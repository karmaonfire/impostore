import { useEffect, useRef, useState } from 'react';
import PlayerList from '../components/PlayerList';
import Timer from '../components/Timer';
import { socket } from '../socket';
import { useGameStore } from '../store';

function playerName(players: { id: string; nickname: string }[], id: string | null | undefined) {
  if (!id) return '???';
  return players.find((p) => p.id === id)?.nickname ?? '???';
}

export default function Game({ onLeave }: { onLeave: () => void }) {
  const roomState = useGameStore((s) => s.roomState)!;
  const session = useGameStore((s) => s.session)!;
  const yourWord = useGameStore((s) => s.yourWord);

  const [clueText, setClueText] = useState('');
  const [selectedVote, setSelectedVote] = useState<string | null>(null);
  const [revealing, setRevealing] = useState(false);
  const prevPhase = useRef(roomState.phase);

  useEffect(() => {
    if (roomState.phase === 'reveal' && prevPhase.current !== 'reveal') {
      setRevealing(true);
      const t = setTimeout(() => setRevealing(false), 2200);
      return () => clearTimeout(t);
    }
    if (roomState.phase === 'clue' && prevPhase.current !== 'clue') {
      setSelectedVote(null);
    }
    prevPhase.current = roomState.phase;
  }, [roomState.phase]);

  const me = roomState.players.find((p) => p.id === session.playerId);
  const amHost = roomState.hostId === session.playerId;
  const isMyTurn = roomState.currentTurnPlayerId === session.playerId;
  const active = roomState.players.filter((p) => !p.isSpectator);

  function submitClue() {
    const text = clueText.trim();
    if (!text) return;
    socket.emit('submit_clue', text);
    setClueText('');
  }

  function confirmVote() {
    if (!selectedVote) return;
    socket.emit('submit_vote', selectedVote);
  }

  return (
    <div className="page game-page">
      <div className="game-topbar">
        <span className="room-code-mini">Stanza {roomState.code}</span>
        <span className="round-indicator">
          {roomState.eliminationCycle > 1 && `Ciclo ${roomState.eliminationCycle} · `}
          {roomState.phase === 'clue' && `Round ${roomState.clueGiro}/${roomState.totalClueRounds}`}
        </span>
        <button className="btn btn-ghost btn-tiny" onClick={onLeave}>
          🚪 Abbandona
        </button>
      </div>

      <div className="game-grid">
        <aside className="panel sidebar">
          <h3>Giocatori</h3>
          <PlayerList
            players={active}
            hostId={roomState.hostId}
            myPlayerId={session.playerId}
            phase={roomState.phase}
            currentTurnPlayerId={roomState.currentTurnPlayerId}
            showVoteStatus
            liveVoteCounts={roomState.liveVoteCounts}
          />
        </aside>

        <main className="panel game-main">
          {yourWord && !me?.isSpectator && (
            <div className={`word-card word-card-${yourWord.role}`}>
              <span className="word-role">{yourWord.role === 'impostor' ? '🎭 Sei l\'IMPOSTORE' : '🙂 Sei un INNOCENTE'}</span>
              <span className="word-caption">{yourWord.role === 'impostor' ? 'Il tuo suggerimento' : 'La tua parola'}</span>
              <span className="word-value">{yourWord.word}</span>
              {yourWord.category && <span className="word-category">Categoria: {yourWord.category}</span>}
            </div>
          )}
          {me?.isSpectator && <div className="banner">👁️ Sei in modalità spettatore</div>}
          {me?.isEliminated && !me?.isSpectator && <div className="banner">☠️ Sei stato eliminato — segui il resto della partita come spettatore</div>}

          {roomState.phase === 'clue' && (
            <section>
              <h2>
                {isMyTurn ? '🎙️ Tocca a te! Scrivi una parola' : `In attesa di ${playerName(roomState.players, roomState.currentTurnPlayerId)}…`}
              </h2>
              <Timer endsAt={roomState.phaseEndsAt} label="Tempo" />
              {isMyTurn && (
                <div className="clue-input-row">
                  <input
                    autoFocus
                    maxLength={60}
                    value={clueText}
                    placeholder="La tua parola…"
                    onChange={(e) => setClueText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && submitClue()}
                  />
                  <button className="btn btn-primary" onClick={submitClue}>
                    Conferma
                  </button>
                </div>
              )}
              <ClueBoard clues={roomState.clues} players={roomState.players} />
            </section>
          )}

          {roomState.phase === 'voting' && (
            <section>
              <h2>🗳️ Votazione — chi è l&apos;impostore?</h2>
              <Timer endsAt={roomState.phaseEndsAt} label="Tempo votazione" />
              {me?.isEliminated ? (
                <p className="hint">☠️ Sei stato eliminato in questa partita: segui la votazione come spettatore.</p>
              ) : me?.hasVoted ? (
                <p className="hint">
                  Voto inviato. In attesa degli altri ({active.filter((p) => !p.isEliminated && p.hasVoted).length}/{active.filter((p) => !p.isEliminated).length})…
                </p>
              ) : (
                <>
                  <div className="vote-grid">
                    {active
                      .filter((p) => !p.isEliminated)
                      .filter((p) => roomState.settings.allowSelfVote || p.id !== session.playerId)
                      .map((p) => (
                        <button
                          key={p.id}
                          className={`vote-option ${selectedVote === p.id ? 'vote-option-selected' : ''}`}
                          onClick={() => setSelectedVote(p.id)}
                        >
                          <span className="player-avatar" style={{ background: p.avatarColor }}>
                            {p.avatarEmoji}
                          </span>
                          {p.nickname}
                          {!!roomState.liveVoteCounts?.[p.id] && (
                            <span className="vote-count-badge">{roomState.liveVoteCounts[p.id]}</span>
                          )}
                        </button>
                      ))}
                  </div>
                  <button className="btn btn-primary btn-large" disabled={!selectedVote} onClick={confirmVote}>
                    Conferma voto
                  </button>
                </>
              )}
              <h3>Parole dette</h3>
              <WordRecap clues={roomState.clues} players={roomState.players} />
            </section>
          )}

          {roomState.phase === 'elimination' && <EliminationSection />}

          {roomState.phase === 'reveal' && (
            <RevealSection revealing={revealing} onLeave={onLeave} amHost={amHost} />
          )}
        </main>
      </div>
    </div>
  );
}

