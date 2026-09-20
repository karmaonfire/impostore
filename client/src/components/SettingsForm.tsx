import { ALL_CATEGORIES, CATEGORY_LABELS, Category, Difficulty, RoomSettings } from '@shared/types';

interface Props {
  settings: RoomSettings;
  onChange: (partial: Partial<RoomSettings>) => void;
  disabled?: boolean;
}

function NumberField({ label, value, min, max, disabled, onChange }: { label: string; value: number; min: number; max: number; disabled?: boolean; onChange: (v: number) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(clampInt(e.target.value, min, max))}
      />
    </label>
  );
}

function clampInt(raw: string, min: number, max: number): number {
  const n = parseInt(raw, 10);
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function ToggleField({ label, value, disabled, onChange }: { label: string; value: boolean; disabled?: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="field toggle-field">
      <span>{label}</span>
      <input type="checkbox" checked={value} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

export default function SettingsForm({ settings, onChange, disabled }: Props) {
  const categoriesMode: 'random' | 'custom' = settings.categories === 'random' ? 'random' : 'custom';
  const selectedCategories = new Set(Array.isArray(settings.categories) ? settings.categories : []);

  function toggleCategory(cat: Category) {
    const current = Array.isArray(settings.categories) ? settings.categories : [];
    const next = current.includes(cat) ? current.filter((c) => c !== cat) : [...current, cat];
    onChange({ categories: next.length > 0 ? next : 'random' });
  }

  return (
    <div className="settings-form">
      <fieldset>
        <legend>Giocatori</legend>
        <div className="field-row">
          <NumberField label="Min giocatori" value={settings.minPlayers} min={3} max={16} disabled={disabled} onChange={(v) => onChange({ minPlayers: v })} />
          <NumberField label="Max giocatori" value={settings.maxPlayers} min={settings.minPlayers} max={16} disabled={disabled} onChange={(v) => onChange({ maxPlayers: v })} />
          <NumberField label="Numero impostori" value={settings.numImpostors} min={1} max={Math.max(1, Math.floor(settings.maxPlayers / 2))} disabled={disabled} onChange={(v) => onChange({ numImpostors: v })} />
        </div>
      </fieldset>

      <fieldset>
        <legend>Round e timer</legend>
        <div className="field-row">
          <NumberField label="Numero di round" value={settings.clueRounds} min={1} max={6} disabled={disabled} onChange={(v) => onChange({ clueRounds: v })} />
          <NumberField label="Tempo per parola (sec)" value={settings.clueTimeSec} min={10} max={180} disabled={disabled} onChange={(v) => onChange({ clueTimeSec: v })} />
          <NumberField label="Tempo votazione (sec)" value={settings.votingTimeSec} min={10} max={180} disabled={disabled} onChange={(v) => onChange({ votingTimeSec: v })} />
        </div>
      </fieldset>

      <fieldset>
        <legend>Votazione</legend>
        <div className="field-row">
          <ToggleField label="Permetti voto a se stessi" value={settings.allowSelfVote} disabled={disabled} onChange={(v) => onChange({ allowSelfVote: v })} />
          <ToggleField label="Permetti pareggio (nessuna eliminazione)" value={settings.allowTie} disabled={disabled} onChange={(v) => onChange({ allowTie: v })} />
        </div>
      </fieldset>

      <fieldset>
        <legend>Parole</legend>
        <div className="field-row">
          <label className="field">
            <span>Difficoltà</span>
            <select disabled={disabled} value={settings.difficulty} onChange={(e) => onChange({ difficulty: e.target.value as Difficulty })}>
              <option value="easy">Facile</option>
              <option value="normal">Normale</option>
              <option value="hard">Difficile</option>
            </select>
          </label>
        </div>

        <div className="field">
          <span>Categorie</span>
          <div className="category-mode-row">
            <button type="button" className={categoriesMode === 'random' ? 'chip chip-active' : 'chip'} disabled={disabled} onClick={() => onChange({ categories: 'random' })}>
              Tutte casuali
            </button>
            {ALL_CATEGORIES.map((cat) => (
              <button
                type="button"
                key={cat}
                className={categoriesMode === 'custom' && selectedCategories.has(cat) ? 'chip chip-active' : 'chip'}
                disabled={disabled}
                onClick={() => toggleCategory(cat)}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>Stanza</legend>
        <div className="field-row">
          <ToggleField label="Stanza pubblica" value={settings.isPublic} disabled={disabled} onChange={(v) => onChange({ isPublic: v })} />
          <ToggleField label="Permetti ingresso a partita iniziata" value={settings.allowLateJoin} disabled={disabled} onChange={(v) => onChange({ allowLateJoin: v })} />
          <ToggleField label="Modalità spettatore" value={settings.spectatorMode} disabled={disabled} onChange={(v) => onChange({ spectatorMode: v })} />
        </div>
      </fieldset>
    </div>
  );
}
