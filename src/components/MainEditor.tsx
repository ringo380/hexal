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
import ConfirmDialog from './modals/ConfirmDialog';
import KeyboardShortcutsModal from './modals/KeyboardShortcutsModal';
import EncounterTableEditorModal from './modals/EncounterTableEditorModal';
import LandmarkTableEditorModal from './modals/LandmarkTableEditorModal';
import EncounterTemplateLibrary from './modals/EncounterTemplateLibrary';
import RegionManagerModal from './modals/RegionManagerModal';
import TerrainEditorModal from './modals/TerrainEditorModal';
import NpcDirectoryModal from './modals/NpcDirectoryModal';
import RelationshipWebModal from './modals/RelationshipWebModal';
import SessionLogModal from './modals/SessionLogModal';
import QuestManagerModal from './modals/QuestManagerModal';
import SettingsModal from './modals/SettingsModal';
import LoginModal from './auth/LoginModal';
import ProfileMenu from './auth/ProfileMenu';
import ConnectionStatus from './ui/ConnectionStatus';
import CreateRegionFromSelectionModal from './modals/CreateRegionFromSelectionModal';
import CommandPalette from './CommandPalette';
import Icon from './icons/Icon';
import { CATEGORY_INFO, type ContentCategory, parseHexKey } from '../types/Campaign';

interface MainEditorProps {
  onRegisterExport?: (handler: () => void) => void;
  onRegisterMapExport?: (handler: () => void) => void;
}

