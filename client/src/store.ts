import { create } from 'zustand';
import type { PublicRoomState, YourWordPayload } from '@shared/types';

interface Session {
  code: string;
  playerId: string;
  token: string;
}

interface GameStore {
  connected: boolean;
  session: Session | null;
  roomState: PublicRoomState | null;
  yourWord: YourWordPayload | null;
  errorMessage: string | null;
  nickname: string;

  setConnected: (c: boolean) => void;
  setSession: (s: Session | null) => void;
  setRoomState: (s: PublicRoomState | null) => void;
  setYourWord: (w: YourWordPayload | null) => void;
  setError: (m: string | null) => void;
  setNickname: (n: string) => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  connected: false,
  session: null,
  roomState: null,
  yourWord: null,
  errorMessage: null,
  nickname: (typeof localStorage !== 'undefined' && localStorage.getItem('impostore_nickname')) || '',

  setConnected: (c) => set({ connected: c }),
  setSession: (s) => set({ session: s }),
  setRoomState: (s) => set({ roomState: s }),
  setYourWord: (w) => set({ yourWord: w }),
  setError: (m) => set({ errorMessage: m }),
  setNickname: (n) => {
    try {
      localStorage.setItem('impostore_nickname', n);
    } catch {
      /* ignore storage failures (private browsing, etc.) */
    }
    set({ nickname: n });
  },
  reset: () => set({ session: null, roomState: null, yourWord: null, errorMessage: null }),
}));

export function saveRoomToken(code: string, playerId: string, token: string) {
  try {
    localStorage.setItem(`impostore_room_${code}`, JSON.stringify({ playerId, token }));
  } catch {
    /* ignore */
  }
}

export function loadRoomToken(code: string): { playerId: string; token: string } | null {
  try {
    const raw = localStorage.getItem(`impostore_room_${code}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearRoomToken(code: string) {
  try {
    localStorage.removeItem(`impostore_room_${code}`);
  } catch {
    /* ignore */
  }
}