function ClueBoard({ clues, players }: { clues: { playerId: string; round: number; text: string }[]; players: { id: string; nickname: string; avatarEmoji: string; avatarColor: string }[] }) {
  if (clues.length === 0) return <p className="hint">Nessuna parola ancora.</p>;
  const rounds = [...new Set(clues.map((c) => c.round))];
  return (
    <div className="clue-board">
      {rounds.map((round) => (
        <div key={round} className="clue-round">
          <h4>Round {round}</h4>
          <div className="clue-chips">
            {clues
              .filter((c) => c.round === round)
              .map((c, i) => {
                const p = players.find((pl) => pl.id === c.playerId);
                return (
                  <span key={i} className="clue-chip">
                    <span className="clue-chip-avatar" style={{ background: p?.avatarColor }}>
                      {p?.avatarEmoji}
                    </span>
                    <strong>{p?.nickname}:</strong> {c.text}
                  </span>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}

function WordRecap({ clues, players }: { clues: { playerId: string; round: number; text: string }[]; players: { id: string; nickname: string }[] }) {
  if (clues.length === 0) return <p className="hint">Nessuna parola detta.</p>;
  const order: string[] = [];
  const byPlayer = new Map<string, string[]>();
  for (const c of clues) {
    if (!byPlayer.has(c.playerId)) {
      byPlayer.set(c.playerId, []);
      order.push(c.playerId);
    }
    byPlayer.get(c.playerId)!.push(c.text);
  }
  return (
    <ul className="word-recap">
      {order.map((playerId) => (
        <li key={playerId}>
          <strong>{players.find((p) => p.id === playerId)?.nickname ?? '???'}:</strong> {byPlayer.get(playerId)!.join(', ')}
        </li>
      ))}
    </ul>
  );
}

function EliminationSection() {
  const roomState = useGameStore((s) => s.roomState)!;
  const interim = roomState.interimElimination;
  if (!interim) return null;
  const eliminated = roomState.players.find((p) => p.id === interim.eliminatedId);
  const remaining = roomState.players.filter((p) => !p.isSpectator && !p.isEliminated).length;
  const votedTargets = Object.keys(interim.voteCounts).filter((id) => (interim.voteCounts[id] ?? 0) > 0);

  return (
    <section className="reveal-section">
      <div className="reveal-outcome outcome-neutral">
        {interim.noElimination ? (
          <h2>🤷 Nessuno eliminato {interim.tie ? '(pareggio)' : ''}</h2>
        ) : (
          <h2>{eliminated?.nickname ?? '???'} è stato eliminato</h2>
        )}
        <p className="hint">Non era l&apos;ultimo impostore: la partita continua con la stessa parola ({remaining} giocatori rimasti)…</p>
      </div>

      {votedTargets.length > 0 && (
        <>
          <h3>Voti</h3>
          <ul className="vote-results">
            {votedTargets.map((targetId) => {
              const target = roomState.players.find((p) => p.id === targetId);
              const voters = interim.voterIds[targetId] ?? [];
              return (
                <li key={targetId}>
                  {target?.nickname}: {interim.voteCounts[targetId]} voto/i ({voters.map((id) => roomState.players.find((p) => p.id === id)?.nickname).join(', ') || 'nessuno'})
                </li>
              );
            })}
          </ul>
        </>
      )}

      <div className="reveal-countdown">
        <span className="reveal-countdown-dots">🔄</span>
      </div>
    </section>
  );
}

function RevealSection({ revealing, onLeave, amHost }: { revealing: boolean; onLeave: () => void; amHost: boolean }) {
  const roomState = useGameStore((s) => s.roomState)!;
  const result = roomState.lastResult;
  if (!result) return null;

  if (revealing) {
    return (
      <div className="reveal-countdown">
        <span>I voti sono stati rivelati…</span>
        <span className="reveal-countdown-dots">🤫🔍🎭</span>
      </div>
    );
  }

  const eliminated = roomState.players.find((p) => p.id === result.eliminatedId);

  return (
    <section className="reveal-section">
      <div className={`reveal-outcome ${result.wasImpostorEliminated ? 'outcome-good' : 'outcome-bad'}`}>
        {result.impostorGuessedWord ? (
          <h2>🎭 L&apos;impostore ha scritto la parola segreta! L&apos;impostore vince la partita.</h2>
        ) : result.noElimination ? (
          <h2>🤷 Rimasto un solo innocente: l&apos;impostore vince la partita ({result.tie ? 'pareggio' : 'zero voti'})</h2>
        ) : (
          <h2>
            {eliminated?.nickname} è stato eliminato — {result.wasImpostorEliminated ? '🎉 Era l\'impostore! Vincono gli innocenti.' : '😱 Non era l\'impostore! Vince l\'impostore.'}
          </h2>
        )}
      </div>

      {result.eliminationHistory.length > 0 && (
        <p className="hint">
          Eliminati durante la partita:{' '}
          {result.eliminationHistory
            .map((e) => roomState.players.find((p) => p.id === e.playerId)?.nickname ?? '???')
            .join(', ')}
        </p>
      )}

      <div className="word-reveal-row">
        <div className="word-reveal-card">
          <span>La parola</span>
          <strong>{result.innocentWord}</strong>
        </div>
        <div className="word-reveal-card word-reveal-impostor">
          <span>Il suggerimento dell&apos;impostore</span>
          <strong>{result.impostorHint}</strong>
        </div>
      </div>

      <h3>Impostori: {roomState.players.filter((p) => result.impostorIds.includes(p.id)).map((p) => p.nickname).join(', ')}</h3>

      {result.voteResults.length > 0 && (
        <>
          <h3>Voti</h3>
          <ul className="vote-results">
            {result.voteResults.map((v) => {
              const target = roomState.players.find((p) => p.id === v.targetId);
              return (
                <li key={v.targetId}>
                  {target?.nickname}: {v.votes} voto/i ({v.voterIds.map((id) => roomState.players.find((p) => p.id === id)?.nickname).join(', ') || 'nessuno'})
                </li>
              );
            })}
          </ul>
        </>
      )}

      {amHost ? (
        <button className="btn btn-primary btn-large" onClick={() => socket.emit('play_again')}>
          🔄 Torna alla lobby
        </button>
      ) : (
        <p className="hint">In attesa dell&apos;host…</p>
      )}
      <button className="btn btn-ghost" onClick={onLeave}>
        🚪 Abbandona
      </button>
    </section>
  );
}
