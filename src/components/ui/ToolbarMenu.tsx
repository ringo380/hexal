// ToolbarMenu - labelled toolbar button that opens a dropdown of actions

import { useState, useRef, useEffect, useId } from 'react';
import Icon from '../icons/Icon';
import type { IconName } from '../icons/Icon';

export interface ToolbarMenuItem {
  label: string;
  icon: IconName;
  onSelect: () => void;
  /** Count shown beside the item (e.g. unread player notes); hidden when 0 */
  badge?: number;
}

interface ToolbarMenuProps {
  label: string;
  icon: IconName;
  items: ToolbarMenuItem[];
}

function ToolbarMenu({ label, icon, items }: ToolbarMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const menuId = useId();

  const badgeTotal = items.reduce((sum, item) => sum + (item.badge ?? 0), 0);

  // Close when clicking outside (ref-based contains() check, like ProfileMenu)
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Move focus into the menu when it opens from the keyboard or a click
  useEffect(() => {
    if (open) itemRefs.current[0]?.focus();
  }, [open]);

  const close = (restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  };

  const handleMenuKeyDown = (e: React.KeyboardEvent) => {
    const buttons = itemRefs.current.filter((b): b is HTMLButtonElement => b !== null);
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        e.stopPropagation();
        close(true);
        break;
      case 'ArrowDown':
        e.preventDefault();
        buttons[(index + 1) % buttons.length]?.focus();
        break;
      case 'ArrowUp':
        e.preventDefault();
        buttons[(index - 1 + buttons.length) % buttons.length]?.focus();
        break;
      case 'Home':
        e.preventDefault();
        buttons[0]?.focus();
        break;
      case 'End':
        e.preventDefault();
        buttons[buttons.length - 1]?.focus();
        break;
    }
  };

  // Close when keyboard focus leaves the menu (e.g. Tab to the next control)
  const handleBlur = (e: React.FocusEvent) => {
    if (open && !containerRef.current?.contains(e.relatedTarget as Node | null)) {
      setOpen(false);
    }
  };

  return (
    <div className="toolbar-menu" ref={containerRef} onBlur={handleBlur}>
      <button
        ref={triggerRef}
        className={`btn btn-secondary toolbar-menu-trigger${open ? ' btn-active' : ''}`}
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' && !open) {
            e.preventDefault();
            setOpen(true);
          }
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
      >
        <Icon name={icon} size={16} /> {label}
        <Icon name="chevron-down" size={12} />
        {badgeTotal > 0 && (
          <span className="filter-badge" aria-label={`${badgeTotal} new`}>{badgeTotal}</span>
        )}
      </button>
      {open && (
        <div id={menuId} className="toolbar-menu-list" role="menu" aria-label={label} onKeyDown={handleMenuKeyDown}>
          {items.map((item, i) => (
            <button
              key={item.label}
              ref={(el) => { itemRefs.current[i] = el; }}
              className="toolbar-menu-item"
              role="menuitem"
              tabIndex={-1}
              onClick={() => {
                close(false);
                item.onSelect();
              }}
            >
              <Icon name={item.icon} size={16} />
              <span className="toolbar-menu-item-label">{item.label}</span>
              {(item.badge ?? 0) > 0 && (
                <span className="toolbar-menu-item-badge">{item.badge}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default ToolbarMenu;
