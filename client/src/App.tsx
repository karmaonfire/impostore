import { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import HowToPlay from './pages/HowToPlay';
import RoomPage from './pages/RoomPage';
import { socket } from './socket';
import { useGameStore } from './store';

export default function App() {
  const setConnected = useGameStore((s) => s.setConnected);
  const setRoomState = useGameStore((s) => s.setRoomState);
  const setYourWord = useGameStore((s) => s.setYourWord);
  const setError = useGameStore((s) => s.setError);

  useEffect(() => {
    socket.connect();

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onRoomState = (state: Parameters<typeof setRoomState>[0]) => setRoomState(state);
    const onYourWord = (payload: Parameters<typeof setYourWord>[0]) => setYourWord(payload);
    const onError = (msg: string) => {
      setError(msg);
      setTimeout(() => setError(null), 5000);
    };
    const onKicked = () => {
      setError('Sei stato rimosso dalla stanza.');
      setRoomState(null);
      setYourWord(null);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('room_state', onRoomState);
    socket.on('your_word', onYourWord);
    socket.on('error_message', onError);
    socket.on('kicked', onKicked);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('room_state', onRoomState);
      socket.off('your_word', onYourWord);
      socket.off('error_message', onError);
      socket.off('kicked', onKicked);
    };
  }, [setConnected, setRoomState, setYourWord, setError]);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/come-si-gioca" element={<HowToPlay />} />
      <Route path="/stanza/:code" element={<RoomPage />} />
    </Routes>
  );
}
