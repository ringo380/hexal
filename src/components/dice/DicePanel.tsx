// DicePanel — controlled dice-roller UI. Not context-coupled: callers (the
// DM popover and the player web view) bind `onRoll` to their own useDice()
// instance and pass in history themselves. Keeping this component pure props
// in / DiceRoll out means it can render identically in both bundles.

import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { DiceParseError, formatRoll, parseNotation } from '../../services/diceService';
import type { DiceAdvantage, DiceRoll } from '../../types';
import Icon from '../icons/Icon';
import DiceHistoryList from './DiceHistoryList';
import DiceResultReveal from './DiceResultReveal';

const DIE_FACES = [4, 6, 8, 10, 12, 20, 100];
const MIN_COUNT = 1;
const MAX_COUNT = 20;
const MIN_MODIFIER = -20;
const MAX_MODIFIER = 20;

const ADVANTAGE_OPTIONS: { value: DiceAdvantage; label: string }[] = [
  { value: 'none', label: 'Normal' },
  { value: 'advantage', label: 'Advantage' },
  { value: 'disadvantage', label: 'Disadvantage' },
];

interface DicePanelProps {
  onRoll: (
    input: string | { sides: number; count: number },
    opts: { advantage: DiceAdvantage; modifier: number; isHidden?: boolean }
  ) => DiceRoll;
  history: DiceRoll[];
  showHiddenToggle: boolean;
  announce?: (msg: string) => void;
}

