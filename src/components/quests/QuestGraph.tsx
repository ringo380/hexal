// QuestGraph — canvas-based quest dependency visualization

import { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import type { Quest, StoryArc } from '../../types/Quest';
import { QUEST_STATUS_INFO } from '../../types/Quest';
import Icon from '../icons/Icon';

interface QuestGraphProps {
  quests: Quest[];
  storyArcs: StoryArc[];
  selectedQuestId: string | null;
  onSelectQuest: (questId: string) => void;
}

interface NodeRect {
  questId: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

// Column assignments by status
const STATUS_COLUMN: Record<string, number> = {
  unknown: 0,
  rumored: 0,
  active: 1,
  completed: 2,
  failed: 2,
  abandoned: 2,
};

const COL_X = [100, 350, 600];
const NODE_W = 160;
const NODE_H = 50;
const NODE_SPACING_Y = 80;
const NODE_RADIUS = 8;

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + '\u2026' : text;
}

function QuestGraph({ quests, storyArcs, selectedQuestId, onSelectQuest }: QuestGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Pan/zoom state
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [scale, setScale] = useState(1);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });

  // Hover tracking
  const [hoveredQuestId, setHoveredQuestId] = useState<string | null>(null);

  // Compute node positions from quests
  const nodeRects = useMemo<NodeRect[]>(() => {
    const columns: Quest[][] = [[], [], []];
    for (const q of quests) {
      const col = STATUS_COLUMN[q.status] ?? 0;
      columns[col].push(q);
    }

    const rects: NodeRect[] = [];
    for (let col = 0; col < 3; col++) {
      const colQuests = columns[col];
      for (let i = 0; i < colQuests.length; i++) {
        rects.push({
          questId: colQuests[i].id,
          x: COL_X[col],
          y: 60 + i * NODE_SPACING_Y,
          w: NODE_W,
          h: NODE_H,
        });
      }
    }
    return rects;
  }, [quests]);

  // Build lookup: questId -> NodeRect
  const nodeMap = useMemo(() => {
    const m = new Map<string, NodeRect>();
    for (const n of nodeRects) m.set(n.questId, n);
    return m;
  }, [nodeRects]);

  // Quest lookup
  const questMap = useMemo(() => {
    const m = new Map<string, Quest>();
    for (const q of quests) m.set(q.id, q);
    return m;
  }, [quests]);

  // Hit-test: convert canvas coords to world coords and check nodes
  const hitTest = useCallback(
    (canvasX: number, canvasY: number): string | null => {
      const wx = (canvasX - offsetX) / scale;
      const wy = (canvasY - offsetY) / scale;
      for (let i = nodeRects.length - 1; i >= 0; i--) {
        const n = nodeRects[i];
        if (wx >= n.x && wx <= n.x + n.w && wy >= n.y && wy <= n.y + n.h) {
          return n.questId;
        }
      }
      return null;
    },
    [nodeRects, offsetX, offsetY, scale],
  );

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // 1. Clear
    ctx.clearRect(0, 0, rect.width, rect.height);

    // 2. Apply transform
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    // 3. Story arc background boxes
    for (const arc of storyArcs) {
      const arcNodes = arc.questIds
        .map((id) => nodeMap.get(id))
        .filter((n): n is NodeRect => !!n);
      if (arcNodes.length === 0) continue;

      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const n of arcNodes) {
        if (n.x < minX) minX = n.x;
        if (n.y < minY) minY = n.y;
        if (n.x + n.w > maxX) maxX = n.x + n.w;
        if (n.y + n.h > maxY) maxY = n.y + n.h;
      }

      const pad = 16;
      ctx.fillStyle = arc.color + '18'; // semi-transparent
      ctx.strokeStyle = arc.color + '44';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(minX - pad, minY - pad - 20, maxX - minX + pad * 2, maxY - minY + pad * 2 + 20, 6);
      ctx.fill();
      ctx.stroke();

      // Arc title label
      ctx.fillStyle = arc.color;
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(truncate(arc.title || 'Untitled Arc', 30), minX - pad + 6, minY - pad - 6);
    }

    // 4. Edges (prerequisite arrows)
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1.5;
    for (const quest of quests) {
      const targetNode = nodeMap.get(quest.id);
      if (!targetNode) continue;
      for (const prereqId of quest.prerequisiteQuestIds) {
        const sourceNode = nodeMap.get(prereqId);
        if (!sourceNode) continue;

        const sx = sourceNode.x + sourceNode.w;
        const sy = sourceNode.y + sourceNode.h / 2;
        const tx = targetNode.x;
        const ty = targetNode.y + targetNode.h / 2;

        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(tx, ty);
        ctx.stroke();

        // Arrowhead
        const angle = Math.atan2(ty - sy, tx - sx);
        const headLen = 8;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(
          tx - headLen * Math.cos(angle - Math.PI / 6),
          ty - headLen * Math.sin(angle - Math.PI / 6),
        );
        ctx.lineTo(
          tx - headLen * Math.cos(angle + Math.PI / 6),
          ty - headLen * Math.sin(angle + Math.PI / 6),
        );
        ctx.closePath();
        ctx.fillStyle = '#888';
        ctx.fill();
      }
    }

    // 5. Nodes
    for (const node of nodeRects) {
      const quest = questMap.get(node.questId);
      if (!quest) continue;

      const color = QUEST_STATUS_INFO[quest.status].color;

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(node.x, node.y, node.w, node.h, NODE_RADIUS);
      ctx.fill();

      // 6. Node text
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(truncate(quest.title || 'Untitled', 20), node.x + node.w / 2, node.y + 18);

      // Objective progress
      const total = quest.objectives.length;
      if (total > 0) {
        const done = quest.objectives.filter((o) => o.isComplete).length;
        ctx.font = '10px sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillText(`${done}/${total}`, node.x + node.w / 2, node.y + 36);
      }

      // 7. Selection highlight
      if (quest.id === selectedQuestId) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(node.x - 2, node.y - 2, node.w + 4, node.h + 4, NODE_RADIUS + 2);
        ctx.stroke();
      }
    }

    ctx.restore();
  }, [quests, storyArcs, nodeRects, nodeMap, questMap, selectedQuestId, offsetX, offsetY, scale]);

  // Resize observer to keep canvas sized correctly
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const observer = new ResizeObserver(() => {
      const rect = container.getBoundingClientRect();
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      // Trigger re-render via a no-op state update
      setScale((s) => s);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    // Check click on node
    const hit = hitTest(cx, cy);
    if (hit) {
      onSelectQuest(hit);
      return;
    }

    // Start drag
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offsetX, oy: offsetY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    if (dragging) {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      setOffsetX(dragStart.current.ox + dx);
      setOffsetY(dragStart.current.oy + dy);
      return;
    }

    // Hover hit-test for cursor
    const hit = hitTest(cx, cy);
    setHoveredQuestId(hit);
  };

  const handleMouseUp = () => {
    setDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    setScale((s) => Math.min(3, Math.max(0.3, s * factor)));
  };

  // Help text visibility — hide after first interaction
  const [showHelp, setShowHelp] = useState(true);
  const hideHelp = useCallback(() => setShowHelp(false), []);

  // Auto-hide after 3 seconds
  useEffect(() => {
    if (!showHelp) return;
    const timer = setTimeout(() => setShowHelp(false), 3000);
    return () => clearTimeout(timer);
  }, [showHelp]);

  const handleMouseDownWrapped = (e: React.MouseEvent<HTMLCanvasElement>) => {
    hideHelp();
    handleMouseDown(e);
  };

  const handleWheelWrapped = (e: React.WheelEvent<HTMLCanvasElement>) => {
    hideHelp();
    handleWheel(e);
  };

  return (
    <div ref={containerRef} className="quest-graph-container">
      {quests.length === 0 ? (
        <div className="quest-graph-empty">
          <Icon name="star" size={32} />
          <p>No quests to display. Create some quests first.</p>
        </div>
      ) : (
        <>
          <canvas
            ref={canvasRef}
            className={`quest-graph-canvas ${dragging ? 'dragging' : ''} ${hoveredQuestId ? 'hovering' : ''}`}
            role="img"
            aria-label="Quest dependency graph"
            onMouseDown={handleMouseDownWrapped}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheelWrapped}
          />
          {showHelp && (
            <div className="quest-graph-help">Drag to pan, scroll to zoom</div>
          )}
        </>
      )}
    </div>
  );
}

export default QuestGraph;
