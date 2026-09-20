import { ALL_CATEGORIES, Category, Difficulty } from './types';

export interface WordEntry {
  word: string;
  tier: 1 | 2 | 3; // 1 = easy/common, 2 = normal, 3 = hard/rarer
  hints: string[]; // related words — used as the impostor's secret hint, and by AI bots as plausible clues
}

function w(word: string, tier: 1 | 2 | 3, hints: string[]): WordEntry {
  return { word, tier, hints };
}

export const WORD_BANK: Record<Category, WordEntry[]> = {
  animali: [
    w('Leone', 1, ['savana', 'criniera', 're']),
    w('Elefante', 1, ['proboscide', 'grande', 'savana']),
    w('Delfino', 1, ['mare', 'intelligente', 'salto']),
    w('Aquila', 2, ['cielo', 'artigli', 'vista']),
    w('Pinguino', 1, ['ghiaccio', 'nero', 'freddo']),
    w('Serpente', 1, ['veleno', 'striscia', 'squame']),
    w('Canguro', 2, ['tasca', 'salto', 'australia']),
    w('Gorilla', 2, ['forza', 'giungla', 'petto']),
    w('Squalo', 1, ['denti', 'mare', 'pinna']),
    w('Farfalla', 1, ['ali', 'colori', 'fiore']),
    w('Volpe', 2, ['furba', 'coda', 'bosco']),
    w('Orso', 1, ['foresta', 'miele', 'pelliccia']),
    w('Coccodrillo', 2, ['fiume', 'denti', 'palude']),
    w('Struzzo', 3, ['sabbia', 'collo', 'veloce']),
    w('Pipistrello', 3, ['notte', 'grotta', 'ali']),
  ],
  cibo: [
    w('Pizza', 1, ['forno', 'formaggio', 'italia']),
    w('Gelato', 1, ['freddo', 'estate', 'cono']),
    w('Pasta', 1, ['sugo', 'italia', 'forchetta']),
    w('Sushi', 2, ['riso', 'giappone', 'pesce']),
    w('Panino', 1, ['pane', 'pranzo', 'farcito']),
    w('Torta', 1, ['compleanno', 'dolce', 'candeline']),
    w('Formaggio', 1, ['latte', 'stagionato', 'forma']),
    w('Lasagna', 2, ['forno', 'strati', 'ragù']),
    w('Cioccolato', 1, ['dolce', 'cacao', 'fondente']),
    w('Risotto', 2, ['riso', 'mantecato', 'cucchiaio']),
    w('Tacos', 3, ['messico', 'piccante', 'tortilla']),
    w('Hamburger', 1, ['carne', 'panino', 'fast food']),
    w('Croissant', 2, ['colazione', 'francia', 'sfoglia']),
    w('Miele', 2, ['api', 'dolce', 'barattolo']),
  ],
  bevande: [
    w('Caffè', 1, ['tazza', 'mattina', 'amaro']),
    w('Vino', 1, ['uva', 'calice', 'cantina']),
    w('Birra', 1, ['luppolo', 'schiuma', 'boccale']),
    w('Succo', 1, ['frutta', 'spremuta', 'dolce']),
    w('Tè', 1, ['bustina', 'infuso', 'tazza']),
    w('Acqua', 1, ['bottiglia', 'rubinetto', 'sete']),
    w('Cioccolata calda', 3, ['inverno', 'tazza', 'panna']),
    w('Cocktail', 2, ['shaker', 'ghiaccio', 'bar']),
    w('Frullato', 2, ['frutta', 'frullatore', 'cremoso']),
    w('Limonata', 2, ['limone', 'estate', 'fresca']),
  ],
  oggetti: [
    w('Ombrello', 1, ['pioggia', 'apri', 'manico']),
    w('Occhiali', 1, ['vista', 'lenti', 'naso']),
    w('Chiave', 1, ['porta', 'serratura', 'girare']),
    w('Specchio', 1, ['riflesso', 'vetro', 'immagine']),
    w('Zaino', 1, ['scuola', 'spalle', 'tasche']),
    w('Forbici', 1, ['tagliare', 'lame', 'carta']),
    w('Candela', 2, ['cera', 'fiamma', 'buio']),
    w('Valigia', 1, ['viaggio', 'ruote', 'aeroporto']),
    w('Orologio', 1, ['tempo', 'lancette', 'polso']),
    w('Martello', 2, ['chiodo', 'colpo', 'attrezzo']),
    w('Sedia', 1, ['seduta', 'gambe', 'tavolo']),
    w('Bussola', 3, ['nord', 'ago', 'direzione']),
  ],
  sport: [
    w('Calcio', 1, ['pallone', 'gol', 'stadio']),
    w('Tennis', 1, ['racchetta', 'rete', 'palla']),
    w('Nuoto', 1, ['piscina', 'bracciata', 'acqua']),
    w('Basket', 1, ['canestro', 'palla', 'schiacciata']),
    w('Ciclismo', 2, ['bici', 'pedali', 'strada']),
    w('Pugilato', 2, ['guantoni', 'ring', 'colpo']),
    w('Sci', 2, ['neve', 'pista', 'discesa']),
    w('Golf', 2, ['buca', 'mazza', 'green']),
    w('Scherma', 3, ['spada', 'maschera', 'pedana']),
    w('Pallavolo', 2, ['rete', 'schiacciata', 'palla']),
    w('Atletica', 2, ['pista', 'corsa', 'record']),
    w('Surf', 3, ['onda', 'tavola', 'oceano']),
  ],
  film: [
    w('Titanic', 1, ['nave', 'iceberg', 'amore']),
    w('Avatar', 1, ['blu', 'pandora', 'alieni']),
    w('Matrix', 2, ['pillola', 'realtà', 'hacker']),
    w('Jaws', 3, ['squalo', 'mare', 'paura']),
    w('Frozen', 1, ['ghiaccio', 'regina', 'neve']),
    w('Rocky', 2, ['boxe', 'scalinata', 'campione']),
    w('Shrek', 1, ['orco', 'palude', 'asino']),
    w('Joker', 2, ['clown', 'risata', 'caos']),
    w('Inception', 3, ['sogno', 'trottola', 'livelli']),
    w('Gladiatore', 2, ['arena', 'roma', 'spada']),
  ],
  serietv: [
    w('Friends', 1, ['divano', 'caffetteria', 'amici']),
    w('Breaking Bad', 2, ['chimica', 'deserto', 'camper']),
    w('Stranger Things', 1, ['sottosopra', 'anni 80', 'bicicletta']),
    w('Squid Game', 1, ['gioco', 'maschera', 'sopravvivenza']),
    w('The Office', 2, ['ufficio', 'telecamera', 'imbarazzo']),
    w('Game of Thrones', 1, ['trono', 'drago', 'regno']),
    w('La Casa di Carta', 2, ['rapina', 'maschera', 'banca']),
    w('Peaky Blinders', 3, ['coppola', 'gang', 'birmingham']),
    w('Sherlock', 2, ['indizi', 'lente', 'detective']),
  ],
  videogiochi: [
    w('Minecraft', 1, ['blocchi', 'creativo', 'picconare']),
    w('Fortnite', 1, ['paracadute', 'costruire', 'battle royale']),
    w('Mario', 1, ['fungo', 'tubo', 'salto']),
    w('Zelda', 2, ['spada', 'triforza', 'avventura']),
    w('Tetris', 1, ['blocchi', 'righe', 'incastro']),
    w('Pac-Man', 2, ['labirinto', 'fantasmi', 'pallini']),
    w('FIFA', 1, ['calcio', 'squadra', 'console']),
    w('Among Us', 1, ['astronave', 'sabotatore', 'compiti']),
    w('The Sims', 2, ['casa', 'vita virtuale', 'personaggio']),
    w('Pokemon', 1, ['cattura', 'allenatore', 'evoluzione']),
  ],
  personaggi: [
    w('Batman', 1, ['pipistrello', 'mantello', 'gotham']),
    w('Harry Potter', 1, ['bacchetta', 'mago', 'scuola']),
    w('Spider-Man', 1, ['ragnatela', 'città', 'maschera']),
    w('Sherlock Holmes', 2, ['lente', 'indizi', 'pipa']),
    w('Cenerentola', 1, ['scarpetta', 'mezzanotte', 'principe']),
    w('Dracula', 2, ['sangue', 'castello', 'notte']),
    w('Robin Hood', 2, ['arco', 'foresta', 'ricchi']),
    w('Pinocchio', 1, ['naso', 'burattino', 'bugie']),
  ],
  luoghi: [
    w('Spiaggia', 1, ['sabbia', 'onde', 'ombrellone']),
    w('Montagna', 1, ['vetta', 'neve', 'sentiero']),
    w('Deserto', 1, ['sabbia', 'oasi', 'cammello']),
    w('Foresta', 1, ['alberi', 'sentiero', 'animali']),
    w('Biblioteca', 1, ['libri', 'silenzio', 'scaffali']),
    w('Aeroporto', 1, ['volo', 'valigia', 'pista']),
    w('Ospedale', 1, ['medico', 'lettino', 'ambulanza']),
    w('Castello', 2, ['torre', 'ponte levatoio', 're']),
    w('Vulcano', 2, ['lava', 'eruzione', 'cratere']),
    w('Isola', 2, ['mare', 'palme', 'circondata']),
  ],
  paesi: [
    w('Italia', 1, ['pizza', 'stivale', 'roma']),
    w('Giappone', 1, ['sushi', 'samurai', 'tokyo']),
    w('Brasile', 1, ['samba', 'calcio', 'amazzonia']),
    w('Egitto', 1, ['piramidi', 'deserto', 'nilo']),
    w('Francia', 1, ['torre eiffel', 'baguette', 'parigi']),
    w('Australia', 2, ['canguro', 'outback', 'oceano']),
    w('Messico', 2, ['tacos', 'sombrero', 'deserto']),
    w('Norvegia', 3, ['fiordi', 'freddo', 'aurora']),
    w('India', 2, ['spezie', 'taj mahal', 'gange']),
  ],
  citta: [
    w('Roma', 1, ['colosseo', 'papa', 'tevere']),
    w('Parigi', 1, ['torre eiffel', 'moda', 'senna']),
    w('New York', 1, ['grattacieli', 'statua', 'taxi']),
    w('Venezia', 1, ['canali', 'gondola', 'maschere']),
    w('Tokyo', 2, ['neon', 'metropoli', 'sushi']),
    w('Dubai', 2, ['grattacieli', 'deserto', 'lusso']),
    w('Londra', 1, ['big ben', 'pioggia', 'tè']),
    w('Rio de Janeiro', 3, ['carnevale', 'spiaggia', 'cristo']),
  ],
  natura: [
    w('Fiume', 1, ['acqua', 'corrente', 'ponte']),
    w('Cascata', 1, ['acqua', 'rocce', 'schiuma']),
    w('Tramonto', 1, ['sole', 'colori', 'orizzonte']),
    w('Arcobaleno', 1, ['colori', 'pioggia', 'cielo']),
    w('Ghiacciaio', 2, ['freddo', 'montagna', 'ghiaccio']),
    w('Uragano', 2, ['vento', 'tempesta', 'occhio']),
    w('Terremoto', 2, ['scossa', 'crepa', 'faglia']),
    w('Nebbia', 2, ['grigia', 'visibilità', 'umida']),
  ],
  tecnologia: [
    w('Smartphone', 1, ['schermo', 'app', 'tasca']),
    w('Robot', 1, ['metallo', 'automatico', 'braccia']),
    w('Internet', 1, ['rete', 'connessione', 'sito']),
    w('Drone', 2, ['eliche', 'telecomando', 'volo']),
    w('Laptop', 1, ['tastiera', 'schermo', 'portatile']),
    w('Realtà virtuale', 3, ['visore', 'immersivo', 'digitale']),
    w('Stampante 3D', 3, ['filamento', 'strati', 'modello']),
    w('Intelligenza artificiale', 2, ['algoritmo', 'dati', 'apprendimento']),
  ],
  scuola: [
    w('Zaino', 1, ['spalle', 'libri', 'scuola']),
    w('Lavagna', 1, ['gesso', 'aula', 'cancellino']),
    w('Compito', 1, ['casa', 'quaderno', 'scadenza']),
    w('Ricreazione', 2, ['pausa', 'cortile', 'merenda']),
    w('Interrogazione', 2, ['ansia', 'voto', 'cattedra']),
    w('Diploma', 2, ['esame', 'pergamena', 'traguardo']),
    w('Matita', 1, ['gomma', 'temperino', 'disegno']),
    w('Professore', 1, ['cattedra', 'lezione', 'aula']),
  ],
  lavoro: [
    w('Ufficio', 1, ['scrivania', 'computer', 'riunione']),
    w('Stipendio', 1, ['busta paga', 'mese', 'banca']),
    w('Riunione', 1, ['tavolo', 'sala', 'ordine del giorno']),
    w('Colloquio', 2, ['curriculum', 'domande', 'ansia']),
    w('Straordinario', 3, ['ore extra', 'stanchezza', 'paga']),
    w('Capo', 1, ['direzione', 'ordini', 'ufficio']),
    w('Contratto', 2, ['firma', 'clausole', 'assunzione']),
  ],
  misc: [
    w('Musica', 1, ['note', 'ritmo', 'cuffie']),
    w('Sogno', 1, ['notte', 'fantasia', 'sveglia']),
    w('Festa', 1, ['palloncini', 'musica', 'invitati']),
    w('Magia', 2, ['bacchetta', 'trucco', 'illusione']),
    w('Silenzio', 2, ['quiete', 'pausa', 'assenza di rumore']),
    w('Fortuna', 2, ['quadrifoglio', 'destino', 'caso']),
    w('Tempo', 3, ['orologio', 'calendario', 'attesa']),
    w('Amicizia', 2, ['fiducia', 'legame', 'supporto']),
  ],
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function maxTierFor(difficulty: Difficulty): 1 | 2 | 3 {
  if (difficulty === 'easy') return 1;
  if (difficulty === 'normal') return 2;
  return 3;
}

function eligibleWords(category: Category, maxTier: number): WordEntry[] {
  const filtered = WORD_BANK[category].filter((e) => e.tier <= maxTier);
  return filtered.length > 0 ? filtered : WORD_BANK[category];
}

export interface PickPairOptions {
  categories: Category[] | 'random';
  difficulty: Difficulty;
  recentWords: string[]; // lowercase innocent words, most recent first
}

export interface PickedPair {
  innocentWord: string;
  /** A word related to innocentWord (one of its own hints) — the impostor's only lead. */
  impostorHint: string;
  category: Category;
}

/**
 * The impostor never gets a rival word from a different topic — they get one
 * of the innocent word's own associated hints, so their clues can plausibly
 * connect to the real thing without ever revealing the category to them.
 */
export function pickWordPair(opts: PickPairOptions): PickedPair {
  const pool: Category[] =
    opts.categories === 'random' || opts.categories.length === 0
      ? ALL_CATEGORIES
      : opts.categories;

  const maxTier = maxTierFor(opts.difficulty);
  const recentSet = new Set(opts.recentWords);

  for (let attempt = 0; attempt < 40; attempt++) {
    const innocentCategory = pickRandom(pool);
    const innocentEntry = pickRandom(eligibleWords(innocentCategory, maxTier));
    if (recentSet.has(innocentEntry.word.toLowerCase())) continue;
    if (innocentEntry.hints.length === 0) continue;

    const impostorHint = pickRandom(innocentEntry.hints);
    return { innocentWord: innocentEntry.word, impostorHint, category: innocentCategory };
  }

  // Fallback: ignore history to avoid ever getting stuck.
  const innocentCategory = pickRandom(pool);
  const innocentEntry = pickRandom(WORD_BANK[innocentCategory]);
  const impostorHint = pickRandom(innocentEntry.hints);
  return { innocentWord: innocentEntry.word, impostorHint, category: innocentCategory };
}

export function findHints(word: string): string[] {
  for (const cat of ALL_CATEGORIES) {
    const entry = WORD_BANK[cat].find((e) => e.word.toLowerCase() === word.toLowerCase());
    if (entry) return entry.hints;
  }
  return [];
}
