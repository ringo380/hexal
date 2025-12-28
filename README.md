# Hexal

A desktop application for managing D&D hex crawl campaigns, built with Electron, React, and TypeScript.

## Features

- **Hex Grid Editor**: Visual hex grid with customizable terrain types
- **Campaign Management**: Create, save, load, and export campaigns
- **Content Tracking**: Track locations, encounters, NPCs, treasures, and clues per hex
- **Discovery Status**: Mark hexes as undiscovered, discovered, or cleared
- **Procedural Generation**: Random terrain and encounter generation
- **Multi-Window Support**: Open multiple campaigns simultaneously
- **Autosave**: Automatic saving with 2-second debounce
- **Undo/Redo**: Full history support for all edits
- **Export Options**: Export to JSON or Markdown formats

## Tech Stack

- **Frontend**: React 18, TypeScript
- **Desktop**: Electron 28
- **Build**: Vite, electron-builder
- **State Management**: React Context + useReducer

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Project Structure

```
hexal-electron/
├── electron/           # Electron main process
│   ├── main.ts        # Main process entry point
│   └── preload.ts     # Preload script for IPC
├── src/
│   ├── components/    # React components
│   ├── stores/        # State management contexts
│   ├── services/      # Utility services (hex geometry, etc.)
│   ├── styles/        # CSS styles
│   └── types/         # TypeScript type definitions
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## License

Private - All rights reserved
