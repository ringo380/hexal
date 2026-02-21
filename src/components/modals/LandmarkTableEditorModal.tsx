// LandmarkTableEditorModal - CRUD for landmark generation tables
// Follows the same pattern as EncounterTableEditorModal
import { useState } from 'react';
import { useCampaign } from '../../stores/CampaignContext';
import type { LandmarkTable, LandmarkEntry } from '../../types/Campaign';
import Icon from '../icons/Icon';
import { onActivate } from '../../utils/keyboard';

interface LandmarkTableEditorModalProps {
  onClose: () => void;
}

function LandmarkTableEditorModal({ onClose }: LandmarkTableEditorModalProps) {
  const { campaign, updateCampaignData } = useCampaign();
  const tables = campaign?.landmarkTables ?? [];
  const [selectedTableId, setSelectedTableId] = useState<string | null>(tables[0]?.id ?? null);
  const [editingTable, setEditingTable] = useState<LandmarkTable | null>(null);

  const selectedTable = tables.find(t => t.id === selectedTableId) ?? null;

  const addTable = () => {
    const newTable: LandmarkTable = {
      id: crypto.randomUUID(),
      name: 'New Table',
      terrain: '',
      entries: []
    };
    updateCampaignData({ landmarkTables: [...tables, newTable] });
    setSelectedTableId(newTable.id);
    setEditingTable(newTable);
  };

  const deleteTable = (id: string) => {
    updateCampaignData({ landmarkTables: tables.filter(t => t.id !== id) });
    if (selectedTableId === id) {
      setSelectedTableId(tables.find(t => t.id !== id)?.id ?? null);
    }
    setEditingTable(null);
  };

  const saveTable = (updated: LandmarkTable) => {
    updateCampaignData({
      landmarkTables: tables.map(t => t.id === updated.id ? updated : t)
    });
    setEditingTable(null);
  };

  const addEntry = () => {
    if (!selectedTable) return;
    const newEntry: LandmarkEntry = {
      id: crypto.randomUUID(),
      title: 'New Landmark',
      description: '',
      rarity: 'common',
      weight: 1
    };
    const updated = { ...selectedTable, entries: [...selectedTable.entries, newEntry] };
    updateCampaignData({
      landmarkTables: tables.map(t => t.id === updated.id ? updated : t)
    });
  };

  const updateEntry = (entryId: string, updates: Partial<LandmarkEntry>) => {
    if (!selectedTable) return;
    const updated = {
      ...selectedTable,
      entries: selectedTable.entries.map(e => e.id === entryId ? { ...e, ...updates } : e)
    };
    updateCampaignData({
      landmarkTables: tables.map(t => t.id === updated.id ? updated : t)
    });
  };

  const deleteEntry = (entryId: string) => {
    if (!selectedTable) return;
    const updated = {
      ...selectedTable,
      entries: selectedTable.entries.filter(e => e.id !== entryId)
    };
    updateCampaignData({
      landmarkTables: tables.map(t => t.id === updated.id ? updated : t)
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal encounter-table-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Landmark Tables</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body encounter-table-layout">
          {/* Left panel - table list */}
          <div className="encounter-table-list" role="listbox" aria-label="Landmark tables">
            {tables.map(table => (
              <div
                key={table.id}
                role="option"
                tabIndex={0}
                aria-selected={table.id === selectedTableId}
                className={`encounter-table-item ${table.id === selectedTableId ? 'selected' : ''}`}
                onClick={() => { setSelectedTableId(table.id); setEditingTable(null); }}
                onKeyDown={onActivate(() => { setSelectedTableId(table.id); setEditingTable(null); })}
              >
                <span className="encounter-table-name">{table.name}</span>
                <span className="encounter-table-terrain">{table.terrain || 'Any'}</span>
                <button
                  className="btn-icon-small danger"
                  onClick={(e) => { e.stopPropagation(); deleteTable(table.id); }}
                  title="Delete table"
                >
                  <Icon name="trash" size={12} />
                </button>
              </div>
            ))}
            <button className="add-item-btn" onClick={addTable}>+ Add Table</button>
          </div>

          {/* Right panel - entries */}
          <div className="encounter-table-entries">
            {selectedTable ? (
              <>
                {editingTable ? (
                  <div className="encounter-table-edit-header">
                    <div className="field-group">
                      <label>Table Name</label>
                      <input
                        type="text"
                        value={editingTable.name}
                        onChange={(e) => setEditingTable({ ...editingTable, name: e.target.value })}
                      />
                    </div>
                    <div className="field-group">
                      <label>Terrain</label>
                      <select
                        value={editingTable.terrain}
                        onChange={(e) => setEditingTable({ ...editingTable, terrain: e.target.value })}
                      >
                        <option value="">Any Terrain</option>
                        {campaign?.terrainTypes.map(t => (
                          <option key={t.name} value={t.name}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="encounter-table-edit-actions">
                      <button className="btn btn-small btn-primary" onClick={() => saveTable(editingTable)}>Save</button>
                      <button className="btn btn-small" onClick={() => setEditingTable(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="encounter-table-header">
                    <div>
                      <h4>{selectedTable.name}</h4>
                      <span className="encounter-table-terrain-label">
                        Terrain: {selectedTable.terrain || 'Any'}
                      </span>
                    </div>
                    <button className="btn btn-small" onClick={() => setEditingTable({ ...selectedTable })}>
                      <Icon name="pencil" size={12} /> Edit
                    </button>
                  </div>
                )}

                <div className="encounter-entries-list">
                  {selectedTable.entries.map(entry => (
                    <div key={entry.id} className="encounter-entry-row">
                      <input
                        type="text"
                        className="entry-title"
                        value={entry.title}
                        onChange={(e) => updateEntry(entry.id, { title: e.target.value })}
                        placeholder="Title"
                      />
                      <input
                        type="text"
                        className="entry-difficulty"
                        value={entry.rarity}
                        onChange={(e) => updateEntry(entry.id, { rarity: e.target.value })}
                        placeholder="Rarity"
                      />
                      <input
                        type="number"
                        className="entry-weight"
                        value={entry.weight}
                        onChange={(e) => updateEntry(entry.id, { weight: Math.max(1, parseInt(e.target.value) || 1) })}
                        min={1}
                        title="Weight"
                      />
                      <button
                        className="btn-icon-small danger"
                        onClick={() => deleteEntry(entry.id)}
                        title="Delete entry"
                      >
                        <Icon name="close" size={14} />
                      </button>
                    </div>
                  ))}
                  <button className="add-item-btn" onClick={addEntry}>+ Add Entry</button>
                </div>
              </>
            ) : (
              <div className="empty-state">
                <p>Select or create a table</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LandmarkTableEditorModal;
