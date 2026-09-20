import { PublicPlayer } from '@shared/types';

interface Props {
  players: PublicPlayer[];
  hostId: string;
  myPlayerId: string;
  phase: string;
  currentTurnPlayerId?: string | null;
  showReady?: boolean;
  showVoteStatus?: boolean;
  onKick?: (playerId: string) => void;
}

export default function PlayerList({ players, hostId, myPlayerId, phase, currentTurnPlayerId, showReady, showVoteStatus, onKick }: Props) {
  const amHost = hostId === myPlayerId;
  return (
    <ul className="player-list">
      {players.map((p) => (
        <li key={p.id} className={`player-row ${p.id === currentTurnPlayerId ? 'player-row-turn' : ''} ${!p.isConnected ? 'player-row-offline' : ''}`}>
          <span className="player-avatar" style={{ background: p.avatarColor }}>
            {p.avatarEmoji}
          </span>
          <span className="player-name">
            {p.nickname}
            {p.id === myPlayerId && <span className="you-tag"> (tu)</span>}
          </span>
          <span className="player-badges">
            {p.id === hostId && <span title="Host" className="badge badge-host">👑</span>}
            {p.isBot && <span title="Bot" className="badge">🤖</span>}
            {p.isSpectator && <span title="Spettatore" className="badge">👁️</span>}
            {!p.isConnected && <span title="Disconnesso" className="badge badge-warn">⚠️</span>}
            {p.id === currentTurnPlayerId && <span title="Turno attuale" className="badge badge-turn">🎙️</span>}
            {showReady && phase === 'lobby' && !p.isSpectator && (
              <span className={`badge ${p.isReady ? 'badge-ready' : 'badge-notready'}`}>{p.isReady ? '✅ Pronto' : '⏳'}</span>
            )}
            {showVoteStatus && phase === 'voting' && !p.isSpectator && (
              <span className={`badge ${p.hasVoted ? 'badge-ready' : 'badge-notready'}`}>{p.hasVoted ? '🗳️' : '…'}</span>
            )}
            <span className="player-score">{p.score} pt</span>
            {amHost && onKick && p.id !== myPlayerId && (
              <button className="btn btn-tiny btn-danger" onClick={() => onKick(p.id)} title="Rimuovi giocatore">
                ✕
              </button>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}
