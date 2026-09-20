import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Game from './Game';
import Lobby from './Lobby';
import { socket } from '../socket';
import { clearRoomToken, loadRoomToken, saveRoomToken, useGameStore } from '../store';

export default function RoomPage() {
  const { code = '' } = useParams();
  const navigate = useNavigate();
  const session = useGameStore((s) => s.session);
  const setSession = useGameStore((s) => s.setSession);
  const roomState = useGameStore((s) => s.roomState);
  const nickname = useGameStore((s) => s.nickname);
  const setError = useGameStore((s) => s.setError);
  const reset = useGameStore((s) => s.reset);

  const [status, setStatus] = useState<'connecting' | 'ready' | 'failed'>('connecting');
  const attempted = useRef(false);

  useEffect(() => {
    const upperCode = code.toUpperCase();
    if (session && session.code === upperCode) {
      setStatus('ready');
      return;
    }
    if (attempted.current) return;
    attempted.current = true;

    const stored = loadRoomToken(upperCode);
    if (!stored) {
      setStatus('failed');
      return;
    }
    socket.emit('join_room', { code: upperCode, nickname: nickname || 'Giocatore', token: stored.token }, (res) => {
      if (!res.ok) {
        clearRoomToken(upperCode);
        setError(res.error);
        setStatus('failed');
        return;
      }
      saveRoomToken(res.code, res.playerId, res.token);
      setSession({ code: res.code, playerId: res.playerId, token: res.token });
      setStatus('ready');
    });
  }, [code, session, nickname, setSession, setError]);

  function handleLeave() {
    socket.emit('leave_room');
    if (session) clearRoomToken(session.code);
    reset();
    navigate('/');
  }

  if (status === 'connecting') {
    return (
      <div className="page center-page">
        <div className="spinner" />
        <p>Connessione alla stanza…</p>
      </div>
    );
  }

  if (status === 'failed' || !roomState) {
    return (
      <div className="page center-page">
        <p>Impossibile entrare nella stanza {code}.</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>
          Torna alla home
        </button>
      </div>
    );
  }

  return roomState.phase === 'lobby' ? <Lobby onLeave={handleLeave} /> : <Game onLeave={handleLeave} />;
}
