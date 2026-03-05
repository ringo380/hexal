// HexDetail - Right panel for viewing/editing hex content
import { useState, useEffect, useCallback } from 'react';
import { useCampaign } from '../stores/CampaignContext';
import { useHexSelection } from '../stores/HexSelectionContext';
import type { Hex, ContentItem, DiscoveryStatus, HexMarker, MarkerType, Npc } from '../types';
import { createContentItem, createNpc, createHex } from '../types';
import type { Encounter, EncounterTemplate } from '../types/Campaign';
import { createEncounter, instantiateFromTemplate } from '../types/Campaign';
import { deleteNpcCleanup } from '../services/npcService';
import { getQuestsForHex, removeNpcFromQuests, removeEncounterFromQuests, removeClueFromQuests } from '../services/questService';
import { getEntriesForHex } from '../services/sessionLog';
import ConfirmDialog from './modals/ConfirmDialog';
import { getMarkerType, getMarkerColor, getMarkerIcon } from '../types/Markers';
import ContentItemRow from './ui/ContentItemRow';
import EncounterRow from './encounters/EncounterRow';
import EncounterEditorModal from './encounters/EncounterEditorModal';
import NpcRow from './npcs/NpcRow';
import NpcEditorModal from './npcs/NpcEditorModal';
import {
  WEATHER_ICONS,
  WEATHER_CONDITION_LABELS,
  Weather,
  WeatherEffects,
  WeatherCondition,
  Temperature,
  WindStrength,
  PrecipitationLevel
} from '../types/Weather';
import { getWeatherSummary } from '../services/weather';
import { formatTravelModifier, formatVisibilityModifier, formatEncounterModifier, getDynamicEffects } from '../data/weatherEffects';
import { useWeatherSimulation } from '../stores/WeatherSimulationContext';
import type { WeatherFieldCell } from '../types/Weather';
import SessionTagBadge from './sessions/SessionTagBadge';
import QuestStatusBadge from './quests/QuestStatusBadge';
import Icon from './icons/Icon';
import { onActivate } from '../utils/keyboard';

import type { IconName } from './icons/Icon';

type ContentCategory = 'locations' | 'encounters' | 'npcs' | 'treasures' | 'clues';

const categoryConfig: Record<ContentCategory, { title: string; icon: IconName }> = {
  locations: { title: 'Locations', icon: 'pin' },
  encounters: { title: 'Encounters', icon: 'sword' },
  npcs: { title: 'NPCs', icon: 'user' },
  treasures: { title: 'Treasures', icon: 'sparkle' },
  clues: { title: 'Clues & Hooks', icon: 'lightbulb' }
};

interface HexDetailProps {
  onOpenQuestManager?: () => void;
}

