# Hexal - Comprehensive Codebase Analysis

**Generated**: 2026-03-30
**Version**: 1.3.0
**Repository**: https://github.com/ringo380/hexal

---

## 1. Project Overview

**Hexal** is a cross-platform desktop application for managing D&D hex crawl campaigns. It provides a visual hex grid editor, procedural generation, weather simulation, player view with fog of war, and cloud sync capabilities.

| Attribute | Value |
|-----------|-------|
| **Type** | Desktop application (Electron) + Web player |
| **Language** | TypeScript (strict mode) |
| **Frontend** | React 18 with HTML5 Canvas |
| **Desktop** | Electron 35 |
| **Build** | Vite 5, electron-builder |
| **State** | React Context + useReducer |
| **Database** | Local filesystem (`.hexal` files) + Supabase (cloud) + IndexedDB (offline cache) |
| **Auth** | Clerk v6 (OAuth, conditional) |
| **Testing** | Vitest + Playwright |
| **License** | MIT |
| **Total TS/TSX LOC** | ~45,500 (src/) + ~1,000 (electron/) |
| **CSS LOC** | ~7,800 |
| **Source Files** | 201 TS/TSX in src/, 3 in electron/ |

---

## 2. Architecture Pattern

Hexal follows a **three-tier architecture** within a single Electron application:

```
┌──────────────────────────────────────────────────────────────────┐
│                        Electron Shell                            │
│  ┌────────────────────┐    IPC Bridge    ┌────────────────────┐  │
│  │   Main Process     │◄═══════════════►│  Renderer Process  │  │
│  │  electron/main.ts  │   (preload.ts)   │    src/ (React)    │  │
│  │  - File I/O        │                  │  - Canvas Grid     │  │
│  │  - Windows         │                  │  - State Mgmt      │  │
│  │  - Menus           │                  │  - UI Components   │  │
│  │  - Web Server      │                  │  - Weather Engine   │  │
│  └────────────────────┘                  └────────────────────┘  │
│           │                                        │             │
│           ▼                                        ▼             │
│   ~/Documents/Hexal/                     ┌─────────────────┐    │
│   (local .hexal files)                   │  Supabase Cloud  │    │
│                                          │  + IndexedDB     │    │
│                                          └─────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────┐     ┌─────────────────────┐
│  Player Window      │     │  Web Player (HTTP)   │
│  (Electron #2)      │     │  (Browser clients)   │
│  Fog-of-war view    │     │  WebSocket sync      │
└─────────────────────┘     └─────────────────────┘
```

**Key design decisions:**
- **Canvas rendering** over DOM for hex grid performance (60fps with LOD)
- **Web Workers** for procedural generation and weather simulation (non-blocking)
- **PersistenceAdapter pattern** for swappable storage backends
- **Preload bridge** for secure IPC (contextIsolation: true)
- **One-way data flow** from DM to player views

---

## 3. Detailed Directory Structure

