# Hexal

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)](https://github.com/ringo380/hexal/releases)

A desktop application for managing D&D hex crawl campaigns, built with Electron, React, and TypeScript.

## Features

- **Hex Grid Editor**: Visual hex grid with customizable terrain types and LOD (Level of Detail) zoom system
- **Campaign Management**: Create, save, load, and export campaigns
- **Content Tracking**: Track locations, encounters, NPCs, treasures, and clues per hex
- **Discovery Status**: Mark hexes as undiscovered, discovered, or cleared
- **Time & Weather**: In-game calendar with weather simulation
- **Procedural Generation**: Random terrain and encounter generation
- **Multi-Window Support**: Open multiple campaigns simultaneously
- **Autosave**: Automatic saving with 2-second debounce
- **Undo/Redo**: Full history support for all edits
- **Export Options**: Export to JSON or Markdown formats

## Installation

Download the latest release from the [Releases page](https://github.com/ringo380/hexal/releases).

### macOS
- Download the `.dmg` file
- Open and drag Hexal to Applications
- Available for both Intel (x64) and Apple Silicon (arm64)

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Build macOS only
npm run build:mac
```

## Tech Stack

- **Frontend**: React 18, TypeScript
- **Desktop**: Electron 28
- **Build**: Vite, electron-builder
- **State Management**: React Context + useReducer
- **Rendering**: HTML5 Canvas

## Project Structure

```
hexal-electron/
├── electron/           # Electron main process
│   ├── main.ts        # Main process entry point
│   └── preload.ts     # Preload script for IPC
├── src/
│   ├── components/    # React components
│   ├── stores/        # State management contexts
│   ├── services/      # Utility services (hex geometry, time, weather)
│   ├── styles/        # CSS styles
│   ├── types/         # TypeScript type definitions
│   └── data/          # Static data (calendars, weather effects)
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
