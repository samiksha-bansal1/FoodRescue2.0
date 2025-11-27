import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function initializeSocket(userId: string) {
  if (socket) {
    socket.disconnect();
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  
  socket = io(`${protocol}//${host}`, {
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('Socket connected');
    socket?.emit('join_room', userId);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
