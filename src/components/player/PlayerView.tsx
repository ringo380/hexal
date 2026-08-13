// PlayerView - Layout wrapper with Presentation/Explorer mode toggle

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type { PlayerCampaign } from '../../services/playerViewFilter';
import { createDefaultSimulationConfig } from '../../types/Weather';
import PlayerHexGrid from './PlayerHexGrid';
import PlayerHexInfo from './PlayerHexInfo';
import PlayerSidebar from './PlayerSidebar';
import PlayerQuestLog from './PlayerQuestLog';
import MessageToast from './MessageToast';
import MessageHistory from './MessageHistory';
import PlayerJournal from './PlayerJournal';
import PlayerDiceSection from './PlayerDiceSection';
import type { HexCoordinate, PlayerNote } from '../../types';
import type { ActiveEncounter } from '../../types/Campaign';
import { WEATHER_CONDITION_LABELS, TEMPERATURE_LABELS } from '../../types/Weather';
import EncounterOverlay from './EncounterOverlay';
import CombatBanner from './CombatBanner';
import type { PlayerCombatState } from '../../types/Combat';
import { DiceProvider } from '../../stores/DiceContext';
import type { DiceTransport } from '../../types';

interface DmMessage {
  id: string;
  text: string;
  timestamp: number;
  imageDataUrl?: string;
}

type LayoutMode = 'presentation' | 'explorer';

interface PlayerViewProps {
  campaign: PlayerCampaign;
  messages?: DmMessage[];
  onMessageSeen?: () => void;
  activeEncounter?: ActiveEncounter | null;
  onEncounterDismiss?: () => void;
  onSaveNote?: (note: PlayerNote) => void;
  combatState?: PlayerCombatState | null;
  diceTransport?: DiceTransport;
}

