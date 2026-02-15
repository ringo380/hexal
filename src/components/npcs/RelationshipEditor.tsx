import { useState } from 'react';
import type { NpcRelationship, RelationshipType, Npc } from '../../types/Campaign';
import { RELATIONSHIP_TYPE_INFO, createNpcRelationship } from '../../types/Campaign';
import RelationshipBadge from './RelationshipBadge';
import Icon from '../icons/Icon';

const RELATIONSHIP_TYPES: RelationshipType[] = [
  'ally', 'enemy', 'rival', 'family', 'mentor',
  'student', 'employer', 'employee', 'romantic', 'other'
];

interface RelationshipEditorProps {
  relationships: NpcRelationship[];
  allNpcs: Array<{ npc: Npc; hexKey: string }>;
  currentNpcId: string;
  onChange: (relationships: NpcRelationship[]) => void;
}

function RelationshipEditor({ relationships, allNpcs, currentNpcId, onChange }: RelationshipEditorProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<RelationshipType>('ally');

  const linkedIds = new Set(relationships.map(r => r.targetNpcId));

  const filteredNpcs = allNpcs.filter(({ npc }) =>
    npc.id !== currentNpcId &&
    !linkedIds.has(npc.id) &&
    npc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addRelationship = (npcId: string, hexKey: string) => {
    const rel = createNpcRelationship(npcId, hexKey, selectedType);
    onChange([...relationships, rel]);
    setSearchQuery('');
    setShowPicker(false);
  };

  const removeRelationship = (targetNpcId: string) => {
    onChange(relationships.filter(r => r.targetNpcId !== targetNpcId));
  };

  const updateRelationshipType = (targetNpcId: string, type: RelationshipType) => {
    onChange(relationships.map(r =>
      r.targetNpcId === targetNpcId ? { ...r, type } : r
    ));
  };

  const getNpcName = (npcId: string): string => {
    const found = allNpcs.find(({ npc }) => npc.id === npcId);
    return found?.npc.title || 'Unknown NPC';
  };

  return (
    <div className="relationship-editor">
      <label>Relationships</label>
      {relationships.map((rel) => (
        <div key={rel.targetNpcId} className="relationship-row">
          <Icon name="user" size={14} />
          <span className="relationship-target">{getNpcName(rel.targetNpcId)}</span>
          <span className="relationship-hex">({rel.targetHexKey})</span>
          <select
            className="relationship-type-select"
            value={rel.type}
            onChange={(e) => updateRelationshipType(rel.targetNpcId, e.target.value as RelationshipType)}
          >
            {RELATIONSHIP_TYPES.map(t => (
              <option key={t} value={t}>{RELATIONSHIP_TYPE_INFO[t].label}</option>
            ))}
          </select>
          <RelationshipBadge type={rel.type} size="small" />
          <button
            className="btn-icon-small danger"
            onClick={() => removeRelationship(rel.targetNpcId)}
            title="Remove relationship"
          >
            <Icon name="close" size={14} />
          </button>
        </div>
      ))}
      {showPicker ? (
        <div className="relationship-picker">
          <div className="relationship-picker-controls">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search NPCs..."
              autoFocus
            />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as RelationshipType)}
            >
              {RELATIONSHIP_TYPES.map(t => (
                <option key={t} value={t}>{RELATIONSHIP_TYPE_INFO[t].label}</option>
              ))}
            </select>
          </div>
          <div className="relationship-picker-results">
            {filteredNpcs.length === 0 ? (
              <div className="npc-picker-empty">No NPCs found</div>
            ) : (
              filteredNpcs.slice(0, 10).map(({ npc, hexKey }) => (
                <button
                  key={npc.id}
                  className="npc-picker-item"
                  onClick={() => addRelationship(npc.id, hexKey)}
                >
                  <Icon name="user" size={12} />
                  <span>{npc.title}</span>
                  <span className="npc-picker-hex">({hexKey})</span>
                </button>
              ))
            )}
          </div>
          <button className="btn btn-small" onClick={() => setShowPicker(false)}>
            Cancel
          </button>
        </div>
      ) : (
        <button className="add-item-btn" onClick={() => setShowPicker(true)}>
          + Add Relationship
        </button>
      )}
    </div>
  );
}

export default RelationshipEditor;
