// TemplateCustomizeStep - Tabbed customization panel for template pre-creation tweaks
import { useState } from 'react';
import type { CampaignTemplate } from '../../types/CampaignTemplate';
import type { TemplateCustomizations } from '../../types/CampaignTemplate';
import type { CalendarPreset } from '../../types/Weather';
import Icon from '../icons/Icon';

interface TemplateCustomizeStepProps {
  template: CampaignTemplate;
  customizations: TemplateCustomizations;
  onChange: (customizations: TemplateCustomizations) => void;
}

type Tab = 'terrain' | 'factions' | 'regions' | 'content' | 'generation';

function TemplateCustomizeStep({ template, customizations, onChange }: TemplateCustomizeStepProps) {
  const [activeTab, setActiveTab] = useState<Tab>('terrain');

  const tabs: { id: Tab; label: string }[] = [
    { id: 'terrain', label: 'Terrain' },
    { id: 'factions', label: 'Factions' },
    { id: 'regions', label: 'Regions' },
    { id: 'content', label: 'Content' },
    { id: 'generation', label: 'Generation' },
  ];

  return (
    <div>
      <div className="customize-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`customize-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="customize-content">
        {activeTab === 'terrain' && (
          <TerrainTab template={template} customizations={customizations} onChange={onChange} />
        )}
        {activeTab === 'factions' && (
          <FactionsTab template={template} customizations={customizations} onChange={onChange} />
        )}
        {activeTab === 'regions' && (
          <RegionsTab template={template} customizations={customizations} onChange={onChange} />
        )}
        {activeTab === 'content' && (
          <ContentTab template={template} customizations={customizations} onChange={onChange} />
        )}
        {activeTab === 'generation' && (
          <GenerationTab template={template} customizations={customizations} onChange={onChange} />
        )}
      </div>
    </div>
  );
}

// ============ Terrain Tab ============

function TerrainTab({ template, customizations, onChange }: TemplateCustomizeStepProps) {
  const enabledCount = template.terrainTypes.filter(
    t => !customizations.disabledTerrainIds.has(t.id)
  ).length;

  const toggleTerrain = (id: string) => {
    const next = new Set(customizations.disabledTerrainIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      // Prevent disabling all terrains
      if (enabledCount <= 1) return;
      next.add(id);
    }
    onChange({ ...customizations, disabledTerrainIds: next });
  };

  const renameTerrain = (id: string, name: string) => {
    const next = { ...customizations.terrainNameOverrides };
    if (name === template.terrainTypes.find(t => t.id === id)?.name) {
      delete next[id];
    } else {
      next[id] = name;
    }
    onChange({ ...customizations, terrainNameOverrides: next });
  };

  return (
    <div>
      {template.terrainTypes.map(terrain => {
        const disabled = customizations.disabledTerrainIds.has(terrain.id);
        return (
          <div key={terrain.id} className="customize-toggle-row">
            <input
              type="checkbox"
              checked={!disabled}
              onChange={() => toggleTerrain(terrain.id)}
              aria-label={`Toggle ${terrain.name}`}
            />
            <div className="toggle-color-swatch" style={{ background: terrain.colorHex }} />
            <div className="toggle-name">
              {!disabled ? (
                <input
                  type="text"
                  value={customizations.terrainNameOverrides[terrain.id] ?? terrain.name}
                  onChange={(e) => renameTerrain(terrain.id, e.target.value)}
                  aria-label={`Rename ${terrain.name}`}
                />
              ) : (
                <span style={{ opacity: 0.5 }}>{terrain.name}</span>
              )}
            </div>
            <span className="toggle-meta">
              <Icon name={terrain.icon as any} size={12} />
            </span>
          </div>
        );
      })}
      {enabledCount <= 1 && (
        <div className="customize-min-warning">At least one terrain type must be enabled</div>
      )}
    </div>
  );
}

// ============ Factions Tab ============

