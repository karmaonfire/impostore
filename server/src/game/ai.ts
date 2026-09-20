import { findHints } from '../../../shared/wordBank.js';

/**
 * AI bot helpers. Bots only ever receive the same information a real player
 * would get (their own secret word, the public clues, the public player
 * list) — they never read another player's role or word, so they cannot
 * cheat.
 */

export interface BotClueContext {
  word: string;
  usedHints: Set<string>;
}

const GENERIC_FILLER_WORDS = [
  'boh', 'strano', 'interessante', 'comune', 'particolare', 'semplice',
  'diverso', 'curioso', 'classico', 'utile',
];

export function botGenerateClue(ctx: BotClueContext): string {
  const hints = findHints(ctx.word).filter((h) => !ctx.usedHints.has(h));
  if (hints.length > 0) {
    const pick = hints[Math.floor(Math.random() * hints.length)];
    return pick;
  }
  const filler = GENERIC_FILLER_WORDS.filter((h) => !ctx.usedHints.has(h));
  if (filler.length > 0) {
    return filler[Math.floor(Math.random() * filler.length)];
  }
  return 'passo';
}

export interface BotVoteContext {
  selfId: string;
  candidateIds: string[];
  isImpostorBot: boolean;
  allowSelfVote: boolean;
}

export function botDecideVote(ctx: BotVoteContext): string {
  const candidates = ctx.candidateIds.filter((id) => ctx.allowSelfVote || id !== ctx.selfId);
  if (candidates.length === 0) return ctx.selfId;
  // Bots vote using public information only (uniform random among
  // candidates); this keeps them simple, fast, and impossible to accuse of
  // peeking at hidden state.
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export function botClueDelayMs(): number {
  return 1200 + Math.floor(Math.random() * 2500);
}

export function botVoteDelayMs(): number {
  return 800 + Math.floor(Math.random() * 2000);
}