function PlayerView({ campaign, messages = [], onMessageSeen, activeEncounter, onEncounterDismiss, onSaveNote, combatState, diceTransport }: PlayerViewProps) {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('presentation');
  const [selectedHexKey, setSelectedHexKey] = useState<string | null>(null);
  const [showQuestLog, setShowQuestLog] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [infoCollapsed, setInfoCollapsed] = useState(false);
  const [activeToast, setActiveToast] = useState<DmMessage | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [lastSeenCount, setLastSeenCount] = useState(0);
  const prevMessageCountRef = useRef(messages.length);
  const [showJournal, setShowJournal] = useState(false);
  const [showDicePanel, setShowDicePanel] = useState(false);
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('hexal-player-name') || '');
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [namePromptIntent, setNamePromptIntent] = useState<'journal' | 'dice'>('journal');
  const [nameInput, setNameInput] = useState('');

  // Roller name for the dice channel - same source as journal authorship
  // (playerName, prompted/stored via the name prompt below). Memoized so the
  // DiceProvider's roll() callback doesn't rebuild on every unrelated
  // PlayerView re-render (e.g. hex selection).
  const diceRoller = useMemo(
    () => ({ kind: 'player' as const, name: playerName || 'Player' }),
    [playerName]
  );

  // Completes the name prompt for whichever panel triggered it (journal or
  // dice), opening that panel immediately rather than requiring a second click.
  const completeNamePrompt = useCallback((name: string) => {
    setPlayerName(name);
    localStorage.setItem('hexal-player-name', name);
    setShowNamePrompt(false);
    if (namePromptIntent === 'dice') {
      setShowDicePanel(true);
    } else {
      setShowJournal(true);
    }
  }, [namePromptIntent]);

  // Show toast when a new message arrives (not on initial mount with history)
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current) {
      setActiveToast(messages[messages.length - 1]);
    }
    prevMessageCountRef.current = messages.length;
  }, [messages.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const unreadCount = Math.max(0, messages.length - lastSeenCount);

  const handleOpenHistory = useCallback(() => {
    setShowHistory(true);
    setLastSeenCount(messages.length);
    onMessageSeen?.();
  }, [messages.length, onMessageSeen]);

  const selectedHex = selectedHexKey ? campaign.hexes[selectedHexKey] ?? null : null;

  const handleHexSelect = useCallback((coord: HexCoordinate) => {
    const key = `${coord.q},${coord.r}`;
    setSelectedHexKey(prev => prev === key ? null : key);
  }, []);

  const handleSidebarSelect = useCallback((key: string) => {
    setSelectedHexKey(key);
  }, []);

  const toggleLayout = useCallback(() => {
    setLayoutMode(prev => prev === 'presentation' ? 'explorer' : 'presentation');
  }, []);

  // Find the region for the selected hex
  const selectedHexRegion = selectedHexKey
    ? campaign.regions.find(r => r.hexKeys.includes(selectedHexKey))
    : undefined;

  // Get terrain name from terrainTypes
  const getTerrainName = (terrain: string) => {
    const t = campaign.terrainTypes.find(tt => tt.name === terrain);
    return t?.name ?? terrain;
  };

  // Weather display
  const weather = campaign.timeWeather?.globalWeather;
  const weatherText = weather
    ? `${WEATHER_CONDITION_LABELS[weather.condition]} | ${TEMPERATURE_LABELS[weather.temperature]}`
    : null;

  return (
    <DiceProvider campaignId={campaign.id} roller={diceRoller} transport={diceTransport}>
    <div className={`player-view player-view--${layoutMode}`}>
      {/* Weather bar */}
      {weatherText && (
        <div className="player-weather-bar">
          {weatherText}
        </div>
      )}

      {/* Layout toggle */}
      <button
        className="player-layout-toggle"
        onClick={toggleLayout}
        title={layoutMode === 'presentation' ? 'Switch to Explorer mode' : 'Switch to Presentation mode'}
      >
        {layoutMode === 'presentation' ? 'Explorer' : 'Presentation'}
      </button>

      {/* Quest log toggle */}
      {campaign.quests.length > 0 && (
        <button
          className="player-quest-log-toggle"
          onClick={() => setShowQuestLog(!showQuestLog)}
        >
          {showQuestLog ? 'Hide Quests' : 'Quest Log'}
        </button>
      )}

      {/* Journal toggle */}
      {onSaveNote && (
        <button
          className="player-journal-toggle"
          onClick={() => {
            if (!playerName) {
              setNamePromptIntent('journal');
              setShowNamePrompt(true);
            } else {
              setShowJournal(!showJournal);
            }
          }}
        >
          {showJournal ? 'Hide Journal' : 'Journal'}
        </button>
      )}

      {/* Dice roller toggle */}
      <button
        className="player-dice-toggle"
        onClick={() => {
          if (!playerName) {
            setNamePromptIntent('dice');
            setShowNamePrompt(true);
          } else {
            setShowDicePanel(!showDicePanel);
          }
        }}
        aria-label="Dice roller"
      >
        {showDicePanel ? 'Hide Dice' : 'Dice'}
      </button>

      {/* Campaign name overlay (presentation mode) */}
      {layoutMode === 'presentation' && (
        <div className="player-campaign-name">{campaign.name}</div>
      )}

      {/* Mobile collapse toggles */}
      {layoutMode === 'explorer' && (
        <button
          className="player-collapse-toggle player-collapse-toggle--sidebar"
          onClick={() => setSidebarCollapsed(prev => !prev)}
          aria-label={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
        >
          {sidebarCollapsed ? 'Hexes' : 'Hide'}
        </button>
      )}
      {selectedHex && (
        <button
          className="player-collapse-toggle player-collapse-toggle--info"
          onClick={() => setInfoCollapsed(prev => !prev)}
          aria-label={infoCollapsed ? 'Show hex info' : 'Hide hex info'}
        >
          {infoCollapsed ? 'Info' : 'Hide'}
        </button>
      )}

      {/* Explorer mode sidebar */}
      {layoutMode === 'explorer' && (
        <div className={sidebarCollapsed ? 'player-sidebar-wrapper collapsed' : 'player-sidebar-wrapper'}>
          <PlayerSidebar
            campaign={campaign}
            selectedHexKey={selectedHexKey}
            onSelectHex={handleSidebarSelect}
          />
        </div>
      )}

      {/* Hex grid */}
      <div className="player-grid-area">
        <PlayerHexGrid
          campaign={campaign}
          selectedHexKey={selectedHexKey}
          onHexSelect={handleHexSelect}
          onHexDeselect={() => setSelectedHexKey(null)}
          weatherField={campaign.weatherField}
          weatherConfig={campaign.weatherSimConfig ? {
            ...createDefaultSimulationConfig(),
            ...campaign.weatherSimConfig
          } : undefined}
        />
      </div>

      {/* Info panel */}
      {selectedHex && (
        <div className={`player-info-panel player-info-panel--${layoutMode}${infoCollapsed ? ' collapsed' : ''}`}>
          <PlayerHexInfo
            hex={selectedHex}
            regionName={selectedHexRegion?.name}
            regionColor={selectedHexRegion?.color}
            terrainName={getTerrainName(selectedHex.terrain)}
            onClose={() => setSelectedHexKey(null)}
          />
        </div>
      )}

      {/* Quest log panel */}
      {showQuestLog && campaign.quests.length > 0 && (
        <div className="player-quest-log-panel">
          <PlayerQuestLog campaign={campaign} />
        </div>
      )}

      {/* Message toggle button */}
      <button
        className="player-message-toggle"
        onClick={handleOpenHistory}
        title="Messages from DM"
        aria-label="Messages from DM"
      >
        Messages
        {unreadCount > 0 && (
          <span className="player-message-badge">{unreadCount}</span>
        )}
      </button>

      {/* Message toast */}
      {activeToast && (
        <MessageToast
          message={activeToast}
          onDismiss={() => setActiveToast(null)}
        />
      )}

      {/* Message history panel */}
      {showHistory && (
        <MessageHistory
          messages={messages}
          onClose={() => setShowHistory(false)}
        />
      )}

      {/* Combat initiative banner */}
      {combatState && (
        <CombatBanner combat={combatState} />
      )}

      {/* Encounter overlay */}
      {activeEncounter && (
        <EncounterOverlay
          encounter={activeEncounter}
          onDismiss={onEncounterDismiss ?? (() => {})}
        />
      )}

      {/* Journal panel */}
      {showJournal && onSaveNote && playerName && (
        <div className="player-journal-panel">
          <PlayerJournal
            notes={campaign.playerNotes}
            playerName={playerName}
            onSave={onSaveNote}
            onClose={() => setShowJournal(false)}
          />
        </div>
      )}

      {/* Dice roller panel */}
      {showDicePanel && playerName && (
        <PlayerDiceSection onClose={() => setShowDicePanel(false)} />
      )}

      {/* Player name prompt */}
      {showNamePrompt && (
        <div className="player-name-prompt-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowNamePrompt(false); }}>
          <div className="player-name-prompt">
            <h3>Enter Your Name</h3>
            <p>
              {namePromptIntent === 'dice'
                ? 'This will be shown next to your dice rolls.'
                : 'This will be used to identify your journal entries.'}
            </p>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Your character or player name"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && nameInput.trim()) {
                  completeNamePrompt(nameInput.trim());
                }
              }}
            />
            <div className="player-name-prompt-actions">
              <button onClick={() => setShowNamePrompt(false)}>Cancel</button>
              <button
                disabled={!nameInput.trim()}
                onClick={() => completeNamePrompt(nameInput.trim())}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </DiceProvider>
  );
}

export default PlayerView;
