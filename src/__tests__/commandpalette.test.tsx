import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CommandPalette from '../components/CommandPalette';

// The COORD_PATTERN regex from CommandPalette
const COORD_PATTERN = /^\s*(\d+)\s*,\s*(\d+)\s*$/;

// Mock useCampaign
const mockSelectHex = vi.fn();
const mockCampaign = {
  id: 'test',
  name: 'Test',
  gridWidth: 10,
  gridHeight: 10,
  hexes: {
    '0,0': {
      id: 'h1',
      coordinate: { q: 0, r: 0 },
      terrain: 'Forest',
      status: 'undiscovered',
      notes: 'A dense forest with wolves',
      tags: [],
      locations: [],
      encounters: [],
      npcs: [{ id: 'npc1', title: 'Elven Ranger', description: 'Patrols the woods', isResolved: false }],
      treasures: [],
      clues: [],
      markers: []
    },
    '1,0': {
      id: 'h2',
      coordinate: { q: 1, r: 0 },
      terrain: 'Mountains',
      status: 'discovered',
      notes: '',
      tags: [],
      locations: [{ id: 'loc1', title: 'Dragon Cave', description: 'A cave entrance', isResolved: false }],
      encounters: [],
      npcs: [],
      treasures: [],
      clues: [],
      markers: []
    }
  },
  terrainTypes: [],
  encounterTables: [],
  createdAt: '2025-01-01',
  modifiedAt: '2025-01-01',
  bookmarkedHexes: ['0,0']
};

// Stable references to prevent useMemo/useEffect invalidation on re-render
const mockBookmarkedHexes = mockCampaign.bookmarkedHexes;
const mockRecentHexes = [{ q: 1, r: 0 }];

vi.mock('../stores/CampaignContext', () => ({
  useCampaign: () => ({
    campaign: mockCampaign,
    bookmarkedHexes: mockBookmarkedHexes
  })
}));

vi.mock('../stores/SelectionContext', () => ({
  useSelection: () => ({
    selectHex: mockSelectHex,
    recentHexes: mockRecentHexes
  })
}));

describe('COORD_PATTERN regex', () => {
  it('matches simple coordinates', () => {
    expect('3,4'.match(COORD_PATTERN)).toBeTruthy();
    expect('0,0'.match(COORD_PATTERN)).toBeTruthy();
    expect('12,34'.match(COORD_PATTERN)).toBeTruthy();
  });

  it('matches with spaces', () => {
    expect(' 3, 4 '.match(COORD_PATTERN)).toBeTruthy();
    expect('3 , 4'.match(COORD_PATTERN)).toBeTruthy();
  });

  it('rejects invalid coordinates', () => {
    expect('abc'.match(COORD_PATTERN)).toBeNull();
    expect('3'.match(COORD_PATTERN)).toBeNull();
    expect('-1,2'.match(COORD_PATTERN)).toBeNull(); // negative not supported by \d+
    expect('3,4,5'.match(COORD_PATTERN)).toBeNull();
  });

  it('extracts q and r values', () => {
    const match = '7, 12'.match(COORD_PATTERN);
    expect(match).toBeTruthy();
    expect(parseInt(match![1], 10)).toBe(7);
    expect(parseInt(match![2], 10)).toBe(12);
  });
});

describe('CommandPalette component', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with search input', () => {
    render(<CommandPalette onClose={onClose} />);
    const input = screen.getByPlaceholderText(/search hexes/i);
    expect(input).toBeInTheDocument();
  });

  it('shows recent and bookmarked hexes when empty', () => {
    render(<CommandPalette onClose={onClose} />);
    // Recent hex (1,0) should appear
    expect(screen.getByText('(1, 0)')).toBeInTheDocument();
    // Bookmarked hex (0,0) should appear (in bookmarks section since it's not in recent)
    expect(screen.getByText('(0, 0)')).toBeInTheDocument();
  });

  it('shows "Jump to" for coordinate input', async () => {
    const user = userEvent.setup();
    render(<CommandPalette onClose={onClose} />);
    const input = screen.getByPlaceholderText(/search hexes/i);
    await user.type(input, '5,3');
    expect(screen.getByText(/jump to/i)).toBeInTheDocument();
  });

  it('shows search results for text queries', async () => {
    const user = userEvent.setup();
    render(<CommandPalette onClose={onClose} />);
    const input = screen.getByPlaceholderText(/search hexes/i);
    await user.type(input, 'dragon');
    // Should find hex 1,0 which has "Dragon Cave" location
    expect(screen.getByText(/1, 0/)).toBeInTheDocument();
  });

  it('shows "No results found" for non-matching query', async () => {
    const user = userEvent.setup();
    render(<CommandPalette onClose={onClose} />);
    const input = screen.getByPlaceholderText(/search hexes/i);
    await user.type(input, 'zzzznonexistent');
    expect(screen.getByText(/no results found/i)).toBeInTheDocument();
  });

  it('calls onClose when clicking overlay', () => {
    render(<CommandPalette onClose={onClose} />);
    const overlay = document.querySelector('.command-palette-overlay');
    expect(overlay).toBeTruthy();
    fireEvent.click(overlay!);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does not close when clicking inside the palette', () => {
    render(<CommandPalette onClose={onClose} />);
    const palette = document.querySelector('.command-palette');
    expect(palette).toBeTruthy();
    fireEvent.click(palette!);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose on Escape key', () => {
    render(<CommandPalette onClose={onClose} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('selects item on Enter and navigates', async () => {
    const user = userEvent.setup();
    render(<CommandPalette onClose={onClose} />);
    screen.getByPlaceholderText(/search hexes/i);
    // Enter with default first item selected (recent hex 1,0)
    await user.keyboard('{Enter}');
    expect(mockSelectHex).toHaveBeenCalledWith({ q: 1, r: 0 });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('navigates results with arrow keys', () => {
    render(<CommandPalette onClose={onClose} />);
    const input = screen.getByPlaceholderText(/search hexes/i);
    // ArrowDown must flush state before Enter reads selectedIndex
    act(() => { fireEvent.keyDown(input, { key: 'ArrowDown' }); });
    act(() => { fireEvent.keyDown(input, { key: 'Enter' }); });
    // Second item should be the bookmarked hex (0,0)
    expect(mockSelectHex).toHaveBeenCalledWith({ q: 0, r: 0 });
  });

  it('selects hex on coordinate jump', async () => {
    const user = userEvent.setup();
    render(<CommandPalette onClose={onClose} />);
    const input = screen.getByPlaceholderText(/search hexes/i);
    await user.type(input, '5,3');
    await user.keyboard('{Enter}');
    expect(mockSelectHex).toHaveBeenCalledWith({ q: 5, r: 3 });
    expect(onClose).toHaveBeenCalledOnce();
  });
});