```
hexal/
├── electron/                    # Electron main process (1,032 LOC)
│   ├── main.ts                 # Window mgmt, menus, IPC handlers, web server
│   ├── preload.ts              # contextBridge API definitions
│   └── webServer.ts            # HTTP + WebSocket server for web player
│
├── src/                        # Renderer process - React app (~45,500 LOC)
│   ├── main.tsx                # App entry: provider hierarchy, routing
│   ├── web-player-main.tsx     # Web player entry point
│   ├── global.d.ts             # ElectronAPI TypeScript declarations
│   │
│   ├── components/             # React components (87 .tsx files)
│   │   ├── MainEditor.tsx      # Three-column layout hub (686 lines)
│   │   ├── HexGrid.tsx         # Canvas hex grid renderer (1,603 lines)
│   │   ├── HexDetail.tsx       # Selected hex detail panel (1,210 lines)
│   │   ├── Sidebar.tsx         # Navigation sidebar
│   │   ├── CampaignBrowser.tsx  # Campaign list/open/create
│   │   ├── CommandPalette.tsx   # Cmd+K quick search
│   │   ├── LayerControl.tsx     # Map layer toggles
│   │   ├── MarkerPalette.tsx    # Draggable map markers
│   │   ├── TimeWeatherBar.tsx   # Time/weather display
│   │   ├── HexContextMenu.tsx   # Right-click menu
│   │   ├── ErrorBoundary.tsx    # Error boundary
│   │   ├── PlayerNotesViewer.tsx # DM view of player notes
│   │   │
│   │   ├── modals/             # All modal dialogs (22 modals)
│   │   │   ├── GeneratorModal.tsx
│   │   │   ├── MapExportModal.tsx
│   │   │   ├── RegionManagerModal.tsx
│   │   │   ├── TerrainEditorModal.tsx
│   │   │   ├── WeatherSettingsModal.tsx
│   │   │   ├── QuestManagerModal.tsx
│   │   │   ├── NpcDirectoryModal.tsx
│   │   │   ├── SessionLogModal.tsx
│   │   │   ├── SettingsModal.tsx
│   │   │   └── ... (13 more)
│   │   │
│   │   ├── encounters/         # Encounter system components
│   │   │   ├── EncounterEditorModal.tsx
│   │   │   ├── EncounterRow.tsx
│   │   │   ├── EncounterDetailView.tsx
│   │   │   ├── CreatureList.tsx
│   │   │   ├── RewardList.tsx
│   │   │   ├── NpcLinker.tsx
│   │   │   └── *Badge.tsx      # Type, Difficulty, Outcome badges
│   │   │
│   │   ├── quests/             # Quest management
│   │   │   ├── QuestGraph.tsx   # Visual quest dependency graph
│   │   │   ├── QuestDetailPanel.tsx
│   │   │   ├── StoryArcEditor.tsx
│   │   │   └── QuestRow.tsx, QuestStatusBadge.tsx
│   │   │
│   │   ├── npcs/               # NPC system
│   │   │   ├── NpcEditorModal.tsx
│   │   │   ├── FactionManager.tsx
│   │   │   ├── RelationshipEditor.tsx
│   │   │   └── *Badge.tsx      # Alignment, Attitude, Faction, Relationship
│   │   │
│   │   ├── player/             # Player view components
│   │   │   ├── PlayerApp.tsx    # Desktop player window root
│   │   │   ├── WebPlayerApp.tsx # Browser player root
│   │   │   ├── PlayerHexGrid.tsx # Fog-of-war hex grid (814 lines)
│   │   │   ├── PlayerView.tsx   # Player layout
│   │   │   ├── PlayerSidebar.tsx
│   │   │   ├── PlayerJournal.tsx # Player notes system
│   │   │   ├── EncounterOverlay.tsx # Theater-of-mind encounters
│   │   │   ├── PlayerQuestLog.tsx
│   │   │   └── ... (messaging, notes, connection status)
│   │   │
│   │   ├── travel/             # Travel mode
│   │   │   └── TravelPanel.tsx
│   │   │
│   │   ├── sessions/           # Session logging
│   │   │   ├── SessionEntryEditor.tsx
│   │   │   └── SessionTagBadge.tsx
│   │   │
│   │   ├── weather/            # Weather UI
│   │   │   ├── WeatherRadarToggle.tsx
│   │   │   └── WeatherEventBadge.tsx
│   │   │
│   │   ├── auth/               # Authentication
│   │   │   ├── LoginModal.tsx
│   │   │   └── ProfileMenu.tsx
│   │   │
│   │   ├── icons/              # Icon system
│   │   │   └── Icon.tsx        # 1,582 lines - duotone SVG icon library
│   │   │
│   │   └── ui/                 # Shared UI primitives
│   │       ├── ContentItemRow.tsx
│   │       ├── ConnectionStatus.tsx
│   │       └── PresenceAvatars.tsx
│   │
│   ├── stores/                 # State management (12 contexts)
│   │   ├── CampaignContext.tsx  # Campaign state + undo/redo (1,284 lines)
│   │   ├── WeatherSimulationContext.tsx # Weather engine bridge
│   │   ├── ToastContext.tsx     # Toast notifications + history
│   │   ├── SelectionContext.tsx # Hex selection state
│   │   ├── HexSelectionContext.tsx # Multi-hex selection
│   │   ├── FilterContext.tsx    # Content filtering
│   │   ├── SettingsContext.tsx   # App preferences (electron-store)
│   │   ├── AuthContext.tsx      # Clerk authentication
│   │   ├── ViewModeContext.tsx   # DM vs Player mode
│   │   ├── LayerVisibilityContext.tsx # Map layer toggles
│   │   ├── AnnouncerContext.tsx  # Screen reader announcements
│   │   └── CommandPaletteContext.tsx # Command palette state
│   │
│   ├── services/               # Business logic (46 .ts files)
│   │   ├── persistence/        # Storage abstraction
│   │   │   ├── index.ts        # Factory: createPersistenceAdapter()
│   │   │   ├── types.ts        # PersistenceAdapter interface
│   │   │   ├── localAdapter.ts  # Electron IPC file adapter
│   │   │   └── cloudAdapter.ts  # Supabase + IndexedDB adapter
│   │   │
│   │   ├── weather/            # Weather simulation engine
│   │   │   ├── FluidWeatherEngine.ts # Fluid dynamics (723 lines)
│   │   │   ├── PerlinWeatherEngine.ts # Perlin noise weather
│   │   │   ├── WeatherSimulator.ts # Orchestrator
│   │   │   ├── WeatherField.ts  # Grid state
│   │   │   ├── WeatherEvents.ts # Storm events
│   │   │   └── perlin.ts       # Perlin noise implementation
│   │   │
│   │   ├── hexGeometry.ts      # Hex coordinate math (odd-q layout)
│   │   ├── hexRenderer.ts      # Canvas rendering passes (1,096 lines)
│   │   ├── gridRenderer.ts     # Grid rendering context
│   │   ├── generator.ts        # Procedural generation (715 lines)
│   │   ├── playerViewFilter.ts  # Fog-of-war data filtering
│   │   ├── mapExport.ts        # PNG/JPEG/PDF export
│   │   ├── markerFigurines.ts   # Marker catalog + rendering
│   │   ├── weather.ts          # Weather calculation API
│   │   ├── weatherGradient.ts   # Weather gradient rendering
│   │   ├── weatherParticles.ts  # Rain/snow particle system
│   │   ├── weatherRadar.ts      # Radar overlay rendering
│   │   ├── weatherLightning.ts  # Lightning flash effects
│   │   ├── weatherAudioService.ts # Web Audio weather sounds
│   │   ├── npcService.ts        # NPC CRUD + cascade delete
│   │   ├── questService.ts      # Quest/StoryArc management
│   │   ├── templateService.ts   # Template extract/customize
│   │   ├── travelService.ts     # A* pathfinding + movement
│   │   ├── search.ts           # Full-text hex search
│   │   ├── sessionLog.ts       # Session logging
│   │   ├── regions.ts          # Region border detection
│   │   ├── rng.ts              # Seeded PRNG (mulberry32)
│   │   ├── export.ts           # JSON/Markdown export
│   │   ├── cloudStorage.ts      # Supabase operations
│   │   ├── localCache.ts        # IndexedDB caching (Dexie)
│   │   ├── storageLayer.ts      # Cache-first storage
│   │   ├── syncEngine.ts        # Conflict-free sync
│   │   ├── connectionManager.ts # Online/offline status
│   │   ├── supabaseClient.ts    # Supabase init
│   │   ├── colorUtils.ts        # Hex color manipulation
│   │   ├── audioService.ts      # Sound effects
│   │   └── *WorkerProtocol.ts   # Worker message types
│   │
│   ├── hooks/                  # Custom React hooks (7 files)
│   │   ├── useWeatherOverlay.ts # 9-pass weather rendering orchestration
│   │   ├── useGridNavigation.ts # Arrow key hex navigation
│   │   ├── useMarkerDrag.ts     # Marker drag-and-drop
│   │   ├── useFocusTrap.ts      # Modal focus trapping
│   │   ├── useWeatherAudio.ts   # Weather audio bridge
│   │   ├── useInlineEdit.ts     # Contenteditable fields
│   │   └── useTimeSince.ts      # Relative time display
│   │
│   ├── types/                  # TypeScript type definitions
│   │   ├── Campaign.ts         # Core data model (1,193 lines)
│   │   ├── Weather.ts          # Weather types
│   │   ├── MapExport.ts        # Export option types
│   │   ├── Quest.ts            # Quest/StoryArc types
│   │   ├── Markers.ts          # Marker types
│   │   ├── CampaignTemplate.ts # Template type
│   │   ├── LayerVisibility.ts  # Layer toggle types
│   │   └── index.ts            # Barrel export
│   │
│   ├── data/                   # Static data
│   │   ├── calendars.ts        # D&D calendar systems
│   │   ├── generatorTables.ts  # Encounter/landmark tables
│   │   ├── weatherEffects.ts   # Weather effect definitions
│   │   └── campaignTemplates/  # 10 D&D setting templates
│   │       ├── index.ts        # CAMPAIGN_TEMPLATES array
│   │       ├── swordCoast.ts, barovia.ts, chult.ts, ...
│   │       └── (10 settings total)
│   │
│   ├── styles/                 # CSS styles
│   │   └── app.css             # All styles (~7,800 lines)
│   │
│   └── __tests__/              # Unit tests (19 test files)
│       ├── campaign.test.ts
│       ├── generator.test.ts
│       ├── playerViewFilter.test.ts
│       ├── regions.test.ts
│       ├── weatherSimulator.test.ts
│       └── ... (14 more)
│
├── e2e/                        # End-to-end tests
│   ├── smoke.mjs               # Electron smoke test
│   ├── capture-screenshots.mjs  # Documentation screenshots
│   └── fixtures/               # Test data
│       └── showcase-campaign.hexal
│
├── supabase/                   # Cloud database
│   └── migrations/
│       ├── 001_initial_schema.sql  # Core tables
│       ├── 002_rls_policies.sql    # Row-level security
│       └── 003_functions.sql       # Database functions
│
├── public/                     # Static assets
│   └── audio/weather/          # Weather sound samples
│       ├── rain-loop.mp3, snow-loop.mp3
│       ├── wind-loop.mp3, fog-drone.mp3
│       └── thunder-1/2/3.mp3
│
├── docs/                       # GitHub Pages site
│   ├── index.html              # Landing page
│   └── screenshots/            # Auto-captured screenshots
│
├── .github/workflows/
│   ├── release.yml             # Build + publish on version tags
│   └── pages.yml               # Deploy docs to GitHub Pages
│
├── vite.config.ts              # Desktop app Vite config
├── vite.config.web-player.ts   # Web player Vite config
├── vitest.config.ts            # Test configuration
├── tsconfig.json               # Renderer TypeScript config
├── tsconfig.node.json          # Node/Electron TypeScript config
├── package.json                # Dependencies and scripts
└── CHANGELOG.md                # Release history
```

