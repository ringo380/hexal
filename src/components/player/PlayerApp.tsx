// PlayerApp - Root component for the player view window
// Manages IPC state, shows waiting/closed screens, renders PlayerView when data is available

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { PlayerCampaign } from '../../services/playerViewFilter';
import type { ActiveEncounter } from '../../types/Campaign';
import type { PlayerCombatState } from '../../types/Combat';
import type { PlayerNote } from '../../types';
import PlayerView from './PlayerView';
import { createElectronDiceTransport } from '../../services/diceTransport';
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
  const [activeEncounter, setActiveEncounter] = useState<ActiveEncounter | null>(null);
  const [combatState, setCombatState] = useState<PlayerCombatState | null>(null);
  const diceTransport = useMemo(() => createElectronDiceTransport(), []);

  useEffect(() => {
    const cleanupUpdate = window.electronAPI.onPlayerViewUpdate((data) => {
      setPlayerCampaign(data as PlayerCampaign);
      setState('active');
    });

    const cleanupClosed = window.electronAPI.onPlayerViewCampaignClosed(() => {
      setState('closed');
      setMessages([]);
      setActiveEncounter(null);
      setCombatState(null);
    });

    const cleanupMessage = window.electronAPI.onPlayerMessage((data) => {
      const msg = data as DmMessage;
      setMessages(prev => [...prev, msg]);
    });

    const cleanupEncounterReveal = window.electronAPI.onEncounterReveal((data) => {
      setActiveEncounter(data as ActiveEncounter);
    });

    const cleanupEncounterDismiss = window.electronAPI.onEncounterDismiss(() => {
      setActiveEncounter(null);
    });

    const cleanupCombatUpdate = window.electronAPI.onCombatUpdate((data) => {
      setCombatState(data as PlayerCombatState);
    });

    const cleanupCombatEnd = window.electronAPI.onCombatEnd(() => {
      setCombatState(null);
    });

    // Listen for notes from other players (relayed by main process)
    const cleanupNotes = window.electronAPI.onPlayerNoteReceived((data) => {
      const note = data as PlayerNote;
      setPlayerCampaign(prev => {
        if (!prev) return prev;
        const existing = prev.playerNotes ?? [];
        const idx = existing.findIndex(n => n.id === note.id);
        const updated = idx >= 0
          ? existing.map((n, i) => i === idx ? note : n)
          : [...existing, note];
        return { ...prev, playerNotes: updated };
      });
    });

    return () => {
      cleanupUpdate();
      cleanupClosed();
      cleanupMessage();
      cleanupEncounterReveal();
      cleanupEncounterDismiss();
      cleanupCombatUpdate();
      cleanupCombatEnd();
      cleanupNotes();
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

  const handleSaveNote = useCallback((note: PlayerNote) => {
    window.electronAPI.sendPlayerNote(note);
    // Also update local state immediately
    setPlayerCampaign(prev => {
      if (!prev) return prev;
      const existing = prev.playerNotes ?? [];
      const idx = existing.findIndex(n => n.id === note.id);
      const updated = idx >= 0
        ? existing.map((n, i) => i === idx ? note : n)
        : [...existing, note];
      return { ...prev, playerNotes: updated };
    });
  }, []);

  return (
    <PlayerView
      campaign={playerCampaign}
      messages={messages}
      activeEncounter={activeEncounter}
      onEncounterDismiss={() => setActiveEncounter(null)}
      onSaveNote={handleSaveNote}
      combatState={combatState}
      diceTransport={diceTransport}
    />
  );
}

export default PlayerApp;
