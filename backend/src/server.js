import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import connectDB from './config/db.js';
import config from './config/index.js';

// Connect to database
await connectDB();

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.io for real-time features
const io = new Server(httpServer, {
  cors: {
    origin: config.corsOrigins || ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Join concert room for real-time seat updates
  socket.on('join-concert', (concertId) => {
    socket.join(`concert:${concertId}`);
    console.log(`Socket ${socket.id} joined concert:${concertId}`);
  });

  // Leave concert room
  socket.on('leave-concert', (concertId) => {
    socket.leave(`concert:${concertId}`);
    console.log(`Socket ${socket.id} left concert:${concertId}`);
  });

  // Handle seat selection (broadcast to others in room)
  socket.on('seat-selecting', (data) => {
    const { concertId, seatIds, userId } = data;
    socket.to(`concert:${concertId}`).emit('seats-being-selected', {
      seatIds,
      userId,
      socketId: socket.id
    });
  });

  // Handle seat lock (after API confirms)
  socket.on('seats-locked', (data) => {
    const { concertId, seatIds, userId, lockedUntil } = data;
    io.to(`concert:${concertId}`).emit('seats-status-changed', {
      seatIds,
      status: 'LOCKED',
      userId,
      lockedUntil
    });
  });

  // Handle seat release
  socket.on('seats-released', (data) => {
    const { concertId, seatIds } = data;
    io.to(`concert:${concertId}`).emit('seats-status-changed', {
      seatIds,
      status: 'AVAILABLE'
    });
  });

  // Handle seat sold (after payment)
  socket.on('seats-sold', (data) => {
    const { concertId, seatIds } = data;
    io.to(`concert:${concertId}`).emit('seats-status-changed', {
      seatIds,
      status: 'SOLD'
    });
  });

  // Handle disconnect
  socket.on('disconnect', (reason) => {
    console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);
  });
});

// Make io accessible to routes
app.set('io', io);

// Emit function helper
export const emitToRoom = (room, event, data) => {
  io.to(room).emit(event, data);
};

// Start server
const PORT = config.port || 5000;

httpServer.listen(PORT, () => {
  console.log(`
    QuickShow Ticket API Server                             
                                                             
   Server running on port ${PORT}                               
   Environment: ${config.nodeEnv || 'development'}                                 
                                                             
   API Endpoints:                                             
   • Health:    http://localhost:${PORT}/health                 
   • API:       http://localhost:${PORT}/api                    
                                                              
   Socket.io:   ws://localhost:${PORT}                          

  `);
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  
  // Close socket.io connections
  io.close(() => {
    console.log('Socket.io connections closed');
  });

  // Close HTTP server
  httpServer.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });

  // Force close after 10s
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

export { io };
export default httpServer;