---

## 4. Core Application Files

### Entry Points
| File | Purpose |
|------|---------|
| `electron/main.ts` | Electron main process: windows, menus, IPC, file I/O |
| `electron/preload.ts` | Security bridge: contextBridge exposes typed API |
| `src/main.tsx` | React entry: provider hierarchy, DM/Player routing |
| `src/web-player-main.tsx` | Web player entry for browser-based player view |
| `index.html` | Desktop app HTML shell |
| `web-player.html` | Web player HTML shell |

### State Management
| Context | Lines | Role |
|---------|-------|------|
| `CampaignContext` | 1,284 | Campaign CRUD, undo/redo (50 states), autosave |
| `WeatherSimulationContext` | 295 | Weather engine bridge + field versioning |
| `ToastContext` | 273 | Toast notifications with action buttons + history |
| `HexSelectionContext` | 135 | Multi-hex selection (Shift/Ctrl+click) |
| `FilterContext` | 123 | Terrain/status/content filtering |
| `SettingsContext` | 118 | electron-store wrapped preferences |
| `AuthContext` | 99 | Clerk authentication + Supabase JWT bridge |
| `ViewModeContext` | 17 | DM vs Player mode toggle |
| `SelectionContext` | 43 | Single hex selection |
| `LayerVisibilityContext` | 61 | Map layer toggles |
| `AnnouncerContext` | 42 | Screen reader live region |
| `CommandPaletteContext` | 38 | Command palette open/close |

