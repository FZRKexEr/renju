# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Renju: Gomoku (Five in a Row) Board & SGF Editor

Renju is a Gomoku/五子棋 board and SGF editor built with Electron and Preact, forked from [Sabaki](https://github.com/SabakiHQ/Sabaki).

**Gomoku rules**: First to connect exactly 5 stones in a row wins. No captures, no ko, no suicide, no komi, no handicap, no pass/resign.
**Board size**: Default 15x15, user-configurable (5-25).
**SGF format**: Uses `GM[4]` (Gomoku) instead of `GM[1]` (Go).

## Development Commands

### Setup
```bash
npm install              # Install dependencies
```

### Development
```bash
npm run watch           # Watch and bundle files automatically
npm start               # Start Renju in development mode
```

### Build
```bash
npm run bundle          # Bundle files for production
npm run build           # Build Electron app (directory)
npm run dist:macos      # Build macOS installer
npm run dist:linux      # Build Linux installer
npm run dist:win32      # Build Windows 32-bit installer
npm run dist:win64      # Build Windows 64-bit installer
npm run dist:win32-portable # Build Windows 32-bit portable version
npm run dist:win64-portable # Build Windows 64-bit portable version
```

### Code Formatting
```bash
npm run format          # Auto-format all files with Prettier
npm run format-check    # Check formatting without modifying files
npm run watch-format    # Auto-format on file changes
```

### Tests
```bash
npm run test            # Run Mocha tests
npm run test -- test/filename.js # Run specific test file
```

### i18n
```bash
npm run i18n            # Generate i18n files
```

## High-Level Architecture

### Application Structure

Renju follows a traditional Electron architecture with two main processes:

1. **Main Process** (`src/main.js`): Handles window management, menu bar, IPC communication, and system interactions.
2. **Renderer Process** (`src/components/App.js`): Preact-based UI rendering and application logic.

### Key Directories

```
src/
├── components/         # Preact UI components (Goban, menus, bars, drawers)
├── modules/            # Core application logic (game tree, board, file formats)
│   ├── fileformats/   # SGF, NGF, GIB, UGF file format handlers
│   └── shims/         # Compatibility layers
├── main.js            # Electron main process
├── menu.js            # Menu bar configuration
├── setting.js         # Settings management
├── i18n.js            # Internationalization
├── updater.js         # Update checking
└── preload.js         # Preload script for renderer process

test/                  # Mocha test files
style/                 # SCSS stylesheets
data/                  # Application data and themes
docs/                  # Documentation
```

### Core Modules

- **Game Tree Management**: `src/modules/gametree.js` - Immutable game tree data structure
- **Board Logic**: `src/modules/gomoku-board.js` - Gomoku board data type (replaces `@sabaki/go-board`)
- **File Formats**: `src/modules/fileformats/` - SGF, NGF, GIB, UGF parsing/writing
- **Board Rendering**: `@sabaki/shudan` - Low-level Preact Goban component

### State Management

The application uses a combination of:
- Local component state (Preact `useState`)
- Context API for global state
- Settings stored in `electron-store` via `src/setting.js`

### IPC Communication

Main process and renderer process communicate via Electron's IPC:
- Main → Renderer: `win.webContents.send()`
- Renderer → Main: `ipcRenderer.invoke()` or `ipcRenderer.send()`

### Building & Bundling

- **Bundler**: webpack 5
- **Target**: Electron renderer process
- **Aliases**: React → Preact compat for smaller bundle size
- **Entry Point**: `src/components/App.js`
- **Output**: `bundle.js` (in root directory)

### Styling

- **CSS Preprocessor**: SCSS
- **Stylesheet Location**: `style/` directory
- **Theme System**: Custom theme support via `data/themes/` directory

### Internationalization

- **Library**: `@sabaki/i18n`
- **Translation Files**: `data/i18n/` directory
- **Context Helper**: `src/i18n.js`

## Key Technologies

- **Electron 37.10.3**: Desktop application framework
- **Preact 10.4.0**: React-compatible UI library (lighter weight)
- **Webpack 5**: Module bundler
- **Mocha 10.0.0**: Testing framework
- **Prettier 3.8.1**: Code formatter
- **@sabaki/* packages**: SGF parsing, board rendering, game tree (Go-specific packages like deadstones, influence, gtp removed)

## Important Files

- `package.json`: Project dependencies and scripts
- `webpack.config.js`: webpack configuration
- `index.html`: Entry HTML file
- `build/`: Build configuration for electron-builder
- `data/themes/`: Built-in board/stone themes
- `data/i18n/`: Translation files
