// HexDetail - Right panel for viewing/editing hex content
import { useState, useEffect, useCallback } from 'react';
import { useCampaign } from '../stores/CampaignContext';
import { useSelection } from '../stores/SelectionContext';
import type { Hex, ContentItem, DiscoveryStatus } from '../types';
import { createContentItem, createHex } from '../types';
import ContentItemRow from './ui/ContentItemRow';
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
import { formatTravelModifier, formatVisibilityModifier, formatEncounterModifier } from '../data/weatherEffects';

type ContentCategory = 'locations' | 'encounters' | 'npcs' | 'treasures' | 'clues';

const categoryConfig: Record<ContentCategory, { title: string; icon: string }> = {
  locations: { title: 'Locations', icon: '📍' },
  encounters: { title: 'Encounters', icon: '⚔️' },
  npcs: { title: 'NPCs', icon: '👤' },
  treasures: { title: 'Treasures', icon: '✨' },
  clues: { title: 'Clues & Hooks', icon: '💡' }
};

function HexDetail() {
  const {
    campaign,
    getHex,
    getOrCreateHex,
    updateHex,
    timeWeather,
    getWeatherForHex,
    getWeatherEffectsForHex,
    setHexWeather,
    clearHexWeather
  } = useCampaign();
  const { selectedCoordinate } = useSelection();

  const [hex, setHex] = useState<Hex | null>(null);
  const [editingItem, setEditingItem] = useState<{ item: ContentItem; category: ContentCategory } | null>(null);

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

  const handleTerrainChange = (terrain: string) => {
    if (!hex || !selectedCoordinate) return;
    const updated = { ...getOrCreateHex(selectedCoordinate), terrain };
    saveHex(updated);
  };

  const handleStatusChange = (status: DiscoveryStatus) => {
    if (!hex || !selectedCoordinate) return;
    const updated = { ...getOrCreateHex(selectedCoordinate), status };
    saveHex(updated);
  };

  const handleNotesChange = (notes: string) => {
    if (!hex || !selectedCoordinate) return;
    const updated = { ...getOrCreateHex(selectedCoordinate), notes };
    saveHex(updated);
  };

  const handleTagsChange = (tagsStr: string) => {
    if (!hex || !selectedCoordinate) return;
    const tags = tagsStr.split(',').map(t => t.trim()).filter(t => t);
    const updated = { ...getOrCreateHex(selectedCoordinate), tags };
    saveHex(updated);
  };

  const addItem = (category: ContentCategory) => {
    if (!selectedCoordinate) return;
    const currentHex = getOrCreateHex(selectedCoordinate);
    const newItem = createContentItem(`New ${category.slice(0, -1)}`);
    const updated = {
      ...currentHex,
      [category]: [...currentHex[category], newItem]
    };
    saveHex(updated);
    setEditingItem({ item: newItem, category });
  };

  const updateItem = (category: ContentCategory, updatedItem: ContentItem) => {
    if (!hex || !selectedCoordinate) return;
    const currentHex = getOrCreateHex(selectedCoordinate);
    const updated = {
      ...currentHex,
      [category]: currentHex[category].map(item =>
        item.id === updatedItem.id ? updatedItem : item
      )
    };
    saveHex(updated);
  };

  const deleteItem = (category: ContentCategory, itemId: string) => {
    if (!hex || !selectedCoordinate) return;
    const currentHex = getOrCreateHex(selectedCoordinate);
    const updated = {
      ...currentHex,
      [category]: currentHex[category].filter(item => item.id !== itemId)
    };
    saveHex(updated);
  };

  const toggleResolved = (category: ContentCategory, itemId: string) => {
    if (!hex || !selectedCoordinate) return;
    const currentHex = getOrCreateHex(selectedCoordinate);
    const updated = {
      ...currentHex,
      [category]: currentHex[category].map(item =>
        item.id === itemId ? { ...item, isResolved: !item.isResolved } : item
      )
    };
    saveHex(updated);
  };

  if (!selectedCoordinate || !hex) {
    return (
      <div className="hex-detail empty">
        <div className="empty-state">
          <span className="empty-icon">⬡</span>
          <p>Select a hex to view details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="hex-detail">
      {/* Header Info */}
      <div className="detail-header">
        <h2>Hex ({selectedCoordinate.q}, {selectedCoordinate.r})</h2>
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

        {/* Weather Section */}
        {timeWeather && selectedCoordinate && (
          <HexWeatherSection
            weather={getWeatherForHex(selectedCoordinate, hex.terrain)}
            effects={getWeatherEffectsForHex(selectedCoordinate, hex.terrain)}
            onSetWeather={(weather) => setHexWeather(selectedCoordinate, weather)}
            onClearOverride={() => clearHexWeather(selectedCoordinate)}
            hasOverride={!!timeWeather.hexWeatherOverrides[`${selectedCoordinate.q},${selectedCoordinate.r}`]}
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

        {/* Content Sections */}
        {(Object.keys(categoryConfig) as ContentCategory[]).map((category) => (
          <ContentSection
            key={category}
            category={category}
            items={hex[category]}
            onAdd={() => addItem(category)}
            onToggleResolved={(id) => toggleResolved(category, id)}
            onEdit={(item) => setEditingItem({ item, category })}
            onDelete={(id) => deleteItem(category, id)}
          />
        ))}
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <ContentItemEditor
          item={editingItem.item}
          category={editingItem.category}
          onSave={(item) => {
            updateItem(editingItem.category, item);
            setEditingItem(null);
          }}
          onClose={() => setEditingItem(null)}
        />
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
  onEdit: (item: ContentItem) => void;
  onDelete: (id: string) => void;
}

function ContentSection({ category, items, onAdd, onToggleResolved, onEdit, onDelete }: ContentSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const config = categoryConfig[category];

  return (
    <div className="content-section">
      <div className="section-header" onClick={() => setIsExpanded(!isExpanded)}>
        <span className="section-icon">{config.icon}</span>
        <span className="section-title">{config.title}</span>
        <span className="section-count">{items.length}</span>
        <span className="section-toggle">{isExpanded ? '▼' : '▶'}</span>
      </div>
      {isExpanded && (
        <div className="section-content">
          {items.map((item) => (
            <ContentItemRow
              key={item.id}
              item={item}
              onToggleResolved={() => onToggleResolved(item.id)}
              onEdit={() => onEdit(item)}
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

// Content item editor modal
interface ContentItemEditorProps {
  item: ContentItem;
  category: ContentCategory;
  onSave: (item: ContentItem) => void;
  onClose: () => void;
}

function ContentItemEditor({ item, category, onSave, onClose }: ContentItemEditorProps) {
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description);
  const [difficulty, setDifficulty] = useState(item.difficulty ?? '');

  const handleSave = () => {
    onSave({
      ...item,
      title,
      description,
      difficulty: difficulty || undefined
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit {categoryConfig[category].title.slice(0, -1)}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="field-group">
            <label>Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>
          <div className="field-group">
            <label>Difficulty / CR</label>
            <input
              type="text"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              placeholder="e.g., CR 2, Easy, etc."
            />
          </div>
          <div className="field-group">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save</button>
        </div>
      </div>
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
}

function HexWeatherSection({
  weather,
  effects,
  onSetWeather,
  onClearOverride,
  hasOverride
}: HexWeatherSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editWeather, setEditWeather] = useState<Weather | null>(null);

  // If no weather available, don't render
  if (!weather || !effects) return null;

  const weatherIcon = WEATHER_ICONS[weather.condition] || '🌤️';
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
      <div className="section-header" onClick={() => setIsExpanded(!isExpanded)}>
        <span className="section-icon">🌦️</span>
        <span className="section-title">Weather</span>
        {hasOverride && <span className="override-badge">Override</span>}
        <span className="section-toggle">{isExpanded ? '▼' : '▶'}</span>
      </div>
      {isExpanded && (
        <div className="section-content">
          {!isEditing ? (
            <>
              <div className="weather-current">
                <span className="weather-icon-large">{weatherIcon}</span>
                <div className="weather-info">
                  <span className="weather-summary">{summary}</span>
                  <span className="weather-label">{WEATHER_CONDITION_LABELS[weather.condition]}</span>
                </div>
              </div>

              <div className="weather-effects">
                <h5>Effects</h5>
                <ul>
                  <li>
                    <span className="effect-icon">🚶</span>
                    <span className="effect-label">Travel:</span>
                    <span className="effect-value">{formatTravelModifier(effects.travelModifier)}</span>
                  </li>
                  <li>
                    <span className="effect-icon">👁️</span>
                    <span className="effect-label">Visibility:</span>
                    <span className="effect-value">{formatVisibilityModifier(effects.visibilityModifier)}</span>
                  </li>
                  <li>
                    <span className="effect-icon">⚔️</span>
                    <span className="effect-label">Encounters:</span>
                    <span className="effect-value">{formatEncounterModifier(effects.encounterModifier)}</span>
                  </li>
                </ul>
                <p className="effect-description">{effects.description}</p>
              </div>

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
                      {WEATHER_ICONS[c]} {WEATHER_CONDITION_LABELS[c]}
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

export default HexDetail;
