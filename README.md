# Cromva

> 🗒️ Modern Note-taking Application with File System Integration

## Features

- 📝 **Markdown Editor** - Full markdown support with live preview
- 📂 **File System Integration** - Connect local folders via File System Access API
- 🔍 **Spotlight Search** - Quick search with `Ctrl+K`
- 📊 **Graph View** - Visualize connections between notes
- 🎨 **Infinite Canvas** - Organize notes spatially
- 💾 **Auto-sync** - Automatic save to disk and localStorage

## Getting Started

### Requirements

- Modern browser with File System Access API support (Chrome, Edge)
- Node.js 18+ (for tests)

### Running

Simply open `index.html` in your browser, or use a local server:

```bash
npm install
npm run serve
# Open http://localhost:8080
```

### Running Tests

```bash
# Install dependencies
npm install

# Run all tests (headless)
npm test

# Run with visible browser
npm run test:headed

# Debug mode (step-by-step)
npm run test:debug
```

## Project Structure

```
cromva/
├── index.html           # Main application
├── css/
│   └── index.css        # Styles
├── js/
│   ├── core/            # Core modules
│   │   ├── state.js     # State management & localStorage
│   │   └── fs_handler.js # File System Access API
│   ├── features/        # Feature modules
│   │   ├── editor.js    # Note editor
│   │   ├── workspaces.js # Workspace management
│   │   ├── location_picker.js
│   │   ├── graph.js     # Graph visualization
│   │   ├── canvas.js    # Infinite canvas
│   │   └── settings.js
│   ├── ui/
│   │   └── navigation.js
│   ├── utils/
│   │   └── helpers.js
│   └── main.js          # Entry point
├── scripts/             # Testing & tools
│   ├── runner.js        # Browser test runner
│   ├── mock-data.js     # Test data
│   ├── tests/           # Unit tests
│   └── e2e/             # E2E tests (Playwright)
└── docs/                # Documentation
```

## Architecture

### Workspace Model

Workspaces are **hybrid containers** that can hold:
- Virtual notes (stored in localStorage)
- Linked files (via File System Access API)

See [docs/WORKSPACE_ARCHITECTURE.md](docs/WORKSPACE_ARCHITECTURE.md) for details.

### State Management

All data is persisted to `localStorage`:
- `cromva-notes` - Note content
- `cromva-workspaces` - Workspace metadata
- `cromva-workspaceFiles` - File associations
- `cromva-settings` - User preferences

## Development

### Console Commands

```javascript
// Run all tests
CromvaTest.runAll()

// Toggle debug mode
CromvaDebug.toggle()

// View current state
CromvaDebug.showState()

// Generate mock data
CromvaMock.generateAll()
```

### Test Results: 177/177 ✅

## License

MIT
