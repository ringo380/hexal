import { useState } from 'react';
import type { LinkedNpcRef, Npc } from '../../types/Campaign';
import Icon from '../icons/Icon';

interface NpcLinkerProps {
  linkedNpcs: LinkedNpcRef[];
  allNpcs: Array<{ npc: Npc; hexKey: string }>;
  onChange: (linkedNpcs: LinkedNpcRef[]) => void;
}

function NpcLinker({ linkedNpcs, allNpcs, onChange }: NpcLinkerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showPicker, setShowPicker] = useState(false);

  const linkedIds = new Set(linkedNpcs.map(l => l.npcId));

  const filteredNpcs = allNpcs.filter(({ npc }) =>
    !linkedIds.has(npc.id) &&
    npc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addLink = (npcId: string, hexKey: string) => {
    onChange([...linkedNpcs, { npcId, hexKey }]);
    setSearchQuery('');
    setShowPicker(false);
  };

  const removeLink = (npcId: string) => {
    onChange(linkedNpcs.filter(l => l.npcId !== npcId));
  };

  const getNpcName = (npcId: string): string => {
    const found = allNpcs.find(({ npc }) => npc.id === npcId);
    return found?.npc.title || 'Unknown NPC';
  };

  const getNpcHex = (ref: LinkedNpcRef): string => {
    return ref.hexKey;
  };

  return (
    <div className="npc-linker">
      <label>Linked NPCs</label>
      {linkedNpcs.map((ref) => (
        <div key={ref.npcId} className="npc-link-row">
          <Icon name="user" size={14} />
          <span className="npc-link-name">{getNpcName(ref.npcId)}</span>
          <span className="npc-link-hex">({getNpcHex(ref)})</span>
          <button
            className="btn-icon-small danger"
            onClick={() => removeLink(ref.npcId)}
            title="Unlink NPC"
            aria-label="Unlink NPC"
          >
            <Icon name="close" size={14} />
          </button>
        </div>
      ))}
      {showPicker ? (
        <div className="npc-picker">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search NPCs..."
            aria-label="Search NPCs to link"
            autoFocus
          />
          <div className="npc-picker-results">
            {filteredNpcs.length === 0 ? (
              <div className="npc-picker-empty">No NPCs found</div>
            ) : (
              filteredNpcs.slice(0, 10).map(({ npc, hexKey }) => (
                <button
                  key={npc.id}
                  className="npc-picker-item"
                  onClick={() => addLink(npc.id, hexKey)}
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
          + Link NPC
        </button>
      )}
    </div>
  );
}

export default NpcLinker;
