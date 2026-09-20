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

export type WordMode = 'far' | 'close';

export type GamePhase = 'lobby' | 'clue' | 'discussion' | 'voting' | 'elimination' | 'reveal' | 'gameover';

export interface RoomSettings {
  minPlayers: number;
  maxPlayers: number;
  numImpostors: number;
  clueRounds: number;
  clueTimeSec: number;
  discussionTimeSec: number;
  votingTimeSec: number;
  allowSelfVote: boolean;
  allowTie: boolean;
  pointsToWin: number;
  difficulty: Difficulty;
  categories: Category[] | 'random';
  wordMode: WordMode;
  isPublic: boolean;
  allowLateJoin: boolean;
  spectatorMode: boolean;
  /** 0 = unlimited (match ends only via pointsToWin). Otherwise match ends after this many full rounds. */
  maxRounds: number;
}

export const DEFAULT_SETTINGS: RoomSettings = {
  minPlayers: 3,
  maxPlayers: 10,
  numImpostors: 1,
  clueRounds: 2,
  clueTimeSec: 30,
  discussionTimeSec: 60,
  votingTimeSec: 30,
  allowSelfVote: false,
  allowTie: true,
  pointsToWin: 10,
  difficulty: 'normal',
  categories: 'random',
  wordMode: 'far',
  isPublic: false,
  allowLateJoin: true,
  spectatorMode: true,
  maxRounds: 0,
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
  score: number;
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
  impostorWord: string;
  category: Category;
  voteResults: VoteResultEntry[];
  eliminationHistory: { playerId: string; cycle: number }[];
  pointsAwarded: Record<string, number>;
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
  matchRound: number;
  eliminationCycle: number;
  clueGiro: number;
  totalClueRounds: number;
  currentTurnPlayerId: string | null;
  clues: ClueEntry[];
  phaseEndsAt: number | null;
  lastResult: RoundResult | null;
  interimElimination: InterimElimination | null;
  category: Category | null;
  gameOverWinnerIds: string[] | null;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  nickname: string;
  text: string;
  ts: number;
}

export interface YourWordPayload {
  word: string;
  role: 'innocent' | 'impostor';
  category: Category;
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
  send_chat_message: (text: string) => void;
}

export interface ServerToClientEvents {
  room_state: (state: PublicRoomState) => void;
  your_word: (payload: YourWordPayload) => void;
  error_message: (msg: string) => void;
  kicked: () => void;
  chat_message: (msg: ChatMessage) => void;
}

export const MIN_PLAYERS_HARD_FLOOR = 3;
export const MAX_PLAYERS_HARD_CEIL = 16;
