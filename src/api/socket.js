import { io } from 'socket.io-client';
import { BASE_URL } from './client';

let socketUrl = BASE_URL;
if (socketUrl.includes('/api')) {
  socketUrl = socketUrl.replace('/api', '');
} else if (socketUrl.endsWith('/')) {
  socketUrl = socketUrl.slice(0, -1);
}

export const socket = io(socketUrl, {
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
