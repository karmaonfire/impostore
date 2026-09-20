import type { Server, Socket } from 'socket.io';
import {
  AckResponse,
  ClientToServerEvents,
  CreateRoomPayload,
  JoinRoomPayload,
  RoomSettings,
  ServerToClientEvents,
} from '../../../shared/types.js';
import { generatePlayerId } from '../utils/id.js';
import { botClueDelayMs, botDecideVote, botGenerateClue, botVoteDelayMs } from '../game/ai.js';
import { Room, RoomCallbacks } from '../rooms/Room.js';
import { RoomManager } from '../rooms/RoomManager.js';

export interface SocketData {
  roomCode: string | null;
  playerId: string | null;
}

export type AppServer = Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;
type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

export function createRoomManager(io: AppServer): RoomManager {
  const callbacks: RoomCallbacks = {
    broadcastState: (room: Room) => {
      io.to(room.code).emit('room_state', room.toPublicState());
    },
    sendYourWord: (room, playerId, payload) => {
      const socketId = room.getSocketId(playerId);
      if (socketId) io.to(socketId).emit('your_word', payload);
    },
    sendError: (room, playerId, message) => {
      const socketId = room.getSocketId(playerId);
      if (socketId) io.to(socketId).emit('error_message', message);
    },
    sendKicked: (room, playerId) => {
      const socketId = room.getSocketId(playerId);
      if (socketId) io.to(socketId).emit('kicked');
    },
    scheduleBotClue: (room, playerId) => {
      setTimeout(() => {
        const current = room.turnOrder[room.currentTurnIndex];
        if (current !== playerId || room.phase !== 'clue') return;
        const player = room.players.get(playerId);
        if (!player || !player.isBot || !player.word) return;
        const usedHints = new Set(room.clues.filter((c) => c.playerId === playerId).map((c) => c.text));
        const clue = botGenerateClue({ word: player.word, usedHints });
        room.submitClue(playerId, clue);
      }, botClueDelayMs());
    },
    scheduleBotVote: (room, playerId) => {
      setTimeout(() => {
        if (room.phase !== 'voting') return;
        const player = room.players.get(playerId);
        if (!player || !player.isBot) return;
        if (room.votes.has(playerId)) return;
        const target = botDecideVote({
          selfId: playerId,
          candidateIds: room.turnOrder,
          isImpostorBot: room.impostorIds.includes(playerId),
          allowSelfVote: room.settings.allowSelfVote,
        });
        room.submitVote(playerId, target);
      }, botVoteDelayMs());
    },
    onEmpty: () => {},
  };

  return new RoomManager(callbacks);
}

function makeAck(room: Room, playerId: string, token: string): AckResponse {
  return { ok: true, code: room.code, playerId, token };
}

