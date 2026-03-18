// TravelPanel - DM-side travel control panel for planning routes and stepping the party

import { useState, useCallback, useMemo } from 'react';
import { useCampaign } from '../../stores/CampaignContext';
import { findPath, buildPassableKeys } from '../../services/travelService';
import { parseHexKey } from '../../types/Campaign';
import type { TravelLogEntry } from '../../types/Campaign';
import Icon from '../icons/Icon';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface TravelPanelProps {
  onClose: () => void;
  travelPath: string[];
  onTravelPathChange: (path: string[]) => void;
  hexClickCallback: React.MutableRefObject<((key: string) => void) | null>;
}

function TravelPanel({ onClose, travelPath, onTravelPathChange, hexClickCallback }: TravelPanelProps) {
  const { campaign, updateCampaignData } = useCampaign();
  const [isSettingPosition, setIsSettingPosition] = useState(false);
  const [isPlanningRoute, setIsPlanningRoute] = useState(false);

  const panelRef = useFocusTrap({ onEscape: onClose });

  const partyPosition = campaign?.partyPosition;
  const travelLog = campaign?.travelLog ?? [];

  // Derive currentStepIndex from partyPosition to stay in sync with undo/redo
  const currentStepIndex = travelPath.length > 0 && partyPosition
    ? travelPath.indexOf(partyPosition)
    : -1;

  // Build terrain lookup for display
  const getTerrainName = useCallback((key: string) => {
    if (!campaign) return 'Unknown';
    const hex = campaign.hexes[key];
    return hex?.terrain || 'Empty';
  }, [campaign]);

  // Handle hex click for setting position or planning route
  const handleHexClick = useCallback((key: string) => {
    if (isSettingPosition) {
      updateCampaignData({ partyPosition: key });
      setIsSettingPosition(false);
      hexClickCallback.current = null;
      return;
    }

    if (isPlanningRoute && campaign && partyPosition) {
      const startCoord = parseHexKey(partyPosition);
      const endCoord = parseHexKey(key);
      if (!startCoord || !endCoord) return;

      const passable = buildPassableKeys(campaign.gridWidth, campaign.gridHeight, campaign.hexes);
      const path = findPath(startCoord, endCoord, passable, campaign.gridWidth, campaign.gridHeight);
      if (path) {
        onTravelPathChange(path);
      }
      setIsPlanningRoute(false);
      hexClickCallback.current = null;
    }
  }, [isSettingPosition, isPlanningRoute, campaign, partyPosition, updateCampaignData, onTravelPathChange, hexClickCallback]);

  // Start set-position mode
  const startSetPosition = useCallback(() => {
    setIsSettingPosition(true);
    setIsPlanningRoute(false);
    hexClickCallback.current = handleHexClick;
  }, [handleHexClick, hexClickCallback]);

  // Start plan-route mode
  const startPlanRoute = useCallback(() => {
    if (!partyPosition) return;
    setIsPlanningRoute(true);
    setIsSettingPosition(false);
    onTravelPathChange([]);
    hexClickCallback.current = handleHexClick;
  }, [partyPosition, handleHexClick, hexClickCallback, onTravelPathChange]);

  // Update the callback ref when handleHexClick changes
  if (isSettingPosition || isPlanningRoute) {
    hexClickCallback.current = handleHexClick;
  }

  // Step forward along the planned path
  const stepForward = useCallback(() => {
    if (!campaign || travelPath.length === 0) return;
    const nextIndex = currentStepIndex + 1;
    if (nextIndex >= travelPath.length) return;

    const fromKey = travelPath[currentStepIndex];
    const toKey = travelPath[nextIndex];
    const targetHex = campaign.hexes[toKey];
    const wasUndiscovered = targetHex?.status === 'undiscovered';

    // Update party position
    const updates: Partial<typeof campaign> = {
      partyPosition: toKey
    };

    // Auto-discover hex if undiscovered
    if (wasUndiscovered && targetHex) {
      updates.hexes = {
        ...campaign.hexes,
        [toKey]: { ...targetHex, status: 'discovered' }
      };
    }

    // Add travel log entry
    const logEntry: TravelLogEntry = {
      id: crypto.randomUUID(),
      fromHexKey: fromKey,
      toHexKey: toKey,
      timestamp: new Date().toISOString(),
      discovered: wasUndiscovered
    };
    updates.travelLog = [...(campaign.travelLog ?? []), logEntry];

    updateCampaignData(updates);
  }, [campaign, travelPath, currentStepIndex, updateCampaignData]);

  // Complete route (jump to end)
  const completeRoute = useCallback(() => {
    if (!campaign || travelPath.length === 0) return;

    const logEntries: TravelLogEntry[] = [];
    let hexes = { ...campaign.hexes };

    for (let i = currentStepIndex; i < travelPath.length - 1; i++) {
      const fromKey = travelPath[i];
      const toKey = travelPath[i + 1];
      const targetHex = hexes[toKey];
      const wasUndiscovered = targetHex?.status === 'undiscovered';

      if (wasUndiscovered && targetHex) {
        hexes = { ...hexes, [toKey]: { ...targetHex, status: 'discovered' } };
      }

      logEntries.push({
        id: crypto.randomUUID(),
        fromHexKey: fromKey,
        toHexKey: toKey,
        timestamp: new Date().toISOString(),
        discovered: wasUndiscovered
      });
    }

    updateCampaignData({
      partyPosition: travelPath[travelPath.length - 1],
      hexes,
      travelLog: [...(campaign.travelLog ?? []), ...logEntries]
    });
  }, [campaign, travelPath, currentStepIndex, updateCampaignData]);

  // Clear route
  const clearRoute = useCallback(() => {
    onTravelPathChange([]);
  }, [onTravelPathChange]);

  // Clear party position
  const clearPosition = useCallback(() => {
    updateCampaignData({ partyPosition: undefined });
    onTravelPathChange([]);
  }, [updateCampaignData, onTravelPathChange]);

  // Remaining steps
  const remainingSteps = travelPath.length > 0 ? travelPath.length - 1 - currentStepIndex : 0;

  // Recent travel log (last 10 entries)
  const recentLog = useMemo(() => {
    return travelLog.slice(-10).reverse();
  }, [travelLog]);

  if (!campaign) return null;

  return (
    <div className="travel-panel" ref={panelRef}>
      <div className="travel-panel-header">
        <h3><Icon name="walk" size={16} /> Travel Mode</h3>
        <button className="btn btn-icon btn-icon-small" onClick={onClose} aria-label="Close travel panel">
          <Icon name="close" size={14} />
        </button>
      </div>

      <div className="travel-panel-body">
        {/* Party Position Section */}
        <div className="travel-section">
          <h4>Party Position</h4>
          {partyPosition ? (
            <div className="travel-position-info">
              <span className="travel-position-badge">
                <Icon name="pin" size={12} /> {partyPosition} ({getTerrainName(partyPosition)})
              </span>
              <div className="travel-position-actions">
                <button className="btn btn-small btn-secondary" onClick={startSetPosition}>
                  Move
                </button>
                <button className="btn btn-small btn-secondary" onClick={clearPosition}>
                  Clear
                </button>
              </div>
            </div>
          ) : (
            <div className="travel-empty-state">
              <p className="empty-hint">No position set</p>
              <button
                className="btn btn-small btn-primary"
                onClick={startSetPosition}
              >
                Set Position
              </button>
            </div>
          )}
          {isSettingPosition && (
            <div className="travel-mode-hint">
              Click a hex on the map to set the party position.
              <button className="btn btn-small" onClick={() => { setIsSettingPosition(false); hexClickCallback.current = null; }}>
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Route Planning Section */}
        <div className="travel-section">
          <h4>Route Planning</h4>
          {!partyPosition ? (
            <p className="empty-hint">Set a party position first to plan routes.</p>
          ) : isPlanningRoute ? (
            <div className="travel-mode-hint">
              Click a destination hex on the map.
              <button className="btn btn-small" onClick={() => { setIsPlanningRoute(false); hexClickCallback.current = null; }}>
                Cancel
              </button>
            </div>
          ) : travelPath.length > 0 ? (
            <div className="travel-route-info">
              <div className="travel-route-summary">
                <span>{travelPath.length - 1} steps total, {remainingSteps} remaining</span>
              </div>
              <div className="travel-route-steps">
                {travelPath.map((key, i) => (
                  <div key={key + i} className={`travel-route-step ${i === currentStepIndex ? 'current' : ''} ${i < currentStepIndex ? 'visited' : ''}`}>
                    <span className="step-number">{i + 1}</span>
                    <span className="step-hex">{key}</span>
                    <span className="step-terrain">{getTerrainName(key)}</span>
                  </div>
                ))}
              </div>
              <div className="travel-route-controls">
                <button
                  className="btn btn-small btn-primary"
                  onClick={stepForward}
                  disabled={remainingSteps === 0}
                >
                  Step Forward
                </button>
                <button
                  className="btn btn-small btn-secondary"
                  onClick={completeRoute}
                  disabled={remainingSteps === 0}
                >
                  Complete Route
                </button>
                <button className="btn btn-small" onClick={clearRoute}>
                  Clear Route
                </button>
              </div>
            </div>
          ) : (
            <button className="btn btn-small btn-primary" onClick={startPlanRoute}>
              Plan Route
            </button>
          )}
        </div>

        {/* Travel Log Section */}
        <div className="travel-section">
          <h4>Travel Log</h4>
          {recentLog.length === 0 ? (
            <p className="empty-hint">No travel recorded yet.</p>
          ) : (
            <div className="travel-log-entries">
              {recentLog.map((entry) => (
                <div key={entry.id} className="travel-log-entry">
                  <span className="log-route">
                    {entry.fromHexKey} &rarr; {entry.toHexKey}
                  </span>
                  {entry.discovered && (
                    <span className="log-badge log-badge-discovered">New</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TravelPanel;