### Rendering Pipeline
| Component | Lines | Role |
|-----------|-------|------|
| `HexGrid.tsx` | 1,603 | Interactive canvas: zoom/pan/select/LOD/markers |
| `PlayerHexGrid.tsx` | 814 | Player canvas: fog-of-war, read-only |
| `hexRenderer.ts` | 1,096 | Canvas rendering passes |
| `gridRenderer.ts` | 315 | Grid rendering context + LOD manager |
| `hexGeometry.ts` | 220 | Hex coordinate math (odd-q vertical) |

**Canvas Render Pass Order:**
1. Hex backgrounds (terrain colors)
2. Connections (rivers/roads)
3. Region borders (color-coded)
4. Region labels
5. Weather overlay (9 sub-passes)
6. Travel path
7. Markers/icons
8. Character tokens
9. Party position

---

## 5. Data Layer

### Local Storage
- Campaign files saved as `.hexal` (JSON) in `~/Documents/Hexal/`
- File I/O through Electron main process IPC
- Autosave with 2-second debounce
- Version counter incremented on each save

### Cloud Storage (Supabase)
**Tables:**
| Table | Purpose |
|-------|---------|
| `profiles` | User accounts (Clerk-linked) |
| `campaigns` | Campaign metadata + JSONB data |
| `hexes` | Individual hex cells (campaign_id + hex_key) |
| `regions` | Geographic regions |
| `campaign_members` | Role-based access (owner/dm/player/viewer) |
| `invite_links` | Shareable campaign invites |

