# Himalayan Switchboard Designer - Schneider Electric

A modern, feature-rich Angular application for designing electrical switchboards and circuits using fabric.js and PrimeNG.

## Features

- **Interactive Canvas**: Draw and manipulate circuit components on a responsive canvas
- **Circuit Components**:
  - Switches (green)
  - Circuit Breakers (red)
  - Outlets (orange)
- **Drawing Tools**:
  - Lines for connections
  - Rectangles and Circles for enclosures
  - Text labels
- **Properties Panel**: Edit selected object properties including:
  - Position (X, Y coordinates)
  - Size (width, height, radius)
  - Colors (stroke and fill)
  - Rotation and opacity
- **File Operations**:
  - Save projects as JSON
  - Load existing projects
  - Export as PNG images
- **Rich UI**: Dark theme with gradient accents optimized for electrical design work

## Tech Stack

- **Angular 21** - Latest Angular framework with standalone components
- **Fabric.js 7** - HTML5 canvas library for drawing and object manipulation
- **PrimeNG** - Rich UI component library
- **TypeScript** - Type-safe development
- **SCSS** - Advanced styling with variables and mixins

## Getting Started

### Prerequisites

- Node.js (v20 or higher)
- npm (v11.6.2 or higher)

### Installation

```bash
npm install
```

### Development Server

```bash
npm start
```

Navigate to `http://localhost:4200/`. The application will automatically reload when you make changes to source files.

### Build

```bash
npm run build
```

Build artifacts will be stored in the `dist/` directory.

## Usage Guide

### Drawing Tools

1. **Select Tool (V)**: Click to select and move objects
2. **Line Tool (L)**: Click and drag to draw connection lines
3. **Rectangle Tool (R)**: Click and drag to draw rectangular enclosures
4. **Circle Tool (C)**: Click and drag to draw circular elements
5. **Text Tool (T)**: Click to add editable text labels

### Circuit Components

- **Switch**: Click the switch icon and then click on the canvas to place
- **Circuit Breaker**: Click the breaker icon and then click on the canvas to place
- **Outlet**: Click the outlet icon and then click on the canvas to place

### Editing Properties

1. Select any object on the canvas
2. The properties panel on the right will show editable properties
3. Modify position, size, colors, rotation, and opacity
4. Changes apply in real-time

### File Operations

- **Save**: Export your design as a JSON file for later editing
- **Open**: Load a previously saved JSON project
- **Export PNG**: Generate a high-quality PNG image of your design
- **Clear Canvas**: Remove all objects (with confirmation)

### Keyboard Shortcuts

- `Del`: Delete selected object
- `V`: Switch to Select tool
- `L`: Switch to Line tool
- `R`: Switch to Rectangle tool
- `C`: Switch to Circle tool
- `T`: Add text label

## Project Structure

```
src/
├── app/
│   ├── services/
│   │   └── canvas.service.ts       # Core fabric.js canvas logic
│   ├── switchboard/
│   │   └── switchboard.component.ts # Main canvas component
│   ├── toolbar/
│   │   └── toolbar.component.ts     # Top toolbar with tools
│   ├── properties-panel/
│   │   └── properties-panel.component.ts # Right-side property editor
│   ├── app.config.ts               # App configuration with PrimeNG
│   └── app.routes.ts               # Route configuration
├── styles.scss                      # Global styles
└── index.html                       # Main HTML file
```

## Design Principles

- **Schneider Electric Branding**: Professional green accent color (#00ff88)
- **Dark Theme**: Optimized for reduced eye strain during extended design sessions
- **Responsive Layout**: Flexible toolbar and panels
- **Accessibility**: WCAG AA compliant with proper focus management
- **Performance**: Signals-based state management for optimal rendering

## Future Enhancements

- [ ] More circuit component types (transformers, meters, etc.)
- [ ] Snap-to-grid functionality
- [ ] Component library/templates
- [ ] Multi-select and group operations
- [ ] Undo/Redo functionality
- [ ] Zoom and pan controls
- [ ] Auto-routing for connections
- [ ] Component specifications and data sheets
- [ ] Collaboration features

## License

Proprietary - Schneider Electric

## Support

For issues or questions, contact the Himalayan project team.
