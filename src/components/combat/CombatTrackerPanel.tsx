// CombatTrackerPanel - floating DM panel for running combat: initiative
// order, turns/rounds, HP, conditions, and quick-add from encounter data.
// State is session-only (CombatContext); players see a filtered mirror.

import { useState, useMemo, useRef } from 'react';
import { useCampaign } from '../../stores/CampaignContext';
import { useCombat } from '../../stores/CombatContext';
import { useAnnounce } from '../../stores/AnnouncerContext';
import { expandEncounterCreatures } from '../../services/combatTracker';
import { createCombatant } from '../../types/Combat';
import type { Combatant } from '../../types/Combat';
import type { Encounter } from '../../types/Campaign';
import CombatantRow from './CombatantRow';
import ConfirmDialog from '../modals/ConfirmDialog';
import Icon from '../icons/Icon';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface CombatTrackerPanelProps {
  onClose: () => void;
}

function CombatTrackerPanel({ onClose }: CombatTrackerPanelProps) {
  const { campaign } = useCampaign();
  const { combat, dispatch } = useCombat();
  const announce = useAnnounce();
  const panelRef = useFocusTrap({ onEscape: onClose });

  const [selectedEncounterId, setSelectedEncounterId] = useState('');
  const [newName, setNewName] = useState('');
  const [newInitiative, setNewInitiative] = useState('');
  const [newHp, setNewHp] = useState('');
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const dragIndexRef = useRef<number | null>(null);

  // All encounters with creatures, across every hex
  const encounterOptions = useMemo(() => {
    if (!campaign) return [];
    const options: { encounter: Encounter; hexKey: string }[] = [];
    for (const [hexKey, hex] of Object.entries(campaign.hexes)) {
      for (const encounter of hex.encounters) {
        if (encounter.creatures.length > 0) {
          options.push({ encounter, hexKey });
        }
      }
    }
    return options;
  }, [campaign]);

  const buildPartyCombatants = (existing: Combatant[]): Combatant[] => {
    const inCombat = new Set(existing.map(c => c.sourceId).filter(Boolean));
    return (campaign?.playerCharacters ?? [])
      .filter(pc => !inCombat.has(pc.id))
      .map(pc => createCombatant({ name: pc.name || 'Unnamed', kind: 'pc', sourceId: pc.id }));
  };

  const handleStartCombat = () => {
    dispatch({ type: 'START_COMBAT', combatants: buildPartyCombatants([]) });
    announce('Combat started');
  };

  const handleEndCombat = () => {
    setShowEndConfirm(false);
    dispatch({ type: 'END_COMBAT' });
    announce('Combat ended');
  };

  const handleAddParty = () => {
    const combatants = buildPartyCombatants(combat.combatants);
    if (combatants.length > 0) dispatch({ type: 'ADD_COMBATANTS', combatants });
  };

  const handleQuickAdd = () => {
    const option = encounterOptions.find(o => o.encounter.id === selectedEncounterId);
    if (!option) return;
    dispatch({
      type: 'ADD_COMBATANTS',
      combatants: expandEncounterCreatures(option.encounter.creatures, option.encounter.id)
    });
    setSelectedEncounterId('');
  };

  const handleManualAdd = () => {
    const name = newName.trim();
    if (!name) return;
    const maxHp = parseInt(newHp) > 0 ? parseInt(newHp) : null;
    dispatch({
      type: 'ADD_COMBATANTS',
      combatants: [createCombatant({
        name,
        initiative: parseInt(newInitiative) || 0,
        maxHp,
        currentHp: maxHp
      })]
    });
    setNewName('');
    setNewInitiative('');
    setNewHp('');
  };

  const announceTurn = (state: typeof combat) => {
    const current = state.combatants[state.turnIndex];
    if (current) announce(`Round ${state.round}: ${current.name}'s turn`);
  };

  const handleNextTurn = () => {
    dispatch({ type: 'NEXT_TURN' });
    // Reducer result isn't available here; recompute the announcement
    const next = combat.turnIndex + 1;
    const wrapped = next >= combat.combatants.length;
    announceTurn({
      ...combat,
      turnIndex: wrapped ? 0 : next,
      round: wrapped ? combat.round + 1 : combat.round
    });
  };

  const handlePrevTurn = () => {
    if (combat.turnIndex === 0 && combat.round === 1) return;
    const wrapped = combat.turnIndex === 0;
    announceTurn({
      ...combat,
      turnIndex: wrapped ? combat.combatants.length - 1 : combat.turnIndex - 1,
      round: wrapped ? combat.round - 1 : combat.round
    });
    dispatch({ type: 'PREV_TURN' });
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (toIndex: number) => {
    const fromIndex = dragIndexRef.current;
    dragIndexRef.current = null;
    if (fromIndex === null || fromIndex === toIndex) return;
    dispatch({ type: 'REORDER', fromIndex, toIndex });
  };

  const currentCombatant = combat.combatants[combat.turnIndex];

  return (
    <div className="combat-panel" ref={panelRef} role="region" aria-label="Combat tracker">
      <div className="combat-panel-header">
        <h3><Icon name="sword" size={16} /> Combat Tracker</h3>
        <button className="btn btn-icon btn-icon-small" onClick={onClose} aria-label="Close combat tracker">
          <Icon name="close" size={14} />
        </button>
      </div>

      <div className="combat-panel-body">
        {!combat.isActive ? (
          <div className="combat-empty-state">
            <p className="empty-hint">No combat in progress.</p>
            <button className="btn btn-primary" onClick={handleStartCombat}>
              <Icon name="sword" size={14} /> Start Combat
            </button>
            {(campaign?.playerCharacters ?? []).length > 0 && (
              <p className="empty-hint">Party members are added automatically.</p>
            )}
          </div>
        ) : (
          <>
            <div className="combat-round-bar">
              <span className="combat-round" aria-live="off">Round {combat.round}</span>
              <div className="combat-turn-controls">
                <button
                  className="btn btn-small btn-secondary"
                  onClick={handlePrevTurn}
                  disabled={combat.combatants.length === 0 || (combat.turnIndex === 0 && combat.round === 1)}
                  aria-label="Previous turn"
                >
                  &larr; Back
                </button>
                <button
                  className="btn btn-small btn-primary"
                  onClick={handleNextTurn}
                  disabled={combat.combatants.length === 0}
                  aria-label="Next turn"
                >
                  Next &rarr;
                </button>
              </div>
            </div>
            {currentCombatant && (
              <div className="combat-current-turn">
                Current: <strong>{currentCombatant.name}</strong>
              </div>
            )}

            <div className="combat-actions">
              <button
                className="btn btn-small btn-secondary"
                onClick={() => dispatch({ type: 'SORT_BY_INITIATIVE' })}
                disabled={combat.combatants.length < 2}
              >
                Sort by Initiative
              </button>
              <button className="btn btn-small btn-secondary" onClick={handleAddParty}>
                <Icon name="users" size={13} /> Add Party
              </button>
              <button className="btn btn-small btn-danger" onClick={() => setShowEndConfirm(true)}>
                End Combat
              </button>
            </div>

            {combat.combatants.length === 0 ? (
              <p className="empty-hint">No combatants yet. Add the party, an encounter, or individual creatures below.</p>
            ) : (
              <ul className="combatant-list">
                {combat.combatants.map((combatant, index) => (
                  <CombatantRow
                    key={combatant.id}
                    combatant={combatant}
                    isCurrent={index === combat.turnIndex}
                    index={index}
                    total={combat.combatants.length}
                    dispatch={dispatch}
                    onDragStart={(i) => { dragIndexRef.current = i; }}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  />
                ))}
              </ul>
            )}

            <div className="combat-add-section">
              <h4>Quick Add</h4>
              {encounterOptions.length > 0 && (
                <div className="combat-quick-add">
                  <select
                    value={selectedEncounterId}
                    onChange={(e) => setSelectedEncounterId(e.target.value)}
                    aria-label="Select encounter to add"
                  >
                    <option value="">From encounter...</option>
                    {encounterOptions.map(({ encounter, hexKey }) => (
                      <option key={encounter.id} value={encounter.id}>
                        {encounter.title || 'Untitled'} ({hexKey})
                      </option>
                    ))}
                  </select>
                  <button
                    className="btn btn-small btn-secondary"
                    onClick={handleQuickAdd}
                    disabled={!selectedEncounterId}
                  >
                    Add
                  </button>
                </div>
              )}
              <div className="combat-manual-add">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleManualAdd(); }}
                  placeholder="Name"
                  aria-label="New combatant name"
                />
                <input
                  type="number"
                  value={newInitiative}
                  onChange={(e) => setNewInitiative(e.target.value)}
                  placeholder="Init"
                  aria-label="New combatant initiative"
                />
                <input
                  type="number"
                  value={newHp}
                  onChange={(e) => setNewHp(e.target.value)}
                  min={1}
                  placeholder="HP"
                  aria-label="New combatant max HP"
                />
                <button className="btn btn-small btn-secondary" onClick={handleManualAdd} disabled={!newName.trim()}>
                  Add
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {showEndConfirm && (
        <ConfirmDialog
          title="End Combat"
          message="End combat? Initiative order, HP, and conditions will be lost."
          confirmLabel="End Combat"
          cancelLabel="Cancel"
          variant="danger"
          onConfirm={handleEndCombat}
          onCancel={() => setShowEndConfirm(false)}
        />
      )}
    </div>
  );
}

export default CombatTrackerPanel;
