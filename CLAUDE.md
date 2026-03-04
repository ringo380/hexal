# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hexal is a cross-platform desktop application for managing D&D hex crawl campaigns, built with Electron + React + TypeScript.

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start Vite dev server + Electron (hot reload)
npm run build        # Full production build (TypeScript + Vite + electron-builder)
npm run build:mac    # macOS-only build (x64 + arm64 DMG/ZIP)
npm run preview      # Preview production build locally
npm run electron     # Run Electron directly (for testing compiled code)
```

**Screenshots**: `npm run screenshots` (requires `npm run dev` running — captures 13 docs screenshots via Playwright)

**Quick type check**: `npx tsc --noEmit` (faster than full build for catching errors)

**Testing**: `npx vitest run` to run the test suite.

## Architecture

### Electron Process Model

```
electron/main.ts      → Main process: windows, menus, file I/O, IPC handlers
electron/preload.ts   → Security bridge: contextBridge exposes IPC to renderer
src/                  → Renderer process: React application
```

IPC is secured with `nodeIntegration: false` and `contextIsolation: true`. The preload script exposes a typed `window.electronAPI` interface.

### React Application Structure

- **State**: Context + useReducer pattern in `src/stores/`
  - `CampaignContext` - Main state with undo/redo history (50-state limit)
  - `SelectionContext` - Hex selection and filtering
  - `SettingsContext` - App settings (AI keys, cloud config, preferences) wrapping electron-store IPC
- **Services**: Utility functions in `src/services/`
  - `persistence/` - PersistenceAdapter interface + LocalPersistenceAdapter (abstracts storage backend)
  - `hexGeometry.ts` - Canvas-based hex rendering, coordinate math, and hex neighbor utilities
  - `regions.ts` - Region utility functions (lookup, contiguity, border detection)
  - `generator.ts` - Procedural terrain/encounter generation
  - `rng.ts` - Seeded PRNG (mulberry32) — use instead of `Math.random()` for deterministic generation
  - `time.ts` / `weather.ts` - Calendar systems and weather simulation
  - `weatherGradient.ts` / `weatherParticles.ts` / `weatherRadar.ts` / `weatherLightning.ts` - Weather overlay rendering (gradient, particles, radar features, lightning)
  - `questService.ts` - Quest/StoryArc CRUD, cross-entity cleanup (follows npcService pattern)
  - `templateService.ts` - Template extract/validate/wrap/encode/decode/customize. When renaming entities referenced by string name elsewhere (e.g., terrain name in encounter tables), the rename must cascade to all referencing objects.
- **Data**: Static default tables in `src/data/`
  - `generatorTables.ts` - Default encounter and landmark tables (10 terrain types)
  - `campaignTemplates/` - Pre-built campaign templates (10 settings), barrel exports `CAMPAIGN_TEMPLATES` array + `getTemplateById()`
- **Components**: `src/components/` with feature subdirectories
  - `encounters/` - Encounter-specific components (badges, editors, row)
  - `quests/` - Quest components (status badge, row, detail panel, graph, story arc editor)
  - `modals/` - All modal dialogs
  - `ui/` - Shared UI components (ContentItemRow)
  - `icons/` - Duotone SVG icon system (Icon.tsx with IconName type union)
  - `HexGrid.tsx` uses HTML5 Canvas for rendering
  - Three-column layout: Sidebar | HexGrid | HexDetail

### Data Flow

1. Campaign files (`.hexal` or `.json`) stored in `~/Documents/Hexal/`
2. Main process handles file I/O via IPC
3. Campaign state managed in CampaignContext with autosave (2s debounce)
4. Undo/redo maintains circular buffer of 50 history states

## Key Data Models

Campaign → contains hexes as `Record<"q,r", Hex>`
Campaign.schemaVersion → migration versioning (current: 2), Campaign.version → monotonic save counter for sync
Hex → terrain, status (undiscovered/discovered/cleared), content arrays
ContentItem → title, description, difficulty, isResolved (used for locations, encounters, NPCs, treasures, clues)
Encounter extends ContentItem → encounterType, creatures, linkedNpcIds, rewards, outcome (used for hex encounters)
EncounterTemplate → reusable encounter blueprints stored at campaign level
LandmarkTable → id, name, terrain, entries[] (campaign-level, used by procedural generation)
GenerationConfig → seed, biomeClusteringStrength, encounterDensity, landmarkDensity, terrainVariety
HexConnections → rivers: HexEdge[], roads: HexEdge[] (optional on Hex, edges 0-5)
Region → id, name, color, description, hexKeys[], tags, isDiscovered, notes (campaign-level, one-region-per-hex)
Quest → id, title, description, status, objectives[], linkedHexKeys/NpcRefs/EncounterIds/ClueIds, storyArcId?, prerequisiteQuestIds, isVisibleToPlayers, tags (campaign-level)
StoryArc → id, title, description, questIds[], status, isVisibleToPlayers, color (campaign-level, groups quests)
CampaignTemplate → id, name, description, icon, terrainTypes, encounterTables, landmarkTables, factions, regions, calendarPreset, generationConfig (static data in `src/data/campaignTemplates/`, instantiated via `createCampaignFromTemplate()`)

Hex coordinates use axial system (q, r) with odd-q vertical offset layout.

## Build Output

- `dist/` - Compiled React application
- `dist-electron/` - Compiled Electron main/preload
- `release/` - Final DMG/ZIP packages
- `docs/` - GitHub Pages site (deployed via `.github/workflows/pages.yml`)
- `docs/screenshots/` - Generated by `npm run screenshots`, committed to repo

## Style Guidelines

- Dark mode aesthetic (background: `#1e1e1e`)
- Uses CSS in `src/styles/` - no CSS framework
- **Shared CSS classes**: `.tab-btn` (global tab button with hover/active), `.empty-hint` (dim italic placeholder text for empty sections), `.btn-icon-small` (small icon-only buttons)

