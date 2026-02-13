# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2026-02-13

### Added
- **Hex Regions**: Define named geographic regions (e.g., "The Dark Woods", "City of Leris") by grouping hexes
- **Region Manager Modal**: Two-panel modal for creating, editing, and managing regions (Cmd+R)
- **Region Paint Mode**: Click hexes on the canvas to add/remove them from a region
- **Canvas Region Visualization**: Semi-transparent color overlay on region hexes, colored border rendering on region boundaries, region name labels at overview zoom levels
- **Region in HexDetail**: View and assign regions from the hex detail panel
- **Region Filtering**: Filter sidebar hex list by region membership
- **Region Search**: Search for hexes by region name
- **Region Color Palette**: 12 preset colors plus custom color picker for region assignment
- **Hex Neighbor Utilities**: `getHexNeighbors`, `areHexesAdjacent`, `getValidNeighbors` for odd-q offset grid
- **Region Service**: Pure utility functions for region operations (contiguity checks, border detection, fast lookup maps)

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
