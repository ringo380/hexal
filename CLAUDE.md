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
- **Services**: Utility functions in `src/services/`
  - `hexGeometry.ts` - Canvas-based hex rendering, coordinate math, and hex neighbor utilities
  - `regions.ts` - Region utility functions (lookup, contiguity, border detection)
  - `generator.ts` - Procedural terrain/encounter generation
  - `time.ts` / `weather.ts` - Calendar systems and weather simulation
- **Components**: `src/components/` with feature subdirectories
  - `encounters/` - Encounter-specific components (badges, editors, row)
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
Hex → terrain, status (undiscovered/discovered/cleared), content arrays
ContentItem → title, description, difficulty, isResolved (used for locations, encounters, NPCs, treasures, clues)
Encounter extends ContentItem → encounterType, creatures, linkedNpcIds, rewards, outcome (used for hex encounters)
EncounterTemplate → reusable encounter blueprints stored at campaign level
Region → id, name, color, description, hexKeys[], tags, isDiscovered, notes (campaign-level, one-region-per-hex)

Hex coordinates use axial system (q, r) with odd-q vertical offset layout.

## Build Output

- `dist/` - Compiled React application
- `dist-electron/` - Compiled Electron main/preload
- `release/` - Final DMG/ZIP packages

## Style Guidelines

- Dark mode aesthetic (background: `#1e1e1e`)
- Uses CSS in `src/styles/` - no CSS framework

## Patterns & Conventions

- **Adding optional Campaign fields**: Add as `fieldName?: Type` for backward compat, default in `createCampaign()`, migrate in `migrateCampaign()` called at load time
- **Campaign-level CRUD**: Use `updateCampaignData()` from context (dispatches `UPDATE_CAMPAIGN`) — handles history, undo/redo, autosave
- **Feature components**: Group in `src/components/<feature>/` subdirectory
- **Types**: Define in `src/types/Campaign.ts`, re-exported via `src/types/index.ts`
