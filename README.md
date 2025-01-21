# Quantum Graph Visualization Tool

An interactive visualization tool for creating and manipulating quantum field theory graphs with real-time rendering and animations.

## Features

- **Interactive JSON Editor**

  - Syntax highlighting
  - Real-time validation
  - Auto-formatting
  - Keyboard shortcuts (Cmd/Ctrl + Enter to render)

- **Graph Visualization**

  - Dynamic node placement
  - Animated connections
  - Custom node shapes and styles
  - SVG-based rendering
  - Zoom controls

- **Node Animations**

  - Pulse
  - Orbit
  - Wave
  - Spin
  - Flow patterns

- **Layout System**
  - Automatic grid arrangement
  - Custom node positioning
  - Configurable spacing and dimensions
  - Responsive scaling

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

#### Clone the repository

- git clone [your-repo-url]

#### Install dependencies

- npm install

#### Start the development server

npm run dev

## JSON Structure

- The visualization accepts a specific JSON structure:

```
{
  "nodes": [
    {
      "id": "string",
      "name": "string",
      "shapes": [...],
      "animate": {
        "type": "string",
        "params": {...}
      }
    }
  ],
  "edges": [...],
  "layoutConfig": {...}
}
```

## Configuration

The graph layout can be customized through the `layoutConfig` object:

- `startX/Y`: Initial position offset
- `columnWidth/rowHeight`: Grid spacing
- `boxWidth/Height`: Node dimensions
- `boxMargin`: Space between nodes
- `fontSize`: Text size
- `columnsPerRow`: Grid layout

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
