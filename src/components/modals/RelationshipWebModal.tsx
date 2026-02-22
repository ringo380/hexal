import { useState, useRef, useEffect, useCallback } from 'react';
import { useCampaign } from '../../stores/CampaignContext';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import type { Npc, Faction } from '../../types/Campaign';
import { RELATIONSHIP_TYPE_INFO } from '../../types/Campaign';
import Icon from '../icons/Icon';

interface RelationshipWebModalProps {
  onClose: () => void;
}

interface NodePosition {
  x: number;
  y: number;
  npc: Npc;
  hexKey: string;
}

function RelationshipWebModal({ onClose }: RelationshipWebModalProps) {
  const { allNpcs, factions } = useCampaign();
  const focusTrapRef = useFocusTrap<HTMLDivElement>({ onEscape: onClose });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [filterFactionId, setFilterFactionId] = useState<string>('');
  const [showDead, setShowDead] = useState(true);

  const filteredNpcs = allNpcs.filter(({ npc }) => {
    if (filterFactionId && npc.factionId !== filterFactionId) return false;
    if (!showDead && !npc.isAlive) return false;
    return true;
  });

  const getFaction = (factionId?: string): Faction | undefined => {
    if (!factionId) return undefined;
    return factions.find(f => f.id === factionId);
  };

  // Layout NPCs in a circle grouped by faction
  const computeLayout = useCallback((): NodePosition[] => {
    if (filteredNpcs.length === 0) return [];

    const width = 600;
    const height = 400;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.35;

    // Group by faction, then lay out in a circle
    const groups = new Map<string, Array<{ npc: Npc; hexKey: string }>>();
    for (const entry of filteredNpcs) {
      const groupKey = entry.npc.factionId || '__none__';
      if (!groups.has(groupKey)) groups.set(groupKey, []);
      groups.get(groupKey)!.push(entry);
    }

    const positions: NodePosition[] = [];
    let globalIdx = 0;
    const total = filteredNpcs.length;

    Array.from(groups.values()).forEach(group => {
      group.forEach(({ npc, hexKey }) => {
        const angle = (globalIdx / total) * Math.PI * 2 - Math.PI / 2;
        positions.push({
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
          npc,
          hexKey
        });
        globalIdx++;
      });
    });

    return positions;
  }, [filteredNpcs]);

  const positions = computeLayout();

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = 600;
    const height = 400;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);

    // Draw edges (relationships)
    const posMap = new Map<string, NodePosition>();
    positions.forEach(p => posMap.set(p.npc.id, p));

    positions.forEach(pos => {
      pos.npc.relationships.forEach(rel => {
        const target = posMap.get(rel.targetNpcId);
        if (!target) return;

        const typeInfo = RELATIONSHIP_TYPE_INFO[rel.type];
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        ctx.lineTo(target.x, target.y);
        ctx.strokeStyle = typeInfo.color + '88';
        ctx.lineWidth = selectedNodeId === pos.npc.id || selectedNodeId === rel.targetNpcId ? 2.5 : 1;
        ctx.stroke();
      });
    });

    // Draw nodes
    positions.forEach(pos => {
      const isSelected = pos.npc.id === selectedNodeId;
      const faction = getFaction(pos.npc.factionId);
      const nodeColor = faction?.color || '#9e9e9e';

      // Node circle
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, isSelected ? 10 : 7, 0, Math.PI * 2);
      ctx.fillStyle = pos.npc.isAlive ? nodeColor : '#444444';
      ctx.fill();
      ctx.strokeStyle = isSelected ? '#ffffff' : nodeColor;
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.stroke();

      // Dead marker
      if (!pos.npc.isAlive) {
        ctx.beginPath();
        ctx.moveTo(pos.x - 4, pos.y - 4);
        ctx.lineTo(pos.x + 4, pos.y + 4);
        ctx.moveTo(pos.x + 4, pos.y - 4);
        ctx.lineTo(pos.x - 4, pos.y + 4);
        ctx.strokeStyle = '#f44336';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Label
      ctx.fillStyle = isSelected ? '#ffffff' : '#cccccc';
      ctx.font = isSelected ? 'bold 11px sans-serif' : '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(pos.npc.title, pos.x, pos.y - 14);
    });
  }, [positions, selectedNodeId]);

  // Handle canvas click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clickedNode = positions.find(pos => {
      const dx = pos.x - x;
      const dy = pos.y - y;
      return Math.sqrt(dx * dx + dy * dy) < 12;
    });

    setSelectedNodeId(clickedNode?.npc.id ?? null);
  };

  const selectedNpc = selectedNodeId
    ? filteredNpcs.find(({ npc }) => npc.id === selectedNodeId)
    : null;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="relationship-web-modal-title">
      <div className="modal modal-xl relationship-web-modal" ref={focusTrapRef} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 id="relationship-web-modal-title"><Icon name="link" size={18} /> Relationship Web</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="relationship-web-body">
          <div className="relationship-web-controls">
            {factions.length > 0 && (
              <select value={filterFactionId} onChange={(e) => setFilterFactionId(e.target.value)}>
                <option value="">All Factions</option>
                {factions.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            )}
            <label className="filter-checkbox">
              <input type="checkbox" checked={showDead} onChange={(e) => setShowDead(e.target.checked)} />
              Show Dead
            </label>
          </div>
          <div className="relationship-web-canvas-wrapper">
            {filteredNpcs.length === 0 ? (
              <div className="empty-state">
                <Icon name="users" size={32} />
                <p>No NPCs to display</p>
              </div>
            ) : (
              <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                style={{ cursor: 'pointer' }}
              />
            )}
          </div>
          {selectedNpc && (
            <div className="relationship-web-detail">
              <h4>
                {!selectedNpc.npc.isAlive && <Icon name="skull" size={14} />}
                {' '}{selectedNpc.npc.title}
              </h4>
              <p className="relationship-web-detail-hex">Hex ({selectedNpc.hexKey})</p>
              {selectedNpc.npc.relationships.length > 0 && (
                <div className="relationship-web-detail-rels">
                  {selectedNpc.npc.relationships.map(rel => {
                    const targetName = allNpcs.find(({ npc }) => npc.id === rel.targetNpcId)?.npc.title || 'Unknown';
                    return (
                      <div key={rel.targetNpcId} className="relationship-web-detail-rel">
                        <span style={{ color: RELATIONSHIP_TYPE_INFO[rel.type].color }}>
                          {RELATIONSHIP_TYPE_INFO[rel.type].label}
                        </span>
                        {' '}&rarr; {targetName}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="relationship-web-legend">
          {Object.entries(RELATIONSHIP_TYPE_INFO).map(([type, info]) => (
            <span key={type} className="relationship-web-legend-item">
              <span className="legend-swatch" style={{ backgroundColor: info.color }} />
              {info.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default RelationshipWebModal;
