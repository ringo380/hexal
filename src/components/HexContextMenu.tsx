import { useRef, useEffect } from 'react';

interface HexContextMenuProps {
  x: number;
  y: number;
  selectionCount: number;
  onCreateRegion: () => void;
  onClose: () => void;
}

function HexContextMenu({ x, y, selectionCount, onCreateRegion, onClose }: HexContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click — check event target against our ref
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="hex-context-menu"
      style={{ left: x, top: y }}
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
