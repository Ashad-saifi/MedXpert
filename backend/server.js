import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import prescriptionRoutes from './routes/prescriptionRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import { loginUser } from './controllers/userController.js';

import { loginRateLimiter } from './middleware/authMiddleware.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=()');
  next();
});

// Configure CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000'
];
app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps, curl, postman) in dev
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Dev flexible fallback
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Compatibility route for client authentication with rate limiting
app.post('/api/auth/login', loginRateLimiter, loginUser);

// Mount modular Mongoose database routes
app.use("/api/users", userRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/notifications", notificationRoutes);

// Serve static files from the React frontend build if available
const distPath = fs.existsSync(path.join(__dirname, '../dist')) 
  ? path.join(__dirname, '../dist') 
  : fs.existsSync(path.join(__dirname, '../frontend/dist')) 
    ? path.join(__dirname, '../frontend/dist') 
    : null;

if (distPath) {
  app.use(express.static(distPath));
}

// Fallback to index.html for non-API client routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const indexPath = distPath ? path.join(distPath, 'index.html') : null;
  if (indexPath && fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).send(`
      <html>
        <head><title>MedXpert API Server</title></head>
        <body style="font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
          <div style="text-align: center; padding: 2rem; border-radius: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);">
            <h2 style="color: #0284c7; margin-bottom: 0.5rem;">🏥 MedXpert Backend API Server Active</h2>
            <p style="color: #94a3b8;">Frontend dev server is running on <a href="http://localhost:3000" style="color: #38bdf8;">http://localhost:3000</a></p>
          </div>
        </body>
      </html>
    `);
  }
});

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ noServer: true });

import Notification from './models/Notification.js';

// Global map of active video consultation call sessions
export const activeCallSessions = new Map(); // roomId/appointmentId -> { doctorId, doctorName, patientId, patientName, startedAt, status }

// Track connected clients
const clients = new Map(); // ws -> { role, room, userName, userId }

function normalizeRoom(r) {
  if (!r) return '';
  return String(r).toLowerCase().replace(/^room-/, '').trim();
}