function HexDetail({ onOpenQuestManager }: HexDetailProps = {}) {
  const {
    campaign,
    getHex,
    getOrCreateHex,
    updateHex,
    updateCampaignData,
    timeWeather,
    getWeatherForHex,
    getWeatherEffectsForHex,
    setHexWeather,
    clearHexWeather,
    markerTypes,
    removeMarker,
    updateMarker,
    encounterTemplates,
    allNpcs,
    factions,
    toggleBookmark,
    isBookmarked,
    regions,
    addHexToRegion,
    removeHexFromRegion,
    getRegionForHex,
    sessions,
    sessionLog
  } = useCampaign();
  const { selectedCoordinate, selectedMarker, selectMarker, regionPaintMode } = useHexSelection();
  const weatherSim = useWeatherSimulation();

  const [hex, setHex] = useState<Hex | null>(null);
  const [editingEncounter, setEditingEncounter] = useState<Encounter | null>(null);
  const [editingNpc, setEditingNpc] = useState<Npc | null>(null);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [npcToDelete, setNpcToDelete] = useState<{ id: string; title: string } | null>(null);

  // Load hex data when selection changes
  useEffect(() => {
    if (selectedCoordinate) {
      const h = getHex(selectedCoordinate);
      setHex(h ?? createHex(selectedCoordinate));
    } else {
      setHex(null);
    }
  }, [selectedCoordinate, getHex, campaign]);

  // Save hex changes
  const saveHex = useCallback((updatedHex: Hex) => {
    updateHex(updatedHex);
    setHex(updatedHex);
  }, [updateHex]);

  const handleTerrainChange = useCallback((terrain: string) => {
    if (!hex || !selectedCoordinate) return;
    const updated = { ...getOrCreateHex(selectedCoordinate), terrain };
    saveHex(updated);
  }, [hex, selectedCoordinate, getOrCreateHex, saveHex]);

  const handleStatusChange = useCallback((status: DiscoveryStatus) => {
    if (!hex || !selectedCoordinate) return;
    const updated = { ...getOrCreateHex(selectedCoordinate), status };
    saveHex(updated);
  }, [hex, selectedCoordinate, getOrCreateHex, saveHex]);

  const handleNotesChange = useCallback((notes: string) => {
    if (!hex || !selectedCoordinate) return;
    const updated = { ...getOrCreateHex(selectedCoordinate), notes };
    saveHex(updated);
  }, [hex, selectedCoordinate, getOrCreateHex, saveHex]);

  const handleTagsChange = useCallback((tagsStr: string) => {
    if (!hex || !selectedCoordinate) return;
    const tags = tagsStr.split(',').map(t => t.trim()).filter(t => t);
    const updated = { ...getOrCreateHex(selectedCoordinate), tags };
    saveHex(updated);
  }, [hex, selectedCoordinate, getOrCreateHex, saveHex]);

  const addItem = useCallback((category: ContentCategory) => {
    if (!selectedCoordinate) return;
    const currentHex = getOrCreateHex(selectedCoordinate);
    if (category === 'encounters') {
      const newEncounter = createEncounter(`New encounter`);
      const updated = {
        ...currentHex,
        encounters: [...currentHex.encounters, newEncounter]
      };
      saveHex(updated);
      setEditingEncounter(newEncounter);
      return;
    }
    if (category === 'npcs') {
      const newNpc = createNpc('New NPC');
      const updated = {
        ...currentHex,
        npcs: [...currentHex.npcs, newNpc]
      };
      saveHex(updated);
      setEditingNpc(newNpc);
      return;
    }
    const newItem = createContentItem(`New ${category.slice(0, -1)}`);
    const updated = {
      ...currentHex,
      [category]: [...currentHex[category], newItem]
    };
    saveHex(updated);
  }, [selectedCoordinate, getOrCreateHex, saveHex]);

  const addEncounterFromTemplate = useCallback((template: EncounterTemplate) => {
    if (!selectedCoordinate) return;
    const currentHex = getOrCreateHex(selectedCoordinate);
    const encounter = instantiateFromTemplate(template);
    const updated = {
      ...currentHex,
      encounters: [...currentHex.encounters, encounter]
    };
    saveHex(updated);
    setShowTemplatePicker(false);
  }, [selectedCoordinate, getOrCreateHex, saveHex]);

  // Save encounter from full modal (closes modal)
  const saveEncounter = useCallback((updated: Encounter) => {
    if (!hex || !selectedCoordinate) return;
    const currentHex = getOrCreateHex(selectedCoordinate);
    const updatedHex = {
      ...currentHex,
      encounters: currentHex.encounters.map(e =>
        e.id === updated.id ? updated : e
      )
    };
    saveHex(updatedHex);
    setEditingEncounter(null);
  }, [hex, selectedCoordinate, getOrCreateHex, saveHex]);

  // Save encounter from inline edit (does not close modal)
  const saveEncounterInline = useCallback((updated: Encounter) => {
    if (!hex || !selectedCoordinate) return;
    const currentHex = getOrCreateHex(selectedCoordinate);
    const updatedHex = {
      ...currentHex,
      encounters: currentHex.encounters.map(e =>
        e.id === updated.id ? updated : e
      )
    };
    saveHex(updatedHex);
  }, [hex, selectedCoordinate, getOrCreateHex, saveHex]);

  // Save NPC from full modal (closes modal)
  const saveNpc = useCallback((updated: Npc) => {
    if (!hex || !selectedCoordinate) return;
    const currentHex = getOrCreateHex(selectedCoordinate);
    const updatedHex = {
      ...currentHex,
      npcs: currentHex.npcs.map(n =>
        n.id === updated.id ? updated : n
      )
    };
    saveHex(updatedHex);
    setEditingNpc(null);
  }, [hex, selectedCoordinate, getOrCreateHex, saveHex]);

  // Save NPC from inline edit (does not close modal)
  const saveNpcInline = useCallback((updated: Npc) => {
    if (!hex || !selectedCoordinate) return;
    const currentHex = getOrCreateHex(selectedCoordinate);
    const updatedHex = {
      ...currentHex,
      npcs: currentHex.npcs.map(n =>
        n.id === updated.id ? updated : n
      )
    };
    saveHex(updatedHex);
  }, [hex, selectedCoordinate, getOrCreateHex, saveHex]);

  const confirmDeleteNpc = useCallback((npcId: string) => {
    if (!hex) return;
    const currentHex = getOrCreateHex(selectedCoordinate!);
    const npc = currentHex.npcs.find(n => n.id === npcId);
    if (npc) setNpcToDelete({ id: npcId, title: npc.title || 'Unnamed NPC' });
  }, [hex, selectedCoordinate, getOrCreateHex]);

  const executeDeleteNpc = useCallback(() => {
    if (!hex || !selectedCoordinate || !campaign || !npcToDelete) return;
    const currentHex = getOrCreateHex(selectedCoordinate);
    const updatedHex = {
      ...currentHex,
      npcs: currentHex.npcs.filter(n => n.id !== npcToDelete.id)
    };
    saveHex(updatedHex);
    const hKey = `${selectedCoordinate.q},${selectedCoordinate.r}`;
    const cleanup = deleteNpcCleanup(campaign, npcToDelete.id, hKey);
    updateCampaignData(cleanup);
    const questCleanup = removeNpcFromQuests(campaign, npcToDelete.id);
    updateCampaignData(questCleanup);
    setNpcToDelete(null);
  }, [hex, selectedCoordinate, campaign, npcToDelete, getOrCreateHex, saveHex, updateCampaignData]);

  const updateItem = useCallback((category: ContentCategory, updatedItem: ContentItem) => {
    if (!hex || !selectedCoordinate) return;
    const currentHex = getOrCreateHex(selectedCoordinate);
    const updated = {
      ...currentHex,
      [category]: currentHex[category].map(item =>
        item.id === updatedItem.id ? updatedItem : item
      )
    };
    saveHex(updated);
  }, [hex, selectedCoordinate, getOrCreateHex, saveHex]);

  const deleteItem = useCallback((category: ContentCategory, itemId: string) => {
    if (!hex || !selectedCoordinate) return;
    const currentHex = getOrCreateHex(selectedCoordinate);
    const updated = {
      ...currentHex,
      [category]: currentHex[category].filter(item => item.id !== itemId)
    };
    saveHex(updated);
    if (campaign) {
      if (category === 'encounters') {
        updateCampaignData(removeEncounterFromQuests(campaign, itemId));
      } else if (category === 'clues') {
        updateCampaignData(removeClueFromQuests(campaign, itemId));
      }
    }
  }, [hex, selectedCoordinate, campaign, getOrCreateHex, saveHex, updateCampaignData]);

  const toggleResolved = useCallback((category: ContentCategory, itemId: string) => {
    if (!hex || !selectedCoordinate) return;
    const currentHex = getOrCreateHex(selectedCoordinate);
    const updated = {
      ...currentHex,
      [category]: currentHex[category].map(item =>
        item.id === itemId ? { ...item, isResolved: !item.isResolved } : item
      )
    };
    saveHex(updated);
  }, [hex, selectedCoordinate, getOrCreateHex, saveHex]);

  if (!selectedCoordinate || !hex) {
    return (
      <div className="hex-detail empty">
        <div className="empty-state">
          <span className="empty-icon"><Icon name="hexagon" size={48} /></span>
          <p>Select a hex to view details</p>
          <p className="empty-state-hint">Click any hex on the map or in the sidebar to view and edit its content.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="hex-detail">
      {/* Header Info */}
      <div className="detail-header">
        <h2>Hex ({selectedCoordinate.q}, {selectedCoordinate.r})</h2>
        <button
          className={`bookmark-btn ${isBookmarked(selectedCoordinate) ? 'bookmarked' : ''}`}
          onClick={() => toggleBookmark(selectedCoordinate)}
          title={isBookmarked(selectedCoordinate) ? 'Remove bookmark' : 'Bookmark this hex'}
          aria-label={isBookmarked(selectedCoordinate) ? 'Remove bookmark' : 'Bookmark this hex'}
        >
          <Icon name="star" size={18} />
        </button>
      </div>

      <div className="detail-content">
        {/* Terrain */}
        <div className="field-group">
          <label>Terrain</label>
          <select value={hex.terrain} onChange={(e) => handleTerrainChange(e.target.value)}>
            <option value="">-- Select Terrain --</option>
            {campaign?.terrainTypes.map((t) => (
              <option key={t.name} value={t.name}>{t.name}</option>
            ))}
          </select>
          {(() => {
            const terrainType = campaign?.terrainTypes.find(t => t.name === hex.terrain);
            if (!terrainType || !terrainType.hazardLevel) return null;
            const hazardColors: Record<number, string> = { 1: '#e6a817', 2: '#e87520', 3: '#d94c2e', 4: '#d32f2f', 5: '#8b1a1a' };
            return (
              <div className="hazard-indicator" style={{ borderLeftColor: hazardColors[terrainType.hazardLevel] || '#e6a817' }}>
                <div className="hazard-header">
                  <Icon name="skull" size={14} />
                  <span>{terrainType.hazardType || 'Hazard'}</span>
                  <span className="hazard-level-badge" style={{ backgroundColor: hazardColors[terrainType.hazardLevel] || '#e6a817' }}>
                    Lv {terrainType.hazardLevel}
                  </span>
                </div>
                {terrainType.hazardDescription && (
                  <div className="hazard-description">{terrainType.hazardDescription}</div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Status */}
        <div className="field-group">
          <label>Status</label>
          <div className="status-buttons">
            {(['undiscovered', 'discovered', 'cleared'] as DiscoveryStatus[]).map((status) => (
              <button
                key={status}
                className={`status-btn ${hex.status === status ? 'active' : ''}`}
                onClick={() => handleStatusChange(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Region */}
        {selectedCoordinate && (
          <div className="field-group region-info-section">
            <label>Region</label>
            {regionPaintMode ? (
              <div className="region-info-row">
                <span style={{ fontSize: '12px', color: 'var(--accent-color)' }}>
                  Currently painting region...
                </span>
              </div>
            ) : (() => {
              const hexRegion = getRegionForHex(selectedCoordinate);
              if (hexRegion) {
                return (
                  <div className="region-info-row">
                    <span className="region-swatch" style={{ backgroundColor: hexRegion.color }} />
                    <span>{hexRegion.name || 'Unnamed'}</span>
                    <button
                      className="btn btn-small"
                      onClick={() => removeHexFromRegion(hexRegion.id, selectedCoordinate)}
                      title="Remove from region"
                      style={{ marginLeft: 'auto', fontSize: '11px' }}
                    >
                      Remove
                    </button>
                  </div>
                );
              }
              return (
                <div className="region-info-row">
                  <select
                    className="region-assign-select"
                    value=""
                    onChange={(e) => {
                      if (e.target.value && selectedCoordinate) {
                        addHexToRegion(e.target.value, selectedCoordinate);
                      }
                    }}
                  >
                    <option value="">No region — assign...</option>
                    {regions.map(r => (
                      <option key={r.id} value={r.id}>{r.name || 'Unnamed'}</option>
                    ))}
                  </select>
                </div>
              );
            })()}
          </div>
        )}

        {/* Tags */}
        <div className="field-group">
          <label>Tags</label>
          <input
            type="text"
            placeholder="Comma-separated tags"
            value={hex.tags.join(', ')}
            onChange={(e) => handleTagsChange(e.target.value)}
          />
        </div>

        {/* Markers Section */}
        {hex.markers && hex.markers.length > 0 && (
          <MarkerSection
            markers={hex.markers}
            markerTypes={markerTypes}
            selectedMarkerId={selectedMarker?.markerId}
            onSelectMarker={(markerId) => selectMarker(markerId, selectedCoordinate)}
            onRemoveMarker={(markerId) => {
              removeMarker(selectedCoordinate, markerId);
              if (selectedMarker?.markerId === markerId) {
                selectMarker(null);
              }
            }}
            onUpdateMarker={(marker) => updateMarker(selectedCoordinate, marker)}
          />
        )}

        {/* Weather Section */}
        {timeWeather && selectedCoordinate && (
          <HexWeatherSection
            weather={getWeatherForHex(selectedCoordinate, hex.terrain, weatherSim.field[`${selectedCoordinate.q},${selectedCoordinate.r}`])}
            effects={getWeatherEffectsForHex(selectedCoordinate, hex.terrain, weatherSim.field[`${selectedCoordinate.q},${selectedCoordinate.r}`])}
            onSetWeather={(weather) => setHexWeather(selectedCoordinate, weather)}
            onClearOverride={() => clearHexWeather(selectedCoordinate)}
            hasOverride={!!timeWeather.hexWeatherOverrides[`${selectedCoordinate.q},${selectedCoordinate.r}`]}
            simulationCell={weatherSim.field[`${selectedCoordinate.q},${selectedCoordinate.r}`]}
          />
        )}

        {/* Notes */}
        <div className="field-group">
          <label>Notes</label>
          <textarea
            placeholder="DM notes for this hex..."
            value={hex.notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            rows={3}
          />
        </div>

        {/* Encounters Section (enhanced) */}
        <EncounterSection
          encounters={hex.encounters}
          templates={encounterTemplates}
          showTemplatePicker={showTemplatePicker}
          onToggleTemplatePicker={() => setShowTemplatePicker(!showTemplatePicker)}
          onAdd={() => addItem('encounters')}
          onAddFromTemplate={addEncounterFromTemplate}
          onToggleResolved={(id) => toggleResolved('encounters', id)}
          onSave={saveEncounterInline}
          onEditFull={(encounter) => setEditingEncounter(encounter)}
          onDelete={(id) => deleteItem('encounters', id)}
        />

        {/* NPC Section (dedicated) */}
        <NpcSection
          npcs={hex.npcs}
          factions={factions}
          onAdd={() => addItem('npcs')}
          onToggleResolved={(id) => toggleResolved('npcs', id)}
          onSave={saveNpcInline}
          onEditFull={(npc) => setEditingNpc(npc)}
          onDelete={(id) => confirmDeleteNpc(id)}
        />

        {/* Other Content Sections (excluding encounters and npcs) */}
        {(Object.keys(categoryConfig) as ContentCategory[]).filter(c => c !== 'encounters' && c !== 'npcs').map((category) => (
          <ContentSection
            key={category}
            category={category}
            items={hex[category]}
            onAdd={() => addItem(category)}
            onToggleResolved={(id) => toggleResolved(category, id)}
            onSave={(item) => updateItem(category, item)}
            onDelete={(id) => deleteItem(category, id)}
          />
        ))}

        {/* Session History */}
        {selectedCoordinate && (() => {
          const hexKey = `${selectedCoordinate.q},${selectedCoordinate.r}`;
          const hexEntries = getEntriesForHex(sessionLog, hexKey);
          if (hexEntries.length === 0) return null;
          return (
            <HexSessionHistory entries={hexEntries} sessions={sessions} />
          );
        })()}

        {/* Quests */}
        {selectedCoordinate && campaign && (() => {
          const hexKey = `${selectedCoordinate.q},${selectedCoordinate.r}`;
          const hexQuests = getQuestsForHex(campaign, hexKey);
          if (hexQuests.length === 0) return null;
          return (
            <HexQuestSection quests={hexQuests} onOpenQuestManager={onOpenQuestManager} />
          );
        })()}
      </div>

      {/* Encounter Edit Modal */}
      {editingEncounter && (
        <EncounterEditorModal
          encounter={editingEncounter}
          allNpcs={allNpcs}
          onSave={saveEncounter}
          onClose={() => setEditingEncounter(null)}
        />
      )}

      {/* NPC Edit Modal */}
      {editingNpc && (
        <NpcEditorModal
          npc={editingNpc}
          factions={factions}
          allNpcs={allNpcs}
          onSave={saveNpc}
          onClose={() => setEditingNpc(null)}
        />
      )}
      {npcToDelete && (
        <ConfirmDialog
          title={`Delete ${npcToDelete.title}?`}
          message="This will remove this NPC and clean up all relationship and encounter references across the campaign."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          variant="danger"
          onConfirm={executeDeleteNpc}
          onCancel={() => setNpcToDelete(null)}
        />
      )}
    </div>
  );
}

// Encounter section component (enhanced)
interface EncounterSectionProps {
  encounters: Encounter[];
  templates: EncounterTemplate[];
  showTemplatePicker: boolean;
  onToggleTemplatePicker: () => void;
  onAdd: () => void;
  onAddFromTemplate: (template: EncounterTemplate) => void;
  onToggleResolved: (id: string) => void;
  onSave: (encounter: Encounter) => void;
  onEditFull: (encounter: Encounter) => void;
  onDelete: (id: string) => void;
}

function EncounterSection({
  encounters, templates, showTemplatePicker, onToggleTemplatePicker,
  onAdd, onAddFromTemplate, onToggleResolved, onSave, onEditFull, onDelete
}: EncounterSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="content-section">
      <div className="section-header" role="button" tabIndex={0} aria-expanded={isExpanded} aria-controls="hex-encounters-content" onClick={() => setIsExpanded(!isExpanded)} onKeyDown={onActivate(() => setIsExpanded(!isExpanded))}>
        <span className="section-icon"><Icon name="sword" size={14} /></span>
        <span className="section-title">Encounters</span>
        <span className="section-count">{encounters.length}</span>
        <span className="section-toggle"><Icon name={isExpanded ? 'chevron-down' : 'chevron-right'} size={12} /></span>
      </div>
      {isExpanded && (
        <div id="hex-encounters-content" className="section-content">
          {encounters.length === 0 && <p className="section-empty-hint">No encounters yet. Add one below.</p>}
          {encounters.map((encounter) => (
            <EncounterRow
              key={encounter.id}
              encounter={encounter}
              onToggleResolved={() => onToggleResolved(encounter.id)}
              onSave={onSave}
              onEditFull={onEditFull}
              onDelete={() => onDelete(encounter.id)}
            />
          ))}
          <div className="encounter-add-buttons">
            <button className="add-item-btn" onClick={onAdd}>
              + Add Encounter
            </button>
            {templates.length > 0 && (
              <div className="template-picker-wrapper">
                <button className="add-item-btn" onClick={onToggleTemplatePicker}>
                  + From Template
                </button>
                {showTemplatePicker && (
                  <div className="template-picker-dropdown">
                    {templates.map(t => (
                      <button
                        key={t.id}
                        className="template-picker-item"
                        onClick={() => onAddFromTemplate(t)}
                      >
                        {t.name}
                        {t.encounterType && <span className="template-picker-type"> ({t.encounterType})</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// NPC section component (dedicated)
interface NpcSectionProps {
  npcs: Npc[];
  factions: import('../types/Campaign').Faction[];
  onAdd: () => void;
  onToggleResolved: (id: string) => void;
  onSave: (npc: Npc) => void;
  onEditFull: (npc: Npc) => void;
  onDelete: (id: string) => void;
}

function NpcSection({ npcs, factions, onAdd, onToggleResolved, onSave, onEditFull, onDelete }: NpcSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const getFaction = (factionId?: string) => {
    if (!factionId) return undefined;
    return factions.find(f => f.id === factionId);
  };

  return (
    <div className="content-section">
      <div className="section-header" role="button" tabIndex={0} aria-expanded={isExpanded} aria-controls="hex-npcs-content" onClick={() => setIsExpanded(!isExpanded)} onKeyDown={onActivate(() => setIsExpanded(!isExpanded))}>
        <span className="section-icon"><Icon name="user" size={14} /></span>
        <span className="section-title">NPCs</span>
        <span className="section-count">{npcs.length}</span>
        <span className="section-toggle"><Icon name={isExpanded ? 'chevron-down' : 'chevron-right'} size={12} /></span>
      </div>
      {isExpanded && (
        <div id="hex-npcs-content" className="section-content">
          {npcs.length === 0 && <p className="section-empty-hint">No NPCs yet. Add one below.</p>}
          {npcs.map((npc) => (
            <NpcRow
              key={npc.id}
              npc={npc}
              faction={getFaction(npc.factionId)}
              onToggleResolved={() => onToggleResolved(npc.id)}
              onSave={onSave}
              onEditFull={onEditFull}
              onDelete={() => onDelete(npc.id)}
            />
          ))}
          <button className="add-item-btn" onClick={onAdd}>
            + Add NPC
          </button>
        </div>
      )}
    </div>
  );
}

// Content section component
interface ContentSectionProps {
  category: ContentCategory;
  items: ContentItem[];
  onAdd: () => void;
  onToggleResolved: (id: string) => void;
  onSave: (item: ContentItem) => void;
  onDelete: (id: string) => void;
}

function ContentSection({ category, items, onAdd, onToggleResolved, onSave, onDelete }: ContentSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const config = categoryConfig[category];

  return (
    <div className="content-section">
      <div className="section-header" role="button" tabIndex={0} aria-expanded={isExpanded} aria-controls={`hex-${category}-content`} onClick={() => setIsExpanded(!isExpanded)} onKeyDown={onActivate(() => setIsExpanded(!isExpanded))}>
        <span className="section-icon"><Icon name={config.icon} size={14} /></span>
        <span className="section-title">{config.title}</span>
        <span className="section-count">{items.length}</span>
        <span className="section-toggle"><Icon name={isExpanded ? 'chevron-down' : 'chevron-right'} size={12} /></span>
      </div>
      {isExpanded && (
        <div id={`hex-${category}-content`} className="section-content">
          {items.length === 0 && <p className="section-empty-hint">None yet. Add one below.</p>}
          {items.map((item) => (
            <ContentItemRow
              key={item.id}
              item={item}
              onToggleResolved={() => onToggleResolved(item.id)}
              onSave={onSave}
              onDelete={() => onDelete(item.id)}
            />
          ))}
          <button className="add-item-btn" onClick={onAdd}>
            + Add {config.title.slice(0, -1)}
          </button>
        </div>
      )}
    </div>
  );
}

// Weather condition options for the editor
const CONDITION_OPTIONS: WeatherCondition[] = [
  'clear', 'partly-cloudy', 'cloudy', 'overcast',
  'light-rain', 'rain', 'heavy-rain', 'thunderstorm',
  'drizzle', 'fog', 'mist',
  'light-snow', 'snow', 'heavy-snow', 'blizzard',
  'hail', 'sleet', 'windy', 'hot', 'cold', 'freezing'
];

const TEMPERATURE_OPTIONS: Temperature[] = [
  'freezing', 'cold', 'cool', 'mild', 'warm', 'hot', 'scorching'
];

const WIND_OPTIONS: WindStrength[] = ['calm', 'light', 'moderate', 'strong', 'gale'];

const PRECIPITATION_OPTIONS: PrecipitationLevel[] = ['none', 'light', 'moderate', 'heavy'];

// Hex weather section component
interface HexWeatherSectionProps {
  weather: Weather | undefined;
  effects: WeatherEffects | undefined;
  onSetWeather: (weather: Weather) => void;
  onClearOverride: () => void;
  hasOverride: boolean;
  simulationCell?: WeatherFieldCell;
}

function HexWeatherSection({
  weather,
  effects,
  onSetWeather,
  onClearOverride,
  hasOverride,
  simulationCell
}: HexWeatherSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editWeather, setEditWeather] = useState<Weather | null>(null);

  // If no weather available, don't render
  if (!weather || !effects) return null;

  const weatherIconName = WEATHER_ICONS[weather.condition] || 'cloud-partial';
  const summary = getWeatherSummary(weather);

  const handleStartEdit = () => {
    setEditWeather({ ...weather });
    setIsEditing(true);
  };

  const handleApplyEdit = () => {
    if (editWeather) {
      onSetWeather(editWeather);
      setIsEditing(false);
      setEditWeather(null);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditWeather(null);
  };

  return (
    <div className="hex-weather-section">
      <div className="section-header" role="button" tabIndex={0} aria-expanded={isExpanded} aria-controls="hex-weather-content" onClick={() => setIsExpanded(!isExpanded)} onKeyDown={onActivate(() => setIsExpanded(!isExpanded))}>
        <span className="section-icon"><Icon name="cloud-sun" size={14} /></span>
        <span className="section-title">Weather</span>
        {hasOverride && <span className="override-badge">Override</span>}
        <span className="section-toggle"><Icon name={isExpanded ? 'chevron-down' : 'chevron-right'} size={12} /></span>
      </div>
      {isExpanded && (
        <div id="hex-weather-content" className="section-content">
          {!isEditing ? (
            <>
              <div className="weather-current">
                <span className="weather-icon-large"><Icon name={weatherIconName} size={32} /></span>
                <div className="weather-info">
                  <span className="weather-summary">{summary}</span>
                  <span className="weather-label">{WEATHER_CONDITION_LABELS[weather.condition]}</span>
                </div>
              </div>

              <div className="weather-effects">
                <h5>Effects</h5>
                <ul>
                  <li>
                    <span className="effect-icon"><Icon name="walk" size={14} /></span>
                    <span className="effect-label">Travel:</span>
                    <span className="effect-value">{formatTravelModifier(effects.travelModifier)}</span>
                  </li>
                  <li>
                    <span className="effect-icon"><Icon name="eye" size={14} /></span>
                    <span className="effect-label">Visibility:</span>
                    <span className="effect-value">{formatVisibilityModifier(effects.visibilityModifier)}</span>
                  </li>
                  <li>
                    <span className="effect-icon"><Icon name="sword" size={14} /></span>
                    <span className="effect-label">Encounters:</span>
                    <span className="effect-value">{formatEncounterModifier(effects.encounterModifier)}</span>
                  </li>
                </ul>
                <p className="effect-description">{effects.description}</p>
              </div>

              {/* Simulation-derived weather data */}
              {simulationCell && (
                <div className="hex-weather-sim">
                  <h5>Simulation Data</h5>
                  <div className="weather-sim-stats">
                    <span>Pressure: {Math.round(simulationCell.pressure)} hPa</span>
                    <span>Temp: {Math.round(simulationCell.temperature)}°C</span>
                    <span>Humidity: {Math.round(simulationCell.humidity * 100)}%</span>
                    <span>Cloud cover: {Math.round(simulationCell.cloudCover * 100)}%</span>
                  </div>
                  {(() => {
                    const dynEffects = getDynamicEffects(simulationCell, effects);
                    return (
                      <>
                        {dynEffects.temperatureHazard !== 'none' && (
                          <p className={dynEffects.temperatureHazard === 'hypothermia' || dynEffects.temperatureHazard === 'heatstroke' ? 'storm-warning' : 'hazard-warning'}>
                            {dynEffects.temperatureHazard === 'cold-risk' && 'Cold exposure risk'}
                            {dynEffects.temperatureHazard === 'heat-risk' && 'Heat exposure risk'}
                            {dynEffects.temperatureHazard === 'hypothermia' && 'Hypothermia danger!'}
                            {dynEffects.temperatureHazard === 'heatstroke' && 'Heatstroke danger!'}
                          </p>
                        )}
                        {dynEffects.stormCellWarning && (
                          <p className="storm-warning">Active storm cell — travel extremely hazardous</p>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

              <div className="weather-actions">
                <button
                  className="btn btn-small"
                  onClick={handleStartEdit}
                  title="Set custom weather for this hex"
                >
                  Set Custom
                </button>
                {hasOverride && (
                  <button
                    className="btn btn-small"
                    onClick={onClearOverride}
                    title="Use regional weather"
                  >
                    Clear Override
                  </button>
                )}
                {!hasOverride && (
                  <span className="weather-source">Using regional weather</span>
                )}
              </div>
            </>
          ) : (
            <div className="weather-editor">
              <div className="form-group">
                <label>Condition</label>
                <select
                  value={editWeather?.condition || 'clear'}
                  onChange={(e) => setEditWeather(w => w ? { ...w, condition: e.target.value as WeatherCondition } : null)}
                >
                  {CONDITION_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {WEATHER_CONDITION_LABELS[c]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Temperature</label>
                <select
                  value={editWeather?.temperature || 'mild'}
                  onChange={(e) => setEditWeather(w => w ? { ...w, temperature: e.target.value as Temperature } : null)}
                >
                  {TEMPERATURE_OPTIONS.map((t) => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Wind</label>
                <select
                  value={editWeather?.wind || 'calm'}
                  onChange={(e) => setEditWeather(w => w ? { ...w, wind: e.target.value as WindStrength } : null)}
                >
                  {WIND_OPTIONS.map((w) => (
                    <option key={w} value={w}>{w.charAt(0).toUpperCase() + w.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Precipitation</label>
                <select
                  value={editWeather?.precipitation || 'none'}
                  onChange={(e) => setEditWeather(w => w ? { ...w, precipitation: e.target.value as PrecipitationLevel } : null)}
                >
                  {PRECIPITATION_OPTIONS.map((p) => (
                    <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="weather-editor-actions">
                <button className="btn btn-small btn-primary" onClick={handleApplyEdit}>
                  Apply
                </button>
                <button className="btn btn-small" onClick={handleCancelEdit}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Marker section component
interface MarkerSectionProps {
  markers: HexMarker[];
  markerTypes: MarkerType[];
  selectedMarkerId?: string;
  onSelectMarker: (markerId: string | null) => void;
  onRemoveMarker: (markerId: string) => void;
  onUpdateMarker: (marker: HexMarker) => void;
}

function MarkerSection({
  markers,
  markerTypes,
  selectedMarkerId,
  onSelectMarker,
  onRemoveMarker,
  onUpdateMarker
}: MarkerSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [editingMarkerId, setEditingMarkerId] = useState<string | null>(null);

  const handleToggleVisibility = (marker: HexMarker) => {
    onUpdateMarker({ ...marker, isVisible: !marker.isVisible });
  };

  const handleLabelChange = (marker: HexMarker, label: string) => {
    onUpdateMarker({ ...marker, label: label || undefined });
  };

  return (
    <div className="marker-section">
      <div className="section-header" role="button" tabIndex={0} aria-expanded={isExpanded} aria-controls="hex-markers-content" onClick={() => setIsExpanded(!isExpanded)} onKeyDown={onActivate(() => setIsExpanded(!isExpanded))}>
        <span className="section-icon"><Icon name="pin" size={14} /></span>
        <span className="section-title">Markers</span>
        <span className="section-count">{markers.length}</span>
        <span className="section-toggle"><Icon name={isExpanded ? 'chevron-down' : 'chevron-right'} size={12} /></span>
      </div>
      {isExpanded && (
        <div id="hex-markers-content" className="section-content">
          {markers.map((marker) => {
            const markerType = getMarkerType(marker.typeId, markerTypes);
            const icon = getMarkerIcon(marker, markerTypes);
            const color = getMarkerColor(marker, markerTypes);
            const isSelected = marker.id === selectedMarkerId;
            const isEditing = marker.id === editingMarkerId;

            return (
              <div
                key={marker.id}
                className={`marker-item ${isSelected ? 'selected' : ''} ${!marker.isVisible ? 'hidden-marker' : ''}`}
                role="button"
                tabIndex={0}
                onClick={() => onSelectMarker(isSelected ? null : marker.id)}
                onKeyDown={onActivate(() => onSelectMarker(isSelected ? null : marker.id))}
              >
                <span className="marker-item-icon" style={{ color }}>
                  {icon}
                </span>
                <div className="marker-item-info">
                  {isEditing ? (
                    <input
                      type="text"
                      className="marker-label-input"
                      value={marker.label || ''}
                      placeholder={markerType?.name || 'Marker'}
                      onChange={(e) => handleLabelChange(marker, e.target.value)}
                      onBlur={() => setEditingMarkerId(null)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') setEditingMarkerId(null);
                        e.stopPropagation();
                      }}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                    />
                  ) : (
                    <span
                      className="marker-item-name"
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setEditingMarkerId(marker.id);
                      }}
                    >
                      {marker.label || markerType?.name || 'Marker'}
                    </span>
                  )}
                  <span className="marker-item-type">{markerType?.name}</span>
                </div>
                <div className="marker-item-actions">
                  <button
                    className="btn-icon-small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleVisibility(marker);
                    }}
                    title={marker.isVisible ? 'Hide marker' : 'Show marker'}
                    aria-label={marker.isVisible ? 'Hide marker' : 'Show marker'}
                  >
                    <Icon name={marker.isVisible ? 'eye' : 'eye-off'} size={14} />
                  </button>
                  <button
                    className="btn-icon-small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingMarkerId(marker.id);
                    }}
                    title="Edit label"
                    aria-label="Edit label"
                  >
                    <Icon name="pencil" size={14} />
                  </button>
                  <button
                    className="btn-icon-small danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveMarker(marker.id);
                    }}
                    title="Remove marker"
                    aria-label="Remove marker"
                  >
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              </div>
            );
          })}
          <p className="marker-hint">Click to select • Double-click name to edit • Delete key to remove</p>
        </div>
      )}
    </div>
  );
}

// Hex quest section
interface HexQuestSectionProps {
  quests: import('../types/Quest').Quest[];
  onOpenQuestManager?: () => void;
}

function HexQuestSection({ quests, onOpenQuestManager }: HexQuestSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="content-section hex-quest-section">
      <div className="section-header" role="button" tabIndex={0} aria-expanded={isExpanded} aria-controls="hex-quests-content" onClick={() => setIsExpanded(!isExpanded)} onKeyDown={onActivate(() => setIsExpanded(!isExpanded))}>
        <span className="section-icon"><Icon name="star" size={14} /></span>
        <span className="section-title">Quests</span>
        <span className="section-count">{quests.length}</span>
        <span className="section-toggle"><Icon name={isExpanded ? 'chevron-down' : 'chevron-right'} size={12} /></span>
      </div>
      {isExpanded && (
        <div id="hex-quests-content" className="section-content">
          {quests.map(quest => {
            const completed = quest.objectives.filter(o => o.isComplete).length;
            const total = quest.objectives.length;
            return (
              <div key={quest.id} className="hex-quest-item">
                <QuestStatusBadge status={quest.status} size="small" />
                <span className="hex-quest-title">{quest.title || 'Untitled'}</span>
                {total > 0 && (
                  <span className="hex-quest-progress">{completed}/{total}</span>
                )}
                {onOpenQuestManager && (
                  <button
                    className="btn-icon-small"
                    onClick={(e) => { e.stopPropagation(); onOpenQuestManager(); }}
                    title="View in Quest Manager"
                    aria-label="View in Quest Manager"
                  >
                    <Icon name="export" size={12} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Hex session history section
interface HexSessionHistoryProps {
  entries: import('../types/Campaign').SessionLogEntry[];
  sessions: import('../types/Campaign').Session[];
}

function HexSessionHistory({ entries, sessions }: HexSessionHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const getSession = (sessionId: string) => sessions.find(s => s.id === sessionId);

  return (
    <div className="content-section hex-session-history">
      <div className="section-header" role="button" tabIndex={0} aria-expanded={isExpanded} aria-controls="hex-session-history-content" onClick={() => setIsExpanded(!isExpanded)} onKeyDown={onActivate(() => setIsExpanded(!isExpanded))}>
        <span className="section-icon"><Icon name="calendar" size={14} /></span>
        <span className="section-title">Session History</span>
        <span className="section-count">{entries.length}</span>
        <span className="section-toggle"><Icon name={isExpanded ? 'chevron-down' : 'chevron-right'} size={12} /></span>
      </div>
      {isExpanded && (
        <div id="hex-session-history-content" className="section-content">
          {entries.map(entry => {
            const session = getSession(entry.sessionId);
            return (
              <div key={entry.id} className="hex-session-history-entry">
                <div className="hex-session-history-header">
                  {session && <span className="hex-session-history-session">S#{session.number}</span>}
                  <span className="hex-session-history-title">{entry.title || 'Untitled'}</span>
                </div>
                {entry.tags.length > 0 && (
                  <div className="hex-session-history-tags">
                    {entry.tags.map(tag => (
                      <SessionTagBadge key={tag} tag={tag} customTag={entry.customTag} size="small" />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default HexDetail;
