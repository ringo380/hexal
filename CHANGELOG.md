# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
