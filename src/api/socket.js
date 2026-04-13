import { io } from 'socket.io-client';
import { BASE_URL } from './client';

// The socket server is at the same origin as API but usually at root or /socket.io
// We strip the /api suffix if it exists
const SOCKET_URL = BASE_URL.replace('/api', '');

export const socket = io(SOCKET_URL, {
  autoConnect: false,
});

export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

export const joinMatchRoom = (matchId) => {
  socket.emit('joinMatch', matchId);
};

export const leaveMatchRoom = (matchId) => {
  socket.emit('leaveMatch', matchId);
};