**Sync strategy:** Offline-first with IndexedDB (Dexie) cache, Supabase realtime subscriptions, conflict resolution via version counters.

### Schema Migrations
- `migrateCampaign()` handles backward compatibility
- `schemaVersion` field (current: 2) for structural migrations
- `version` field (monotonic counter) for sync conflict detection

---

## 6. API & IPC Analysis

### Electron IPC Channels

**Campaign Operations:**
| Channel | Direction | Purpose |
|---------|-----------|---------|
| `list-campaigns` | Renderer → Main | List saved campaigns |
| `save-campaign` | Renderer → Main | Save campaign to disk |
| `load-campaign` | Renderer → Main | Load campaign from disk |
| `delete-campaign` | Renderer → Main | Delete campaign file |

**File Dialogs:**
| Channel | Direction | Purpose |
|---------|-----------|---------|
| `show-open-dialog` | Renderer → Main | Open file picker |
| `show-save-dialog` | Renderer → Main | Save file picker |
| `export-file` | Renderer → Main | Export campaign data |
| `export-binary` | Renderer → Main | Export PNG/JPEG/PDF |

**Player View:**
| Channel | Direction | Purpose |
|---------|-----------|---------|
| `sync-player-view` | Renderer → Main → Player | One-way state sync |
| `player-view-update` | Main → Player | Filtered campaign data |
| `encounter-reveal` | Main → Player | Theater-of-mind encounter |
| `encounter-dismiss` | Main → Player | Clear encounter |
| `player-note-save` | Player → Main → DM | Player note sync |
| `dm-message` | Main → Player | DM text messages |

**Settings & Templates:**
| Channel | Direction | Purpose |
|---------|-----------|---------|
| `get-settings` / `set-settings` | Renderer ↔ Main | electron-store access |
| `list-templates` / `save-template` / `delete-template` | Renderer ↔ Main | Template CRUD |

**Web Server:**
| Channel | Direction | Purpose |
|---------|-----------|---------|
| `web-server-start` / `web-server-stop` | Renderer → Main | HTTP server control |
| `web-server-status` | Main → Renderer | Server status updates |

### Web Player API (HTTP + WebSocket)
- HTTP server in `electron/webServer.ts`
- Serves `dist-web-player/` static files
- WebSocket for real-time campaign state sync
- Session state maintained for late-joining clients

---

## 7. Technology Stack Breakdown

### Runtime & Core
| Technology | Version | Purpose |
|------------|---------|---------|
| **Electron** | 35.x | Desktop shell, multi-window, native menus |
| **React** | 18.2 | UI framework |
| **TypeScript** | 5.3+ | Type safety (strict mode) |
| **Vite** | 5.x | Dev server + bundler |
| **electron-builder** | 26.x | Desktop packaging (DMG/ZIP/EXE) |

### Data & Storage
| Technology | Version | Purpose |
|------------|---------|---------|
| **Supabase** | 2.97 | Cloud storage + realtime sync |
| **Dexie** | 4.3 | IndexedDB wrapper (offline cache) |
| **electron-store** | 8.1 | Desktop settings persistence |

### Authentication
| Technology | Version | Purpose |
|------------|---------|---------|
| **Clerk** | 6.x | OAuth (Google, GitHub) with popup flow |

