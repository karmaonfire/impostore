// Shared types used by both server and client. Keep this file framework-free.

export type Difficulty = 'easy' | 'normal' | 'hard';

export type Category =
  | 'animali'
  | 'cibo'
  | 'bevande'
  | 'oggetti'
  | 'sport'
  | 'film'
  | 'serietv'
  | 'videogiochi'
  | 'personaggi'
  | 'luoghi'
  | 'paesi'
  | 'citta'
  | 'natura'
  | 'tecnologia'
  | 'scuola'
  | 'lavoro'
  | 'misc';

export const ALL_CATEGORIES: Category[] = [
  'animali', 'cibo', 'bevande', 'oggetti', 'sport', 'film', 'serietv',
  'videogiochi', 'personaggi', 'luoghi', 'paesi', 'citta', 'natura',
  'tecnologia', 'scuola', 'lavoro', 'misc',
];

export const CATEGORY_LABELS: Record<Category, string> = {
  animali: 'Animali',
  cibo: 'Cibo',
  bevande: 'Bevande',
  oggetti: 'Oggetti',
  sport: 'Sport',
  film: 'Film',
  serietv: 'Serie TV',
  videogiochi: 'Videogiochi',
  personaggi: 'Personaggi',
  luoghi: 'Luoghi',
  paesi: 'Paesi',
  citta: 'Città',
  natura: 'Natura',
  tecnologia: 'Tecnologia',
  scuola: 'Scuola',
  lavoro: 'Lavoro',
  misc: 'Varie',
};

export type GamePhase = 'lobby' | 'clue' | 'voting' | 'elimination' | 'reveal';

export interface RoomSettings {
  minPlayers: number;
  maxPlayers: number;
  numImpostors: number;
  /** How many rounds (one word each) every surviving player gets before a vote. */
  clueRounds: number;
  clueTimeSec: number;
  votingTimeSec: number;
  allowSelfVote: boolean;
  allowTie: boolean;
  difficulty: Difficulty;
  categories: Category[] | 'random';
  isPublic: boolean;
  allowLateJoin: boolean;
  spectatorMode: boolean;
}

export const DEFAULT_SETTINGS: RoomSettings = {
  minPlayers: 3,
  maxPlayers: 10,
  numImpostors: 1,
  clueRounds: 2,
  clueTimeSec: 30,
  votingTimeSec: 30,
  allowSelfVote: false,
  allowTie: true,
  difficulty: 'normal',
  categories: 'random',
  isPublic: false,
  allowLateJoin: true,
  spectatorMode: true,
};

export interface PublicPlayer {
  id: string;
  nickname: string;
  avatarColor: string;
  avatarEmoji: string;
  isHost: boolean;
  isReady: boolean;
  isConnected: boolean;
  isBot: boolean;
  isSpectator: boolean;
  isEliminated: boolean;
  hasVoted: boolean;
  hasSubmittedClue: boolean;
  joinedLate: boolean;
}

export interface ClueEntry {
  playerId: string;
  round: number;
  text: string;
}

export interface VoteResultEntry {
  targetId: string;
  votes: number;
  voterIds: string[];
}

export interface RoundResult {
  impostorIds: string[];
  eliminatedId: string | null;
  wasImpostorEliminated: boolean;
  impostorGuessedWord: boolean;
  innocentWord: string;
  /** The related hint the impostor(s) were secretly given — not a rival "word". */
  impostorHint: string;
  category: Category;
  voteResults: VoteResultEntry[];
  eliminationHistory: { playerId: string; cycle: number }[];
  tie: boolean;
  noElimination: boolean;
}

/** Broadcast when a vote doesn't end the match — deliberately bare: no words, no role info. */
export interface InterimElimination {
  cycle: number;
  eliminatedId: string | null;
  tie: boolean;
  noElimination: boolean;
  voteCounts: Record<string, number>;
}

export interface PublicRoomState {
  code: string;
  hostId: string;
  phase: GamePhase;
  settings: RoomSettings;
  players: PublicPlayer[];
  eliminationCycle: number;
  clueGiro: number;
  totalClueRounds: number;
  currentTurnPlayerId: string | null;
  clues: ClueEntry[];
  phaseEndsAt: number | null;
  lastResult: RoundResult | null;
  interimElimination: InterimElimination | null;
  /** Live running vote tally while voting is open — counts only, no voter identities. */
  liveVoteCounts: Record<string, number> | null;
  category: Category | null;
}

export interface YourWordPayload {
  word: string;
  role: 'innocent' | 'impostor';
  /** Only sent to innocents — the impostor must never learn the category. */
  category?: Category;
}

export interface CreateRoomPayload {
  nickname: string;
  settings?: Partial<RoomSettings>;
}

export interface JoinRoomPayload {
  code: string;
  nickname: string;
  token?: string;
}

export type AckResponse =
  | { ok: true; code: string; playerId: string; token: string }
  | { ok: false; error: string };

export interface ClientToServerEvents {
  create_room: (payload: CreateRoomPayload, cb: (res: AckResponse) => void) => void;
  join_room: (payload: JoinRoomPayload, cb: (res: AckResponse) => void) => void;
  leave_room: () => void;
  set_ready: (ready: boolean) => void;
  update_settings: (settings: Partial<RoomSettings>) => void;
  fill_bots: () => void;
  remove_bot: () => void;
  start_game: () => void;
  submit_clue: (text: string) => void;
  submit_vote: (targetId: string) => void;
  play_again: () => void;
  kick_player: (playerId: string) => void;
}

export interface ServerToClientEvents {
  room_state: (state: PublicRoomState) => void;
  your_word: (payload: YourWordPayload) => void;
  error_message: (msg: string) => void;
  kicked: () => void;
}

export const MIN_PLAYERS_HARD_FLOOR = 3;
export const MAX_PLAYERS_HARD_CEIL = 16;
