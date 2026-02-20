// CampaignBrowser - Launch screen showing saved campaigns (local + cloud)
import { useState, useEffect } from 'react';
import { useCampaign } from '../stores/CampaignContext';
import { useAuth } from '../stores/AuthContext';
import { useSettings } from '../stores/SettingsContext';
import { getSupabaseClient } from '../services/supabaseClient';
import { listCloudCampaigns, loadCloudCampaign, saveCloudCampaign } from '../services/cloudStorage';
import type { Campaign } from '../types';
import NewCampaignModal from './modals/NewCampaignModal';
import ConfirmDialog from './modals/ConfirmDialog';
import LoginModal from './auth/LoginModal';
import ProfileMenu from './auth/ProfileMenu';
import Icon from './icons/Icon';

interface CampaignInfo {
  name: string;
  path: string;
  modifiedAt: string;
}

interface CloudCampaignInfo {
  id: string;
  name: string;
  modifiedAt: string;
}

type SyncStatus = 'idle' | 'uploading' | 'downloading';

function CampaignBrowser() {
  const { loadCampaign, listCampaigns: listCampaignsFn, deleteCampaignFile } = useCampaign();
  const { user, isAuthenticated } = useAuth();
  const { settings } = useSettings();
  const [campaigns, setCampaigns] = useState<CampaignInfo[]>([]);
  const [cloudCampaigns, setCloudCampaigns] = useState<CloudCampaignInfo[]>([]);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cloudLoading, setCloudLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ path: string; name: string } | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [syncTarget, setSyncTarget] = useState<string | null>(null);

  useEffect(() => {
    loadLocalCampaigns();
  }, []);

  // Load cloud campaigns when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadCloudCampaignsList();
    } else {
      setCloudCampaigns([]);
    }
  }, [isAuthenticated, user]);

  const loadLocalCampaigns = async () => {
    try {
      setLoading(true);
      const list = await listCampaignsFn();
      setCampaigns(list);
    } catch (err) {
      console.error('Failed to load campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCloudCampaignsList = async () => {
    if (!user) return;
    const client = getSupabaseClient(settings.cloud.supabaseUrl, settings.cloud.supabaseAnonKey);
    if (!client) return;

    try {
      setCloudLoading(true);
      const { campaigns: rows, error: listError } = await listCloudCampaigns(client, user.id);
      if (listError) {
        console.warn('Failed to list cloud campaigns:', listError);
        return;
      }
      setCloudCampaigns(rows.map(r => ({
        id: r.id,
        name: r.name,
        modifiedAt: r.modified_at,
      })));
    } catch (err) {
      console.warn('Failed to load cloud campaigns:', err);
    } finally {
      setCloudLoading(false);
    }
  };

  const handleOpen = async () => {
    try {
      const filePath = await window.electronAPI.openFileDialog();
      if (filePath) {
        await loadCampaign(filePath);
      }
    } catch (err) {
      setError('Failed to open campaign');
      console.error(err);
    }
  };

  const handleLoadCampaign = async (path: string) => {
    try {
      setError(null);
      await loadCampaign(path);
    } catch (err) {
      setError('Failed to load campaign');
      console.error(err);
    }
  };

  const handleDeleteCampaign = (path: string, name: string) => {
    setDeleteConfirm({ path, name });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteCampaignFile(deleteConfirm.path);
      await loadLocalCampaigns();
    } catch (err) {
      setError('Failed to delete campaign');
      console.error(err);
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleUploadToCloud = async (path: string) => {
    if (!user) return;
    const client = getSupabaseClient(settings.cloud.supabaseUrl, settings.cloud.supabaseAnonKey);
    if (!client) return;

    try {
      setSyncStatus('uploading');
      setSyncTarget(path);
      setError(null);

      // Load the local campaign file
      const result = await window.electronAPI.loadCampaign(path);
      if (!result.campaign) {
        setError('Failed to read local campaign');
        return;
      }

      // Upload to cloud
      const { error: uploadError } = await saveCloudCampaign(client, result.campaign as Campaign, user.id);
      if (uploadError) {
        setError(`Upload failed: ${uploadError}`);
        return;
      }

      // Refresh cloud list
      await loadCloudCampaignsList();
    } catch (err) {
      setError('Failed to upload campaign');
      console.error(err);
    } finally {
      setSyncStatus('idle');
      setSyncTarget(null);
    }
  };

  const handleDownloadToLocal = async (campaignId: string) => {
    const client = getSupabaseClient(settings.cloud.supabaseUrl, settings.cloud.supabaseAnonKey);
    if (!client) return;

    try {
      setSyncStatus('downloading');
      setSyncTarget(campaignId);
      setError(null);

      // Load from cloud
      const { campaign, error: loadError } = await loadCloudCampaign(client, campaignId);
      if (loadError || !campaign) {
        setError(`Download failed: ${loadError ?? 'Campaign not found'}`);
        return;
      }

      // Save locally via Electron IPC
      const saveResult = await window.electronAPI.saveCampaign(campaign);
      if (!saveResult.success) {
        setError(`Local save failed: ${saveResult.error ?? 'Unknown error'}`);
        return;
      }

      // Refresh local list
      await loadLocalCampaigns();
    } catch (err) {
      setError('Failed to download campaign');
      console.error(err);
    } finally {
      setSyncStatus('idle');
      setSyncTarget(null);
    }
  };

  const handleLoadCloudCampaign = async (campaignId: string) => {
    // Download and open
    const client = getSupabaseClient(settings.cloud.supabaseUrl, settings.cloud.supabaseAnonKey);
    if (!client) return;

    try {
      setError(null);
      setSyncStatus('downloading');
      setSyncTarget(campaignId);

      const { campaign, error: loadError } = await loadCloudCampaign(client, campaignId);
      if (loadError || !campaign) {
        setError(`Failed to load: ${loadError ?? 'Campaign not found'}`);
        return;
      }

      // Save locally then open it
      const saveResult = await window.electronAPI.saveCampaign(campaign);
      if (saveResult.success && saveResult.path) {
        await loadCampaign(saveResult.path);
      }
    } catch (err) {
      setError('Failed to load cloud campaign');
      console.error(err);
    } finally {
      setSyncStatus('idle');
      setSyncTarget(null);
    }
  };

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Check if a local campaign has already been uploaded to cloud
  const isUploadedToCloud = (_localPath: string, localName: string): boolean => {
    return cloudCampaigns.some(c => c.name === localName);
  };

  return (
    <div className="campaign-browser">
      <div className="browser-header">
        <div className="browser-header-top">
          <div>
            <h1>Hexal</h1>
            <p className="subtitle">D&D Hex Crawl Campaign Manager</p>
          </div>
          <div className="browser-header-auth">
            <ProfileMenu onOpenLogin={() => setShowLogin(true)} />
          </div>
        </div>
      </div>

      <div className="browser-actions">
        <button className="btn btn-primary" onClick={() => setShowNewModal(true)}>
          + New Campaign
        </button>
        <button className="btn btn-secondary" onClick={handleOpen}>
          Open...
        </button>
      </div>

      {error && (
        <div className="error-message">{error}</div>
      )}

      {/* Local Campaigns */}
      <div className="campaign-list-section">
        <h2>
          <Icon name="hexagon" size={16} /> Local Campaigns
        </h2>
        {loading ? (
          <div className="loading">Loading...</div>
        ) : campaigns.length === 0 ? (
          <div className="empty-state">
            No local campaigns yet. Create one to get started!
          </div>
        ) : (
          <ul className="campaign-list">
            {campaigns.map((campaign) => (
              <li key={campaign.path} className="campaign-item">
                <button
                  className="campaign-button"
                  onClick={() => handleLoadCampaign(campaign.path)}
                >
                  <span className="campaign-name">{campaign.name}</span>
                  <span className="campaign-meta">
                    <span className={`campaign-badge campaign-badge--local ${isAuthenticated && isUploadedToCloud(campaign.path, campaign.name) ? 'campaign-badge--synced' : ''}`}>
                      {isAuthenticated && isUploadedToCloud(campaign.path, campaign.name) ? 'Synced' : 'Local Only'}
                    </span>
                    <span className="campaign-date">{formatDate(campaign.modifiedAt)}</span>
                  </span>
                </button>
                <div className="campaign-actions">
                  {isAuthenticated && (
                    <button
                      className="btn btn-small btn-secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUploadToCloud(campaign.path);
                      }}
                      disabled={syncStatus !== 'idle'}
                      title="Upload to cloud"
                    >
                      {syncStatus === 'uploading' && syncTarget === campaign.path
                        ? 'Uploading...'
                        : <><Icon name="export" size={12} /> Upload</>}
                    </button>
                  )}
                  <button
                    className="delete-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCampaign(campaign.path, campaign.name);
                    }}
                    title="Delete campaign"
                  >
                    ×
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Cloud Campaigns — only shown when authenticated */}
      {isAuthenticated && (
        <div className="campaign-list-section">
          <h2>
            <Icon name="sparkle" size={16} /> Cloud Campaigns
          </h2>
          {cloudLoading ? (
            <div className="loading">Loading cloud campaigns...</div>
          ) : cloudCampaigns.length === 0 ? (
            <div className="empty-state">
              No cloud campaigns yet. Upload a local campaign to get started!
            </div>
          ) : (
            <ul className="campaign-list">
              {cloudCampaigns.map((campaign) => (
                <li key={campaign.id} className="campaign-item">
                  <button
                    className="campaign-button"
                    onClick={() => handleLoadCloudCampaign(campaign.id)}
                  >
                    <span className="campaign-name">{campaign.name}</span>
                    <span className="campaign-meta">
                      <span className="campaign-badge campaign-badge--cloud">Cloud</span>
                      <span className="campaign-date">{formatDate(campaign.modifiedAt)}</span>
                    </span>
                  </button>
                  <div className="campaign-actions">
                    <button
                      className="btn btn-small btn-secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadToLocal(campaign.id);
                      }}
                      disabled={syncStatus !== 'idle'}
                      title="Download to local"
                    >
                      {syncStatus === 'downloading' && syncTarget === campaign.id
                        ? 'Downloading...'
                        : <><Icon name="arrow-left" size={12} /> Download</>}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {showNewModal && (
        <NewCampaignModal onClose={() => setShowNewModal(false)} />
      )}

      {showLogin && (
        <LoginModal onClose={() => setShowLogin(false)} />
      )}

      {deleteConfirm && (
        <ConfirmDialog
          title="Delete Campaign"
          message={`Delete campaign "${deleteConfirm.name}"? This cannot be undone.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          variant="danger"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}

export default CampaignBrowser;
