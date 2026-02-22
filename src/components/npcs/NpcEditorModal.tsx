import { useState } from 'react';
import type { Npc, NpcAlignment, NpcAttitude, Faction } from '../../types/Campaign';
import { ALIGNMENT_LABELS, ATTITUDE_INFO } from '../../types/Campaign';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import RelationshipEditor from './RelationshipEditor';

const ALIGNMENTS: NpcAlignment[] = [
  'lawful-good', 'neutral-good', 'chaotic-good',
  'lawful-neutral', 'true-neutral', 'chaotic-neutral',
  'lawful-evil', 'neutral-evil', 'chaotic-evil',
  'unaligned'
];

const ATTITUDES: NpcAttitude[] = ['friendly', 'indifferent', 'hostile', 'unknown'];

interface NpcEditorModalProps {
  npc: Npc;
  factions: Faction[];
  allNpcs: Array<{ npc: Npc; hexKey: string }>;
  onSave: (npc: Npc) => void;
  onClose: () => void;
}

function NpcEditorModal({ npc, factions, allNpcs, onSave, onClose }: NpcEditorModalProps) {
  const focusTrapRef = useFocusTrap<HTMLDivElement>({ onEscape: onClose });
  const [title, setTitle] = useState(npc.title);
  const [race, setRace] = useState(npc.race ?? '');
  const [npcClass, setNpcClass] = useState(npc.class ?? '');
  const [alignment, setAlignment] = useState<NpcAlignment | ''>(npc.alignment ?? '');
  const [attitude, setAttitude] = useState<NpcAttitude | ''>(npc.attitude ?? '');
  const [appearance, setAppearance] = useState(npc.appearance ?? '');
  const [personality, setPersonality] = useState(npc.personality ?? '');
  const [description, setDescription] = useState(npc.description);
  const [difficulty, setDifficulty] = useState(npc.difficulty ?? '');
  const [factionId, setFactionId] = useState(npc.factionId ?? '');
  const [factionRole, setFactionRole] = useState(npc.factionRole ?? '');
  const [isAlive, setIsAlive] = useState(npc.isAlive);
  const [tags, setTags] = useState(npc.tags.join(', '));
  const [relationships, setRelationships] = useState(npc.relationships);

  const handleSave = () => {
    onSave({
      ...npc,
      title,
      race: race || undefined,
      class: npcClass || undefined,
      alignment: alignment || undefined,
      attitude: attitude || undefined,
      appearance: appearance || undefined,
      personality: personality || undefined,
      description,
      difficulty: difficulty || undefined,
      factionId: factionId || undefined,
      factionRole: factionRole || undefined,
      isAlive,
      tags: tags.split(',').map(t => t.trim()).filter(t => t),
      relationships
    });
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="npc-editor-modal-title" onClick={onClose}>
      <div ref={focusTrapRef} className="modal modal-lg npc-editor-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 id="npc-editor-modal-title">Edit NPC</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          {/* Basic Info */}
          <div className="field-group">
            <label>Name</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
          </div>

          <div className="field-row">
            <div className="field-group">
              <label>Race</label>
              <input type="text" value={race} onChange={(e) => setRace(e.target.value)} placeholder="e.g., Human, Elf, Dwarf" />
            </div>
            <div className="field-group">
              <label>Class</label>
              <input type="text" value={npcClass} onChange={(e) => setNpcClass(e.target.value)} placeholder="e.g., Fighter, Wizard" />
            </div>
          </div>

          <div className="field-row">
            <div className="field-group">
              <label>Alignment</label>
              <select value={alignment} onChange={(e) => setAlignment(e.target.value as NpcAlignment | '')}>
                <option value="">None</option>
                {ALIGNMENTS.map(a => (
                  <option key={a} value={a}>
                    {ALIGNMENT_LABELS[a]} &mdash; {a.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </option>
                ))}
              </select>
            </div>
            <div className="field-group">
              <label>Attitude</label>
              <select value={attitude} onChange={(e) => setAttitude(e.target.value as NpcAttitude | '')}>
                <option value="">None</option>
                {ATTITUDES.map(a => (
                  <option key={a} value={a}>{ATTITUDE_INFO[a].label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="field-group">
            <label>Appearance</label>
            <textarea value={appearance} onChange={(e) => setAppearance(e.target.value)} rows={2} placeholder="Physical description..." />
          </div>

          <div className="field-group">
            <label>Personality</label>
            <textarea value={personality} onChange={(e) => setPersonality(e.target.value)} rows={2} placeholder="Personality traits, mannerisms..." />
          </div>

          <div className="field-group">
            <label>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Background, motivations..." />
          </div>

          <div className="field-row">
            <div className="field-group">
              <label>Faction</label>
              <select value={factionId} onChange={(e) => setFactionId(e.target.value)}>
                <option value="">None</option>
                {factions.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
            <div className="field-group">
              <label>Faction Role</label>
              <input type="text" value={factionRole} onChange={(e) => setFactionRole(e.target.value)} placeholder="e.g., Leader, Spy, Member" />
            </div>
          </div>

          <div className="field-row">
            <div className="field-group">
              <label>Difficulty / CR</label>
              <input type="text" value={difficulty} onChange={(e) => setDifficulty(e.target.value)} placeholder="e.g., CR 5" />
            </div>
            <div className="field-group">
              <label>Tags (comma-separated)</label>
              <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g., quest-giver, merchant" />
            </div>
          </div>

          <div className="field-group">
            <div className="npc-alive-toggle">
              <input
                type="checkbox"
                id="npc-alive"
                checked={isAlive}
                onChange={(e) => setIsAlive(e.target.checked)}
              />
              <label htmlFor="npc-alive">Alive</label>
            </div>
          </div>

          {/* Relationships */}
          <RelationshipEditor
            relationships={relationships}
            allNpcs={allNpcs}
            currentNpcId={npc.id}
            onChange={setRelationships}
          />
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}

export default NpcEditorModal;
