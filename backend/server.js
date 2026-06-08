import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import prescriptionRoutes from './routes/prescriptionRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { loginUser } from './controllers/userController.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Mount modular Mongoose database routes
app.use("/api/users", userRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/admin", adminRoutes);

// Compatibility route for Vite client authentication
app.post('/api/auth/login', loginUser);

// Serve static files from the React frontend build
app.use(express.static(path.join(__dirname, '../dist')));

// Fallback to index.html for non-API client routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ noServer: true });

// Track connected clients
const clients = new Map(); // ws -> { role }

wss.on('connection', (ws) => {
  console.log('Client connected to WebRTC signaling server');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'join') {
        clients.set(ws, { role: data.role });
        console.log(`WebSocket client registered as role: ${data.role}`);
        
        // Notify the other peer that this role joined
        broadcastToPeer(ws, { type: 'peer-joined', role: data.role });
        return;
      }

      // Forward all other messages (offer, answer, candidate, chat, advice, mute-state, request-vitals, vitals-data, etc.)
      broadcastToPeer(ws, data);
    } catch (err) {
      console.error('Error handling WebSocket message:', err);
    }
  });

  ws.on('close', () => {
    const client = clients.get(ws);
    if (client) {
      console.log(`Client disconnected: ${client.role}`);
      broadcastToPeer(ws, { type: 'peer-left', role: client.role });
      clients.delete(ws);
    }
  });

  ws.on('error', (err) => {
    console.error('WebSocket client error:', err);
  });
});

function broadcastToPeer(senderWs, msgObj) {
  const senderInfo = clients.get(senderWs);
  const targetRole = senderInfo ? (senderInfo.role === 'patient' ? 'doctor' : 'patient') : null;
  
  for (const [ws, info] of clients.entries()) {
    if (ws !== senderWs && (!targetRole || info.role === targetRole)) {
      if (ws.readyState === 1) { // OPEN
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
  console.log(`MedXpert backend server running on http://localhost:${PORT}`);
});

