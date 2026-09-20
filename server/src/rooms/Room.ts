import {
  Category,
  ClueEntry,
  DEFAULT_SETTINGS,
  GamePhase,
  MAX_PLAYERS_HARD_CEIL,
  MIN_PLAYERS_HARD_FLOOR,
  PublicPlayer,
  PublicRoomState,
  RoomSettings,
  RoundResult,
  VoteResultEntry,
  YourWordPayload,
} from '../../../shared/types.js';
import { pairHistoryKey, pickWordPair } from '../../../shared/wordBank.js';
import { computeRoundScore } from '../game/scoring.js';
import { generatePlayerId, generateToken, randomAvatar } from '../utils/id.js';

export interface InternalPlayer {
  id: string;
  token: string;
  nickname: string;
  avatarColor: string;
  avatarEmoji: string;
  isHost: boolean;
  isReady: boolean;
  isConnected: boolean;
  isBot: boolean;
  isSpectator: boolean;
  score: number;
  role: 'innocent' | 'impostor' | null;
  word: string | null;
  socketId: string | null;
  joinedLate: boolean;
  disconnectTimer: ReturnType<typeof setTimeout> | null;
}

const DISCONNECT_GRACE_MS = 45_000;
const RECENT_PAIR_HISTORY = 40;
const MAX_CLUE_LENGTH = 60;

