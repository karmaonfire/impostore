import { useEffect, useState } from 'react';

interface Props {
  endsAt: number | null;
  label?: string;
}

export default function Timer({ endsAt, label }: Props) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!endsAt) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [endsAt]);

  if (!endsAt) return null;

  const remainingMs = Math.max(0, endsAt - now);
  const seconds = Math.ceil(remainingMs / 1000);
  const urgent = seconds <= 5;

  return (
    <div className={`timer ${urgent ? 'timer-urgent' : ''}`}>
      {label && <span className="timer-label">{label}</span>}
      <span className="timer-value">{seconds}s</span>
    </div>
  );
}
