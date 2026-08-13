import { useRef, useEffect, useLayoutEffect, useState } from 'react';

interface HexContextMenuProps {
  x: number;
  y: number;
  selectionCount: number;
  partyMoveTargets?: { id: string; label: string }[];
  onMoveParty?: (partyId: string) => void;
  onCreateRegion: () => void;
  onExportSelected: () => void;
  onClose: () => void;
}

function HexContextMenu({ x, y, selectionCount, partyMoveTargets, onMoveParty, onCreateRegion, onExportSelected, onClose }: HexContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Clamp the menu inside its container after measuring: the item count now
  // varies (party entries), and the container has overflow hidden, so a fixed
  // offset clamp would leave lower items clipped and unreachable
  const [pos, setPos] = useState({ x, y });
  useLayoutEffect(() => {
    const el = menuRef.current;
    const parent = el?.offsetParent as HTMLElement | null;
    if (!el || !parent) {
      setPos({ x, y });
      return;
    }
    setPos({
      x: Math.max(4, Math.min(x, parent.clientWidth - el.offsetWidth - 4)),
      y: Math.max(4, Math.min(y, parent.clientHeight - el.offsetHeight - 4))
    });
  }, [x, y]);

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
      style={{ left: pos.x, top: pos.y }}
    >
      {selectionCount > 0 && (
        <>
          <button
            className="hex-context-menu-item"
            onClick={() => {
              onCreateRegion();
              onClose();
            }}
          >
            Create Region from {selectionCount} hex{selectionCount !== 1 ? 'es' : ''}
          </button>
          <button
            className="hex-context-menu-item"
            onClick={() => {
              onExportSelected();
              onClose();
            }}
          >
            Export {selectionCount} hex{selectionCount !== 1 ? 'es' : ''} as image...
          </button>
        </>
      )}
      {partyMoveTargets?.map(target => (
        <button
          key={target.id}
          className="hex-context-menu-item"
          onClick={() => {
            onMoveParty?.(target.id);
            onClose();
          }}
        >
          {target.label}
        </button>
      ))}
    </div>
  );
}

export default HexContextMenu;
