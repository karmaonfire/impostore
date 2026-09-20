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
          innocenti ricevono la stessa parola segreta. L&apos;impostore non la conosce: riceve invece un
          <strong> suggerimento</strong> collegato a quella parola, abbastanza vicino da aiutarlo a intuire di cosa si
          tratta e a inventare parole plausibili, ma non la parola stessa. L&apos;impostore non sa nemmeno a quale
          categoria appartiene la parola.
        </p>
      </section>

      <section className="howto-section">
        <h2>🗣️ Le parole</h2>
        <p>
          A turno, ogni giocatore dice una sola parola legata alla parola segreta (o, per l&apos;impostore, al proprio
          suggerimento). Gli innocenti cercano di dimostrare — senza essere troppo espliciti — di conoscere la parola
          comune. L&apos;impostore deve improvvisare, ascoltando gli altri per capire di cosa si sta parlando, senza
          farsi scoprire.
        </p>
      </section>

      <section className="howto-section">
        <h2>🗳️ Votazione</h2>
        <p>
          Dopo i round di parole, ogni giocatore vota simultaneamente chi pensa sia l&apos;impostore. I voti restano
          nascosti fino alla fine. Se il voto non elimina l&apos;impostore, la partita continua subito con un altro
          giro sulla stessa parola e i giocatori rimasti — senza rivelare nulla.
        </p>
      </section>

      <section className="howto-section">
        <h2>🏁 Come finisce</h2>
        <p>La partita si conclude in uno di questi tre modi:</p>
        <ul>
          <li>l&apos;impostore viene votato fuori → vincono gli innocenti;</li>
          <li>si arriva a un solo innocente rimasto in gioco → vince l&apos;impostore;</li>
          <li>l&apos;impostore scrive per sbaglio (o per genio) la parola segreta esatta → vince subito l&apos;impostore.</li>
        </ul>
        <p>A quel punto vengono rivelate la parola, il suggerimento e l&apos;identità dell&apos;impostore, e si torna alla lobby per iniziare una nuova partita.</p>
      </section>
    </div>
  );
}
