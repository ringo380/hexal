interface HexContextMenuProps {
  x: number;
  y: number;
  selectionCount: number;
  onCreateRegion: () => void;
  onClose: () => void;
}

function HexContextMenu({ x, y, selectionCount, onCreateRegion, onClose }: HexContextMenuProps) {
  return (
    <div
      className="hex-context-menu"
      style={{ left: x, top: y }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <button
        className="hex-context-menu-item"
        onClick={() => {
          onCreateRegion();
          onClose();
        }}
      >
        Create Region from {selectionCount} hex{selectionCount !== 1 ? 'es' : ''}
      </button>
    </div>
  );
}

export default HexContextMenu;