function DicePanel({ onRoll, history, showHiddenToggle, announce }: DicePanelProps) {
  const [selectedDie, setSelectedDie] = useState(20);
  const [count, setCount] = useState(1);
  const [modifier, setModifier] = useState(0);
  const [advantage, setAdvantage] = useState<DiceAdvantage>('none');
  const [notation, setNotation] = useState('');
  const [isHidden, setIsHidden] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRoll, setLastRoll] = useState<DiceRoll | null>(null);

  const isNotationMode = notation.trim().length > 0;

  // In notation mode, advantage/disadvantage is only eligible when the
  // typed notation itself parses to a single 1d20 term (an optional
  // modifier is fine) - the same shape executeRoll enforces. A cheap parse
  // on every keystroke is fine here; no debounce needed.
  const notationIsSingleD20 = useMemo(() => {
    if (!isNotationMode) return false;
    try {
      const parsed = parseNotation(notation.trim());
      return (
        parsed.terms.length === 1 &&
        parsed.terms[0].count === 1 &&
        parsed.terms[0].sides === 20
      );
    } catch {
      return false;
    }
  }, [isNotationMode, notation]);

  const advantageEnabled = isNotationMode
    ? notationIsSingleD20
    : selectedDie === 20 && count === 1;

  // Advantage/disadvantage only applies to a single d20 - drop back to
  // 'none' whenever the pending roll stops matching that shape, so a stale
  // selection can't silently throw when the user hits Roll.
  useEffect(() => {
    if (!advantageEnabled && advantage !== 'none') {
      setAdvantage('none');
    }
  }, [advantageEnabled, advantage]);

  const handleDieSelect = (sides: number) => {
    setSelectedDie(sides);
    setNotation('');
    setError(null);
  };

  const handleNotationChange = (value: string) => {
    setNotation(value);
    setError(null);
  };

  const handleRoll = () => {
    setError(null);
    // Recompute from advantageEnabled directly rather than reading `advantage`
    // as-is: the effect above resets a stale selection back to 'none' on
    // render, but React may not have flushed that effect yet when this
    // click handler runs, so `advantage` state could still hold a value
    // that no longer matches the current dice/notation shape.
    const effectiveAdvantage: DiceAdvantage = advantageEnabled ? advantage : 'none';
    try {
      const result = isNotationMode
        ? onRoll(notation.trim(), { advantage: effectiveAdvantage, modifier: 0, isHidden })
        : onRoll({ sides: selectedDie, count }, { advantage: effectiveAdvantage, modifier, isHidden });
      setLastRoll(result);
      announce?.(formatRoll(result));
    } catch (err) {
      if (err instanceof DiceParseError) {
        setError(err.message);
      } else {
        throw err;
      }
    }
  };

  const handleNotationKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleRoll();
    }
  };

  return (
    <div className="dice-panel">
      <div className="dice-panel-section dice-die-buttons" role="group" aria-label="Choose a die">
        {DIE_FACES.map((sides) => (
          <button
            key={sides}
            type="button"
            className={`dice-die-btn${!isNotationMode && selectedDie === sides ? ' selected' : ''}`}
            aria-pressed={!isNotationMode && selectedDie === sides}
            onClick={() => handleDieSelect(sides)}
          >
            d{sides}
          </button>
        ))}
      </div>

      <div className="dice-panel-section dice-panel-controls">
        <div className="dice-stepper">
          <span className="dice-stepper-label" id="dice-count-label">Count</span>
          <div className="dice-stepper-controls" role="group" aria-labelledby="dice-count-label">
            <button
              type="button"
              className="dice-stepper-btn"
              aria-label="Decrease dice count"
              onClick={() => setCount((c) => Math.max(MIN_COUNT, c - 1))}
              disabled={count <= MIN_COUNT}
            >
              &minus;
            </button>
            <span className="dice-stepper-value">{count}</span>
            <button
              type="button"
              className="dice-stepper-btn"
              aria-label="Increase dice count"
              onClick={() => setCount((c) => Math.min(MAX_COUNT, c + 1))}
              disabled={count >= MAX_COUNT}
            >
              +
            </button>
          </div>
        </div>

        <div className="dice-stepper">
          <span className="dice-stepper-label" id="dice-modifier-label">Modifier</span>
          <div className="dice-stepper-controls" role="group" aria-labelledby="dice-modifier-label">
            <button
              type="button"
              className="dice-stepper-btn"
              aria-label="Decrease modifier"
              onClick={() => setModifier((m) => Math.max(MIN_MODIFIER, m - 1))}
              disabled={modifier <= MIN_MODIFIER}
            >
              &minus;
            </button>
            <span className="dice-stepper-value">{modifier > 0 ? `+${modifier}` : modifier}</span>
            <button
              type="button"
              className="dice-stepper-btn"
              aria-label="Increase modifier"
              onClick={() => setModifier((m) => Math.min(MAX_MODIFIER, m + 1))}
              disabled={modifier >= MAX_MODIFIER}
            >
              +
            </button>
          </div>
        </div>

        <div
          className="dice-adv-toggle"
          role="group"
          aria-label="Advantage or disadvantage"
        >
          {ADVANTAGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              aria-pressed={advantage === opt.value}
              className={`dice-adv-btn${advantage === opt.value ? ' selected' : ''}`}
              disabled={!advantageEnabled}
              onClick={() => setAdvantage(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="dice-panel-section dice-notation-row">
        <label htmlFor="dice-notation-input" className="sr-only">Dice notation</label>
        <input
          id="dice-notation-input"
          type="text"
          className="dice-notation-input"
          placeholder="or type notation, e.g. 2d6+3"
          value={notation}
          onChange={(e) => handleNotationChange(e.target.value)}
          onKeyDown={handleNotationKeyDown}
        />
        <button type="button" className="dice-roll-btn" onClick={handleRoll}>
          <Icon name="dice" size={16} /> Roll
        </button>
      </div>

      {error && (
        <p className="dice-error" role="alert">{error}</p>
      )}

      {showHiddenToggle && (
        <label className="dice-hidden-toggle">
          <input
            type="checkbox"
            checked={isHidden}
            onChange={(e) => setIsHidden(e.target.checked)}
          />
          Roll hidden (DM only)
        </label>
      )}

      <DiceResultReveal roll={lastRoll} />

      <div className="dice-panel-section dice-history">
        <h4 className="dice-history-heading">History</h4>
        <DiceHistoryList rolls={history} />
      </div>
    </div>
  );
}

export default DicePanel;
