import { customAlphabet } from 'nanoid';

// Avoid ambiguous characters (0/O, 1/I/L) so codes are easy to read aloud and type.
const ROOM_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const roomCodeGen = customAlphabet(ROOM_CODE_ALPHABET, 5);

const idGen = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 16);
const tokenGen = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 32);

export function generateRoomCode(): string {
  return roomCodeGen();
}

export function generatePlayerId(): string {
  return idGen();
}

export function generateToken(): string {
  return tokenGen();
}

const AVATAR_EMOJIS = ['🦊', '🐼', '🐸', '🐵', '🦁', '🐯', '🐨', '🐷', '🐙', '🦉', '🐧', '🦄', '🐲', '🦖', '🐝', '🦋'];
const AVATAR_COLORS = ['#f87171', '#fb923c', '#facc15', '#4ade80', '#2dd4bf', '#38bdf8', '#818cf8', '#c084fc', '#f472b6'];

export function randomAvatar(seedIndex: number): { emoji: string; color: string } {
  const emoji = AVATAR_EMOJIS[seedIndex % AVATAR_EMOJIS.length];
  const color = AVATAR_COLORS[seedIndex % AVATAR_COLORS.length];
  return { emoji, color };
}
