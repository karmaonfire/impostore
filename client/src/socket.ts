import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@shared/types';

const SERVER_URL = import.meta.env.VITE_SERVER_URL as string | undefined;

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SERVER_URL ?? '/', {
  autoConnect: false,
  transports: ['websocket', 'polling'],
});
