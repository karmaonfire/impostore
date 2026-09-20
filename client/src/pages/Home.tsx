import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_SETTINGS, RoomSettings } from '@shared/types';
import SettingsForm from '../components/SettingsForm';
import { socket } from '../socket';
import { saveRoomToken, useGameStore } from '../store';

type Mode = 'none' | 'create' | 'join';

export default function Home() {
  const navigate = useNavigate();
  const nickname = useGameStore((s) => s.nickname);
  const setNickname = useGameStore((s) => s.setNickname);
  const setSession = useGameStore((s) => s.setSession);
  const setError = useGameStore((s) => s.setError);
  const errorMessage = useGameStore((s) => s.errorMessage);

  const [mode, setMode] = useState<Mode>('none');
  const [settings, setSettings] = useState<RoomSettings>(DEFAULT_SETTINGS);
  const [code, setCode] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [busy, setBusy] = useState(false);

  function handleCreate() {
    if (!nickname.trim()) {
      setError('Inserisci un nickname.');
      return;
    }
    setBusy(true);
    socket.emit('create_room', { nickname, settings }, (res) => {
      setBusy(false);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      saveRoomToken(res.code, res.playerId, res.token);
      setSession({ code: res.code, playerId: res.playerId, token: res.token });
      navigate(`/stanza/${res.code}`);
    });
  }

  function handleJoin() {
    if (!nickname.trim()) {
      setError('Inserisci un nickname.');
      return;
    }
    if (!code.trim()) {
      setError('Inserisci il codice della stanza.');
      return;
    }
    setBusy(true);
    socket.emit('join_room', { nickname, code: code.trim().toUpperCase() }, (res) => {
      setBusy(false);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      saveRoomToken(res.code, res.playerId, res.token);
      setSession({ code: res.code, playerId: res.playerId, token: res.token });
      navigate(`/stanza/${res.code}`);
    });
  }

  return (
    <div className="page home-page">
      <div className="hero">
        <h1>🎭 L&apos;Impostore</h1>
        <p className="tagline">Trova chi mente. Non farti scoprire.</p>
      </div>

      {errorMessage && <div className="banner banner-error">{errorMessage}</div>}

      {mode === 'none' && (
        <div className="home-menu">
          <label className="field nickname-field">
            <span>Il tuo nickname</span>
            <input value={nickname} maxLength={20} placeholder="Es. Marco" onChange={(e) => setNickname(e.target.value)} />
          </label>
          <button className="btn btn-primary btn-large" onClick={() => setMode('create')}>
            ➕ Crea stanza
          </button>
          <button className="btn btn-secondary btn-large" onClick={() => setMode('join')}>
            🔑 Entra con codice
          </button>
          <button className="btn btn-ghost" onClick={() => navigate('/come-si-gioca')}>
            📖 Come si gioca
          </button>
        </div>
      )}

      {mode === 'create' && (
        <div className="panel">
          <h2>Crea una nuova stanza</h2>
          <label className="field">
            <span>Il tuo nickname</span>
            <input value={nickname} maxLength={20} onChange={(e) => setNickname(e.target.value)} />
          </label>
          <button className="btn btn-link" onClick={() => setShowAdvanced((v) => !v)}>
            {showAdvanced ? 'Nascondi impostazioni avanzate ▲' : 'Impostazioni avanzate ▼'}
          </button>
          {showAdvanced && <SettingsForm settings={settings} onChange={(p) => setSettings((s) => ({ ...s, ...p }))} />}
          <div className="button-row">
            <button className="btn btn-ghost" onClick={() => setMode('none')} disabled={busy}>
              Indietro
            </button>
            <button className="btn btn-primary" onClick={handleCreate} disabled={busy}>
              {busy ? 'Creazione…' : 'Crea stanza'}
            </button>
          </div>
        </div>
      )}

      {mode === 'join' && (
        <div className="panel">
          <h2>Entra in una stanza</h2>
          <label className="field">
            <span>Il tuo nickname</span>
            <input value={nickname} maxLength={20} onChange={(e) => setNickname(e.target.value)} />
          </label>
          <label className="field">
            <span>Codice stanza</span>
            <input
              value={code}
              maxLength={5}
              placeholder="ES. AB12C"
              className="code-input"
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            />
          </label>
          <div className="button-row">
            <button className="btn btn-ghost" onClick={() => setMode('none')} disabled={busy}>
              Indietro
            </button>
            <button className="btn btn-primary" onClick={handleJoin} disabled={busy}>
              {busy ? 'Ingresso…' : 'Entra'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
