import "dotenv/config";
import http from "http";
import { Server as SocketServer } from "socket.io";
import app from "./app.js";
import connectDB from "./config/db.js";

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = new SocketServer(server, {
  cors: {
    origin: CLIENT_URL,
    credentials: true,
  },
});

import { setSocket } from "./socket.js";
setSocket(io);

// Store active users
const activeUsers = new Map();
const documentRooms = new Map();

// Socket.io connection handler
io.on("connection", (socket) => {
  console.log(`[Socket.io] User connected: ${socket.id}`);

  // Join dashboard room for real-time updates
  socket.on("join_dashboard", ({ userId }) => {
    socket.join(`user_${userId}_updates`);
    console.log(`[Socket.io] User ${userId} joined dashboard`);
  });

  // Leave dashboard room
  socket.on("leave_dashboard", ({ userId }) => {
    socket.leave(`user_${userId}_updates`);
    console.log(`[Socket.io] User ${userId} left dashboard`);
  });

  // Join document room
  socket.on("join_document", ({ documentId }) => {
    socket.join(`doc_${documentId}`);

    if (!documentRooms.has(documentId)) {
      documentRooms.set(documentId, new Set());
    }
    documentRooms.get(documentId).add(socket.id);

    // Notify others
    const users = Array.from(documentRooms.get(documentId));
    io.to(`doc_${documentId}`).emit("active_users", users);
    console.log(`[Socket.io] User joined document: ${documentId}`);
  });

  // Handle content changes
  socket.on("content:change", ({ documentId, content, userId }) => {
    socket.broadcast.to(`doc_${documentId}`).emit("remote_content_change", {
      documentId,
      content,
      userId,
    });
  });

  // Handle cursor position
  socket.on("cursor:move", ({ documentId, position, userId, color }) => {
    socket.broadcast.to(`doc_${documentId}`).emit("remote_cursor_move", {
      documentId,
      position,
      userId,
      color,
    });
  });

  // Handle typing indicator
  socket.on("user:typing", ({ documentId, userId }) => {
    socket.broadcast
      .to(`doc_${documentId}`)
      .emit("user_typing", { documentId, userId });
  });

  // Leave document room
  socket.on("leave_document", ({ documentId }) => {
    socket.leave(`doc_${documentId}`);
    if (documentRooms.has(documentId)) {
      documentRooms.get(documentId).delete(socket.id);
      const users = Array.from(documentRooms.get(documentId));
      io.to(`doc_${documentId}`).emit("active_users", users);
    }
    console.log(`[Socket.io] User left document: ${documentId}`);
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log(`[Socket.io] User disconnected: ${socket.id}`);

    // Remove from all rooms
    documentRooms.forEach((users, documentId) => {
      if (users.has(socket.id)) {
        users.delete(socket.id);
        const userList = Array.from(users);
        io.to(`doc_${documentId}`).emit("active_users", userList);
      }
    });

    activeUsers.delete(socket.id);
  });
});

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Start server
    server.listen(PORT, () => {
      console.log(`[Server] Running on http://localhost:${PORT}`);
      console.log(`[Socket.io] Ready for connections from ${CLIENT_URL}`);
    });
  } catch (error) {
    console.error("[Startup Error]:", error);
    process.exit(1);
  }
};

startServer();

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("[Server] SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("[Server] Closed");
    process.exit(0);
  });
});

export { io };
