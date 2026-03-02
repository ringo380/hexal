// App.tsx - Main application with conditional routing (DM view)
import { useEffect, useState, useCallback, useRef } from 'react';
import { useCampaign } from './stores/CampaignContext';
import CampaignBrowser from './components/CampaignBrowser';
import MainEditor from './components/MainEditor';
import { WeatherSimulationProvider } from './stores/WeatherSimulationContext';
import UnsavedChangesDialog from './components/modals/UnsavedChangesDialog';
import AlertDialog from './components/modals/AlertDialog';
import { filterCampaignForPlayer } from './services/playerViewFilter';
import ErrorBoundary from './components/ErrorBoundary';

type PendingAction = {
  type: 'open' | 'open-new-window' | 'new-campaign';
  filePath?: string;
};

function App() {
  const { campaign, loadCampaign, saveCampaign, saveAs, closeCampaign, hasUnsavedChanges, undo, redo } = useCampaign();
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const exportRef = useRef<(() => void) | null>(null);
  const mapExportRef = useRef<(() => void) | null>(null);

  // Register export handler from MainEditor
  const registerExportHandler = useCallback((handler: () => void) => {
    exportRef.current = handler;
  }, []);

  // Register map export handler from MainEditor
  const registerMapExportHandler = useCallback((handler: () => void) => {
    mapExportRef.current = handler;
  }, []);

  // Handle menu commands
  useEffect(() => {
    const cleanup = window.electronAPI.onMenuCommand(async (command) => {
      switch (command) {
        case 'new-campaign':
          if (hasUnsavedChanges && campaign) {
            setPendingAction({ type: 'new-campaign' });
            setShowUnsavedDialog(true);
          } else {
            // Show campaign browser for new campaign
            closeCampaign();
          }
          break;

        case 'open':
          handleOpen();
          break;

        case 'open-new-window':
          handleOpenNewWindow();
          break;

        case 'save':
          if (campaign) {
            saveCampaign();
          }
          break;

        case 'save-as':
          if (campaign) {
            saveAs();
          }
          break;

        case 'export':
          if (campaign && exportRef.current) {
            exportRef.current();
          }
          break;

        case 'export-map':
          if (campaign && mapExportRef.current) {
            mapExportRef.current();
          }
          break;

        case 'undo':
          undo();
          break;

        case 'redo':
          redo();
          break;

        case 'open-player-view':
          window.electronAPI.openPlayerView();
          break;
      }
    });

    return cleanup;
  }, [campaign, hasUnsavedChanges, saveCampaign, saveAs, closeCampaign, undo, redo]);

  // Handle loading a campaign file on window creation
  useEffect(() => {
    const cleanup = window.electronAPI.onLoadCampaignFile((filePath) => {
      loadCampaign(filePath).catch((error) => {
        console.error('Failed to load campaign:', error);
        setErrorMessage(`Failed to load campaign: ${error.message}`);
      });
    });

    return cleanup;
  }, [loadCampaign]);

  // Sync campaign state to player view windows (debounced to avoid IPC flood)
  const syncTimerRef = useRef<NodeJS.Timeout | null>(null);
  const prevCampaignForSyncRef = useRef<typeof campaign>(null);
  useEffect(() => {
    if (!campaign) return;

    // Immediate sync on first campaign load (null → non-null)
    if (!prevCampaignForSyncRef.current) {
      prevCampaignForSyncRef.current = campaign;
      const playerData = filterCampaignForPlayer(campaign);
      window.electronAPI.syncPlayerView(playerData);
      return;
    }

    prevCampaignForSyncRef.current = campaign;

    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      const playerData = filterCampaignForPlayer(campaign);
      window.electronAPI.syncPlayerView(playerData);
    }, 150);

    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [campaign]);

  // Notify player windows when DM closes campaign
  const prevCampaignRef = useRef(campaign);
  useEffect(() => {
    if (prevCampaignRef.current && !campaign) {
      window.electronAPI.notifyPlayerViewCampaignClosed();
    }
    prevCampaignRef.current = campaign;
  }, [campaign]);

  // Open file dialog and load campaign
  const handleOpen = useCallback(async () => {
    if (hasUnsavedChanges && campaign) {
      // Show dialog before proceeding
      setPendingAction({ type: 'open' });
      setShowUnsavedDialog(true);
      return;
    }

    const filePath = await window.electronAPI.openFileDialog();
    if (filePath) {
      try {
        await loadCampaign(filePath);
      } catch (error: any) {
        setErrorMessage(`Failed to load campaign: ${error.message}`);
      }
    }
  }, [hasUnsavedChanges, campaign, loadCampaign]);

  // Open in new window
  const handleOpenNewWindow = useCallback(async () => {
    const filePath = await window.electronAPI.openFileDialog();
    if (filePath) {
      await window.electronAPI.openInNewWindow(filePath);
    }
  }, []);

  // Handle dialog choices
  const handleDialogSave = useCallback(async () => {
    await saveCampaign();
    setShowUnsavedDialog(false);
    executePendingAction();
  }, [saveCampaign]);

  const handleDialogDontSave = useCallback(() => {
    setShowUnsavedDialog(false);
    executePendingAction();
  }, []);

  const handleDialogOpenNewWindow = useCallback(async () => {
    setShowUnsavedDialog(false);
    if (pendingAction?.type === 'open') {
      // Open in new window instead of current
      await handleOpenNewWindow();
    }
    setPendingAction(null);
  }, [pendingAction, handleOpenNewWindow]);

  const handleDialogCancel = useCallback(() => {
    setShowUnsavedDialog(false);
    setPendingAction(null);
  }, []);

  const executePendingAction = useCallback(async () => {
    if (!pendingAction) return;

    switch (pendingAction.type) {
      case 'open':
        const filePath = await window.electronAPI.openFileDialog();
        if (filePath) {
          try {
            await loadCampaign(filePath);
          } catch (error: any) {
            setErrorMessage(`Failed to load campaign: ${error.message}`);
          }
        }
        break;

      case 'new-campaign':
        closeCampaign();
        break;
    }

    setPendingAction(null);
  }, [pendingAction, loadCampaign, closeCampaign]);

  return (
    <div className="app">
      {campaign ? (
        <ErrorBoundary>
          <WeatherSimulationProvider>
            <MainEditor
              onRegisterExport={registerExportHandler}
              onRegisterMapExport={registerMapExportHandler}
            />
          </WeatherSimulationProvider>
        </ErrorBoundary>
      ) : (
        <CampaignBrowser />
      )}

      {showUnsavedDialog && (
        <UnsavedChangesDialog
          onSave={handleDialogSave}
          onDontSave={handleDialogDontSave}
          onOpenNewWindow={pendingAction?.type === 'open' ? handleDialogOpenNewWindow : undefined}
          onCancel={handleDialogCancel}
        />
      )}

      {errorMessage && (
        <AlertDialog
          title="Error"
          message={errorMessage}
          variant="error"
          onClose={() => setErrorMessage(null)}
        />
      )}
    </div>
  );
}

export default App;