### Rendering & Media
| Technology | Purpose |
|------------|---------|
| **HTML5 Canvas** | Hex grid rendering (60fps) |
| **Web Audio API** | Weather sound synthesis |
| **jsPDF** | PDF map export |
| **Web Workers** | Async generation + weather simulation |

### Testing
| Technology | Version | Purpose |
|------------|---------|---------|
| **Vitest** | 4.x | Unit/integration tests (jsdom) |
| **Playwright** | 1.58 | E2E tests + screenshot capture |
| **Testing Library** | React 16 | Component testing utilities |

### CI/CD
| Technology | Purpose |
|------------|---------|
| **GitHub Actions** | Release builds + Pages deployment |
| **GitHub Pages** | Documentation hosting |
| **Formsubmit.co** | Contact form processing |

---

## 8. Key Design Patterns

### PersistenceAdapter Pattern
```typescript
interface PersistenceAdapter {
  list(): Promise<CampaignListItem[]>;
  save(name: string, campaign: Campaign): Promise<SaveResult>;
  load(path: string): Promise<LoadResult>;
  delete(path: string): Promise<DeleteResult>;
  onRemoteChange?(callback: (campaign: Campaign) => void): () => void;
}
```
Two implementations: `LocalPersistenceAdapter` (Electron IPC) and `CloudPersistenceAdapter` (Supabase + IndexedDB). Factory function `createPersistenceAdapter()` selects implementation.

### Context + useReducer State Management
Campaign state uses a reducer with 50-state undo/redo circular buffer. Actions include `UPDATE_HEX`, `UPDATE_CAMPAIGN`, `SET_CAMPAIGN`, `UNDO`, `REDO`, `MARK_SAVED`. History tracking is automatic for all mutations.

### Canvas LOD (Level of Detail)
8 zoom tiers progressively show/hide visual elements:
- Zoom < 0.3: hex outlines only
- Zoom 0.3-0.5: terrain colors
- Zoom 0.5-0.8: hex coordinates
- Zoom 0.8-1.2: content indicators
- Zoom > 1.2: full labels and icons

### Service Layer Pattern
Pure functions taking `campaign` as first argument, returning partial updates:
```typescript
// npcService.ts
function deleteNpc(campaign: Campaign, npcId: string): Partial<Campaign>
// Returns { npcs, hexes } with all references cleaned up
```

### Web Worker Offloading
- **Generator Worker**: Procedural terrain/encounter generation
- **Weather Worker**: Fluid dynamics simulation tick loop

### Fog-of-War Filtering
`playerViewFilter.ts` strips DM-only data before transmission:
- Undiscovered hexes hidden
- DM notes, tags, internal IDs removed
- Whitelisted `Player*` interfaces for each entity type

---

