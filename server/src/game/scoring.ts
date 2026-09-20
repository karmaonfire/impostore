export interface ScoringInput {
  innocentIds: string[];
  impostorIds: string[];
  eliminatedId: string | null;
  votesReceived: Record<string, number>; // playerId -> number of votes received
  noElimination: boolean;
}

export interface ScoringOutput {
  pointsAwarded: Record<string, number>;
  wasImpostorEliminated: boolean;
}

const POINTS_INNOCENT_WIN = 2;
export const POINTS_IMPOSTOR_ESCAPE = 3;
const POINTS_IMPOSTOR_ZERO_VOTES_BONUS = 1;
const POINTS_CORRECT_VOTE_BONUS = 1;
export const POINTS_IMPOSTOR_GUESS_BONUS = 1;

/**
 * Pure scoring function so the rules are easy to reason about / unit test
 * independently of the room's socket/timer plumbing.
 */
export function computeRoundScore(input: ScoringInput, votes: Record<string, string>): ScoringOutput {
  const impostorSet = new Set(input.impostorIds);
  const wasImpostorEliminated = input.eliminatedId !== null && impostorSet.has(input.eliminatedId);
  const pointsAwarded: Record<string, number> = {};

  const addPoints = (playerId: string, amount: number) => {
    pointsAwarded[playerId] = (pointsAwarded[playerId] ?? 0) + amount;
  };

  if (wasImpostorEliminated) {
    for (const innocentId of input.innocentIds) {
      addPoints(innocentId, POINTS_INNOCENT_WIN);
    }
    // Bonus for anyone who personally voted for a real impostor.
    for (const [voterId, targetId] of Object.entries(votes)) {
      if (impostorSet.has(targetId) && input.innocentIds.includes(voterId)) {
        addPoints(voterId, POINTS_CORRECT_VOTE_BONUS);
      }
    }
  } else {
    for (const impostorId of input.impostorIds) {
      addPoints(impostorId, POINTS_IMPOSTOR_ESCAPE);
      if ((input.votesReceived[impostorId] ?? 0) === 0) {
        addPoints(impostorId, POINTS_IMPOSTOR_ZERO_VOTES_BONUS);
      }
    }
  }

  return { pointsAwarded, wasImpostorEliminated };
}
