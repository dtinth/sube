# Sube - Subtitle Editor

Sube is a browser-based subtitle editor that allows you to create, edit, and manage subtitle files for audio and video content. It provides an intuitive timeline interface for precise subtitle synchronization with media playback.

![Sube Subtitle Editor](https://via.placeholder.com/800x450?text=Sube+Subtitle+Editor)

## Features

### Project Management
- Create, rename, and delete subtitle projects
- Import/export projects in JSON format
- Export subtitles in WebVTT format

### Media Support
- Import audio and video files for subtitle synchronization
- Audio/video playback with timeline visualization
- Waveform visualization for precise timing

### Subtitle Editing
- Create and edit subtitle text directly in the timeline
- Adjust subtitle timing with frame-precise controls
- Visual timeline representation of subtitles
- Split subtitles with blank lines

### User Experience
- Modern UI with Radix UI components
- Keyboard shortcuts for efficient editing
- Works entirely in your browser - no server needed
- Data stored locally in your browser using IndexedDB

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- [pnpm](https://pnpm.io/) package manager

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/sube.git
   cd sube
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Start the development server:
   ```bash
   pnpm dev
   ```

   This will start the application on http://localhost:12424

## Usage Guide

### Creating a New Project

1. From the home page, click "New Project"
2. Enter a title for your project
3. Click "Create"

### Importing Media

1. Open a project
2. Click "Menu" in the top-right corner
3. Select "Import Audio/Video"
4. Choose an audio or video file from your device

### Creating and Editing Subtitles

1. Click on the timeline to create a new subtitle at that position
2. Type your subtitle text in the editor
3. Adjust start and end times using the timeline controls or keyboard shortcuts
4. Click on existing subtitles to edit them

### Keyboard Shortcuts

- **Space**: Play/pause media
- **[** / **]**: Adjust subtitle start time
- **{** / **}**: Adjust subtitle end time
- **,** / **.**: Adjust boundaries at playhead
- **-** / **+**: Adjust playback speed
- **Ctrl+S**: Save project
- **Ctrl+F**: Find in subtitles

### Exporting

1. Click "Menu" in the top-right corner
2. Select "Export VTT" to export your subtitles as a WebVTT file
3. Or select "Export" to export the entire project as JSON (including waveform data)

## Development

### Commands

- `pnpm dev` - Start development server (port 12424)
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm lint` - Run ESLint
- `pnpm typecheck` - Run TypeScript type checking

### Technology Stack

- **Frontend Framework**: React with TypeScript
- **Build Tool**: Vite
- **UI Components**: Radix UI Themes
- **Styling**: Tailwind CSS
- **State Management**: Nanostores
- **Storage**: idb-keyval (IndexedDB)
- **Routing**: React Router DOM

## License

[MIT License](LICENSE)

## Acknowledgments

- [Radix UI](https://www.radix-ui.com/) for the UI components
- [Nanostores](https://github.com/nanostores/nanostores) for lightweight state management
- [idb-keyval](https://github.com/jakearchibald/idb-keyval) for IndexedDB storage

---

*Note: Sube is a local-first application that stores all data in your browser. No data is sent to any server.*