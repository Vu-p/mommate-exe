import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;

const socketBase = () => {
  const apiBase = import.meta.env.VITE_API_BASE?.trim();
  if (apiBase) return apiBase.replace(/\/api\/?$/, '');
  if (window.location.hostname === 'localhost') return 'http://localhost:5000';
  return window.location.origin;
};

export const getSocket = () => {
  const user = JSON.parse(localStorage.getItem('userInfo') || '{}');
  if (!socket) {
    socket = io(socketBase(), {
      autoConnect: false,
      withCredentials: true,
      auth: { token: user.token },
    });
  } else {
    socket.auth = { token: user.token };
  }
  return socket;
};

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};
