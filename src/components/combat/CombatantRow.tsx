// CombatantRow - one combatant in the tracker: initiative, HP, conditions,
// player visibility, reorder and remove controls

import { useState } from 'react';
import type { Dispatch } from 'react';
import type { Combatant } from '../../types/Combat';
import { STANDARD_CONDITIONS } from '../../types/Combat';
import type { CombatAction } from '../../services/combatTracker';
import Icon from '../icons/Icon';

interface CombatantRowProps {
  combatant: Combatant;
  isCurrent: boolean;
  index: number;
  total: number;
  dispatch: Dispatch<CombatAction>;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (index: number) => void;
}

const CUSTOM_OPTION = '__custom__';

function CombatantRow({ combatant, isCurrent, index, total, dispatch, onDragStart, onDragOver, onDrop }: CombatantRowProps) {
  const [hpAmount, setHpAmount] = useState('');
  const [setHpValue, setSetHpValue] = useState('');
  const [showCustomCondition, setShowCustomCondition] = useState(false);
  const [customCondition, setCustomCondition] = useState('');

  const isDown = combatant.currentHp === 0;

  const applyHp = (sign: 1 | -1) => {
    const amount = parseInt(hpAmount);
    if (!amount || amount <= 0) return;
    dispatch({ type: 'APPLY_HP_DELTA', id: combatant.id, delta: sign * amount });
    setHpAmount('');
  };

  const addCondition = (condition: string) => {
    const trimmed = condition.trim();
    if (!trimmed || combatant.conditions.includes(trimmed)) return;
    dispatch({ type: 'TOGGLE_CONDITION', id: combatant.id, condition: trimmed });
  };

  const availableConditions = STANDARD_CONDITIONS.filter(c => !combatant.conditions.includes(c));

  const applySetHp = () => {
    const maxHp = parseInt(setHpValue);
    if (!maxHp || maxHp <= 0) return;
    dispatch({ type: 'UPDATE_COMBATANT', id: combatant.id, changes: { maxHp } });
    setSetHpValue('');
  };

  return (
    <li
      className={`combatant-row${isCurrent ? ' current' : ''}${isDown ? ' down' : ''}${combatant.kind === 'pc' ? ' pc' : ''}`}
      onDragOver={onDragOver}
      onDrop={() => onDrop(index)}
    >
      <div className="combatant-main">
        <span
          className="combatant-drag-handle"
          draggable
          onDragStart={() => onDragStart(index)}
          title="Drag to reorder"
          aria-hidden="true"
        >&#8801;</span>
        <input
          type="number"
          className="combatant-initiative"
          value={combatant.initiative}
          onChange={(e) => dispatch({
            type: 'UPDATE_COMBATANT',
            id: combatant.id,
            changes: { initiative: parseInt(e.target.value) || 0 }
          })}
          aria-label={`${combatant.name} initiative`}
          title="Initiative"
        />
        <span className="combatant-name">
          {isDown && <Icon name="skull" size={13} />}
          {combatant.name}
          {isCurrent && <span className="sr-only"> (current turn)</span>}
        </span>
        <div className="combatant-controls">
          <button
            className="btn-icon-small"
            onClick={() => dispatch({ type: 'REORDER', fromIndex: index, toIndex: index - 1 })}
            disabled={index === 0}
            aria-label={`Move ${combatant.name} up`}
            title="Move up"
          >&uarr;</button>
          <button
            className="btn-icon-small"
            onClick={() => dispatch({ type: 'REORDER', fromIndex: index, toIndex: index + 1 })}
            disabled={index === total - 1}
            aria-label={`Move ${combatant.name} down`}
            title="Move down"
          >&darr;</button>
          <button
            className="btn-icon-small"
            onClick={() => dispatch({
              type: 'UPDATE_COMBATANT',
              id: combatant.id,
              changes: { isVisibleToPlayers: !combatant.isVisibleToPlayers }
            })}
            aria-label={combatant.isVisibleToPlayers ? `Hide ${combatant.name} from players` : `Show ${combatant.name} to players`}
            title={combatant.isVisibleToPlayers ? 'Visible to players' : 'Hidden from players'}
          >
            <Icon name={combatant.isVisibleToPlayers ? 'eye' : 'eye-off'} size={13} />
          </button>
          <button
            className="btn-icon-small danger"
            onClick={() => dispatch({ type: 'REMOVE_COMBATANT', id: combatant.id })}
            aria-label={`Remove ${combatant.name} from combat`}
            title="Remove"
          >
            <Icon name="close" size={13} />
          </button>
        </div>
      </div>

      <div className="combatant-hp">
        {combatant.currentHp !== null ? (
          <>
            <span className="hp-value">
              <Icon name="heart" size={12} /> {combatant.currentHp}{combatant.maxHp !== null ? ` / ${combatant.maxHp}` : ''}
            </span>
            <input
              type="number"
              className="hp-amount"
              value={hpAmount}
              onChange={(e) => setHpAmount(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') applyHp(-1); }}
              min={1}
              placeholder="0"
              aria-label={`${combatant.name} HP amount`}
            />
            <button
              className="btn btn-small hp-damage"
              onClick={() => applyHp(-1)}
              aria-label={`Damage ${combatant.name}`}
            >
              Dmg
            </button>
            <button
              className="btn btn-small hp-heal"
              onClick={() => applyHp(1)}
              aria-label={`Heal ${combatant.name}`}
            >
              Heal
            </button>
          </>
        ) : (
          <>
            <span className="hp-value hp-untracked" title="HP not tracked">
              <Icon name="heart" size={12} /> --
            </span>
            <input
              type="number"
              className="hp-amount"
              value={setHpValue}
              onChange={(e) => setSetHpValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') applySetHp(); }}
              min={1}
              placeholder="Max"
              aria-label={`${combatant.name} max HP`}
            />
            <button
              className="btn btn-small"
              onClick={applySetHp}
              disabled={!(parseInt(setHpValue) > 0)}
              aria-label={`Set max HP for ${combatant.name}`}
            >
              Set HP
            </button>
          </>
        )}
      </div>

      <div className="combatant-conditions">
        {combatant.conditions.map(condition => (
          <button
            key={condition}
            className="condition-badge"
            onClick={() => dispatch({ type: 'TOGGLE_CONDITION', id: combatant.id, condition })}
            aria-label={`Remove ${condition} from ${combatant.name}`}
            title="Click to remove"
          >
            {condition} <Icon name="close" size={9} />
          </button>
        ))}
        <select
          className="condition-select"
          value=""
          onChange={(e) => {
            if (e.target.value === CUSTOM_OPTION) {
              setShowCustomCondition(true);
            } else if (e.target.value) {
              addCondition(e.target.value);
            }
          }}
          aria-label={`Add condition to ${combatant.name}`}
        >
          <option value="">+ Condition</option>
          {availableConditions.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
          <option value={CUSTOM_OPTION}>Custom...</option>
        </select>
        {showCustomCondition && (
          <span className="condition-custom">
            <input
              type="text"
              value={customCondition}
              onChange={(e) => setCustomCondition(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  addCondition(customCondition);
                  setCustomCondition('');
                  setShowCustomCondition(false);
                }
              }}
              placeholder="Condition name"
              aria-label={`Custom condition for ${combatant.name}`}
              autoFocus
            />
            <button
              className="btn btn-small"
              onClick={() => {
                addCondition(customCondition);
                setCustomCondition('');
                setShowCustomCondition(false);
              }}
            >
              Add
            </button>
          </span>
        )}
      </div>
    </li>
  );
}

export default CombatantRow;
