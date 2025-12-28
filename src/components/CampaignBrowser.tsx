// CampaignBrowser - Launch screen showing saved campaigns
import { useState, useEffect } from 'react';
import { useCampaign } from '../stores/CampaignContext';
import NewCampaignModal from './modals/NewCampaignModal';

interface CampaignInfo {
  name: string;
  path: string;
  modifiedAt: string;
}

function CampaignBrowser() {
  const { loadCampaign } = useCampaign();
  const [campaigns, setCampaigns] = useState<CampaignInfo[]>([]);
  const [showNewModal, setShowNewModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const list = await window.electronAPI.listCampaigns();
      setCampaigns(list);
    } catch (err) {
      console.error('Failed to load campaigns:', err);
    } finally {
      setLoading(false);
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

  const handleDeleteCampaign = async (path: string, name: string) => {
    if (!confirm(`Delete campaign "${name}"? This cannot be undone.`)) {
      return;
    }
    try {
      await window.electronAPI.deleteCampaign(path);
      await loadCampaigns();
    } catch (err) {
      setError('Failed to delete campaign');
      console.error(err);
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

  return (
    <div className="campaign-browser">
      <div className="browser-header">
        <h1>Hexal</h1>
        <p className="subtitle">D&D Hex Crawl Campaign Manager</p>
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

      <div className="campaign-list-section">
        <h2>Recent Campaigns</h2>
        {loading ? (
          <div className="loading">Loading...</div>
        ) : campaigns.length === 0 ? (
          <div className="empty-state">
            No campaigns yet. Create one to get started!
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
                  <span className="campaign-date">{formatDate(campaign.modifiedAt)}</span>
                </button>
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
              </li>
            ))}
          </ul>
        )}
      </div>

      {showNewModal && (
        <NewCampaignModal onClose={() => setShowNewModal(false)} />
      )}
    </div>
  );
}

export default CampaignBrowser;
