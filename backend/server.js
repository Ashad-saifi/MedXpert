import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
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

// Create HTTP server for WebSockets / Socket.io compatibility
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Socket.io Real-Time Telehealth Signaling Microservice
io.on("connection", (socket) => {
  console.log(`⚡ Peer connected to server: ${socket.id}`);

  // Client joins a consultation room
  socket.on("join-room", ({ room, userId, role }) => {
    socket.join(room);
    socket.room = room;
    socket.userId = userId;
    socket.role = role;
    console.log(`👥 User ${userId} (${role}) joined consultation room: ${room}`);

    // Notify other peer in the room
    socket.to(room).emit("peer-joined", { socketId: socket.id, userId, role });
  });

  // Relay WebRTC SDP Offers
  socket.on("webrtc-offer", ({ room, offer }) => {
    socket.to(room).emit("webrtc-offer", { offer, senderId: socket.id });
  });

  // Relay WebRTC SDP Answers
  socket.on("webrtc-answer", ({ room, answer }) => {
    socket.to(room).emit("webrtc-answer", { answer, senderId: socket.id });
  });

  // Relay ICE Candidates
  socket.on("webrtc-candidate", ({ room, candidate }) => {
    socket.to(room).emit("webrtc-candidate", { candidate, senderId: socket.id });
  });

  // Relay Live consultations text chat message
  socket.on("chat-message", ({ room, sender, text }) => {
    socket.to(room).emit("chat-message", { sender, text });
  });

  // Relay real-time doctor's advice syncing to the patient
  socket.on("note-sync", ({ room, text }) => {
    socket.to(room).emit("note-sync", { text });
  });

  // Relay dynamic CSS animated emoji reaction floats
  socket.on("reaction", ({ room, emoji }) => {
    socket.to(room).emit("reaction", { emoji });
  });

  // Handle client disconnects gracefully
  socket.on("disconnect", () => {
    console.log(`🔌 Peer disconnected: ${socket.id}`);
    if (socket.room) {
      socket.to(socket.room).emit("peer-disconnected", { userId: socket.userId });
    }
  });
});

server.listen(PORT, () => {
  console.log(`MedXpert backend server running on http://localhost:${PORT}`);
});