## 9. Visual Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           ELECTRON MAIN PROCESS                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │ Window Mgmt  │  │  File I/O    │  │  Web Server  │  │  Menus     │ │
│  │ (DM + Player │  │ ~/Docs/Hexal │  │ HTTP + WS    │  │ macOS/Win  │ │
│  │  windows)    │  │ .hexal JSON  │  │ Port config  │  │ shortcuts  │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └────────────┘ │
│         │                 │                  │                          │
│         └────────────┬────┴──────────────────┘                          │
│                      │ IPC (contextBridge)                               │
├──────────────────────┼──────────────────────────────────────────────────┤
│                      ▼                                                   │
│               RENDERER PROCESS (React 18)                                │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                     CONTEXT PROVIDERS                               ││
│  │  Campaign → Selection → Filter → Settings → Auth → Toast → View   ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  ┌──────────────┐  ┌───────────────────────┐  ┌──────────────────────┐ │
│  │   SIDEBAR    │  │      HEX GRID         │  │    HEX DETAIL        │ │
│  │              │  │   (HTML5 Canvas)       │  │                      │ │
│  │ - Navigation │  │ - 60fps render loop    │  │ - Locations          │ │
│  │ - Campaign   │  │ - LOD zoom (8 tiers)   │  │ - Encounters         │ │
│  │   list       │  │ - Pan/zoom/select      │  │ - NPCs               │ │
│  │ - Content    │  │ - Markers              │  │ - Treasures          │ │
│  │   filters    │  │ - Weather overlay      │  │ - Clues              │ │
│  │              │  │ - Region borders       │  │ - Terrain edit       │ │
│  │              │  │ - Travel paths         │  │ - Notes              │ │
│  └──────────────┘  └───────────────────────┘  └──────────────────────┘ │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                        MODALS (22 total)                         │   │
│  │  Generator | RegionMgr | QuestMgr | NpcDir | TerrainEditor     │   │
│  │  MapExport | WeatherSettings | SessionLog | Settings | ...      │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────┐  ┌──────────────────────────────┐    │
│  │     SERVICES                 │  │     WEB WORKERS              │    │
│  │ - hexGeometry (coord math)   │  │ - generatorWorker            │    │
│  │ - hexRenderer (canvas)       │  │   (terrain/content gen)      │    │
│  │ - generator (proc gen)       │  │ - weatherWorker              │    │
│  │ - weather* (simulation)      │  │   (fluid dynamics sim)       │    │
│  │ - npcService (NPC CRUD)      │  │                              │    │
│  │ - questService (quest CRUD)  │  └──────────────────────────────┘    │
│  │ - travelService (A* path)    │                                       │
│  │ - playerViewFilter (FoW)     │                                       │
│  │ - templateService            │                                       │
│  │ - search (full-text)         │                                       │
│  └──────────────────────────────┘                                       │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    PERSISTENCE LAYER                             │   │
│  │  PersistenceAdapter (interface)                                  │   │
│  │  ├── LocalPersistenceAdapter → Electron IPC → ~/Documents/Hexal │   │
│  │  └── CloudPersistenceAdapter → Supabase + IndexedDB (Dexie)     │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
         │ sync-player-view IPC              │ HTTP + WebSocket
         ▼                                    ▼