export interface RoomCallbacks {
  broadcastState: (room: Room) => void;
  sendYourWord: (room: Room, playerId: string, payload: YourWordPayload) => void;
  sendError: (room: Room, playerId: string, message: string) => void;
  sendKicked: (room: Room, playerId: string) => void;
  scheduleBotClue: (room: Room, playerId: string) => void;
  scheduleBotVote: (room: Room, playerId: string) => void;
  onEmpty: (room: Room) => void;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export class Room {
  code: string;
  hostId: string;
  settings: RoomSettings;
  players = new Map<string, InternalPlayer>();
  phase: GamePhase = 'lobby';

  matchRound = 0;
  currentRound = 0;
  turnOrder: string[] = [];
  currentTurnIndex = 0;
  clues: ClueEntry[] = [];
  votes = new Map<string, string>();

  impostorIds: string[] = [];
  innocentWord: string | null = null;
  impostorWord: string | null = null;
  category: Category | null = null;
  recentPairs: string[] = [];

  phaseEndsAt: number | null = null;
  phaseTimer: ReturnType<typeof setTimeout> | null = null;

  lastResult: RoundResult | null = null;
  gameOverWinnerIds: string[] | null = null;

  private botCounter = 0;
  private avatarSeed = 0;

  constructor(code: string, settings: Partial<RoomSettings> | undefined, private cb: RoomCallbacks) {
    this.code = code;
    this.hostId = '';
    this.settings = Room.sanitizeSettings({ ...DEFAULT_SETTINGS, ...settings });
  }

  static sanitizeSettings(input: RoomSettings): RoomSettings {
    const minPlayers = clamp(Math.round(input.minPlayers), MIN_PLAYERS_HARD_FLOOR, MAX_PLAYERS_HARD_CEIL);
    const maxPlayers = clamp(Math.round(input.maxPlayers), minPlayers, MAX_PLAYERS_HARD_CEIL);
    const numImpostors = clamp(Math.round(input.numImpostors), 1, Math.max(1, Math.floor(maxPlayers / 2)));
    return {
      ...input,
      minPlayers,
      maxPlayers,
      numImpostors,
      clueRounds: clamp(Math.round(input.clueRounds), 1, 6),
      clueTimeSec: clamp(Math.round(input.clueTimeSec), 10, 180),
      discussionTimeSec: clamp(Math.round(input.discussionTimeSec), 0, 600),
      votingTimeSec: clamp(Math.round(input.votingTimeSec), 10, 180),
      pointsToWin: clamp(Math.round(input.pointsToWin), 3, 100),
      maxRounds: clamp(Math.round(input.maxRounds ?? 0), 0, 50),
    };
  }

  private touch() {
    this.cb.broadcastState(this);
  }

  private clearPhaseTimer() {
    if (this.phaseTimer) {
      clearTimeout(this.phaseTimer);
      this.phaseTimer = null;
    }
  }

  private schedulePhaseTimeout(seconds: number, onExpire: () => void) {
    this.clearPhaseTimer();
    if (seconds <= 0) {
      this.phaseEndsAt = null;
      return;
    }
    this.phaseEndsAt = Date.now() + seconds * 1000;
    this.phaseTimer = setTimeout(() => {
      this.phaseTimer = null;
      onExpire();
    }, seconds * 1000);
  }

  // ---------- Player management ----------

  get activePlayers(): InternalPlayer[] {
    return [...this.players.values()].filter((p) => !p.isSpectator);
  }

  get connectedNonBotCount(): number {
    return [...this.players.values()].filter((p) => !p.isBot && p.isConnected).length;
  }

  addPlayer(nickname: string, opts: { forceSpectator?: boolean } = {}): InternalPlayer | { error: string } {
    const trimmed = nickname.trim().slice(0, 20) || 'Giocatore';
    const isFirstPlayer = this.players.size === 0;

    let isSpectator = opts.forceSpectator ?? false;
    if (!isFirstPlayer && this.phase !== 'lobby') {
      if (!this.settings.allowLateJoin) {
        return { error: 'La partita è già iniziata e non accetta nuovi giocatori.' };
      }
      isSpectator = this.settings.spectatorMode ? true : isSpectator;
      if (!this.settings.spectatorMode) {
        return { error: 'La partita è già iniziata.' };
      }
    }
    if (!isFirstPlayer && this.phase === 'lobby' && this.activePlayers.length >= this.settings.maxPlayers && !isSpectator) {
      if (this.settings.spectatorMode) {
        isSpectator = true;
      } else {
        return { error: 'La stanza è piena.' };
      }
    }

    const { emoji, color } = randomAvatar(this.avatarSeed++);
    const player: InternalPlayer = {
      id: generatePlayerId(),
      token: generateToken(),
      nickname: trimmed,
      avatarColor: color,
      avatarEmoji: emoji,
      isHost: isFirstPlayer,
      isReady: isFirstPlayer,
      isConnected: true,
      isBot: false,
      isSpectator,
      score: 0,
      role: null,
      word: null,
      socketId: null,
      joinedLate: !isFirstPlayer && this.phase !== 'lobby',
      disconnectTimer: null,
    };
    this.players.set(player.id, player);
    if (isFirstPlayer) this.hostId = player.id;
    this.touch();
    return player;
  }

  findByToken(token: string): InternalPlayer | undefined {
    return [...this.players.values()].find((p) => p.token === token);
  }

  bindSocket(playerId: string, socketId: string) {
    const player = this.players.get(playerId);
    if (!player) return;
    player.socketId = socketId;
    player.isConnected = true;
    if (player.disconnectTimer) {
      clearTimeout(player.disconnectTimer);
      player.disconnectTimer = null;
    }
    if (player.isBot && this.phase !== 'lobby') {
      // A human reconnected to a seat that had been handed to the bot controller.
      player.isBot = false;
    }
    this.touch();
  }

  handleDisconnect(playerId: string) {
    const player = this.players.get(playerId);
    if (!player) return;
    player.isConnected = false;
    player.socketId = null;
    this.touch();

    player.disconnectTimer = setTimeout(() => {
      const stillHere = this.players.get(playerId);
      if (!stillHere || stillHere.isConnected) return;
      if (this.phase === 'lobby') {
        this.removePlayer(playerId);
      } else {
        stillHere.isBot = true;
        this.maybeAdvanceIfWaitingOn(playerId);
        this.touch();
      }
    }, DISCONNECT_GRACE_MS);
  }

  removePlayer(playerId: string) {
    const player = this.players.get(playerId);
    if (!player) return;
    if (player.disconnectTimer) clearTimeout(player.disconnectTimer);

    const wasCurrentTurn = this.phase === 'clue' && this.turnOrder[this.currentTurnIndex] === playerId;
    this.players.delete(playerId);
    this.turnOrder = this.turnOrder.filter((id) => id !== playerId);
    this.votes.delete(playerId);

    if (this.players.size === 0) {
      this.clearPhaseTimer();
      this.cb.onEmpty(this);
      return;
    }

    if (this.hostId === playerId) {
      const next = [...this.players.values()][0];
      next.isHost = true;
      this.hostId = next.id;
    }

    if (this.phase !== 'lobby' && this.activePlayers.length < 2) {
      this.forceEndToLobby();
      return;
    }

    if (wasCurrentTurn) {
      this.advanceClueTurn();
    } else if (this.phase === 'voting') {
      this.maybeFinishVoting();
    }

    this.touch();
  }

  private forceEndToLobby() {
    this.clearPhaseTimer();
    this.phase = 'lobby';
    this.lastResult = null;
    this.gameOverWinnerIds = null;
    for (const p of this.players.values()) {
      p.isReady = p.isHost;
      p.role = null;
      p.word = null;
      p.isSpectator = false;
    }
    this.touch();
  }

  setReady(playerId: string, ready: boolean) {
    const player = this.players.get(playerId);
    if (!player || this.phase !== 'lobby' || player.isSpectator) return;
    player.isReady = ready;
    this.touch();
  }

  updateSettings(playerId: string, partial: Partial<RoomSettings>) {
    if (playerId !== this.hostId || this.phase !== 'lobby') return;
    this.settings = Room.sanitizeSettings({ ...this.settings, ...partial });
    this.touch();
  }

  kickPlayer(requesterId: string, targetId: string) {
    if (requesterId !== this.hostId || requesterId === targetId) return;
    const target = this.players.get(targetId);
    if (!target) return;
    this.cb.sendKicked(this, targetId);
    this.removePlayer(targetId);
  }

  addBot() {
    if (this.phase !== 'lobby') return;
    if (this.activePlayers.length >= this.settings.maxPlayers) return;
    this.botCounter += 1;
    const { emoji, color } = randomAvatar(this.avatarSeed++);
    const bot: InternalPlayer = {
      id: generatePlayerId(),
      token: generateToken(),
      nickname: `Bot ${this.botCounter}`,
      avatarColor: color,
      avatarEmoji: emoji,
      isHost: false,
      isReady: true,
      isConnected: true,
      isBot: true,
      isSpectator: false,
      score: 0,
      role: null,
      word: null,
      socketId: null,
      joinedLate: false,
      disconnectTimer: null,
    };
    this.players.set(bot.id, bot);
    this.touch();
  }

  removeBot() {
    if (this.phase !== 'lobby') return;
    const bots = [...this.players.values()].filter((p) => p.isBot);
    const last = bots[bots.length - 1];
    if (last) {
      this.players.delete(last.id);
      this.touch();
    }
  }

  // ---------- Game flow ----------

  canStart(): { ok: true } | { ok: false; error: string } {
    if (this.phase !== 'lobby') return { ok: false, error: 'La partita è già iniziata.' };
    const active = this.activePlayers;
    if (active.length < this.settings.minPlayers) {
      return { ok: false, error: `Servono almeno ${this.settings.minPlayers} giocatori.` };
    }
    if (active.length > this.settings.maxPlayers) {
      return { ok: false, error: `Troppi giocatori (massimo ${this.settings.maxPlayers}).` };
    }
    if (this.settings.numImpostors >= active.length) {
      return { ok: false, error: 'Troppi impostori rispetto ai giocatori.' };
    }
    const notReady = active.filter((p) => !p.isBot && !p.isReady);
    if (notReady.length > 0) {
      return { ok: false, error: 'Non tutti i giocatori sono pronti.' };
    }
    return { ok: true };
  }

  startGame(requesterId: string) {
    if (requesterId !== this.hostId) return;
    const check = this.canStart();
    if (!check.ok) {
      this.cb.sendError(this, requesterId, check.error);
      return;
    }
    for (const p of this.players.values()) {
      p.score = 0;
      p.isSpectator = p.isSpectator && false;
    }
    this.gameOverWinnerIds = null;
    this.matchRound = 0;
    this.beginRound();
  }

  private beginRound() {
    this.matchRound += 1;
    const active = this.activePlayers;
    const shuffled = shuffle(active.map((p) => p.id));
    this.impostorIds = shuffled.slice(0, this.settings.numImpostors);
    const innocentIds = shuffled.slice(this.settings.numImpostors);

    const picked = pickWordPair({
      categories: this.settings.categories,
      difficulty: this.settings.difficulty,
      wordMode: this.settings.wordMode,
      recentPairs: this.recentPairs,
    });
    this.innocentWord = picked.innocentWord;
    this.impostorWord = picked.impostorWord;
    this.category = picked.category;
    this.recentPairs.unshift(pairHistoryKey(picked.innocentWord, picked.impostorWord));
    this.recentPairs = this.recentPairs.slice(0, RECENT_PAIR_HISTORY);

    for (const id of innocentIds) {
      const p = this.players.get(id)!;
      p.role = 'innocent';
      p.word = picked.innocentWord;
    }
    for (const id of this.impostorIds) {
      const p = this.players.get(id)!;
      p.role = 'impostor';
      p.word = picked.impostorWord;
    }

    this.clues = [];
    this.votes.clear();
    this.turnOrder = shuffle(shuffled);
    this.currentRound = 1;
    this.currentTurnIndex = 0;
    this.lastResult = null;
    this.phase = 'clue';

    for (const p of this.players.values()) {
      if (!p.isSpectator && p.role && p.word) {
        this.cb.sendYourWord(this, p.id, { word: p.word, role: p.role, category: this.category! });
      }
    }

    this.startClueTurnTimer();
    this.touch();
  }

  private startClueTurnTimer() {
    this.schedulePhaseTimeout(this.settings.clueTimeSec, () => {
      const currentId = this.turnOrder[this.currentTurnIndex];
      if (currentId) {
        this.clues.push({ playerId: currentId, round: this.currentRound, text: '—' });
      }
      this.advanceClueTurn();
      this.touch();
    });
    const currentId = this.turnOrder[this.currentTurnIndex];
    const currentPlayer = currentId ? this.players.get(currentId) : undefined;
    if (currentPlayer?.isBot) {
      this.cb.scheduleBotClue(this, currentPlayer.id);
    }
  }

  submitClue(playerId: string, text: string) {
    if (this.phase !== 'clue') return;
    if (this.turnOrder[this.currentTurnIndex] !== playerId) return;
    const clean = text.trim().slice(0, MAX_CLUE_LENGTH);
    if (!clean) return;
    this.clues.push({ playerId, round: this.currentRound, text: clean });
    this.advanceClueTurn();
    this.touch();
  }

  private advanceClueTurn() {
    this.clearPhaseTimer();
    this.currentTurnIndex += 1;
    if (this.currentTurnIndex >= this.turnOrder.length) {
      this.currentRound += 1;
      this.currentTurnIndex = 0;
      if (this.currentRound > this.settings.clueRounds) {
        this.beginDiscussion();
        return;
      }
    }
    this.startClueTurnTimer();
  }

  private maybeAdvanceIfWaitingOn(playerId: string) {
    if (this.phase === 'clue' && this.turnOrder[this.currentTurnIndex] === playerId) {
      const player = this.players.get(playerId);
      if (player?.isBot) {
        this.cb.scheduleBotClue(this, playerId);
      }
    }
    if (this.phase === 'voting') {
      const player = this.players.get(playerId);
      if (player?.isBot && !this.votes.has(playerId)) {
        this.cb.scheduleBotVote(this, playerId);
      }
    }
  }

  private beginDiscussion() {
    this.phase = 'discussion';
    this.schedulePhaseTimeout(this.settings.discussionTimeSec, () => {
      this.beginVoting();
      this.touch();
    });
    this.touch();
  }

  private beginVoting() {
    this.phase = 'voting';
    this.votes.clear();
    this.schedulePhaseTimeout(this.settings.votingTimeSec, () => {
      this.finishVoting();
    });
    for (const id of this.turnOrder) {
      const p = this.players.get(id);
      if (p?.isBot) this.cb.scheduleBotVote(this, id);
    }
  }

  submitVote(voterId: string, targetId: string) {
    if (this.phase !== 'voting') return;
    if (this.votes.has(voterId)) return;
    if (!this.turnOrder.includes(voterId)) return;
    if (!this.turnOrder.includes(targetId)) return;
    if (!this.settings.allowSelfVote && targetId === voterId) return;
    this.votes.set(voterId, targetId);
    this.touch();
    this.maybeFinishVoting();
  }

  private maybeFinishVoting() {
    if (this.phase !== 'voting') return;
    if (this.votes.size >= this.turnOrder.length) {
      this.finishVoting();
    }
  }

  private finishVoting() {
    if (this.phase !== 'voting') return;
    this.clearPhaseTimer();

    const votesReceived: Record<string, number> = {};
    const voterMap: Record<string, string[]> = {};
    for (const id of this.turnOrder) votesReceived[id] = 0;
    for (const [voterId, targetId] of this.votes.entries()) {
      votesReceived[targetId] = (votesReceived[targetId] ?? 0) + 1;
      voterMap[targetId] = voterMap[targetId] ?? [];
      voterMap[targetId].push(voterId);
    }

    let maxVotes = 0;
    for (const v of Object.values(votesReceived)) maxVotes = Math.max(maxVotes, v);
    const topTargets = maxVotes > 0 ? Object.entries(votesReceived).filter(([, v]) => v === maxVotes).map(([id]) => id) : [];

    let eliminatedId: string | null = null;
    let tie = false;
    let noElimination = false;

    if (topTargets.length === 0) {
      noElimination = true;
    } else if (topTargets.length === 1) {
      eliminatedId = topTargets[0];
    } else {
      tie = true;
      if (this.settings.allowTie) {
        noElimination = true;
      } else {
        eliminatedId = topTargets[Math.floor(Math.random() * topTargets.length)];
      }
    }

    const innocentIds = this.turnOrder.filter((id) => !this.impostorIds.includes(id));
    const votesObj: Record<string, string> = Object.fromEntries(this.votes.entries());
    const { pointsAwarded, wasImpostorEliminated } = computeRoundScore(
      { innocentIds, impostorIds: this.impostorIds, eliminatedId, votesReceived, noElimination },
      votesObj,
    );

    for (const [playerId, pts] of Object.entries(pointsAwarded)) {
      const p = this.players.get(playerId);
      if (p) p.score += pts;
    }

    const voteResults: VoteResultEntry[] = this.turnOrder.map((id) => ({
      targetId: id,
      votes: votesReceived[id] ?? 0,
      voterIds: voterMap[id] ?? [],
    }));

    this.lastResult = {
      impostorIds: [...this.impostorIds],
      eliminatedId,
      wasImpostorEliminated,
      innocentWord: this.innocentWord!,
      impostorWord: this.impostorWord!,
      category: this.category!,
      voteResults,
      pointsAwarded,
      tie,
      noElimination,
    };

    const reachedPoints = [...this.players.values()].some((p) => p.score >= this.settings.pointsToWin);
    const reachedMaxRounds = this.settings.maxRounds > 0 && this.matchRound >= this.settings.maxRounds;

    if (reachedPoints || reachedMaxRounds) {
      const topScore = Math.max(...[...this.players.values()].map((p) => p.score));
      this.gameOverWinnerIds = [...this.players.values()].filter((p) => p.score === topScore).map((p) => p.id);
    } else {
      this.gameOverWinnerIds = null;
    }

    this.phase = 'reveal';
    this.phaseEndsAt = null;
    this.touch();
  }

  playAgain(requesterId: string) {
    if (requesterId !== this.hostId) return;
    if (this.phase === 'reveal' && !this.gameOverWinnerIds) {
      this.beginRound();
    } else if (this.phase === 'reveal' && this.gameOverWinnerIds) {
      this.resetMatch();
    } else if (this.phase === 'gameover') {
      this.resetMatch();
    }
  }

  private resetMatch() {
    this.phase = 'lobby';
    this.lastResult = null;
    this.gameOverWinnerIds = null;
    this.matchRound = 0;
    this.clues = [];
    this.votes.clear();
    this.impostorIds = [];
    for (const p of this.players.values()) {
      p.score = 0;
      p.role = null;
      p.word = null;
      p.isReady = p.isHost || p.isBot;
    }
    this.touch();
  }

  // ---------- Serialization ----------

  toPublicPlayer(p: InternalPlayer): PublicPlayer {
    return {
      id: p.id,
      nickname: p.nickname,
      avatarColor: p.avatarColor,
      avatarEmoji: p.avatarEmoji,
      isHost: p.isHost,
      isReady: p.isReady,
      isConnected: p.isConnected,
      isBot: p.isBot,
      isSpectator: p.isSpectator,
      score: p.score,
      hasVoted: this.votes.has(p.id),
      hasSubmittedClue: this.clues.some((c) => c.playerId === p.id && c.round === this.currentRound),
      joinedLate: p.joinedLate,
    };
  }

  toPublicState(): PublicRoomState {
    return {
      code: this.code,
      hostId: this.hostId,
      phase: this.phase,
      settings: this.settings,
      players: [...this.players.values()].map((p) => this.toPublicPlayer(p)),
      matchRound: this.matchRound,
      currentRound: this.currentRound,
      totalClueRounds: this.settings.clueRounds,
      currentTurnPlayerId: this.phase === 'clue' ? this.turnOrder[this.currentTurnIndex] ?? null : null,
      clues: this.clues,
      phaseEndsAt: this.phaseEndsAt,
      lastResult: this.lastResult,
      category: this.phase === 'clue' || this.phase === 'discussion' || this.phase === 'voting' ? this.category : this.lastResult?.category ?? null,
      gameOverWinnerIds: this.gameOverWinnerIds,
    };
  }

  getSocketId(playerId: string): string | null {
    return this.players.get(playerId)?.socketId ?? null;
  }

  destroy() {
    this.clearPhaseTimer();
    for (const p of this.players.values()) {
      if (p.disconnectTimer) clearTimeout(p.disconnectTimer);
    }
  }
}
