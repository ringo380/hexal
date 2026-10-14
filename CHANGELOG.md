# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- **Toolbar**: the editor toolbar no longer runs off the right edge of the window. Less frequent actions are grouped into four labelled menus: World (Encounters, Landmarks, Templates, Regions, Terrain, Generate), Story (NPCs, Quests, Sessions, Characters), Players (Player Notes, Message Players) and Export (Export Map, Export Data). Travel, Combat and Dice stay one click away. On narrow windows the toolbar wraps onto a second row instead of scrolling the whole layout sideways. The menus work from the keyboard (arrow keys, Home, End, Escape).

### Security
- Updated Electron to 41.10.7 and electron-builder to 26.17.0, and refreshed dependencies to patched versions of dompurify, fast-uri, @xmldom/xmldom, undici, js-yaml, brace-expansion, source-map-js, http-cache-semantics and vitest.

## [1.5.2] - 2026-10-12

### Fixed
- **Web player join link**: the address shown to the DM returned "Not Found" because the server looked for a page the web player build never creates. It has been broken since the web player was introduced in 1.4.0.
- **Web player on the local network**: the player view crashed before rendering when opened over plain HTTP on a LAN address, because it relied on a browser API that only exists on HTTPS or localhost pages.
- **Web player join address**: on machines with a VPN, WSL, Docker or virtual machine network adapters, the server could show an address players cannot reach. It now uses the address of the real network connection.
- **Windows: campaign names with reserved characters**: a name containing `:` saved without error but left no visible file, so the campaign disappeared from the list, and names containing `?`, `*`, `<`, `>`, `|` or `"` failed to save. These characters are now replaced with `-` in the file name; the campaign name itself is unchanged.
- **Windows**: tooltips and the search box show `Ctrl+` shortcuts instead of the Mac Command symbol, and About Hexal is available from the Help menu.

### Changed
- Added a `build:win` script for Windows builds.

## [1.5.1] - 2026-08-13

### Fixed
- Fixed a TypeScript build error that broke the Linux release build in 1.5.0, leaving that release without Linux packages.

## [1.5.0] - 2026-08-13

### Added
- **Integrated dice roller**: roll standard notation (`2d6+3`, `1d20`, `d%`, multi-term expressions) from the DM toolbar, an Electron player window, or the web player, with quick die buttons, advantage and disadvantage on single d20 rolls, and a session roll history.
- **Hidden rolls**: the DM can roll privately; hidden rolls never reach player views.
- **Shared rolls**: rolls made by the DM or any player appear live in every connected view, and the history is replayed to anyone who joins late.

## [1.4.0] - 2026-08-13

### Added
- **Initiative and combat tracker**: floating panel with initiative order (drag or buttons to reorder), HP damage and healing, conditions, and a round counter. Quick-add expands encounter creatures into numbered combatants with HP prefilled, and the party joins in one click. Players see a live turn-order banner without HP or hidden combatants.
- **Player characters on the map**: character tokens with party grouping, drag-to-move on the DM map, party moves from the context menu, and automatic fan-out when several characters share a hex.
- **Travel mode**: A* route planning over passable terrain, step-by-step party movement with automatic discovery, and a travel log.
- **DM-to-player messaging** with toast notifications and history, and **player journals** that sync both ways.
- **Encounter reveal**: theater-of-mind overlay pushed to player views.
- **Web player**: browser-based player view served over the local network and protected by a PIN, with a mobile-responsive layout and touch gestures.
- **Campaign templates**: ten built-in settings for new campaigns, plus template import and export, a customization wizard, and a community gallery.
- **Custom terrain editor** with hazards, categories, and import and export.
- **Region export** and additional map export options.
- **Accounts and cloud sync**: email and password sign-up with account management, and offline-first cloud sync with conflict detection and merge resolution.
- Actionable toast notifications with a history panel.
- Linux builds (AppImage and deb) alongside macOS and Windows.

### Changed
- Enhanced fog of war with adjacency silhouettes in player views.
- Hex grid and weather rendering performance improvements, and a shared render pipeline for the DM and player maps.
- Visual consistency, save and load feedback, sidebar, and inline editing polish.
- Updated to Electron 41 and Vite 8.

### Fixed
- Undiscovered hexes can no longer be selected in player views.
- Weather overlay rendering, campaign time sync, and sample-based weather audio.

### Security
- Resolved all open Dependabot and npm audit alerts.

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

## [1.2.5] - 2026-01-26

### Changed
- Completed the conversion of all icons to the duotone SVG icon system.

## [1.2.4] - 2026-01-26

### Changed
- Icons upgraded to a duotone style with an accent color.

### Security
- Patched tar and lodash vulnerabilities.

## [1.2.3] - 2026-01-26

### Added
- Keyboard shortcuts reference (Cmd/Ctrl+?).
- Loading states in the export dialogs.
- Windows application icon.

### Changed
- Browser alert and confirm dialogs replaced with themed in-app dialogs.
- Emoji and Unicode buttons replaced with SVG icons.

### Improved
- Accessibility: ARIA labels on all icon-only buttons, dialog roles on all modals, and a live region for save status.

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
