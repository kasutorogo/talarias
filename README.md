# Talarias

Talarias is a desktop launcher for searching, editing, and copying reusable text templates.  
This version is built with Tauri, Vite, and Rust.

## Features

- Fast keyboard-driven search
- Editable preview before copy
- Alias support
- Global shortcuts
- User-selectable templates folder
- Folder dropdown based on first-level subfolders
- Golden light and dark themes
- Welcome and About windows

## Default content

The repository includes Bash script templates in [`templates/BASH_SCRIPT`](./templates/BASH_SCRIPT) so the app shows useful sample content on first launch.

Users can later choose any templates folder on their own machine.

## Project structure

- `frontend/`: HTML, CSS, and JavaScript for the app UI
- `src-tauri/`: Rust backend, window setup, native integrations, and bundling
- `templates/`: bundled sample templates

## How templates work

- Talarias searches `.md` and `.txt` files recursively.
- The folder dropdown only shows the first level of subfolders inside the selected root.
- Deeper nested folders are still searchable, but they do not appear as separate dropdown options.
- Markdown templates remove the first `# ...` heading and trim everything from `## Relacionado` onward.

## Development

```bash
npm install
npm run dev
```

## Checks

```bash
npm run check
```

## Builds

```bash
npm run build:mac
npm run build:win
npm run build:win:ja
```

## Suggested GitHub description

Desktop template launcher for searching, editing, and copying Markdown or text snippets with global shortcuts.
