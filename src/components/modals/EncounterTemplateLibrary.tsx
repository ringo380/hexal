import { useState } from 'react';
import { useCampaign } from '../../stores/CampaignContext';
import type { EncounterTemplate, EncounterType } from '../../types/Campaign';
import { createEncounterTemplate, ENCOUNTER_TYPE_INFO } from '../../types/Campaign';
import EncounterTypeBadge from '../encounters/EncounterTypeBadge';
import DifficultyBadge from '../encounters/DifficultyBadge';
import CreatureList from '../encounters/CreatureList';
import RewardList from '../encounters/RewardList';
import Icon from '../icons/Icon';

interface EncounterTemplateLibraryProps {
  onClose: () => void;
}

const ENCOUNTER_TYPES: EncounterType[] = ['combat', 'social', 'exploration', 'puzzle'];

function EncounterTemplateLibrary({ onClose }: EncounterTemplateLibraryProps) {
  const { encounterTemplates, updateCampaignData } = useCampaign();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTemplate, setEditingTemplate] = useState<EncounterTemplate | null>(null);

  const filteredTemplates = encounterTemplates.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
    t.encounterType.includes(searchQuery.toLowerCase())
  );

  const addTemplate = () => {
    const template = createEncounterTemplate('New Template');
    updateCampaignData({
      encounterTemplates: [...encounterTemplates, template]
    });
    setEditingTemplate(template);
  };

  const saveTemplate = (updated: EncounterTemplate) => {
    updateCampaignData({
      encounterTemplates: encounterTemplates.map(t => t.id === updated.id ? updated : t)
    });
    setEditingTemplate(null);
  };

  const deleteTemplate = (id: string) => {
    updateCampaignData({
      encounterTemplates: encounterTemplates.filter(t => t.id !== id)
    });
    if (editingTemplate?.id === id) setEditingTemplate(null);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal encounter-template-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Encounter Templates</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="template-toolbar">
            <input
              type="text"
              className="template-search"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="btn btn-primary btn-small" onClick={addTemplate}>
              + New Template
            </button>
          </div>

          {editingTemplate ? (
            <TemplateEditor
              template={editingTemplate}
              onSave={saveTemplate}
              onCancel={() => setEditingTemplate(null)}
            />
          ) : (
            <div className="template-grid">
              {filteredTemplates.length === 0 ? (
                <div className="empty-state">
                  <p>No templates found. Create one to get started.</p>
                </div>
              ) : (
                filteredTemplates.map(template => (
                  <div key={template.id} className="template-card">
                    <div className="template-card-header">
                      <h4>{template.name}</h4>
                      <div className="template-card-badges">
                        <EncounterTypeBadge type={template.encounterType} size="small" />
                        <DifficultyBadge difficulty={template.difficulty} size="small" />
                      </div>
                    </div>
                    {template.description && (
                      <p className="template-card-description">{template.description}</p>
                    )}
                    {template.creatures.length > 0 && (
                      <div className="template-card-creatures">
                        {template.creatures.map(c => (
                          <span key={c.id} className="template-creature-tag">
                            {c.count}x {c.name}
                          </span>
                        ))}
                      </div>
                    )}
                    {template.tags.length > 0 && (
                      <div className="template-card-tags">
                        {template.tags.map(tag => (
                          <span key={tag} className="template-tag">{tag}</span>
                        ))}
                      </div>
                    )}
                    <div className="template-card-actions">
                      <button className="btn btn-small" onClick={() => setEditingTemplate({ ...template })}>
                        <Icon name="pencil" size={12} /> Edit
                      </button>
                      <button className="btn btn-small btn-danger" onClick={() => deleteTemplate(template.id)}>
                        <Icon name="trash" size={12} /> Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Template editor sub-component
interface TemplateEditorProps {
  template: EncounterTemplate;
  onSave: (template: EncounterTemplate) => void;
  onCancel: () => void;
}

function TemplateEditor({ template, onSave, onCancel }: TemplateEditorProps) {
  const [name, setName] = useState(template.name);
  const [description, setDescription] = useState(template.description);
  const [encounterType, setEncounterType] = useState<EncounterType>(template.encounterType);
  const [difficulty, setDifficulty] = useState(template.difficulty);
  const [creatures, setCreatures] = useState(template.creatures);
  const [rewards, setRewards] = useState(template.rewards);
  const [tags, setTags] = useState(template.tags.join(', '));
  const [terrainAffinity, setTerrainAffinity] = useState(template.terrainAffinity?.join(', ') ?? '');

  const handleSave = () => {
    onSave({
      ...template,
      name,
      description,
      encounterType,
      difficulty,
      creatures,
      rewards,
      tags: tags.split(',').map(t => t.trim()).filter(t => t),
      terrainAffinity: terrainAffinity ? terrainAffinity.split(',').map(t => t.trim()).filter(t => t) : undefined
    });
  };

  return (
    <div className="template-editor">
      <div className="field-group">
        <label>Template Name</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
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
          <label>Difficulty</label>
          <input type="text" value={difficulty} onChange={(e) => setDifficulty(e.target.value)} placeholder="e.g., CR 2, Hard" />
        </div>
      </div>

      <div className="field-group">
        <label>Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
      </div>

      <CreatureList creatures={creatures} onChange={setCreatures} />
      <RewardList rewards={rewards} onChange={setRewards} />

      <div className="field-group">
        <label>Tags (comma-separated)</label>
        <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g., undead, forest, night" />
      </div>

      <div className="field-group">
        <label>Terrain Affinity (comma-separated)</label>
        <input type="text" value={terrainAffinity} onChange={(e) => setTerrainAffinity(e.target.value)} placeholder="e.g., Forest, Swamp" />
      </div>

      <div className="template-editor-actions">
        <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSave}>Save Template</button>
      </div>
    </div>
  );
}

export default EncounterTemplateLibrary;
