// CommandPalette - Unified search, coordinate jump, recent & bookmarked hexes
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useCampaign } from '../stores/CampaignContext';
import { useHexSelection } from '../stores/HexSelectionContext';
import { searchCampaign, getMatchHint } from '../services/search';
import { parseHexKey } from '../types/Campaign';
import Icon from './icons/Icon';

interface CommandPaletteProps {
  onClose: () => void;
}

interface PaletteItem {
  id: string;
  label: string;
  sublabel: string;
  section?: string;
  coord: { q: number; r: number };
}

const COORD_PATTERN = /^\s*(\d+)\s*,\s*(\d+)\s*$/;

function CommandPalette({ onClose }: CommandPaletteProps) {
  const { campaign, bookmarkedHexes } = useCampaign();
  const { selectHex, recentHexes } = useHexSelection();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [onClose]);

  const getHexTerrain = useCallback((q: number, r: number): string => {
    if (!campaign) return '';
    const hex = campaign.hexes[`${q},${r}`];
    return hex?.terrain || 'Empty';
  }, [campaign]);

  const items = useMemo((): PaletteItem[] => {
    if (!campaign) return [];

    const trimmed = query.trim();

    // Empty query: show recent + bookmarked
    if (!trimmed) {
      const result: PaletteItem[] = [];

      // Recent hexes (top 5)
      const recentSlice = recentHexes.slice(0, 5);
      for (const coord of recentSlice) {
        result.push({
          id: `recent-${coord.q},${coord.r}`,
          label: `(${coord.q}, ${coord.r})`,
          sublabel: getHexTerrain(coord.q, coord.r),
          section: 'Recent Hexes',
          coord
        });
      }

      // Bookmarked hexes (top 5)
      const bookmarkSlice = bookmarkedHexes.slice(0, 5);
      for (const key of bookmarkSlice) {
        const parsed = parseHexKey(key);
        if (!parsed) continue;
        // Skip if already in recent
        if (recentSlice.some(c => c.q === parsed.q && c.r === parsed.r)) continue;
        result.push({
          id: `bookmark-${key}`,
          label: `(${parsed.q}, ${parsed.r})`,
          sublabel: getHexTerrain(parsed.q, parsed.r),
          section: 'Bookmarks',
          coord: parsed
        });
      }

      // Active Quests (top 5)
      const activeQuests = (campaign.quests ?? []).filter(q => q.status === 'active').slice(0, 5);
      for (const quest of activeQuests) {
        const firstKey = quest.linkedHexKeys[0];
        if (!firstKey) continue;
        const parsed = parseHexKey(firstKey);
        const coord = parsed || { q: 0, r: 0 };
        result.push({
          id: `quest-${quest.id}`,
          label: quest.title || 'Untitled Quest',
          sublabel: `Active \u2022 ${quest.objectives.filter(o => o.isComplete).length}/${quest.objectives.length} objectives`,
          section: 'Active Quests',
          coord
        });
      }

      return result;
    }

    // Coordinate pattern: show jump option
    const coordMatch = trimmed.match(COORD_PATTERN);
    if (coordMatch) {
      const q = parseInt(coordMatch[1], 10);
      const r = parseInt(coordMatch[2], 10);
      const terrain = getHexTerrain(q, r);
      return [{
        id: `jump-${q},${r}`,
        label: `Jump to (${q}, ${r})`,
        sublabel: terrain,
        coord: { q, r }
      }];
    }

    // Text query: search campaign
    const results = searchCampaign(campaign, trimmed);
    return results.slice(0, 20).map(r => {
      const parsed = parseHexKey(r.hexKey);
      const coord = parsed || { q: 0, r: 0 };
      return {
        id: `search-${r.hexKey}`,
        label: `(${coord.q}, ${coord.r}) ${r.hex.terrain}`,
        sublabel: getMatchHint(r.matches),
        coord
      };
    });
  }, [campaign, query, recentHexes, bookmarkedHexes, getHexTerrain]);

  // Reset selection when items change
  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const selectedEl = listRef.current.querySelector('.palette-result.selected');
    selectedEl?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const handleSelect = useCallback((item: PaletteItem) => {
    selectHex(item.coord);
    onClose();
  }, [selectHex, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (items[selectedIndex]) {
        handleSelect(items[selectedIndex]);
      }
    }
  };

  // Track sections for rendering headers
  let lastSection: string | undefined;

  return (
    <div className="command-palette-overlay" onClick={onClose}>
      <div className="command-palette" onClick={(e) => e.stopPropagation()}>
        <div className="palette-input-wrapper">
          <Icon name="search" size={18} />
          <input
            ref={inputRef}
            className="palette-input"
            type="text"
            placeholder="Search hexes, content, or enter coordinates (q,r)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className="palette-results" ref={listRef}>
          {items.length === 0 && query.trim() ? (
            <div className="palette-empty">No results found</div>
          ) : (
            items.map((item, index) => {
              const showSection = item.section && item.section !== lastSection;
              lastSection = item.section;
              return (
                <div key={item.id}>
                  {showSection && (
                    <div className="palette-section-header">
                      {item.section === 'Recent Hexes' && <Icon name="clock" size={12} />}
                      {item.section === 'Bookmarks' && <Icon name="star" size={12} />}
                      {item.section}
                    </div>
                  )}
                  <div
                    className={`palette-result ${index === selectedIndex ? 'selected' : ''}`}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <span className="palette-result-label">{item.label}</span>
                    <span className="palette-result-sublabel">{item.sublabel}</span>
                  </div>
                </div>
              );
            })
          )}
          {items.length === 0 && !query.trim() && (
            <div className="palette-empty">Type to search or enter coordinates</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;
