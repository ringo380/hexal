import { useState } from 'react';
import { useCampaign } from '../../stores/CampaignContext';
import type { Npc, NpcAttitude, Faction } from '../../types/Campaign';
import { ATTITUDE_INFO, parseHexKey } from '../../types/Campaign';
import { moveNpc } from '../../services/npcService';
import { updateQuestNpcHexKey, removeFactionFromQuests } from '../../services/questService';
import AlignmentBadge from '../npcs/AlignmentBadge';
import AttitudeBadge from '../npcs/AttitudeBadge';
import FactionBadge from '../npcs/FactionBadge';
import RelationshipBadge from '../npcs/RelationshipBadge';
import FactionManager from '../npcs/FactionManager';
import NpcEditorModal from '../npcs/NpcEditorModal';
import Icon from '../icons/Icon';

interface NpcDirectoryModalProps {
  onClose: () => void;
  onOpenRelationshipWeb?: () => void;
}

type Tab = 'npcs' | 'factions';

function NpcDirectoryModal({ onClose, onOpenRelationshipWeb }: NpcDirectoryModalProps) {
  const { campaign, allNpcs, factions, updateCampaignData } = useCampaign();
  const [activeTab, setActiveTab] = useState<Tab>('npcs');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFaction, setFilterFaction] = useState<string>('');
  const [filterAttitude, setFilterAttitude] = useState<NpcAttitude | ''>('');
  const [filterAlive, setFilterAlive] = useState<'all' | 'alive' | 'dead'>('all');
  const [selectedNpcId, setSelectedNpcId] = useState<string | null>(null);
  const [editingNpc, setEditingNpc] = useState<{ npc: Npc; hexKey: string } | null>(null);
  const [moveTargetHex, setMoveTargetHex] = useState('');
  const [moveError, setMoveError] = useState('');

  const filteredNpcs = allNpcs.filter(({ npc }) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        npc.title.toLowerCase().includes(q) ||
        (npc.race ?? '').toLowerCase().includes(q) ||
        (npc.class ?? '').toLowerCase().includes(q) ||
        npc.tags.some(t => t.toLowerCase().includes(q));
      if (!matchesSearch) return false;
    }
    if (filterFaction && npc.factionId !== filterFaction) return false;
    if (filterAttitude && npc.attitude !== filterAttitude) return false;
    if (filterAlive === 'alive' && !npc.isAlive) return false;
    if (filterAlive === 'dead' && npc.isAlive) return false;
    return true;
  });

  const selectedEntry = selectedNpcId
    ? allNpcs.find(({ npc }) => npc.id === selectedNpcId)
    : null;

  const getFaction = (factionId?: string): Faction | undefined => {
    if (!factionId) return undefined;
    return factions.find(f => f.id === factionId);
  };

  const handleMoveNpc = () => {
    if (!campaign || !selectedEntry || !moveTargetHex.trim()) return;
    const trimmed = moveTargetHex.trim();

    // Validate hex coordinate format
    const parsed = parseHexKey(trimmed);
    if (!parsed) {
      setMoveError('Invalid format. Use q,r (e.g., 3,5)');
      return;
    }

    // Validate target hex exists in campaign
    if (!campaign.hexes[trimmed]) {
      setMoveError('Hex does not exist in this campaign');
      return;
    }

    const result = moveNpc(campaign, selectedEntry.npc.id, selectedEntry.hexKey, trimmed);
    updateCampaignData(result);
    const questUpdate = updateQuestNpcHexKey(campaign, selectedEntry.npc.id, selectedEntry.hexKey, trimmed);
    updateCampaignData(questUpdate);
    setMoveTargetHex('');
    setMoveError('');
    setSelectedNpcId(null);
  };

  const handleSaveNpc = (updated: Npc) => {
    if (!campaign || !editingNpc) return;
    const hexes = { ...campaign.hexes };
    const hex = hexes[editingNpc.hexKey];
    if (hex) {
      hexes[editingNpc.hexKey] = {
        ...hex,
        npcs: hex.npcs.map(n => n.id === updated.id ? updated : n)
      };
      updateCampaignData({ hexes });
    }
    setEditingNpc(null);
  };

  const handleUpdateFactions = (updatedFactions: Faction[]) => {
    // Detect deleted factions and clean up quest references
    if (campaign) {
      const deletedIds = factions
        .filter(f => !updatedFactions.some(uf => uf.id === f.id))
        .map(f => f.id);
      if (deletedIds.length > 0) {
        let questUpdates: { quests: import('../../types/Quest').Quest[] } | null = null;
        for (const factionId of deletedIds) {
          questUpdates = removeFactionFromQuests(
            questUpdates ? { ...campaign, quests: questUpdates.quests } : campaign,
            factionId
          );
        }
        if (questUpdates) {
          updateCampaignData({ factions: updatedFactions, ...questUpdates });
          return;
        }
      }
    }
    updateCampaignData({ factions: updatedFactions });
  };

  const getNpcName = (npcId: string): string => {
    const found = allNpcs.find(({ npc }) => npc.id === npcId);
    return found?.npc.title || 'Unknown NPC';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-xl npc-directory-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3><Icon name="users" size={18} /> NPC Directory</h3>
          <div className="npc-directory-tabs">
            <button
              className={`tab-btn ${activeTab === 'npcs' ? 'active' : ''}`}
              onClick={() => setActiveTab('npcs')}
            >
              NPCs ({allNpcs.length})
            </button>
            <button
              className={`tab-btn ${activeTab === 'factions' ? 'active' : ''}`}
              onClick={() => setActiveTab('factions')}
            >
              Factions ({factions.length})
            </button>
          </div>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        {activeTab === 'npcs' ? (
          <div className="npc-directory-body">
            {/* Left panel: NPC list */}
            <div className="npc-list-panel">
              <div className="npc-list-toolbar">
                <input
                  type="text"
                  className="npc-search"
                  placeholder="Search NPCs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="npc-filters">
                  {factions.length > 0 && (
                    <select value={filterFaction} onChange={(e) => setFilterFaction(e.target.value)}>
                      <option value="">All Factions</option>
                      {factions.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  )}
                  <select value={filterAttitude} onChange={(e) => setFilterAttitude(e.target.value as NpcAttitude | '')}>
                    <option value="">All Attitudes</option>
                    {(['friendly', 'indifferent', 'hostile', 'unknown'] as NpcAttitude[]).map(a => (
                      <option key={a} value={a}>{ATTITUDE_INFO[a].label}</option>
                    ))}
                  </select>
                  <select value={filterAlive} onChange={(e) => setFilterAlive(e.target.value as 'all' | 'alive' | 'dead')}>
                    <option value="all">All</option>
                    <option value="alive">Alive</option>
                    <option value="dead">Dead</option>
                  </select>
                </div>
              </div>
              <div className="npc-list-items">
                {filteredNpcs.length === 0 ? (
                  <div style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' }}>
                    No NPCs found
                  </div>
                ) : (
                  filteredNpcs.map(({ npc, hexKey }) => (
                    <div
                      key={npc.id}
                      className={`npc-directory-item ${npc.id === selectedNpcId ? 'selected' : ''} ${!npc.isAlive ? 'npc-dead' : ''}`}
                      onClick={() => setSelectedNpcId(npc.id)}
                    >
                      <div className="npc-directory-item-header">
                        {!npc.isAlive && <Icon name="skull" size={12} />}
                        <span className="npc-directory-item-name">{npc.title}</span>
                        <span className="npc-directory-item-hex">({hexKey})</span>
                      </div>
                      <div className="npc-directory-item-badges">
                        <AlignmentBadge alignment={npc.alignment} size="small" />
                        <AttitudeBadge attitude={npc.attitude} size="small" />
                        <FactionBadge faction={getFaction(npc.factionId)} size="small" />
                      </div>
                    </div>
                  ))
                )}
              </div>
              {onOpenRelationshipWeb && (
                <div className="npc-list-footer">
                  <button className="btn btn-secondary btn-small" onClick={onOpenRelationshipWeb}>
                    <Icon name="link" size={14} /> View Relationships
                  </button>
                </div>
              )}
            </div>

            {/* Right panel: Quick Reference Card */}
            <div className="npc-detail-panel">
              {selectedEntry ? (
                <NpcQuickCard
                  npc={selectedEntry.npc}
                  hexKey={selectedEntry.hexKey}
                  faction={getFaction(selectedEntry.npc.factionId)}
                  moveTargetHex={moveTargetHex}
                  moveError={moveError}
                  onMoveTargetChange={(v) => { setMoveTargetHex(v); setMoveError(''); }}
                  onMove={handleMoveNpc}
                  onEdit={() => setEditingNpc(selectedEntry)}
                  getNpcName={getNpcName}
                />
              ) : (
                <div className="empty-state">
                  <Icon name="user" size={32} />
                  <p>Select an NPC to view details</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="npc-directory-body">
            <FactionManager
              factions={factions}
              allNpcs={allNpcs}
              onUpdate={handleUpdateFactions}
            />
          </div>
        )}
      </div>

      {/* NPC Editor Modal (nested) */}
      {editingNpc && (
        <NpcEditorModal
          npc={editingNpc.npc}
          factions={factions}
          allNpcs={allNpcs}
          onSave={handleSaveNpc}
          onClose={() => setEditingNpc(null)}
        />
      )}
    </div>
  );
}

// Quick Reference Card sub-component
interface NpcQuickCardProps {
  npc: Npc;
  hexKey: string;
  faction?: Faction;
  moveTargetHex: string;
  moveError: string;
  onMoveTargetChange: (value: string) => void;
  onMove: () => void;
  onEdit: () => void;
  getNpcName: (id: string) => string;
}

function NpcQuickCard({
  npc, hexKey, faction,
  moveTargetHex, moveError, onMoveTargetChange, onMove, onEdit, getNpcName
}: NpcQuickCardProps) {
  const subtitle = [npc.race, npc.class].filter(Boolean).join(' ');

  return (
    <div className="npc-quick-card">
      <div className="npc-quick-card-header">
        <h3>
          {!npc.isAlive && <Icon name="skull" size={16} />}
          {' '}{npc.title}
        </h3>
        {subtitle && <div className="npc-quick-card-subtitle">{subtitle}</div>}
      </div>

      <div className="npc-quick-card-badges">
        <AlignmentBadge alignment={npc.alignment} />
        <AttitudeBadge attitude={npc.attitude} />
        <FactionBadge faction={faction} />
      </div>

      {npc.appearance && (
        <div className="npc-quick-card-section">
          <h4>Appearance</h4>
          <p>{npc.appearance}</p>
        </div>
      )}

      {npc.personality && (
        <div className="npc-quick-card-section">
          <h4>Personality</h4>
          <p>{npc.personality}</p>
        </div>
      )}

      {npc.description && (
        <div className="npc-quick-card-section">
          <h4>Description</h4>
          <p>{npc.description}</p>
        </div>
      )}

      {faction && npc.factionRole && (
        <div className="npc-quick-card-section">
          <h4>Faction Role</h4>
          <p>{npc.factionRole} in {faction.name}</p>
        </div>
      )}

      <div className="npc-quick-card-section">
        <h4>Location</h4>
        <p>Hex ({hexKey})</p>
      </div>

      {npc.relationships.length > 0 && (
        <div className="npc-quick-card-section">
          <h4>Relationships</h4>
          <div className="npc-quick-card-relationships">
            {npc.relationships.map(rel => (
              <div key={rel.targetNpcId} className="npc-quick-card-rel">
                <RelationshipBadge type={rel.type} size="small" />
                <span>{getNpcName(rel.targetNpcId)}</span>
                <span className="npc-quick-card-rel-hex">({rel.targetHexKey})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {npc.tags.length > 0 && (
        <div className="npc-quick-card-section">
          <h4>Tags</h4>
          <div className="npc-quick-card-tags">
            {npc.tags.map(tag => (
              <span key={tag} className="template-tag">{tag}</span>
            ))}
          </div>
        </div>
      )}

      <div className="npc-quick-card-actions">
        <button className="btn btn-primary btn-small" onClick={onEdit}>
          <Icon name="pencil" size={12} /> Edit
        </button>
      </div>

      <div className="npc-quick-card-move">
        <label>Move to Hex</label>
        <div className="npc-move-row">
          <input
            type="text"
            value={moveTargetHex}
            onChange={(e) => onMoveTargetChange(e.target.value)}
            placeholder="e.g., 3,5"
          />
          <button
            className="btn btn-small btn-secondary"
            onClick={onMove}
            disabled={!moveTargetHex.trim()}
          >
            Move
          </button>
        </div>
        {moveError && <div className="npc-move-error">{moveError}</div>}
      </div>
    </div>
  );
}

export default NpcDirectoryModal;
