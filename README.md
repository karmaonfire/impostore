# L'Impostore — Online

Gioco multiplayer in tempo reale ispirato al party game "Impostore": tutti gli
innocenti ricevono la stessa parola segreta, l'impostore riceve una parola
diversa e deve mimetizzarsi tra gli indizi altrui senza farsi scoprire.

## Struttura del progetto

```
shared/     Tipi TypeScript e banca di parole condivisi da client e server
server/     Backend Node.js + Express + Socket.IO (autorevole su tutta la logica di gioco)
client/     Frontend React + TypeScript + Vite
```

Il server è l'unica fonte di verità: assegna ruoli, parole, turni, timer,
voti e punteggio. Il client non può mai leggere la parola o il ruolo di un
altro giocatore — il server invia `your_word` privatamente, via socket
individuale, solo al giocatore interessato.

## Avvio in locale

Richiede Node.js 20+.

```bash
# terminale 1 — backend (porta 3001)
cd server
npm install
npm run dev

# terminale 2 — frontend (porta 5173, con proxy verso il backend)
cd client
npm install
npm run dev
```

Apri `http://localhost:5173`. Per testare il multiplayer, apri più schede o
usa un altro dispositivo sulla stessa rete puntando a
`http://<IP-del-PC>:5173` (Vite è configurato con `host: true`).

Per giocare da soli puoi creare una stanza, abbassare "Min giocatori" a 3
nelle impostazioni avanzate e premere "Aggiungi bot" nella lobby per
riempire gli slot con IA.

## Build di produzione (servizio unico)

Il backend, in produzione, serve anche i file statici del client — un solo
processo Node da esporre online.

```bash
cd client && npm install && npm run build   # genera client/dist
cd ../server && npm install                  # tsx esegue il TS direttamente, nessuna build da compilare
npm start                                     # avvia su http://localhost:3001
```

### Con Docker

```bash
docker compose up --build
```

Espone il gioco completo su `http://localhost:3001`.

## Deploy online

Questo progetto non include credenziali di hosting: per pubblicarlo con un
URL reale scegli un servizio che supporti WebSocket persistenti (Vercel/Netlify
"serverless" **non** vanno bene per Socket.IO). Opzioni consigliate, tutte
compatibili con il `Dockerfile` incluso:

1. **Render.com** (piano gratuito disponibile)
   - "New Web Service" → collega il repository Git → Render rileva il
     `Dockerfile` automaticamente.
   - Variabili d'ambiente: `PORT` (Render la imposta da sola), `CLIENT_ORIGIN=*`.
2. **Railway.app**
   - "New Project" → "Deploy from GitHub repo" → rileva il `Dockerfile`.
3. **Fly.io**
   - `fly launch` nella root del progetto (rileva il Dockerfile), poi `fly deploy`.
4. **Qualunque VPS con Docker**
   - `git clone`, poi `docker compose up -d --build`.

In tutti i casi basta un solo servizio (il `Dockerfile` root), perché il
backend serve anche il frontend compilato. Dopo il deploy, condividi
`https://<tuo-dominio>` con gli amici: da lì potranno creare stanze, ricevere
un codice a 5 caratteri e unirsi dal proprio telefono o PC.

Se preferisci ospitare frontend e backend separatamente, imposta
`VITE_SERVER_URL` (URL del backend) in fase di build del client e
`CLIENT_ORIGIN` (URL del frontend) come variabile d'ambiente del server per i
CORS.

## Funzionalità implementate

- Stanze indipendenti con codice a 5 caratteri, condivisibile via link.
- Lobby con nickname, avatar, stato "pronto", impostazioni visibili e
  modificabili dall'host in tempo reale.
- Impostazioni: min/max giocatori, numero impostori, round di indizi, timer
  indizio/discussione/voto, voto a se stessi, pareggio ammesso, punti per
  vincere, round massimi, difficoltà, categorie (multiple o casuali),
  modalità parole vicine/lontane, stanza pubblica/privata, ingresso a
  partita iniziata, modalità spettatore.
- 17 categorie di parole con banca interna, selezione automatica di coppie
  innocenti/impostore "lontane" (o "vicine" in modalità avanzata), con
  cronologia anti-ripetizione ed esclusione di coppie banali/sinonimi.
- Turni di indizi sequenziali con timer server-autorevole, fase di
  discussione con chat di gruppo, votazione simultanea a voti nascosti,
  reveal con dettaglio voti, entrambe le parole, impostore ed eliminato.
- Punteggio: innocenti premiati se eliminano l'impostore, impostore premiato
  se sopravvive (con bonus se riceve zero voti); classifica live; fine
  partita al raggiungimento del punteggio (o round massimi) impostato.
- Bot IA per riempire slot mancanti: ricevono una parola come un giocatore
  normale, generano indizi plausibili dalla propria parola, votano senza mai
  leggere informazioni private altrui.
- Riconnessione: un giocatore disconnesso mantiene il posto per 45s; se non
  torna, il bot prende il controllo del suo turno finché non si riconnette.
- Sicurezza: ogni evento è validato server-side (fase corretta, turno
  corretto, permessi host); i voti restano nascosti fino al reveal; nessun
  payload contiene mai la parola o il ruolo di un altro giocatore.
- UI responsive (mobile, tablet, desktop) in italiano.

## Note sui bot IA

I bot usano euristiche semplici (indizi presi da una lista di associazioni
per parola, voti pseudo-casuali tra i candidati validi) per restare
volutamente "onesti": non leggono mai lo stato nascosto degli altri
giocatori. È un'implementazione intenzionalmente leggera, pensata per
riempire le partite piccole — non un'IA linguistica.