function FactionsTab({ template, customizations, onChange }: TemplateCustomizeStepProps) {
  const toggleFaction = (index: number) => {
    const next = new Set(customizations.disabledFactionIndices);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    onChange({ ...customizations, disabledFactionIndices: next });
  };

  const renameFaction = (index: number, name: string) => {
    const next = { ...customizations.factionNameOverrides };
    if (name === template.factions[index]?.name) {
      delete next[index];
    } else {
      next[index] = name;
    }
    onChange({ ...customizations, factionNameOverrides: next });
  };

  if (template.factions.length === 0) {
    return <div className="empty-hint">This template has no factions</div>;
  }

  return (
    <div>
      {template.factions.map((faction, i) => {
        const disabled = customizations.disabledFactionIndices.has(i);
        return (
          <div key={i} className="customize-toggle-row">
            <input
              type="checkbox"
              checked={!disabled}
              onChange={() => toggleFaction(i)}
              aria-label={`Toggle ${faction.name}`}
            />
            <div className="toggle-color-swatch" style={{ background: faction.color }} />
            <div className="toggle-name">
              {!disabled ? (
                <input
                  type="text"
                  value={customizations.factionNameOverrides[i] ?? faction.name}
                  onChange={(e) => renameFaction(i, e.target.value)}
                  aria-label={`Rename ${faction.name}`}
                />
              ) : (
                <span style={{ opacity: 0.5 }}>{faction.name}</span>
              )}
            </div>
            <span className="toggle-meta">{faction.description.slice(0, 40)}...</span>
          </div>
        );
      })}
    </div>
  );
}

// ============ Regions Tab ============

function RegionsTab({ template, customizations, onChange }: TemplateCustomizeStepProps) {
  const toggleRegion = (index: number) => {
    const next = new Set(customizations.disabledRegionIndices);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    onChange({ ...customizations, disabledRegionIndices: next });
  };

  if (template.regions.length === 0) {
    return <div className="empty-hint">This template has no regions</div>;
  }

  return (
    <div>
      {template.regions.map((region, i) => (
        <div key={i} className="customize-toggle-row">
          <input
            type="checkbox"
            checked={!customizations.disabledRegionIndices.has(i)}
            onChange={() => toggleRegion(i)}
            aria-label={`Toggle ${region.name}`}
          />
          <div className="toggle-color-swatch" style={{ background: region.color }} />
          <span className="toggle-name">{region.name}</span>
          <span className="toggle-meta">{region.description.slice(0, 50)}</span>
        </div>
      ))}
    </div>
  );
}

// ============ Content Tab ============