export function registerSocketHandlers(io: AppServer, roomManager: RoomManager) {
  io.on('connection', (socket: AppSocket) => {
    socket.data.roomCode = null;
    socket.data.playerId = null;

    const getCurrentRoom = (): Room | undefined => {
      if (!socket.data.roomCode) return undefined;
      return roomManager.getRoom(socket.data.roomCode);
    };

    socket.on('create_room', (payload: CreateRoomPayload, cb: (res: AckResponse) => void) => {
      try {
        const nickname = (payload?.nickname ?? '').toString();
        if (!nickname.trim()) {
          cb({ ok: false, error: 'Inserisci un nickname.' });
          return;
        }
        const room = roomManager.createRoom(payload.settings as Partial<RoomSettings> | undefined);
        socket.join(room.code);
        const player = room.addPlayer(nickname);
        if ('error' in player) {
          socket.leave(room.code);
          cb({ ok: false, error: player.error });
          return;
        }
        room.bindSocket(player.id, socket.id);
        socket.data.roomCode = room.code;
        socket.data.playerId = player.id;
        cb(makeAck(room, player.id, player.token));
      } catch (err) {
        cb({ ok: false, error: 'Errore nella creazione della stanza.' });
      }
    });

    socket.on('join_room', (payload: JoinRoomPayload, cb: (res: AckResponse) => void) => {
      try {
        const code = (payload?.code ?? '').toString().trim().toUpperCase();
        const nickname = (payload?.nickname ?? '').toString();
        const room = roomManager.getRoom(code);
        if (!room) {
          cb({ ok: false, error: 'Stanza non trovata.' });
          return;
        }

        if (payload.token) {
          const existing = room.findByToken(payload.token);
          if (existing) {
            socket.join(room.code);
            room.bindSocket(existing.id, socket.id);
            socket.data.roomCode = room.code;
            socket.data.playerId = existing.id;
            cb(makeAck(room, existing.id, existing.token));
            return;
          }
        }

        if (!nickname.trim()) {
          cb({ ok: false, error: 'Inserisci un nickname.' });
          return;
        }
        socket.join(room.code);
        const player = room.addPlayer(nickname);
        if ('error' in player) {
          socket.leave(room.code);
          cb({ ok: false, error: player.error });
          return;
        }
        room.bindSocket(player.id, socket.id);
        socket.data.roomCode = room.code;
        socket.data.playerId = player.id;
        cb(makeAck(room, player.id, player.token));
      } catch (err) {
        cb({ ok: false, error: 'Errore nell\'ingresso alla stanza.' });
      }
    });

    socket.on('leave_room', () => {
      const room = getCurrentRoom();
      const playerId = socket.data.playerId;
      if (room && playerId) {
        room.removePlayer(playerId);
      }
      socket.data.roomCode = null;
      socket.data.playerId = null;
      socket.rooms.forEach((r) => {
        if (r !== socket.id) socket.leave(r);
      });
    });

    socket.on('set_ready', (ready: boolean) => {
      const room = getCurrentRoom();
      if (room && socket.data.playerId) room.setReady(socket.data.playerId, !!ready);
    });

    socket.on('update_settings', (settings: Partial<RoomSettings>) => {
      const room = getCurrentRoom();
      if (room && socket.data.playerId) room.updateSettings(socket.data.playerId, settings ?? {});
    });

    socket.on('fill_bots', () => {
      const room = getCurrentRoom();
      if (room && socket.data.playerId === room.hostId) room.addBot();
    });

    socket.on('remove_bot', () => {
      const room = getCurrentRoom();
      if (room && socket.data.playerId === room.hostId) room.removeBot();
    });

    socket.on('start_game', () => {
      const room = getCurrentRoom();
      if (room && socket.data.playerId) room.startGame(socket.data.playerId);
    });

    socket.on('submit_clue', (text: string) => {
      const room = getCurrentRoom();
      if (room && socket.data.playerId) room.submitClue(socket.data.playerId, (text ?? '').toString());
    });

    socket.on('submit_vote', (targetId: string) => {
      const room = getCurrentRoom();
      if (room && socket.data.playerId) room.submitVote(socket.data.playerId, (targetId ?? '').toString());
    });

    socket.on('play_again', () => {
      const room = getCurrentRoom();
      if (room && socket.data.playerId) room.playAgain(socket.data.playerId);
    });

    socket.on('kick_player', (playerId: string) => {
      const room = getCurrentRoom();
      if (room && socket.data.playerId) room.kickPlayer(socket.data.playerId, (playerId ?? '').toString());
    });

    socket.on('send_chat_message', (text: string) => {
      const room = getCurrentRoom();
      const playerId = socket.data.playerId;
      if (!room || !playerId) return;
      const player = room.players.get(playerId);
      if (!player) return;
      const clean = (text ?? '').toString().trim().slice(0, 200);
      if (!clean) return;
      io.to(room.code).emit('chat_message', {
        id: generatePlayerId(),
        playerId,
        nickname: player.nickname,
        text: clean,
        ts: Date.now(),
      });
    });

    socket.on('disconnect', () => {
      const room = getCurrentRoom();
      if (room && socket.data.playerId) {
        room.handleDisconnect(socket.data.playerId);
      }
    });
  });
}
