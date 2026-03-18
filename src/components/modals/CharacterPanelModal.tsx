import { useState } from 'react';
import { useCampaign } from '../../stores/CampaignContext';
import { useHexSelection } from '../../stores/HexSelectionContext';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { createPlayerCharacter, createParty, hexKey as toHexKey } from '../../types/Campaign';
import type { PlayerCharacter, Party } from '../../types/Campaign';
import Icon from '../icons/Icon';

interface CharacterPanelModalProps {
  onClose: () => void;
}

const CHARACTER_COLORS = [
  '#4a9eff', '#4caf50', '#f44336', '#ff9800', '#9c27b0', '#00bcd4',
  '#e91e63', '#8bc34a', '#ff5722', '#607d8b', '#3f51b5', '#cddc39'
];

const CHARACTER_ICONS = ['🧙', '⚔️', '🏹', '🛡️', '🗡️', '🧝', '🧛', '🧜', '🦹', '🧑‍🎤', '👤', '🐉'];

type Tab = 'characters' | 'parties';

function CharacterPanelModal({ onClose }: CharacterPanelModalProps) {
  const focusTrapRef = useFocusTrap<HTMLDivElement>({ onEscape: onClose });
  const { campaign, updateCampaignData } = useCampaign();
  const { selectedCoordinate } = useHexSelection();
  const selectedHexKey = selectedCoordinate ? toHexKey(selectedCoordinate) : null;
  const [activeTab, setActiveTab] = useState<Tab>('characters');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<PlayerCharacter>>({});
  const [editingPartyId, setEditingPartyId] = useState<string | null>(null);
  const [partyDraft, setPartyDraft] = useState<Partial<Party>>({});

  if (!campaign) return null;

  const characters = campaign.playerCharacters ?? [];
  const parties = campaign.parties ?? [];

  const handleAddCharacter = () => {
    const pc = createPlayerCharacter('New Character');
    updateCampaignData({
      playerCharacters: [...characters, pc]
    });
    setEditingId(pc.id);
    setEditDraft(pc);
  };

  const handleDeleteCharacter = (id: string) => {
    updateCampaignData({
      playerCharacters: characters.filter(c => c.id !== id)
    });
    if (editingId === id) {
      setEditingId(null);
      setEditDraft({});
    }
  };

  const handleSaveCharacter = () => {
    if (!editingId) return;
    updateCampaignData({
      playerCharacters: characters.map(c =>
        c.id === editingId ? { ...c, ...editDraft } : c
      )
    });
    setEditingId(null);
    setEditDraft({});
  };

  const handleStartEdit = (pc: PlayerCharacter) => {
    setEditingId(pc.id);
    setEditDraft({ ...pc });
  };

  const handleToggleVisibility = (id: string) => {
    updateCampaignData({
      playerCharacters: characters.map(c =>
        c.id === id ? { ...c, isVisible: !c.isVisible } : c
      )
    });
  };

  const handlePlaceOnHex = (id: string) => {
    if (!selectedHexKey) return;
    updateCampaignData({
      playerCharacters: characters.map(c =>
        c.id === id ? { ...c, hexKey: selectedHexKey } : c
      )
    });
  };

  const handleRemoveFromMap = (id: string) => {
    updateCampaignData({
      playerCharacters: characters.map(c =>
        c.id === id ? { ...c, hexKey: undefined } : c
      )
    });
  };

  const handleAddParty = () => {
    const party = createParty('New Party');
    updateCampaignData({
      parties: [...parties, party]
    });
    setEditingPartyId(party.id);
    setPartyDraft(party);
  };

  const handleDeleteParty = (id: string) => {
    // Unassign characters from this party
    const updatedChars = characters.map(c =>
      c.partyId === id ? { ...c, partyId: undefined } : c
    );
    updateCampaignData({
      parties: parties.filter(p => p.id !== id),
      playerCharacters: updatedChars
    });
    if (editingPartyId === id) {
      setEditingPartyId(null);
      setPartyDraft({});
    }
  };

  const handleSaveParty = () => {
    if (!editingPartyId) return;
    updateCampaignData({
      parties: parties.map(p =>
        p.id === editingPartyId ? { ...p, ...partyDraft } : p
      )
    });
    setEditingPartyId(null);
    setPartyDraft({});
  };

  const handleAssignParty = (characterId: string, partyId: string | undefined) => {
    updateCampaignData({
      playerCharacters: characters.map(c =>
        c.id === characterId ? { ...c, partyId } : c
      )
    });
  };

  const getPartyName = (partyId?: string) => {
    if (!partyId) return 'None';
    return parties.find(p => p.id === partyId)?.name ?? 'Unknown';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal character-panel"
        ref={focusTrapRef}
        role="dialog"
        aria-label="Character tracking"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Character Tracking</h2>
          <button className="btn btn-icon" onClick={onClose} aria-label="Close">
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="character-panel__tabs">
          <button
            className={`tab-btn ${activeTab === 'characters' ? 'active' : ''}`}
            onClick={() => setActiveTab('characters')}
          >
            <Icon name="user" size={14} /> Characters ({characters.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'parties' ? 'active' : ''}`}
            onClick={() => setActiveTab('parties')}
          >
            <Icon name="users" size={14} /> Parties ({parties.length})
          </button>
        </div>

        <div className="modal-body character-panel__body">
          {activeTab === 'characters' && (
            <>
              <div className="character-panel__toolbar">
                <button className="btn btn-primary btn-small" onClick={handleAddCharacter}>
                  + Add Character
                </button>
              </div>

              {characters.length === 0 && (
                <p className="empty-hint">No characters yet. Add one to start tracking on the map.</p>
              )}

              <ul className="character-panel__list">
                {characters.map(pc => (
                  <li key={pc.id} className="character-panel__item">
                    {editingId === pc.id ? (
                      <div className="character-panel__edit-form">
                        <div className="character-panel__edit-row">
                          <label>Name</label>
                          <input
                            type="text"
                            value={editDraft.name ?? ''}
                            onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })}
                            aria-label="Character name"
                            autoFocus
                          />
                        </div>
                        <div className="character-panel__edit-row">
                          <label>Icon</label>
                          <div className="character-panel__icon-picker">
                            {CHARACTER_ICONS.map(icon => (
                              <button
                                key={icon}
                                className={`character-panel__icon-btn ${editDraft.icon === icon ? 'active' : ''}`}
                                onClick={() => setEditDraft({ ...editDraft, icon })}
                                aria-label={`Select icon ${icon}`}
                              >
                                {icon}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="character-panel__edit-row">
                          <label>Color</label>
                          <div className="character-panel__color-picker">
                            {CHARACTER_COLORS.map(color => (
                              <button
                                key={color}
                                className={`character-panel__color-btn ${editDraft.color === color ? 'active' : ''}`}
                                style={{ backgroundColor: color }}
                                onClick={() => setEditDraft({ ...editDraft, color })}
                                aria-label={`Select color ${color}`}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="character-panel__edit-row">
                          <label>Party</label>
                          <select
                            value={editDraft.partyId ?? ''}
                            onChange={(e) => setEditDraft({ ...editDraft, partyId: e.target.value || undefined })}
                            aria-label="Assign party"
                          >
                            <option value="">None</option>
                            {parties.map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="character-panel__edit-actions">
                          <button className="btn btn-primary btn-small" onClick={handleSaveCharacter}>Save</button>
                          <button className="btn btn-small" onClick={() => { setEditingId(null); setEditDraft({}); }}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="character-panel__item-display">
                        <div className="character-panel__item-info">
                          <span
                            className="character-panel__token"
                            style={{ backgroundColor: pc.color }}
                          >
                            {pc.icon}
                          </span>
                          <div className="character-panel__item-details">
                            <strong>{pc.name || 'Unnamed'}</strong>
                            <span className="character-panel__meta">
                              {pc.hexKey ? `@ ${pc.hexKey}` : 'Not placed'}
                              {pc.partyId && ` | ${getPartyName(pc.partyId)}`}
                            </span>
                          </div>
                        </div>
                        <div className="character-panel__item-actions">
                          <button
                            className="btn-icon-small"
                            onClick={() => handleToggleVisibility(pc.id)}
                            title={pc.isVisible ? 'Hide from players' : 'Show to players'}
                            aria-label={pc.isVisible ? 'Hide from players' : 'Show to players'}
                          >
                            <Icon name={pc.isVisible ? 'eye' : 'eye-off'} size={14} />
                          </button>
                          {selectedHexKey && (
                            <button
                              className="btn-icon-small"
                              onClick={() => handlePlaceOnHex(pc.id)}
                              title={`Place on hex ${selectedHexKey}`}
                              aria-label={`Place on hex ${selectedHexKey}`}
                            >
                              <Icon name="pin" size={14} />
                            </button>
                          )}
                          {pc.hexKey && (
                            <button
                              className="btn-icon-small"
                              onClick={() => handleRemoveFromMap(pc.id)}
                              title="Remove from map"
                              aria-label="Remove from map"
                            >
                              <Icon name="close" size={14} />
                            </button>
                          )}
                          <button
                            className="btn-icon-small"
                            onClick={() => handleStartEdit(pc)}
                            title="Edit character"
                            aria-label="Edit character"
                          >
                            <Icon name="pencil" size={14} />
                          </button>
                          <button
                            className="btn-icon-small"
                            onClick={() => handleDeleteCharacter(pc.id)}
                            title="Delete character"
                            aria-label="Delete character"
                          >
                            <Icon name="trash" size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}

          {activeTab === 'parties' && (
            <>
              <div className="character-panel__toolbar">
                <button className="btn btn-primary btn-small" onClick={handleAddParty}>
                  + Add Party
                </button>
              </div>

              {parties.length === 0 && (
                <p className="empty-hint">No parties yet. Create one to group characters.</p>
              )}

              <ul className="character-panel__list">
                {parties.map(party => (
                  <li key={party.id} className="character-panel__item">
                    {editingPartyId === party.id ? (
                      <div className="character-panel__edit-form">
                        <div className="character-panel__edit-row">
                          <label>Name</label>
                          <input
                            type="text"
                            value={partyDraft.name ?? ''}
                            onChange={(e) => setPartyDraft({ ...partyDraft, name: e.target.value })}
                            aria-label="Party name"
                            autoFocus
                          />
                        </div>
                        <div className="character-panel__edit-row">
                          <label>Color</label>
                          <div className="character-panel__color-picker">
                            {CHARACTER_COLORS.map(color => (
                              <button
                                key={color}
                                className={`character-panel__color-btn ${partyDraft.color === color ? 'active' : ''}`}
                                style={{ backgroundColor: color }}
                                onClick={() => setPartyDraft({ ...partyDraft, color })}
                                aria-label={`Select color ${color}`}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="character-panel__edit-actions">
                          <button className="btn btn-primary btn-small" onClick={handleSaveParty}>Save</button>
                          <button className="btn btn-small" onClick={() => { setEditingPartyId(null); setPartyDraft({}); }}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="character-panel__item-display">
                        <div className="character-panel__item-info">
                          <span
                            className="character-panel__party-dot"
                            style={{ backgroundColor: party.color }}
                          />
                          <div className="character-panel__item-details">
                            <strong>{party.name || 'Unnamed'}</strong>
                            <span className="character-panel__meta">
                              {characters.filter(c => c.partyId === party.id).length} members
                            </span>
                          </div>
                        </div>
                        <div className="character-panel__item-actions">
                          <button
                            className="btn-icon-small"
                            onClick={() => { setEditingPartyId(party.id); setPartyDraft({ ...party }); }}
                            title="Edit party"
                            aria-label="Edit party"
                          >
                            <Icon name="pencil" size={14} />
                          </button>
                          <button
                            className="btn-icon-small"
                            onClick={() => handleDeleteParty(party.id)}
                            title="Delete party"
                            aria-label="Delete party"
                          >
                            <Icon name="trash" size={14} />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Show members of this party */}
                    {editingPartyId !== party.id && (
                      <div className="character-panel__party-members">
                        {characters.filter(c => c.partyId === party.id).map(c => (
                          <span key={c.id} className="character-panel__member-tag" style={{ borderColor: c.color }}>
                            {c.icon} {c.name}
                            <button
                              className="character-panel__member-remove"
                              onClick={() => handleAssignParty(c.id, undefined)}
                              title="Remove from party"
                              aria-label={`Remove ${c.name} from party`}
                            >
                              &times;
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default CharacterPanelModal;
