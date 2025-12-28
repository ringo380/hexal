// HexGrid - Canvas-based hex grid with selection
import { useRef, useEffect, useCallback } from 'react';
import { useCampaign } from '../stores/CampaignContext';
import { useSelection } from '../stores/SelectionContext';
import {
  HEX_SIZE,
  hexCenter,
  canvasSize,
  drawHexPath,
  coordinateAt
} from '../services/hexGeometry';
import { hexHasUnresolvedContent } from '../types';
import type { HexCoordinate } from '../types';

function HexGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { campaign, getHex } = useCampaign();
  const { selectedCoordinate, selectHex, clearSelection, moveSelection } = useSelection();

  // Get terrain color
  const getTerrainColor = useCallback((terrain: string): string => {
    const terrainType = campaign?.terrainTypes.find(t => t.name === terrain);
    return terrainType?.colorHex ?? '#666666';
  }, [campaign]);

  // Draw the grid
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !campaign) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw all hexes
    for (let q = 0; q < campaign.gridWidth; q++) {
      for (let r = 0; r < campaign.gridHeight; r++) {
        const coord: HexCoordinate = { q, r };
        const center = hexCenter(coord);
        const hex = getHex(coord);
        const isSelected = selectedCoordinate?.q === q && selectedCoordinate?.r === r;

        // Determine fill color
        let fillColor = 'rgba(50, 50, 50, 0.3)'; // Empty/inactive hex
        if (hex && hex.terrain) {
          // Only apply terrain color if terrain is assigned
          const baseColor = getTerrainColor(hex.terrain);
          const opacity = hex.status === 'undiscovered' ? 0.3 : 0.7;
          fillColor = hexToRgba(baseColor, opacity);
        }

        // Draw hex
        drawHexPath(ctx, center, HEX_SIZE);
        ctx.fillStyle = fillColor;
        ctx.fill();

        // Draw border
        ctx.strokeStyle = isSelected ? '#4a9eff' : '#555555';
        ctx.lineWidth = isSelected ? 3 : 1;
        ctx.stroke();

        // Draw status indicator
        if (hex && hex.status !== 'undiscovered') {
          ctx.beginPath();
          ctx.arc(center.x, center.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = hex.status === 'discovered' ? 'rgba(74, 158, 255, 0.7)' : 'rgba(76, 175, 80, 0.7)';
          ctx.fill();
        }

        // Draw unresolved indicator
        if (hex && hexHasUnresolvedContent(hex)) {
          ctx.beginPath();
          ctx.arc(center.x + 10, center.y - 12, 3, 0, Math.PI * 2);
          ctx.fillStyle = '#ff9800';
          ctx.fill();
        }

        // Draw coordinate label
        ctx.font = '8px sans-serif';
        ctx.fillStyle = '#888888';
        ctx.textAlign = 'center';
        ctx.fillText(`${q},${r}`, center.x, center.y + 16);
      }
    }
  }, [campaign, getHex, selectedCoordinate, getTerrainColor]);

  // Update canvas size and redraw on campaign change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !campaign) return;

    const size = canvasSize(campaign.gridWidth, campaign.gridHeight);
    canvas.width = size.width;
    canvas.height = size.height;

    draw();
  }, [campaign, draw]);

  // Redraw on selection change
  useEffect(() => {
    draw();
  }, [selectedCoordinate, draw]);

  // Handle click
  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!campaign) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const coord = coordinateAt({ x, y }, campaign.gridWidth, campaign.gridHeight);
    if (coord) {
      selectHex(coord);
    }
  }, [campaign, selectHex]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!campaign) return;

      // Don't handle if focus is on an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          moveSelection(-1, 0, campaign.gridWidth, campaign.gridHeight);
          break;
        case 'ArrowRight':
          e.preventDefault();
          moveSelection(1, 0, campaign.gridWidth, campaign.gridHeight);
          break;
        case 'ArrowUp':
          e.preventDefault();
          moveSelection(0, -1, campaign.gridWidth, campaign.gridHeight);
          break;
        case 'ArrowDown':
          e.preventDefault();
          moveSelection(0, 1, campaign.gridWidth, campaign.gridHeight);
          break;
        case 'Escape':
          e.preventDefault();
          clearSelection();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [campaign, moveSelection, clearSelection]);

  if (!campaign) return null;

  return (
    <div className="hex-grid-container">
      <canvas
        ref={canvasRef}
        className="hex-grid-canvas"
        onClick={handleClick}
        tabIndex={0}
      />
    </div>
  );
}

// Helper to convert hex color to rgba
function hexToRgba(hex: string, alpha: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return `rgba(100, 100, 100, ${alpha})`;

  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default HexGrid;
