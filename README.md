# Talarias

Talarias is a small desktop launcher for searching, previewing, editing, and copying reusable text templates. It is built with Electron and designed for fast keyboard-driven workflows.

## What it does

- Opens as a compact floating launcher.
- Searches Markdown and plain text templates recursively.
- Lets you preview and edit a template before copying it.
- Supports global shortcuts for opening the app and copying specific templates.
- Supports aliases for faster searching.
- Lets the user choose any templates root folder.
- Shows first-level subfolders of the selected templates root in the folder dropdown.

## Default repository content

This repository intentionally ships with Bash script templates only under [`templates/BASH_SCRIPT`](./templates/BASH_SCRIPT).

That keeps the public repo lightweight while still showing a useful default template set. The app itself is not limited to Bash templates: the user can point Talarias to any folder on their machine.

## How templates are loaded

- The user chooses a templates root folder.
- Talarias searches that folder recursively for `.md` and `.txt` files.
- The folder dropdown only shows the first level of subfolders directly inside the selected root.
- Deeper nested folders are still searchable recursively, but they do not appear as separate dropdown options.

## Template cleanup rules

Before showing or copying a Markdown template, Talarias applies a few cleanup rules:

1. If the file starts with a top-level Markdown heading (`# ...`), that heading is removed from the body.
2. If a `## Relacionado` section exists, everything from that section onward is removed.
3. The visible editor content is what gets copied.

## Quick start

```bash
npm install
npm start
```

## Keyboard controls

- `Cmd/Ctrl + Alt + P`: open the launcher
- `Arrow Up` / `Arrow Down`: move through results
- `Enter` on the search field: open the selected template
- `Escape`: close results or return to the search input

## Project structure

```text
src/                  Electron main process and renderer files
templates/BASH_SCRIPT Default example templates included in the repo
tools/                Helper scripts
dist/                 Generated builds (not meant for Git)
```

## Packaging

Available build commands:

```bash
npm run build:mac
npm run build:win
npm run build:win:ja
```

- `build:mac` generates the macOS app and DMG.
- `build:win` generates the standard Windows installer.
- `build:win:ja` generates a special Japanese Windows build in a separate output folder.

## GitHub repository description

Suggested short description:

> Desktop template launcher for searching, editing, and copying Markdown or text snippets with global shortcuts.