## Patterns & Conventions

- **Git workflow**: Always use feature branches + PRs. Never push directly to `main`. Create a branch, commit, push with `-u`, and open a PR via `gh pr create`.
- **GitHub Project**: "Hexal Development" is Project #11 under `ringo380`. Use `gh project item-list 11 --owner ringo380 --format json` to query items.
- **Adding optional Campaign fields**: Add as `fieldName?: Type` for backward compat, default in `createCampaign()`, migrate in `migrateCampaign()` called at load time. This also applies to fields on nested persisted objects like `WeatherSimulationConfig` — add defaults in `createDefaultSimulationConfig()` and migrate in `migrateCampaign()`.
- **Adding new IPC channels**: Update 3 files: `electron/main.ts` (handler), `electron/preload.ts` (bridge + local type), `src/global.d.ts` (renderer type). Dialog handlers must use `activeWindow ?? BrowserWindow.getFocusedWindow()` (not just `getFocusedWindow()`) since menu activation can briefly defocus windows. File handlers accepting user-provided paths must validate with `path.resolve()` + `startsWith(folder + path.sep)` to prevent path traversal.
- **Persistence**: All campaign save/load/list/delete goes through `PersistenceAdapter` (injected into `CampaignProvider`), never direct `window.electronAPI` calls from components
- **Settings**: Use `useSettings()` from `SettingsContext` for app preferences. Stored via `electron-store` in main process.
- **Batch hex updates**: When modifying many hexes at once (e.g., generation), use single `updateCampaignData({ hexes: {...} })` — not per-hex loops — for one undo state and one autosave
- **Campaign-level CRUD**: Use `updateCampaignData()` from context (dispatches `UPDATE_CAMPAIGN`) — handles history, undo/redo, autosave
- **Service functions** (`npcService`, `questService`): Pure functions taking `campaign` as first arg, returning partial updates for `updateCampaignData()`. Cascade-delete helpers clean up cross-entity references.
- **Cross-entity delete cleanup**: When deleting entities (NPCs, factions, encounters, clues), call the corresponding `remove*FromQuests()` function from questService to clean dangling references. Wire cleanup into the UI handler that performs the delete.
- **Feature components**: Group in `src/components/<feature>/` subdirectory
- **Types**: Define in `src/types/Campaign.ts`, re-exported via `src/types/index.ts`
- **Creating terrain types programmatically**: Always set `isDefault: false` — `migrateTerrainTypes` backfills `isDefault: true` for any terrain name matching a built-in default, blocking deletion in the Terrain Editor.
- **Outside-click dismissal**: Use ref-based `contains()` checks, NOT `stopPropagation()` + `window` listener. React synthetic `stopPropagation` does not prevent native `window.addEventListener` handlers from firing.
- **Session-only UI state**: `SelectionProvider` wraps the entire app and persists across campaign open/close. New session-only state (e.g., `multiSelectedKeys`) must be cleared on campaign change — add a `useEffect` watching `campaign?.id` in `MainEditor`.

### Accessibility Infrastructure

- **Focus trap**: All modals use `useFocusTrap({ onEscape: onClose })` from `src/hooks/useFocusTrap.ts`. Attach returned ref to the `.modal` div. The hook handles Tab/Shift+Tab cycling, Escape dispatch (with containment check for nested modals), and focus restore on unmount. Prefers `[autofocus]` elements over `focusable[0]`.
- **Screen reader announcements**: Use `useAnnounce()` from `src/stores/AnnouncerContext.tsx`. Call `announce(message)` for dynamic content changes. Skip initial mount with a `useRef` flag when announcing filter results.
- **Visually hidden text**: Use `.sr-only` CSS class for screen-reader-only content.
- **Skip link**: `MainEditor.tsx` has a "Skip to map" link targeting `#main-content` on the grid panel.
- **Canvas accessibility**: Use `role="img"` + `aria-label` only on non-interactive canvases (HexGrid, PlayerHexGrid). Do NOT use `role="img"` on interactive canvases with click/drag handlers (QuestGraph, RelationshipWebModal).
- **Form labels**: Use `htmlFor`+`id` for standalone labels. Use `aria-label` with row index for inputs in repeating rows (e.g., `` aria-label={`Creature ${idx + 1} name`} ``).
- **Icon-only buttons**: Always add `aria-label` to buttons that only contain an icon.
- **No nested interactive elements**: Never nest `<button>` inside `<button>` (invalid HTML). Use `<div role="button" tabIndex={0}>` with `onKeyDown` for Enter/Space when an interactive container needs a nested button (e.g., card with delete button).

