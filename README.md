# Talarias

Talarias is a desktop launcher for searching, editing, and copying reusable text templates.

## Features

- Fast keyboard-driven search
- Editable preview before copy
- Alias support
- Global shortcuts
- User-selectable templates folder
- Folder dropdown based on first-level subfolders

## Included by default

This repository includes Bash script templates in [`templates/BASH_SCRIPT`](./templates/BASH_SCRIPT).

The app is not limited to Bash templates. Users can point Talarias to any folder on their machine.

## How it works

- Choose a templates root folder
- Search `.md` and `.txt` files recursively
- Use the folder dropdown to filter by first-level subfolder
- Edit the template before copying if needed

Nested folders deeper than one level are still searchable, but they do not appear as separate options in the dropdown.

## Quick start

```bash
npm install
npm start
```

## Build commands

```bash
npm run build:mac
npm run build:win
npm run build:win:ja
```

## Suggested GitHub description

Desktop template launcher for searching, editing, and copying Markdown or text snippets with global shortcuts.