wss.on('connection', (ws) => {
  console.log('Client connected to WebRTC signaling server');

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'register') {
        const clientInfo = {
          role: data.role || 'user',
          room: 'lobby',
          userName: data.userName || (data.role === 'doctor' ? 'Doctor' : 'Patient'),
          userId: data.userId || (data.role === 'doctor' ? 'D-101' : 'P-10421')
        };
        clients.set(ws, clientInfo);
        console.log(`WebSocket user registered: role=${clientInfo.role}, userId=${clientInfo.userId}, user=${clientInfo.userName}`);
        return;
      }

      if (data.type === 'join') {
        const normRoom = normalizeRoom(data.room || 'default');
        const clientInfo = {
          role: data.role || 'user',
          room: normRoom,
          userName: data.userName || (data.role === 'doctor' ? 'Doctor' : 'Patient'),
          userId: data.userId || (data.role === 'doctor' ? 'D-101' : 'P-10421')
        };
        clients.set(ws, clientInfo);
        console.log(`WebSocket client joined room: role=${clientInfo.role}, room=${clientInfo.room}, user=${clientInfo.userName}`);
        
        // Notify the other peer in the room that this user joined
        broadcastToPeer(ws, { 
          type: 'peer-joined', 
          role: clientInfo.role, 
          room: clientInfo.room,
          userName: clientInfo.userName,
          userId: clientInfo.userId
        });
        return;
      }

      if (data.type === 'call-invite') {
        console.log(`Call invite sent by ${data.doctorName} for patient ${data.patientName || data.patientId} in room ${data.roomId}`);
        
        const normRoom = normalizeRoom(data.roomId || 'a-501');
        // Record active session with actual dynamic names
        const sessionInfo = {
          doctorId: data.doctorId || 'D-101',
          doctorName: data.doctorName || 'Doctor',
          patientId: data.patientId || 'P-10421',
          patientName: data.patientName || 'Patient',
          roomId: normRoom,
          appointmentId: data.appointmentId || normRoom,
          status: 'calling',
          startedAt: Date.now()
        };
        activeCallSessions.set(sessionInfo.roomId, sessionInfo);
        if (sessionInfo.appointmentId) {
          activeCallSessions.set(sessionInfo.appointmentId, sessionInfo);
        }

        // Create persistent in-app notification in MongoDB
        try {
          await Notification.create({
            userId: sessionInfo.patientId,
            text: `${sessionInfo.doctorName} has started your video consultation. Click to join now.`,
            type: 'info',
            page: 'pConsultation'
          });
        } catch (nErr) {
          console.warn('Failed to save in-app notification for call invite:', nErr.message);
        }

        // Broadcast call invite to all connected clients (especially the patient)
        broadcastCallInvite(ws, {
          type: 'incoming-call',
          ...sessionInfo,
          timestamp: Date.now()
        });
        return;
      }

      if (data.type === 'call-accept') {
        const roomId = normalizeRoom(data.roomId || data.appointmentId);
        if (roomId && activeCallSessions.has(roomId)) {
          const session = activeCallSessions.get(roomId);
          session.status = 'active';
        }
        broadcastToAll(ws, {
          type: 'call-status',
          status: 'accepted',
          roomId: roomId,
          patientName: data.patientName || 'Patient'
        });
        return;
      }

      if (data.type === 'call-decline') {
        const roomId = normalizeRoom(data.roomId || data.appointmentId);
        if (roomId) {
          activeCallSessions.delete(roomId);
          if (data.appointmentId) activeCallSessions.delete(data.appointmentId);
        }
        broadcastToAll(ws, {
          type: 'call-status',
          status: 'declined',
          roomId: roomId,
          patientName: data.patientName || 'Patient'
        });
        return;
      }

      if (data.type === 'call-ended') {
        const roomId = normalizeRoom(data.roomId || data.appointmentId);
        if (roomId) {
          activeCallSessions.delete(roomId);
          if (data.appointmentId) activeCallSessions.delete(data.appointmentId);
        }
        broadcastToPeer(ws, {
          type: 'call-ended',
          roomId: roomId,
          role: data.role,
          userName: data.userName
        });
        return;
      }

      // Ensure room is normalized on all messages
      if (data.room) {
        data.room = normalizeRoom(data.room);
      }

      // Forward all other signaling messages (offer, answer, candidate, webrtc-offer, webrtc-answer, webrtc-candidate, chat, chat-message, note-sync, advice, mute-state, mic-toggle, camera-toggle, speaking-state, request-vitals, vitals-data, reaction)
      broadcastToPeer(ws, data);
    } catch (err) {
      console.error('Error handling WebSocket message:', err);
    }
  });

  ws.on('close', () => {
    const client = clients.get(ws);
    if (client) {
      console.log(`Client disconnected: ${client.userName} (${client.role}) from room ${client.room}`);
      broadcastToPeer(ws, { 
        type: 'peer-left', 
        role: client.role, 
        room: client.room, 
        userName: client.userName,
        userId: client.userId
      });
      clients.delete(ws);
    }
  });

  ws.on('error', (err) => {
    console.error('WebSocket client error:', err);
  });
});

function broadcastCallInvite(senderWs, invitePayload) {
  const payloadStr = JSON.stringify(invitePayload);
  for (const [ws, info] of clients.entries()) {
    if (ws !== senderWs && ws.readyState === 1) { // OPEN
      ws.send(payloadStr);
    }
  }
}

function broadcastToAll(senderWs, msgObj) {
  const payloadStr = JSON.stringify(msgObj);
  for (const [ws] of clients.entries()) {
    if (ws !== senderWs && ws.readyState === 1) {
      ws.send(payloadStr);
    }
  }
}

/**
 * Broadcast real-time database sync events to all connected clients (e.g. Admin, Doctor, Patient dashboards)
 */
export function broadcastGlobalEvent(eventData) {
  const payloadStr = JSON.stringify(eventData);
  for (const [ws] of clients.entries()) {
    if (ws.readyState === 1) { // OPEN
      ws.send(payloadStr);
    }
  }
}

function broadcastToPeer(senderWs, msgObj) {
  const senderInfo = clients.get(senderWs);
  const targetRoom = normalizeRoom(msgObj.room || (senderInfo ? senderInfo.room : ''));
  
  for (const [ws, info] of clients.entries()) {
    if (ws !== senderWs && ws.readyState === 1) { // OPEN
      const peerRoom = normalizeRoom(info.room);
      if (targetRoom && peerRoom === targetRoom) {
        ws.send(JSON.stringify(msgObj));
      }
    }
  }
}

// Handle HTTP upgrade to WebSockets
server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

// Listen on HTTP server
server.listen(PORT, () => {
  console.log(`MedXpert backend server running on http://localhost:5000`);
});

