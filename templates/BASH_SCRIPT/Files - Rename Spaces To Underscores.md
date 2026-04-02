Rename files recursively by replacing spaces with underscores.
Run carefully on shared or synced folders.

```bash
#!/usr/bin/env bash
set -euo pipefail

TARGET_DIR="[FOLDER_PATH]"

find "$TARGET_DIR" -depth -name "* *" | while IFS= read -r file; do
  mv -- "$file" "${file// /_}"
done

echo "Rename complete."
```
