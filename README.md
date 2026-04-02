# Talarias

Talarias is a desktop launcher for searching, previewing, editing, and copying reusable text templates.

## Stack

- Tauri 2
- Vite
- Vanilla HTML, CSS, and JavaScript
- Rust

## Features

- Fast keyboard-first template search
- Editable preview before copy
- Alias support
- Global shortcut support
- User-selectable templates root folder
- Folder dropdown based on first-level subfolders
- Dark and light themes
- Welcome and About windows

## Default repository content

The repo ships with sample Bash templates in [`templates/BASH_SCRIPT`](./templates/BASH_SCRIPT) so the app shows useful content on first launch.

The app is not limited to Bash templates. Users can point Talarias to any templates folder on their machine.

## How template loading works

- Talarias searches `.md` and `.txt` files recursively.
- The folder dropdown shows only the first level of subfolders inside the selected templates root.
- Deeper folders are still searchable, but they do not appear as separate dropdown entries.
- For Markdown files, Talarias removes the first `# ...` heading and trims everything from `## Relacionado` onward.

## Project structure

- `frontend/` - app UI
- `src-tauri/` - Rust backend, window setup, native integrations, and packaging
- `templates/` - sample templates included in the repo
- `public/` - static assets

## Prerequisites

Install these first:

- Node.js LTS and npm
- Rust via `rustup`
- Tauri system dependencies for your platform

Official setup guides:

- Tauri prerequisites: [https://v2.tauri.app/start/prerequisites/](https://v2.tauri.app/start/prerequisites/)
- Tauri Windows installer guide: [https://v2.tauri.app/distribute/windows-installer/](https://v2.tauri.app/distribute/windows-installer/)

Quick platform notes:

- macOS: install Xcode Command Line Tools with `xcode-select --install`
- Windows: use the MSVC Rust toolchain with `rustup default stable-msvc` and install Microsoft C++ Build Tools
- Linux: install the Tauri system packages for your distro; for Ubuntu/Debian, the official docs list `libwebkit2gtk-4.1-dev`, `build-essential`, `libxdo-dev`, `libssl-dev`, `libayatana-appindicator3-dev`, and `librsvg2-dev`

## Run in development

After the prerequisites are installed, the terminal commands are the same on macOS, Windows, and Linux:

```bash
npm install
npm run dev
```

## Run checks

```bash
npm run check
```

## Build from terminal

macOS:

```bash
npm run build:mac
```

Windows:

```bash
npm run build:win
```

Notes:

- For the most reliable Windows installer build, build on Windows.
- Cross-building Windows installers from macOS or Linux is possible with Tauri, but it is less tested than building on Windows directly.

> Coded with Codex