function MainEditor({ onRegisterExport, onRegisterMapExport }: MainEditorProps) {
  const { campaign, saveStatus, saveCampaign, closeCampaign, hasUnsavedChanges, undo, redo, canUndo, canRedo, regions } = useCampaign();
  const {
    searchQuery, setSearchQuery, clearFilters,
    filterTerrain, setFilterTerrain, filterStatus, setFilterStatus,
    filterHasUnresolvedHooks, setFilterHasUnresolvedHooks,
    filterContentTypes, toggleContentTypeFilter,
    filterBookmarked, setFilterBookmarked,
    filterRegion, setFilterRegion,
    activeFilterCount,
    isCommandPaletteOpen, openCommandPalette, closeCommandPalette,
    selectHex,
    multiSelectedKeys, clearMultiSelection
  } = useSelection();
  const [showGenerator, setShowGenerator] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showMapExport, setShowMapExport] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showTimeControls, setShowTimeControls] = useState(false);
  const [showWeatherSettings, setShowWeatherSettings] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [showEncounterTableEditor, setShowEncounterTableEditor] = useState(false);
  const [showLandmarkTableEditor, setShowLandmarkTableEditor] = useState(false);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [showRegionManager, setShowRegionManager] = useState(false);
  const [showNpcDirectory, setShowNpcDirectory] = useState(false);
  const [showRelationshipWeb, setShowRelationshipWeb] = useState(false);
  const [showSessionLog, setShowSessionLog] = useState(false);
  const [showTerrainEditor, setShowTerrainEditor] = useState(false);
  const [showQuestManager, setShowQuestManager] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showCreateRegion, setShowCreateRegion] = useState(false);

  // Clear multi-selection when campaign changes (prevents stale keys across campaigns)
  useEffect(() => {
    clearMultiSelection();
  }, [campaign?.id]); // eslint-disable-line react-hooks/exhaustive-deps

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
      // Cmd+K to open command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openCommandPalette();
      }
      // Cmd+R to open region manager
      if ((e.metaKey || e.ctrlKey) && e.key === 'r' && !e.shiftKey) {
        e.preventDefault();
        setShowRegionManager(true);
      }
      // Cmd+L to open session log
      if ((e.metaKey || e.ctrlKey) && e.key === 'l') {
        e.preventDefault();
        setShowSessionLog(true);
      }
      // Cmd+J to open quest manager
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault();
        setShowQuestManager(true);
      }
      // Cmd+? (Cmd+Shift+/) to show keyboard shortcuts
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === '/') {
        e.preventDefault();
        setShowKeyboardShortcuts(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveCampaign, undo, redo, openCommandPalette]);

  const handleClose = () => {
    if (hasUnsavedChanges) {
      setShowCloseConfirm(true);
      return;
    }
    closeCampaign();
  };

  const confirmClose = () => {
    setShowCloseConfirm(false);
    closeCampaign();
  };

  const getSaveStatusContent = () => {
    switch (saveStatus) {
      case 'saved': return <><Icon name="check" size={12} /> Saved</>;
      case 'saving': return 'Saving...';
      case 'unsaved': return <><Icon name="circle-filled" size={10} /> Unsaved</>;
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
          <button className="btn btn-icon" onClick={handleClose} title="Close campaign" aria-label="Close campaign">
            <Icon name="arrow-left" size={18} />
          </button>
          <h1 className="campaign-title">{campaign.name}</h1>
          <span className={`save-status ${getSaveStatusClass()}`} aria-live="polite">
            {getSaveStatusContent()}
          </span>
          <div className="undo-redo-buttons">
            <button
              className="btn btn-icon"
              onClick={undo}
              disabled={!canUndo}
              title="Undo (⌘Z)"
              aria-label="Undo"
            >
              <Icon name="undo" size={16} />
            </button>
            <button
              className="btn btn-icon"
              onClick={redo}
              disabled={!canRedo}
              title="Redo (⌘⇧Z)"
              aria-label="Redo"
            >
              <Icon name="redo" size={16} />
            </button>
          </div>
          {multiSelectedKeys.size > 0 && (
            <button
              className="btn btn-primary btn-small"
              onClick={() => setShowCreateRegion(true)}
              title="Create region from selected hexes"
            >
              <Icon name="map" size={14} /> Create Region ({multiSelectedKeys.size})
            </button>
          )}
        </div>

        <div className="toolbar-center">
          <input
            id="search-input"
            type="text"
            className="search-input"
            placeholder="Search... (⌘F)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search hexes"
          />

          <div className="filter-dropdown">
            <button
              className="btn btn-icon"
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              title="Filters"
              aria-label="Toggle filters"
              aria-expanded={showFilterMenu}
            >
              <Icon name="filter" size={16} />
              {activeFilterCount > 0 && (
                <span className="filter-badge">{activeFilterCount}</span>
              )}
            </button>
            {showFilterMenu && (
              <div className="filter-menu">
                <div className="filter-group">
                  <label>Terrain</label>
                  <select
                    value={filterTerrain ?? ''}
                    onChange={(e) => setFilterTerrain(e.target.value || null)}
                    aria-label="Filter by terrain"
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
                    aria-label="Filter by status"
                  >
                    <option value="">All Statuses</option>
                    <option value="undiscovered">Undiscovered</option>
                    <option value="discovered">Discovered</option>
                    <option value="cleared">Cleared</option>
                  </select>
                </div>
                {regions.length > 0 && (
                  <div className="filter-group">
                    <label>Region</label>
                    <select
                      value={filterRegion ?? ''}
                      onChange={(e) => setFilterRegion(e.target.value || null)}
                      aria-label="Filter by region"
                    >
                      <option value="">All Regions</option>
                      {regions.map((r) => (
                        <option key={r.id} value={r.id}>{r.name || 'Unnamed'}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="filter-group">
                  <label>Content</label>
                  <div className="filter-checkboxes">
                    {(Object.keys(CATEGORY_INFO) as ContentCategory[]).map((cat) => (
                      <label key={cat} className="filter-checkbox">
                        <input
                          type="checkbox"
                          checked={filterContentTypes.has(cat)}
                          onChange={() => toggleContentTypeFilter(cat)}
                        />
                        <Icon name={CATEGORY_INFO[cat].icon} size={14} />
                        {CATEGORY_INFO[cat].label}
                      </label>
                    ))}
                  </div>
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
                <div className="filter-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={filterBookmarked}
                      onChange={(e) => setFilterBookmarked(e.target.checked)}
                    />
                    <Icon name="star" size={14} />
                    Bookmarked Only
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
          <button className="btn btn-secondary" onClick={() => setShowEncounterTableEditor(true)}>
            <Icon name="sword" size={16} /> Encounters
          </button>
          <button className="btn btn-secondary" onClick={() => setShowLandmarkTableEditor(true)}>
            <Icon name="pin" size={16} /> Landmarks
          </button>
          <button className="btn btn-secondary" onClick={() => setShowTemplateLibrary(true)}>
            <Icon name="sparkle" size={16} /> Templates
          </button>
          <button className="btn btn-secondary" onClick={() => setShowNpcDirectory(true)}>
            <Icon name="users" size={16} /> NPCs
          </button>
          <button className="btn btn-secondary" onClick={() => setShowRegionManager(true)}>
            <Icon name="map" size={16} /> Regions
          </button>
          <button className="btn btn-secondary" onClick={() => setShowTerrainEditor(true)}>
            <Icon name="hexagon" size={16} /> Terrain
          </button>
          <button className="btn btn-secondary" onClick={() => setShowSessionLog(true)}>
            <Icon name="calendar" size={16} /> Sessions
          </button>
          <button className="btn btn-secondary" onClick={() => setShowQuestManager(true)}>
            <Icon name="star" size={16} /> Quests
          </button>
          <button className="btn btn-secondary" onClick={() => setShowGenerator(true)}>
            <Icon name="dice" size={16} /> Generate
          </button>
          <button className="btn btn-secondary" onClick={() => setShowMapExport(true)}>
            <Icon name="map" size={16} /> Export Map
          </button>
          <button className="btn btn-secondary" onClick={() => setShowExport(true)}>
            <Icon name="export" size={16} /> Export Data
          </button>
          <ConnectionStatus />
          <ProfileMenu onOpenLogin={() => setShowLogin(true)} />
          <button className="btn btn-icon" onClick={() => setShowSettings(true)} title="Settings" aria-label="Settings">
            <Icon name="settings" size={18} />
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
          <HexGrid onCreateRegionFromSelection={() => setShowCreateRegion(true)} />
        </div>
        <div className="detail-panel">
          <HexDetail onOpenQuestManager={() => setShowQuestManager(true)} />
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
      {showCloseConfirm && (
        <ConfirmDialog
          title="Unsaved Changes"
          message="You have unsaved changes. Close anyway?"
          confirmLabel="Close"
          cancelLabel="Cancel"
          variant="danger"
          onConfirm={confirmClose}
          onCancel={() => setShowCloseConfirm(false)}
        />
      )}
      {showKeyboardShortcuts && (
        <KeyboardShortcutsModal onClose={() => setShowKeyboardShortcuts(false)} />
      )}
      {showEncounterTableEditor && (
        <EncounterTableEditorModal onClose={() => setShowEncounterTableEditor(false)} />
      )}
      {showLandmarkTableEditor && (
        <LandmarkTableEditorModal onClose={() => setShowLandmarkTableEditor(false)} />
      )}
      {showTemplateLibrary && (
        <EncounterTemplateLibrary onClose={() => setShowTemplateLibrary(false)} />
      )}
      {showRegionManager && (
        <RegionManagerModal onClose={() => setShowRegionManager(false)} />
      )}
      {showTerrainEditor && (
        <TerrainEditorModal onClose={() => setShowTerrainEditor(false)} />
      )}
      {showNpcDirectory && (
        <NpcDirectoryModal
          onClose={() => setShowNpcDirectory(false)}
          onOpenRelationshipWeb={() => {
            setShowNpcDirectory(false);
            setShowRelationshipWeb(true);
          }}
        />
      )}
      {showRelationshipWeb && (
        <RelationshipWebModal onClose={() => setShowRelationshipWeb(false)} />
      )}
      {showSessionLog && (
        <SessionLogModal
          onClose={() => setShowSessionLog(false)}
          onNavigateToHex={(hexKey) => {
            const coord = parseHexKey(hexKey);
            if (coord) {
              selectHex(coord);
              setShowSessionLog(false);
            }
          }}
        />
      )}
      {showQuestManager && (
        <QuestManagerModal onClose={() => setShowQuestManager(false)} />
      )}
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
      {showLogin && (
        <LoginModal onClose={() => setShowLogin(false)} />
      )}
      {showCreateRegion && multiSelectedKeys.size > 0 && (
        <CreateRegionFromSelectionModal
          hexKeys={Array.from(multiSelectedKeys)}
          onClose={() => setShowCreateRegion(false)}
          onCreated={() => {
            setShowCreateRegion(false);
            clearMultiSelection();
          }}
        />
      )}
      {isCommandPaletteOpen && (
        <CommandPalette onClose={closeCommandPalette} />
      )}
    </div>
  );
}

export default MainEditor;
