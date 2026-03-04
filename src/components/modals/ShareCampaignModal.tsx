// ShareCampaignModal — Campaign sharing and invite link management (placeholder)

import { useState } from 'react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import Icon from '../icons/Icon';

interface ShareCampaignModalProps {
  campaignId: string;
  campaignName: string;
  onClose: () => void;
}

type InviteRole = 'dm' | 'player' | 'viewer';

function ShareCampaignModal({ campaignId: _campaignId, campaignName, onClose }: ShareCampaignModalProps) {
  const focusTrapRef = useFocusTrap<HTMLDivElement>({ onEscape: onClose });
  const [inviteRole, setInviteRole] = useState<InviteRole>('player');

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="share-campaign-modal-title">
      <div
        className="modal share-campaign-modal"
        ref={focusTrapRef}
        onClick={(e) => e.stopPropagation()}
        style={{ width: 480 }}
      >
        <div className="modal-header">
          <h3 id="share-campaign-modal-title">
            <Icon name="users" size={18} /> Share "{campaignName}"
          </h3>
          <button className="close-btn" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="modal-body">
          {/* Members Section */}
          <div className="share-section">
            <h4>Members</h4>
            <div className="share-empty">
              Members will be listed here once the campaign is uploaded to the cloud.
            </div>
          </div>

          {/* Invite Link Section */}
          <div className="share-section">
            <h4>Invite Link</h4>
            <div className="invite-row">
              <select
                className="settings-input"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as InviteRole)}
                style={{ width: 120 }}
              >
                <option value="dm">DM</option>
                <option value="player">Player</option>
                <option value="viewer">Viewer</option>
              </select>
              <button
                className="btn btn-primary"
                disabled
                title="Coming soon"
              >
                <Icon name="link" size={14} /> Generate Invite Link
              </button>
            </div>
            <p className="settings-hint" style={{ marginTop: 8 }}>
              Invite links will be available once cloud sync is fully connected. Select a role to
              assign to anyone who joins via the link.
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default ShareCampaignModal;
