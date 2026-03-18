// PlayerApp - Root component for the player view window
// Manages IPC state, shows waiting/closed screens, renders PlayerView when data is available

import { useState, useEffect } from 'react';
import type { PlayerCampaign } from '../../services/playerViewFilter';
import PlayerView from './PlayerView';
import '../../styles/player.css';

type PlayerState = 'waiting' | 'active' | 'closed';

interface DmMessage {
  id: string;
  text: string;
  timestamp: number;
  imageDataUrl?: string;
}

function PlayerApp() {
  const [playerCampaign, setPlayerCampaign] = useState<PlayerCampaign | null>(null);
  const [state, setState] = useState<PlayerState>('waiting');
  const [messages, setMessages] = useState<DmMessage[]>([]);

  useEffect(() => {
    const cleanupUpdate = window.electronAPI.onPlayerViewUpdate((data) => {
      setPlayerCampaign(data as PlayerCampaign);
      setState('active');
    });

    const cleanupClosed = window.electronAPI.onPlayerViewCampaignClosed(() => {
      setState('closed');
      setMessages([]);
    });

    const cleanupMessage = window.electronAPI.onPlayerMessage((data) => {
      const msg = data as DmMessage;
      setMessages(prev => [...prev, msg]);
    });

    return () => {
      cleanupUpdate();
      cleanupClosed();
      cleanupMessage();
    };
  }, []);

  if (state === 'waiting' || !playerCampaign) {
    return (
      <div className="player-status-screen">
        <div className="player-status-content">
          <div className="player-status-icon">&#x1F3B2;</div>
          <h1>Waiting for DM...</h1>
          <p>The player view will appear when the DM opens a campaign.</p>
        </div>
      </div>
    );
  }

  if (state === 'closed') {
    return (
      <div className="player-status-screen">
        <div className="player-status-content">
          <div className="player-status-icon">&#x1F4D6;</div>
          <h1>Campaign Closed</h1>
          <p>The DM has closed the campaign. Waiting for a new session...</p>
        </div>
      </div>
    );
  }

  return <PlayerView campaign={playerCampaign} messages={messages} />;
}

export default PlayerApp;
