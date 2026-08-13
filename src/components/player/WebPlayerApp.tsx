// WebPlayerApp — Root component for the browser-based player view.
// Connects via WebSocket, handles PIN auth, reconnection, and renders PlayerView.

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { PlayerCampaign } from '../../services/playerViewFilter';
import type { ActiveEncounter } from '../../types/Campaign';
import type { PlayerCombatState } from '../../types/Combat';
import type { PlayerNote, DiceRoll, DiceTransport } from '../../types';
import PlayerView from './PlayerView';

type ConnectionState =
  | 'connecting'
  | 'authenticating'
  | 'waiting'
  | 'active'
  | 'closed'
  | 'error';

const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 15000];

function getWsUrl(): string {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.host}`;
}

interface DmMessage {
  id: string;
  text: string;
  timestamp: number;
  imageDataUrl?: string;
}

function WebPlayerApp() {
  const [state, setState] = useState<ConnectionState>('connecting');
  const [campaign, setCampaign] = useState<PlayerCampaign | null>(null);
  const [activeEncounter, setActiveEncounter] = useState<ActiveEncounter | null>(null);
  const [combatState, setCombatState] = useState<PlayerCombatState | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [messages, setMessages] = useState<DmMessage[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptRef = useRef(0);
  const pinRef = useRef(''); // Stores the last successful PIN for auto-reconnect

  // Dice roll channel — bridges the DiceProvider mounted inside PlayerView to
  // this component's single WebSocket onmessage switch, rather than a second
  // onmessage listener. diceHandlersRef holds DiceContext's subscribe()
  // callbacks; it (and the pending buffers below) live outside the
  // per-connection `ws` instance so they survive reconnects untouched.
  //
  // A dice-roll/dice-history message can race DiceProvider's mount (it only
  // mounts once PlayerView renders, after the 'state' message is handled) -
  // buffer anything that arrives before subscribe() is called and replay it
  // then, so a late-joining client never silently drops its history reply.
  const diceHandlersRef = useRef<{ onRoll(r: DiceRoll): void; onHistory(rolls: DiceRoll[]): void } | null>(null);
  const pendingDiceHistoryRef = useRef<DiceRoll[] | null>(null);
  const pendingDiceRollsRef = useRef<DiceRoll[]>([]);

  const diceTransport = useMemo<DiceTransport>(() => ({
    send(roll: DiceRoll): void {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'dice-roll', data: roll }));
      }
    },
    subscribe(handlers): () => void {
      diceHandlersRef.current = handlers;
      if (pendingDiceHistoryRef.current) {
        handlers.onHistory(pendingDiceHistoryRef.current);
        pendingDiceHistoryRef.current = null;
      }
      if (pendingDiceRollsRef.current.length > 0) {
        pendingDiceRollsRef.current.forEach((r) => handlers.onRoll(r));
        pendingDiceRollsRef.current = [];
      }
      return () => {
        diceHandlersRef.current = null;
      };
    },
  }), []);

  const cleanup = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const connect = useCallback((autoPin?: string) => {
    cleanup();
    setState('connecting');

    const ws = new WebSocket(getWsUrl());
    wsRef.current = ws;

    ws.onopen = () => {
      if (autoPin) {
        // Auto-reconnect with stored PIN
        ws.send(JSON.stringify({ type: 'auth', pin: autoPin }));
        setState('authenticating');
      } else {
        setState('authenticating');
      }
    };

    ws.onmessage = (event) => {
      let msg: { type: string; data?: unknown; reason?: string };
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }

      switch (msg.type) {
        case 'auth-ok':
          setState('waiting');
          reconnectAttemptRef.current = 0;
          setPinError('');
          // Clear session overlays that may have ended while disconnected;
          // the server replays encounter/combat state after auth if still active
          setActiveEncounter(null);
          setCombatState(null);
          break;

        case 'auth-fail':
          setPinError(msg.reason || 'Authentication failed');
          pinRef.current = '';
          setState('authenticating');
          break;

        case 'state':
          setCampaign(msg.data as PlayerCampaign);
          setState('active');
          break;

        case 'campaign-closed':
          setState('closed');
          setMessages([]);
          setActiveEncounter(null);
          setCombatState(null);
          pendingDiceHistoryRef.current = null;
          pendingDiceRollsRef.current = [];
          break;

        case 'dm-message':
          setMessages(prev => [...prev, msg.data as DmMessage]);
          break;

        case 'message-history':
          setMessages(msg.data as DmMessage[]);
          break;

        case 'encounter-reveal':
          setActiveEncounter(msg.data as ActiveEncounter);
          break;

        case 'encounter-dismiss':
          setActiveEncounter(null);
          break;

        case 'combat-update':
          setCombatState(msg.data as PlayerCombatState);
          break;

        case 'combat-end':
          setCombatState(null);
          break;

        case 'player-note': {
          const note = msg.data as PlayerNote;
          setCampaign(prev => {
            if (!prev) return prev;
            const existing = prev.playerNotes ?? [];
            const idx = existing.findIndex(n => n.id === note.id);
            const updated = idx >= 0
              ? existing.map((n, i) => i === idx ? note : n)
              : [...existing, note];
            return { ...prev, playerNotes: updated };
          });
          break;
        }

        case 'dice-roll':
          if (diceHandlersRef.current) {
            diceHandlersRef.current.onRoll(msg.data as DiceRoll);
          } else {
            pendingDiceRollsRef.current.push(msg.data as DiceRoll);
          }
          break;

        case 'dice-history':
          if (diceHandlersRef.current) {
            diceHandlersRef.current.onHistory(msg.data as DiceRoll[]);
          } else {
            pendingDiceHistoryRef.current = msg.data as DiceRoll[];
          }
          break;

        case 'ping':
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'pong' }));
          }
          break;
      }
    };

    ws.onclose = () => {
      if (wsRef.current === ws) {
        // Unexpected close — schedule reconnection with exponential backoff
        const attempt = reconnectAttemptRef.current;
        const delay = RECONNECT_DELAYS[Math.min(attempt, RECONNECT_DELAYS.length - 1)];
        setState('error');
        reconnectTimerRef.current = setTimeout(() => {
          reconnectAttemptRef.current = attempt + 1;
          connect(pinRef.current || undefined);
        }, delay);
      }
    };

    ws.onerror = () => {
      // onclose will fire after this
    };
  }, [cleanup]);

  // Initial connection
  useEffect(() => {
    connect();
    return cleanup;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pin = pinInput.trim();
    if (!pin || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    pinRef.current = pin;
    wsRef.current.send(JSON.stringify({ type: 'auth', pin }));
    setPinError('');
  };

  const handleRetry = () => {
    reconnectAttemptRef.current = 0;
    connect(pinRef.current || undefined);
  };

  // --- PIN Entry Screen ---
  if (state === 'authenticating') {
    return (
      <div className="web-player-auth">
        <div className="web-player-auth-card">
          <h1>Hexal Player View</h1>
          <p>Enter the PIN shown in the DM's app to connect.</p>
          <form onSubmit={handlePinSubmit}>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              className="web-player-pin-input"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
              placeholder="0000"
              autoFocus
            />
            {pinError && <p className="web-player-pin-error">{pinError}</p>}
            <button type="submit" className="web-player-btn" disabled={pinInput.length < 4}>
              Connect
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- Connecting Screen ---
  if (state === 'connecting') {
    return (
      <div className="web-player-status">
        <div className="web-player-status-content">
          <div className="web-player-spinner" />
          <h1>Connecting...</h1>
        </div>
      </div>
    );
  }

  // --- Error / Reconnecting Screen ---
  if (state === 'error') {
    return (
      <div className="web-player-status">
        <div className="web-player-status-content">
          <div className="web-player-spinner" />
          <h1>Connection Lost</h1>
          <p>Reconnecting...</p>
          <button className="web-player-btn web-player-btn-secondary" onClick={handleRetry}>
            Retry Now
          </button>
        </div>
      </div>
    );
  }

  // --- Waiting for DM ---
  if (state === 'waiting' || (state === 'active' && !campaign)) {
    return (
      <div className="web-player-status">
        <div className="web-player-status-content">
          <div className="web-player-status-icon">&#x1F3B2;</div>
          <h1>Connected</h1>
          <p>Waiting for the DM to open a campaign...</p>
        </div>
      </div>
    );
  }

  // --- Campaign Closed ---
  if (state === 'closed') {
    return (
      <div className="web-player-status">
        <div className="web-player-status-content">
          <div className="web-player-status-icon">&#x1F4D6;</div>
          <h1>Campaign Closed</h1>
          <p>The DM has closed the campaign. Waiting for a new session...</p>
        </div>
      </div>
    );
  }

  const handleSaveNote = useCallback((note: PlayerNote) => {
    // Send to server via WebSocket
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'player-note-save', data: note }));
    }
    // Update local state immediately
    setCampaign(prev => {
      if (!prev) return prev;
      const existing = prev.playerNotes ?? [];
      const idx = existing.findIndex(n => n.id === note.id);
      const updated = idx >= 0
        ? existing.map((n, i) => i === idx ? note : n)
        : [...existing, note];
      return { ...prev, playerNotes: updated };
    });
  }, []);

  // --- Active Campaign ---
  return (
    <PlayerView
      campaign={campaign!}
      messages={messages}
      activeEncounter={activeEncounter}
      onEncounterDismiss={() => setActiveEncounter(null)}
      onSaveNote={handleSaveNote}
      combatState={combatState}
      diceTransport={diceTransport}
    />
  );
}

export default WebPlayerApp;
