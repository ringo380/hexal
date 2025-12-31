// MainEditor - Three-column layout for campaign editing
import { useState, useEffect } from 'react';
import { useCampaign } from '../stores/CampaignContext';
import { useSelection } from '../stores/SelectionContext';
import Sidebar from './Sidebar';
import HexGrid from './HexGrid';
import HexDetail from './HexDetail';
import MarkerPalette from './MarkerPalette';
import TimeWeatherBar from './TimeWeatherBar';
import GeneratorModal from './modals/GeneratorModal';
import ExportModal from './modals/ExportModal';
import MapExportModal from './modals/MapExportModal';
import TimeControlsModal from './modals/TimeControlsModal';
import WeatherSettingsModal from './modals/WeatherSettingsModal';

interface MainEditorProps {
  onRegisterExport?: (handler: () => void) => void;
  onRegisterMapExport?: (handler: () => void) => void;
}

function MainEditor({ onRegisterExport, onRegisterMapExport }: MainEditorProps) {
  const { campaign, saveStatus, saveCampaign, closeCampaign, hasUnsavedChanges, undo, redo, canUndo, canRedo } = useCampaign();
  const { searchQuery, setSearchQuery, clearFilters, filterTerrain, setFilterTerrain, filterStatus, setFilterStatus, filterHasUnresolvedHooks, setFilterHasUnresolvedHooks } = useSelection();
  const [showGenerator, setShowGenerator] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showMapExport, setShowMapExport] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showTimeControls, setShowTimeControls] = useState(false);
  const [showWeatherSettings, setShowWeatherSettings] = useState(false);

  // Register export handler for menu command
  useEffect(() => {
    if (onRegisterExport) {
      onRegisterExport(() => setShowExport(true));
    }
  }, [onRegisterExport]);

  // Register map export handler for menu command
  useEffect(() => {
    if (onRegisterMapExport) {
      onRegisterMapExport(() => setShowMapExport(true));
    }
  }, [onRegisterMapExport]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+S to save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        saveCampaign();
      }
      // Cmd+F to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        const searchInput = document.getElementById('search-input');
        searchInput?.focus();
      }
      // Cmd+Z to undo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      // Cmd+Shift+Z to redo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
      }
      // Cmd+T to open time controls
      if ((e.metaKey || e.ctrlKey) && e.key === 't') {
        e.preventDefault();
        setShowTimeControls(true);
      }
      // Cmd+W to open weather settings (only if not in input field)
      if ((e.metaKey || e.ctrlKey) && e.key === 'w' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setShowWeatherSettings(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveCampaign, undo, redo]);

  const handleClose = () => {
    if (hasUnsavedChanges) {
      if (!confirm('You have unsaved changes. Close anyway?')) {
        return;
      }
    }
    closeCampaign();
  };

  const getSaveStatusText = () => {
    switch (saveStatus) {
      case 'saved': return '✓ Saved';
      case 'saving': return 'Saving...';
      case 'unsaved': return '● Unsaved';
    }
  };

  const getSaveStatusClass = () => {
    switch (saveStatus) {
      case 'saved': return 'status-saved';
      case 'saving': return 'status-saving';
      case 'unsaved': return 'status-unsaved';
    }
  };

  if (!campaign) return null;

  return (
    <div className="main-editor">
      {/* Toolbar */}
      <div className="toolbar">
        <div className="toolbar-left">
          <button className="btn btn-icon" onClick={handleClose} title="Close campaign">
            ←
          </button>
          <h1 className="campaign-title">{campaign.name}</h1>
          <span className={`save-status ${getSaveStatusClass()}`}>
            {getSaveStatusText()}
          </span>
          <div className="undo-redo-buttons">
            <button
              className="btn btn-icon"
              onClick={undo}
              disabled={!canUndo}
              title="Undo (⌘Z)"
            >
              ↩
            </button>
            <button
              className="btn btn-icon"
              onClick={redo}
              disabled={!canRedo}
              title="Redo (⌘⇧Z)"
            >
              ↪
            </button>
          </div>
        </div>

        <div className="toolbar-center">
          <input
            id="search-input"
            type="text"
            className="search-input"
            placeholder="Search... (⌘F)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <div className="filter-dropdown">
            <button
              className="btn btn-icon"
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              title="Filters"
            >
              ≡
            </button>
            {showFilterMenu && (
              <div className="filter-menu">
                <div className="filter-group">
                  <label>Terrain</label>
                  <select
                    value={filterTerrain ?? ''}
                    onChange={(e) => setFilterTerrain(e.target.value || null)}
                  >
                    <option value="">All Terrains</option>
                    {campaign.terrainTypes.map((t) => (
                      <option key={t.name} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div className="filter-group">
                  <label>Status</label>
                  <select
                    value={filterStatus ?? ''}
                    onChange={(e) => setFilterStatus((e.target.value || null) as any)}
                  >
                    <option value="">All Statuses</option>
                    <option value="undiscovered">Undiscovered</option>
                    <option value="discovered">Discovered</option>
                    <option value="cleared">Cleared</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={filterHasUnresolvedHooks}
                      onChange={(e) => setFilterHasUnresolvedHooks(e.target.checked)}
                    />
                    Has Unresolved Content
                  </label>
                </div>
                <button className="btn btn-small" onClick={clearFilters}>
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="toolbar-right">
          <button className="btn btn-secondary" onClick={() => setShowGenerator(true)}>
            🎲 Generate
          </button>
          <button className="btn btn-secondary" onClick={() => setShowMapExport(true)}>
            🗺 Export Map
          </button>
          <button className="btn btn-secondary" onClick={() => setShowExport(true)}>
            ↗ Export Data
          </button>
        </div>
      </div>

      {/* Time & Weather Bar */}
      <TimeWeatherBar
        onOpenTimeControls={() => setShowTimeControls(true)}
        onOpenWeatherSettings={() => setShowWeatherSettings(true)}
      />

      {/* Three-column layout */}
      <div className="editor-content">
        <div className="sidebar-panel">
          <MarkerPalette />
          <Sidebar />
        </div>
        <div className="grid-panel">
          <HexGrid />
        </div>
        <div className="detail-panel">
          <HexDetail />
        </div>
      </div>

      {/* Modals */}
      {showGenerator && (
        <GeneratorModal onClose={() => setShowGenerator(false)} />
      )}
      {showExport && (
        <ExportModal onClose={() => setShowExport(false)} />
      )}
      {showMapExport && (
        <MapExportModal onClose={() => setShowMapExport(false)} />
      )}
      {showTimeControls && (
        <TimeControlsModal onClose={() => setShowTimeControls(false)} />
      )}
      {showWeatherSettings && (
        <WeatherSettingsModal onClose={() => setShowWeatherSettings(false)} />
      )}
    </div>
  );
}

export default MainEditor;
