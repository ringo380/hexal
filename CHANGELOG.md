# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2026-02-26

### Added
- **Weather Radar Overlay**: Real-time weather simulation with pressure systems, isobars, fronts, cloud cover/shadows, pressure labels, wind arrows, rain/snow/fog/storm particles, and lightning effects rendered via 9-pass canvas pipeline
- **Weather Audio System**: Synthesized ambient sounds via Web Audio API — altitude wind, rain, snow, surface wind with gust LFO, thunder one-shots, and fog drone. Sound shifts with zoom level (thin high-altitude wind at far zoom, full surface weather at close zoom) and blends spatially from hexes near viewport center. Independent toggle and volume slider in layer panel for both DM and player views
- **Quest & Story Arc System**: Campaign-level quests with objectives, status tracking, linked hexes/NPCs/encounters/clues, prerequisite chains, and story arcs that group quests. Includes quest graph visualization, status badges, and cross-entity cleanup on delete
- **Player View**: Second BrowserWindow with fog-of-war, one-way state sync from DM, filtered campaign data (strips DM-only fields), independent layer controls, and keyboard/zoom navigation
- **Session Log**: Timeline-based session logging with tags, in-game timestamps, and per-hex event tracking
- **NPC Relationship & Faction Tracking**: NPC directory with race, class, alignment, attitude, faction membership, and relationship network across the map
- **Enhanced Procedural Generation**: Seeded PRNG (mulberry32), biome clustering, landmark tables, configurable density sliders, and automatic river/road network generation
- **Hex Regions**: Named geographic regions with color overlays, border rendering, region labels, paint mode, multi-select with flood-fill, and context menu for quick creation
- **Search, Filtering & Navigation**: Full-text search, terrain/status/content type/region/bookmark filters, active filter count badge, and command palette (Cmd+K)
- **Encounter Management**: Encounter editor with creature rosters, difficulty ratings, linked NPCs, rewards, outcome tracking, and reusable templates
- **GitHub Pages Documentation Site**: Project landing page with feature showcase and generated screenshots
- **Persistence Layer**: `PersistenceAdapter` interface abstracting campaign I/O, settings system via `electron-store`

### Improved
- **Accessibility**: Focus traps for all modals, live announcer for screen readers, form label associations, icon-only button aria-labels, keyboard accessibility for interactive elements, focus-visible outlines, aria-controls on collapsible sections, canvas alternatives and skip navigation
- **Layer Controls**: Google Maps-style floating panel with toggles for all visual layers (terrain, coordinates, status, content, connections, regions, markers, weather overlay/particles/isobars/fronts/clouds/pressure/wind)

### Fixed
- Weather overlay responsive canvas sizing and layer control state management
- Player view status dots and marker filtering on undiscovered hexes
- Region context menu click handling, multi-select cleared on normal click and campaign switch
- Resolved all npm audit vulnerabilities (jspdf, tar)

### Testing
- Vitest framework with 334 tests covering search, filtering, campaign migration, regions, weather simulation, player view, quests, NPCs, procedural generation, and RNG
- Playwright E2E smoke test suite for Electron app

## [1.2.2] - 2026-01-19

### Security
- Updated jspdf from 3.0.4 to 4.0.0 (fixes GHSA-f8cm-6447-x5h2 path traversal vulnerability)
- Added npm override for tar@7.5.3 (fixes arbitrary file overwrite vulnerability)

### Changed
- Extracted color utilities into dedicated `colorUtils.ts` module
- Improved code organization in hex renderer and marker figurine services

## [1.2.1] - 2026-01-15

### Fixed
- Removed explicit Windows icon configuration (let electron-builder auto-convert)

## [1.2.0] - 2026-01-10

### Added
- **Windows Build Support**: Added Windows target to electron-builder configuration
- **GitHub Actions Release Workflow**: Automated builds and releases via CI/CD
- **Tabletop Figurine Markers**: Place 26+ marker types on hexes (settlements, landmarks, players, hazards)
- **Map Export**: Export maps to PNG, JPEG, or PDF with customizable presets

### Changed
- Updated build configuration for cross-platform support

## [1.1.1] - 2025-12-28

### Security
- Updated Electron from 28.3.3 to 35.7.5 (fixes CVE-2025-55305 ASAR integrity bypass)
- Updated esbuild from 0.21.5 to 0.25.12 (fixes GHSA-67mh-4wv8-2f99 dev server CORS vulnerability)

## [1.1.0] - 2025-12-28

### Added
- **LOD (Level of Detail) System**: 8 zoom levels (0.15x to 5.0x) with progressive detail
- **Inverse Font Scaling**: Smaller fonts at higher zoom levels allow more text to display without truncation
- **Compact Content Indicators**: Color-coded dots in a row showing content types per hex
- **Multiple Content Display**: Show multiple location/content titles at high zoom with "+N more" overflow indicator
- **Time Tracking System**: In-game calendar with configurable time advancement
- **Weather Simulation**: Dynamic weather with terrain-based modifiers
- **TimeWeatherBar**: Status bar showing current time and weather conditions
- **Weather Settings Modal**: Configure weather patterns and effects

### Changed
- Improved hex grid rendering performance
- Enhanced zoom and pan with smooth animations
- Updated content indicator positioning for better visibility

## [1.0.0] - 2025-12-25

### Added
- Initial release
- Hex grid editor with canvas-based rendering
- Campaign management (create, save, load, export)
- Content tracking (locations, encounters, NPCs, treasures, clues)
- Discovery status system (undiscovered, discovered, cleared)
- Procedural terrain and encounter generation
- Multi-window support
- Autosave with 2-second debounce
- Undo/redo history (50 states)
- Export to JSON and Markdown formats
- macOS builds (Intel x64 and Apple Silicon arm64)
