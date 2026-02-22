import { useState } from 'react';
import type { Encounter, EncounterType, EncounterOutcome, Npc, EncounterTemplate } from '../../types/Campaign';
import { ENCOUNTER_TYPE_INFO, OUTCOME_INFO, createEncounterTemplate } from '../../types/Campaign';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import CreatureList from './CreatureList';
import RewardList from './RewardList';
import NpcLinker from './NpcLinker';

interface EncounterEditorModalProps {
  encounter: Encounter;
  allNpcs: Array<{ npc: Npc; hexKey: string }>;
  onSave: (encounter: Encounter) => void;
  onSaveAsTemplate?: (template: EncounterTemplate) => void;
  onClose: () => void;
}

const ENCOUNTER_TYPES: EncounterType[] = ['combat', 'social', 'exploration', 'puzzle'];
const OUTCOMES: EncounterOutcome[] = ['pending', 'victory', 'defeat', 'fled', 'negotiated', 'bypassed'];

function EncounterEditorModal({ encounter, allNpcs, onSave, onSaveAsTemplate, onClose }: EncounterEditorModalProps) {
  const focusTrapRef = useFocusTrap<HTMLDivElement>({ onEscape: onClose });
  const [title, setTitle] = useState(encounter.title);
  const [description, setDescription] = useState(encounter.description);
  const [difficulty, setDifficulty] = useState(encounter.difficulty ?? '');
  const [encounterType, setEncounterType] = useState<EncounterType>(encounter.encounterType);
  const [creatures, setCreatures] = useState(encounter.creatures);
  const [linkedNpcIds, setLinkedNpcIds] = useState(encounter.linkedNpcIds);
  const [rewards, setRewards] = useState(encounter.rewards);
  const [outcome, setOutcome] = useState<EncounterOutcome>(encounter.outcome);
  const [outcomeNotes, setOutcomeNotes] = useState(encounter.outcomeNotes);

  const handleSave = () => {
    onSave({
      ...encounter,
      title,
      description,
      difficulty: difficulty || undefined,
      encounterType,
      creatures,
      linkedNpcIds,
      rewards,
      outcome,
      outcomeNotes
    });
  };

  const handleSaveAsTemplate = () => {
    if (!onSaveAsTemplate) return;
    const template = createEncounterTemplate(title);
    template.description = description;
    template.encounterType = encounterType;
    template.difficulty = difficulty;
    template.creatures = creatures.map(c => ({ ...c, id: crypto.randomUUID() }));
    template.rewards = rewards.map(r => ({ ...r, id: crypto.randomUUID() }));
    onSaveAsTemplate(template);
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="encounter-editor-modal-title" onClick={onClose}>
      <div ref={focusTrapRef} className="modal modal-lg encounter-editor-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 id="encounter-editor-modal-title">Edit Encounter</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {/* Basic Info */}
          <div className="field-group">
            <label>Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div className="field-row">
            <div className="field-group">
              <label>Encounter Type</label>
              <select value={encounterType} onChange={(e) => setEncounterType(e.target.value as EncounterType)}>
                {ENCOUNTER_TYPES.map(t => (
                  <option key={t} value={t}>{ENCOUNTER_TYPE_INFO[t].label}</option>
                ))}
              </select>
            </div>
            <div className="field-group">
              <label>Difficulty / CR</label>
              <input
                type="text"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                placeholder="e.g., CR 2, Easy, Hard"
              />
            </div>
          </div>

          <div className="field-group">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Creatures */}
          <CreatureList creatures={creatures} onChange={setCreatures} />

          {/* Linked NPCs */}
          <NpcLinker linkedNpcs={linkedNpcIds} allNpcs={allNpcs} onChange={setLinkedNpcIds} />

          {/* Rewards */}
          <RewardList rewards={rewards} onChange={setRewards} />

          {/* Outcome */}
          <div className="field-row">
            <div className="field-group">
              <label>Outcome</label>
              <select value={outcome} onChange={(e) => setOutcome(e.target.value as EncounterOutcome)}>
                {OUTCOMES.map(o => (
                  <option key={o} value={o}>{OUTCOME_INFO[o].label}</option>
                ))}
              </select>
            </div>
          </div>

          {outcome !== 'pending' && (
            <div className="field-group">
              <label>Outcome Notes</label>
              <textarea
                value={outcomeNotes}
                onChange={(e) => setOutcomeNotes(e.target.value)}
                rows={2}
                placeholder="How did the encounter resolve?"
              />
            </div>
          )}
        </div>
        <div className="modal-footer">
          {onSaveAsTemplate && (
            <button className="btn btn-secondary" onClick={handleSaveAsTemplate} style={{ marginRight: 'auto' }}>
              Save as Template
            </button>
          )}
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}

export default EncounterEditorModal;