### Canvas Rendering Passes (HexGrid.tsx)

Hex backgrounds → Connections (rivers/roads) → Region borders → Region labels → **Weather overlay** → Markers/icons. Insert new render layers in correct pass order.

### Weather Overlay System

- **Services**: `weatherGradient.ts` (color maps, isobars, fronts), `weatherParticles.ts` (rain/snow/wind/fog/storm particle pool), `weatherRadar.ts` (pressure labels, wind arrows, cloud cover/shadows), `weatherLightning.ts` (flash effects)
- **Audio**: `weatherAudioService.ts` is a singleton with async sample loading (`public/audio/weather/*.mp3`). `ensureGraph()` is async — callers must handle the promise. `useWeatherAudio.ts` hook bridges camera state to audio params with BFS spatial sampling.
- **Campaign time mode**: `WeatherSimulationConfig.timeMode` can be `'realtime'` (auto-tick) or `'campaign'` (manual advance via `ADVANCE_TICKS` worker message, triggered by +1h/+6h/+1d buttons at 4 ticks/hour).
- **Hook**: `useWeatherOverlay.ts` orchestrates all weather rendering in 9-pass order: cloud shadows → gradient → cloud cover → isobars → fronts → pressure labels → wind arrows → particles → lightning
- **Layer visibility**: New weather layers (`cloudShadows`, `pressureLabels`, `windArrows`) are in `LayerVisibility` and `PlayerLayerVisibility`. Passed to `useWeatherOverlay` via `layerFlags` option.
- **Offscreen canvas pattern**: Cloud cover, cloud shadows, and gradient all render to offscreen canvases (cached by field/camera state), then composite onto main canvas. Cloud shadows use `globalCompositeOperation = 'multiply'`.
- **Isobars/fronts are NOT DM-only**: They render for both DM and player views (gated by `config.showIsobars`/`config.showFronts` + layer visibility, not by `isDMView`).

### TypeScript Configuration Quirks

- **Renderer types for `window.electronAPI`**: Defined in `src/global.d.ts` (NOT `electron/preload.ts`). When adding new IPC methods, update BOTH `electron/preload.ts` AND `src/global.d.ts`. Keep type names consistent across both files.
- **`global.d.ts` scoping**: Because the file has `export {}`, top-level interfaces are module-scoped. Types that need to be referenced by name from components must go inside the `declare global {}` block.
- **`tsconfig.node.json` targets ES3 by default**: `electron/` code cannot use `for...of` on `Set`/`Map` — use `Array.from().forEach()` instead.

### Migration Test Pattern

When adding fields to `migrateCampaign()`, update the "returns same reference when no migration needed" test in `campaign.test.ts` to include the new fields — otherwise it will fail because migration adds properties that weren't on the input object.

### Player View System

Second BrowserWindow loaded with `#player-view` hash. State flows one-way: DM renderer → main process (`sync-player-view` IPC) → player window(s) (`player-view-update` IPC). `ViewModeContext` in `src/stores/` branches the React app between DM and Player modes. `playerViewFilter.ts` strips DM-only data before transmission. Player components live in `src/components/player/`.

**Web Player Server**: `electron/webServer.ts` runs an HTTP + WebSocket server in the main process for remote browser-based player views. The `sync-player-view` IPC handler broadcasts to both Electron windows and web clients. Web player has its own Vite config (`vite.config.web-player.ts`), entry point (`web-player.html` → `src/web-player-main.tsx`), and root component (`WebPlayerApp.tsx`). Server settings (`port`, `autoStart`) live in `electron-store` under `server.*`. Build output: `dist-web-player/`.

**Adding visual features to the hex grid**: `PlayerHexGrid.tsx` has its own canvas render passes separate from `HexGrid.tsx`. New visual layers (connections, overlays, etc.) must be added to BOTH renderers. Additionally, new map-visible fields on `Hex` must be explicitly added to the `PlayerHex` interface in `playerViewFilter.ts` (it does not inherit from `Hex`).

**Adding player-visible campaign entities**: In `playerViewFilter.ts`, add `Player*` interface (whitelist fields), filter by `isVisibleToPlayers`, strip DM-only fields (dmNotes, tags, internal IDs). Add to `PlayerCampaign` interface and `filterCampaignForPlayer()`. Add tests in `playerViewFilter.test.ts`.
