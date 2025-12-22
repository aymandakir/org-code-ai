import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

let io: SocketIOServer | null = null;

export function initializeWebSocket(server: HTTPServer) {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`✅ Client connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });

    // Join scan room
    socket.on('join:scan', (scanId: string) => {
      socket.join(`scan:${scanId}`);
      console.log(`Client ${socket.id} joined scan:${scanId}`);
    });

    // Join org room
    socket.on('join:org', (orgId: string) => {
      socket.join(`org:${orgId}`);
      console.log(`Client ${socket.id} joined org:${orgId}`);
    });
  });

  return io;
}

export function emitScanEvent(
  event: 'scan:started' | 'scan:progress' | 'scan:vulnerability' | 'scan:completed',
  data: unknown,
  scanId?: string
) {
  if (!io) return;

  if (scanId) {
    io.to(`scan:${scanId}`).emit(event, data);
  } else {
    io.emit(event, data);
  }
}

export function emitOrgEvent(
  event: 'org:scan:started' | 'org:scan:progress' | 'org:scan:completed',
  data: unknown,
  orgId?: string
) {
  if (!io) return;

  if (orgId) {
    io.to(`org:${orgId}`).emit(event, data);
  } else {
    io.emit(event, data);
  }
}

