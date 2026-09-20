import { useState } from 'react';
import { CATEGORY_LABELS } from '@shared/types';
import PlayerList from '../components/PlayerList';
import SettingsForm from '../components/SettingsForm';
import { socket } from '../socket';
import { useGameStore } from '../store';

export default function Lobby({ onLeave }: { onLeave: () => void }) {
  const roomState = useGameStore((s) => s.roomState)!;
  const session = useGameStore((s) => s.session)!;
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(true);

  const me = roomState.players.find((p) => p.id === session.playerId);
  const amHost = roomState.hostId === session.playerId;
  const active = roomState.players.filter((p) => !p.isSpectator);
  const spectators = roomState.players.filter((p) => p.isSpectator);

  const notReadyCount = active.filter((p) => !p.isBot && !p.isReady).length;
  const canStart =
    active.length >= roomState.settings.minPlayers &&
    active.length <= roomState.settings.maxPlayers &&
    roomState.settings.numImpostors < active.length &&
    notReadyCount === 0;

  function copyCode() {
    navigator.clipboard?.writeText(roomState.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function copyLink() {
    const url = `${window.location.origin}/stanza/${roomState.code}`;
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  const categoriesLabel =
    roomState.settings.categories === 'random'
      ? 'Tutte casuali'
      : roomState.settings.categories.map((c) => CATEGORY_LABELS[c]).join(', ');

  return (
    <div className="page lobby-page">
      <div className="lobby-header">
        <div className="room-code-box">
          <span className="room-code-label">Codice stanza</span>
          <button className="room-code" onClick={copyCode} title="Copia codice">
            {roomState.code}
          </button>
          <button className="btn btn-tiny" onClick={copyLink}>
            {copied ? '✅ Copiato!' : '🔗 Copia link invito'}
          </button>
        </div>
        <button className="btn btn-ghost" onClick={onLeave}>
          🚪 Abbandona
        </button>
      </div>

      <div className="lobby-grid">
        <div className="panel">
          <h2>
            Giocatori ({active.length}/{roomState.settings.maxPlayers})
          </h2>
          <PlayerList
            players={active}
            hostId={roomState.hostId}
            myPlayerId={session.playerId}
            phase="lobby"
            showReady
            onKick={amHost ? (id) => socket.emit('kick_player', id) : undefined}
          />
          {spectators.length > 0 && (
            <>
              <h3>Spettatori</h3>
              <PlayerList players={spectators} hostId={roomState.hostId} myPlayerId={session.playerId} phase="lobby" />
            </>
          )}

          <div className="button-row">
            {!me?.isSpectator && (
              <button className={`btn ${me?.isReady ? 'btn-secondary' : 'btn-primary'}`} onClick={() => socket.emit('set_ready', !me?.isReady)}>
                {me?.isReady ? '❌ Non pronto' : '✅ Pronto'}
              </button>
            )}
            {amHost && (
              <>
                <button className="btn btn-ghost" onClick={() => socket.emit('fill_bots')} disabled={active.length >= roomState.settings.maxPlayers}>
                  🤖 Aggiungi bot
                </button>
                <button className="btn btn-ghost" onClick={() => socket.emit('remove_bot')}>
                  🤖 Rimuovi bot
                </button>
              </>
            )}
          </div>

          {amHost && (
            <button className="btn btn-primary btn-large" disabled={!canStart} onClick={() => socket.emit('start_game')}>
              ▶️ Inizia partita
            </button>
          )}
          {amHost && !canStart && (
            <p className="hint">
              {active.length < roomState.settings.minPlayers && `Servono almeno ${roomState.settings.minPlayers} giocatori. `}
              {notReadyCount > 0 && `${notReadyCount} giocatori non pronti. `}
              {roomState.settings.numImpostors >= active.length && 'Troppi impostori per questo numero di giocatori.'}
            </p>
          )}
          {!amHost && <p className="hint">In attesa che l&apos;host avvii la partita…</p>}
        </div>

        <div className="panel">
          <button className="btn btn-link" onClick={() => setShowSettings((v) => !v)}>
            {showSettings ? 'Nascondi impostazioni ▲' : 'Mostra impostazioni ▼'}
          </button>
          {showSettings &&
            (amHost ? (
              <SettingsForm settings={roomState.settings} onChange={(p) => socket.emit('update_settings', p)} />
            ) : (
              <ul className="settings-summary">
                <li>Giocatori: {roomState.settings.minPlayers}–{roomState.settings.maxPlayers}</li>
                <li>Impostori: {roomState.settings.numImpostors}</li>
                <li>Round di indizi: {roomState.settings.clueRounds}</li>
                <li>Tempo indizio: {roomState.settings.clueTimeSec}s</li>
                <li>Tempo discussione: {roomState.settings.discussionTimeSec}s</li>
                <li>Tempo votazione: {roomState.settings.votingTimeSec}s</li>
                <li>Voto a se stessi: {roomState.settings.allowSelfVote ? 'sì' : 'no'}</li>
                <li>Pareggio ammesso: {roomState.settings.allowTie ? 'sì' : 'no'}</li>
                <li>Punti per vincere: {roomState.settings.pointsToWin}</li>
                <li>Difficoltà: {roomState.settings.difficulty}</li>
                <li>Categorie: {categoriesLabel}</li>
                <li>Modalità parole: {roomState.settings.wordMode === 'far' ? 'molto diverse' : 'più vicine'}</li>
                <li>Stanza: {roomState.settings.isPublic ? 'pubblica' : 'privata'}</li>
                <li>Ingresso a partita iniziata: {roomState.settings.allowLateJoin ? 'sì' : 'no'}</li>
              </ul>
            ))}
        </div>
      </div>
    </div>
  );
}
