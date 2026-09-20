import cors from 'cors';
import express from 'express';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Server } from 'socket.io';
import { ClientToServerEvents, ServerToClientEvents } from '../../shared/types.js';
import { AppServer, createRoomManager, registerSocketHandlers, SocketData } from './socket/handlers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = Number(process.env.PORT ?? 3001);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? '*';

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN }));
app.get('/health', (_req, res) => res.json({ ok: true, rooms: roomManagerRoomCount() }));

const clientDist = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDist));

const httpServer = createServer(app);
const io: AppServer = new Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>(httpServer, {
  cors: { origin: CLIENT_ORIGIN, methods: ['GET', 'POST'] },
});

const roomManager = createRoomManager(io);
registerSocketHandlers(io, roomManager);

function roomManagerRoomCount() {
  return roomManager.roomCount();
}

// SPA fallback so deep links (e.g. shared room URLs) load the client app.
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/socket.io') || req.path.startsWith('/health')) {
    next();
    return;
  }
  res.sendFile(path.join(clientDist, 'index.html'), (err) => {
    if (err) next();
  });
});

httpServer.listen(PORT, () => {
  console.log(`Impostore server listening on port ${PORT}`);
});
