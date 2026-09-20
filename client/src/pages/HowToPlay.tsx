import { useNavigate } from 'react-router-dom';

export default function HowToPlay() {
  const navigate = useNavigate();
  return (
    <div className="page howto-page">
      <button className="btn btn-ghost" onClick={() => navigate('/')}>
        ← Indietro
      </button>
      <h1>Come si gioca</h1>

      <section className="howto-section">
        <h2>🎭 Il concetto</h2>
        <p>
          Ogni partita ha un gruppo di <strong>innocenti</strong> e almeno un <strong>impostore</strong>. Tutti gli
          innocenti ricevono la stessa parola segreta; l&apos;impostore riceve una parola diversa — non un sinonimo,
          ma abbastanza diversa da rendere difficile capire subito quella degli innocenti.
        </p>
      </section>

      <section className="howto-section">
        <h2>🗣️ Indizi</h2>
        <p>
          A turno, ogni giocatore dice una sola parola come indizio legata alla propria parola. Gli innocenti cercano
          di dimostrare (senza essere troppo espliciti) di conoscere la parola comune. L&apos;impostore deve
          improvvisare un indizio plausibile ascoltando gli altri, cercando di capire la parola degli innocenti.
        </p>
      </section>

      <section className="howto-section">
        <h2>💬 Discussione</h2>
        <p>Dopo gli indizi si apre una fase di discussione libera per confrontarsi su chi sembra sospetto.</p>
      </section>

      <section className="howto-section">
        <h2>🗳️ Votazione</h2>
        <p>
          Ogni giocatore vota simultaneamente chi pensa sia l&apos;impostore. I voti restano nascosti fino alla fine,
          poi vengono rivelati insieme all&apos;identità dell&apos;impostore e a entrambe le parole.
        </p>
      </section>

      <section className="howto-section">
        <h2>🏆 Punteggio</h2>
        <p>
          Se l&apos;impostore viene eliminato, gli innocenti guadagnano punti. Se l&apos;impostore sopravvive (o c&apos;è
          pareggio), è l&apos;impostore a guadagnare punti — con un bonus se non riceve nemmeno un voto. Vince chi
          raggiunge per primo il punteggio impostato dall&apos;host.
        </p>
      </section>
    </div>
  );
}