┌────────────────────┐              ┌────────────────────┐
│  PLAYER WINDOW     │              │  WEB PLAYER        │
│  (Electron #2)     │              │  (Browser)         │
│  - PlayerHexGrid   │              │  - WebPlayerApp    │
│  - Fog of war      │              │  - Same components │
│  - Read-only       │              │  - WebSocket sync  │
│  - Quest log       │              │  - Late-join state │
│  - Journal/Notes   │              │                    │
│  - Encounter       │              │                    │
│    overlay         │              │                    │
└────────────────────┘              └────────────────────┘

         ┌──────────────────────────────┐
         │        SUPABASE CLOUD        │
         │  - campaigns table           │
         │  - hexes table               │
         │  - regions table             │
         │  - campaign_members (RBAC)   │
         │  - invite_links              │
         │  - Row-Level Security        │
         │  - Realtime subscriptions    │
         └──────────────────────────────┘
```

---

## 10. Testing Strategy

### Unit Tests (Vitest)
| Test File | Coverage Area |
|-----------|---------------|
| `campaign.test.ts` | Campaign creation, migration, schema versioning |
| `generator.test.ts` | Procedural generation determinism |
| `playerViewFilter.test.ts` | Fog-of-war data stripping |
| `regions.test.ts` | Region border detection, contiguity |
| `weatherSimulator.test.ts` | Weather engine accuracy |
| `weatherField.test.ts` | Weather field state management |
| `weatherParticles.test.ts` | Particle system behavior |
| `npcService.test.ts` | NPC CRUD + cascade delete |
| `questService.test.ts` | Quest/StoryArc management |
| `templateService.test.ts` | Template extract/customize |
| `travelService.test.ts` | A* pathfinding |
| `search.test.ts` | Full-text search |
| `rng.test.ts` | Seeded PRNG determinism |
| `sessionLog.test.ts` | Session logging |
| `generatorTables.test.ts` | Default table validation |
| `campaignTemplates.test.ts` | Template data integrity |
| `hexRenderer.test.ts` | Rendering utilities |
| `selectioncontext.test.tsx` | Selection state management |
| `commandpalette.test.tsx` | Command palette search |
| `sidebar-filtering.test.ts` | Sidebar filter logic |

### E2E Tests (Playwright)
- `e2e/smoke.mjs` — Electron app launch verification
- `e2e/capture-screenshots.mjs` — 13 documentation screenshots

### Test Commands
```bash
npx vitest run          # Run all unit tests
npx vitest              # Watch mode
npm run test:e2e        # E2E smoke test (requires Electron)
npm run screenshots     # Capture docs screenshots (requires dev server)
```

---

## 11. Environment & Setup

### Environment Variables
| Variable | Required | Purpose |
|----------|----------|---------|
| `VITE_CLERK_PUBLISHABLE_KEY` | Optional | Enables Clerk OAuth (app works without it) |
| `VITE_SUPABASE_URL` | Optional | Supabase cloud URL |
| `VITE_SUPABASE_ANON_KEY` | Optional | Supabase anonymous key |

### Development Setup
```bash
npm install              # Install dependencies
npm run dev              # Start Vite + Electron (hot reload)
npx tsc --noEmit         # Quick type check
npx vitest run           # Run tests
```

### Production Build
```bash
npm run build            # Full build: tsc + vite + web-player + electron-builder
npm run build:mac        # macOS only (DMG + ZIP for x64 + arm64)
```

### Release Process
1. Update version in `package.json`
2. Tag with `v*` pattern (e.g., `v1.3.0`)
3. Push tag → GitHub Actions builds macOS + Windows artifacts
4. Artifacts uploaded to GitHub Releases

---

## 12. Key Insights & Recommendations

### Code Quality Assessment

**Strengths:**
- Well-structured type system with comprehensive Campaign model (1,193 lines of type definitions)
- Clean separation of concerns: stores, services, components, types
- PersistenceAdapter abstraction enables local/cloud flexibility
- Thorough accessibility implementation (focus traps, ARIA, skip links, announcements)
- LOD system provides excellent zoom performance on large grids
- Seeded PRNG ensures deterministic procedural generation
- Migration system handles backward compatibility across versions
- Service layer uses pure functions for testability

**Areas of Note:**
- `app.css` is a single 7,800-line file - could benefit from CSS modules or component-scoped styles
- `HexGrid.tsx` at 1,603 lines handles rendering, interaction, and animation - logic is well-organized but large
- `Icon.tsx` at 1,582 lines contains inline SVG paths - works but is a large single file
- `CampaignContext.tsx` at 1,284 lines manages all campaign state in one reducer - intentional for undo/redo atomicity
- `HexDetail.tsx` at 1,210 lines handles all hex content types in one component

### Security Considerations
- IPC security is well-implemented: `nodeIntegration: false`, `contextIsolation: true`
- Path traversal protection on file handlers (`path.resolve()` + `startsWith()` validation)
- Row-Level Security on Supabase tables
- Clerk OAuth uses popup flow (avoids `file://` redirect issues in Electron)
- `contextBridge` creates frozen objects (prevents monkey-patching)
- Template input sanitization in place

### Performance Architecture
- Canvas rendering (not DOM) for hex grid - critical for large maps
- Web Workers for generation and weather simulation
- LOD system reduces rendering cost at low zoom
- Offscreen canvas caching for weather overlays
- Viewport culling limits rendering to visible hexes
- `fieldVersion` counter avoids unnecessary re-renders (instead of reference equality)
- Canvas text property batching avoids redundant `ctx.font` calls
- Autosave debounce (2s) prevents write storms

### Maintainability Suggestions
1. **CSS modularization**: Consider CSS modules or component-scoped styles to reduce `app.css` size and avoid selector collision risks
2. **Test coverage expansion**: Current tests focus on services/utilities - component integration tests could improve confidence
3. **Player view parity**: `PlayerHexGrid.tsx` must be manually kept in sync with `HexGrid.tsx` render passes - a shared rendering abstraction could reduce this maintenance burden
4. **Weather subsystem complexity**: 12+ files form the weather system - well-organized but represents significant surface area for a TTRPG tool

### Scalability Notes
- Hex grid stored as `Record<"q,r", Hex>` - O(1) lookup by coordinate
- Campaign data is monolithic JSON - cloud sync granularity is at hex level (Supabase `hexes` table)
- 50-state undo history stores full campaign snapshots - memory-intensive for very large maps
- Weather simulation runs at ~10fps in worker, interpolated to 60fps in renderer

---

*Analysis covers Hexal v1.3.0, a mature Electron + React application with ~46,500 lines of TypeScript, 87 React components, 46 service modules, 12 state contexts, and comprehensive D&D campaign management capabilities.*