function ContentTab({ template, customizations, onChange }: TemplateCustomizeStepProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleEncounterTable = (id: string) => {
    const next = new Set(customizations.disabledEncounterTableIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onChange({ ...customizations, disabledEncounterTableIds: next });
  };

  const toggleLandmarkTable = (id: string) => {
    const next = new Set(customizations.disabledLandmarkTableIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onChange({ ...customizations, disabledLandmarkTableIds: next });
  };

  return (
    <div>
      {template.encounterTables.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <h4 style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Encounter Tables ({template.encounterTables.length})
          </h4>
          {template.encounterTables.map(table => (
            <div key={table.id}>
              <div className="customize-toggle-row">
                <input
                  type="checkbox"
                  checked={!customizations.disabledEncounterTableIds.has(table.id)}
                  onChange={() => toggleEncounterTable(table.id)}
                  aria-label={`Toggle ${table.name}`}
                />
                <span className="toggle-name">{table.name}</span>
                <span className="toggle-meta">{table.entries.length} entries</span>
                <button
                  className="btn-icon-small"
                  onClick={() => setExpandedSection(expandedSection === `enc-${table.id}` ? null : `enc-${table.id}`)}
                  aria-label={`Expand ${table.name}`}
                >
                  <Icon name={expandedSection === `enc-${table.id}` ? 'chevron-down' : 'chevron-right'} size={12} />
                </button>
              </div>
              {expandedSection === `enc-${table.id}` && (
                <div style={{ paddingLeft: 32, marginBottom: 4 }}>
                  {table.entries.map(entry => (
                    <div key={entry.id} style={{ fontSize: 11, color: 'var(--text-muted)', padding: '2px 0' }}>
                      {entry.title} — {entry.difficulty}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {template.landmarkTables.length > 0 && (
        <div>
          <h4 style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Landmark Tables ({template.landmarkTables.length})
          </h4>
          {template.landmarkTables.map(table => (
            <div key={table.id}>
              <div className="customize-toggle-row">
                <input
                  type="checkbox"
                  checked={!customizations.disabledLandmarkTableIds.has(table.id)}
                  onChange={() => toggleLandmarkTable(table.id)}
                  aria-label={`Toggle ${table.name}`}
                />
                <span className="toggle-name">{table.name}</span>
                <span className="toggle-meta">{table.entries.length} entries</span>
                <button
                  className="btn-icon-small"
                  onClick={() => setExpandedSection(expandedSection === `lmk-${table.id}` ? null : `lmk-${table.id}`)}
                  aria-label={`Expand ${table.name}`}
                >
                  <Icon name={expandedSection === `lmk-${table.id}` ? 'chevron-down' : 'chevron-right'} size={12} />
                </button>
              </div>
              {expandedSection === `lmk-${table.id}` && (
                <div style={{ paddingLeft: 32, marginBottom: 4 }}>
                  {table.entries.map(entry => (
                    <div key={entry.id} style={{ fontSize: 11, color: 'var(--text-muted)', padding: '2px 0' }}>
                      {entry.title} — {entry.rarity}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============ Generation Tab ============

const CALENDAR_PRESETS: { value: CalendarPreset; label: string }[] = [
  { value: 'simple', label: 'Simple' },
  { value: 'greyhawk', label: 'Greyhawk' },
  { value: 'forgotten-realms', label: 'Forgotten Realms' },
  { value: 'eberron', label: 'Eberron' },
];

function GenerationTab({ template, customizations, onChange }: TemplateCustomizeStepProps) {
  const genConfig = { ...template.generationConfig, ...customizations.generationConfig };

  const updateGenConfig = (key: string, value: number | string) => {
    onChange({
      ...customizations,
      generationConfig: {
        ...customizations.generationConfig,
        [key]: value,
      },
    });
  };

  return (
    <div>
      <div className="gen-config-row">
        <label>Biome Clustering</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={genConfig.biomeClusteringStrength ?? 0.6}
          onChange={(e) => updateGenConfig('biomeClusteringStrength', parseFloat(e.target.value))}
        />
        <span className="gen-config-value">
          {((genConfig.biomeClusteringStrength ?? 0.6) * 100).toFixed(0)}%
        </span>
      </div>
      <div className="gen-config-row">
        <label>Encounter Density</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={genConfig.encounterDensity ?? 0.4}
          onChange={(e) => updateGenConfig('encounterDensity', parseFloat(e.target.value))}
        />
        <span className="gen-config-value">
          {((genConfig.encounterDensity ?? 0.4) * 100).toFixed(0)}%
        </span>
      </div>
      <div className="gen-config-row">
        <label>Landmark Density</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={genConfig.landmarkDensity ?? 0.2}
          onChange={(e) => updateGenConfig('landmarkDensity', parseFloat(e.target.value))}
        />
        <span className="gen-config-value">
          {((genConfig.landmarkDensity ?? 0.2) * 100).toFixed(0)}%
        </span>
      </div>
      <div className="gen-config-row">
        <label>Terrain Variety</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={genConfig.terrainVariety ?? 0.5}
          onChange={(e) => updateGenConfig('terrainVariety', parseFloat(e.target.value))}
        />
        <span className="gen-config-value">
          {((genConfig.terrainVariety ?? 0.5) * 100).toFixed(0)}%
        </span>
      </div>
      <div className="gen-config-row">
        <label>Seed</label>
        <input
          type="text"
          placeholder="Random"
          value={genConfig.seed ?? ''}
          onChange={(e) => updateGenConfig('seed', e.target.value)}
        />
      </div>
      <div className="gen-config-row">
        <label>Calendar</label>
        <select
          value={customizations.calendarPreset ?? template.calendarPreset}
          onChange={(e) => onChange({ ...customizations, calendarPreset: e.target.value as CalendarPreset })}
        >
          {CALENDAR_PRESETS.map(p => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default TemplateCustomizeStep;
