Count total lines across matching files in a folder tree.
Set the folder path and file pattern.

```bash
#!/usr/bin/env bash
set -euo pipefail

TARGET_DIR="[FOLDER_PATH]"
PATTERN="[FILE_PATTERN]"

find "$TARGET_DIR" -type f -name "$PATTERN" -print0 | xargs -0 cat | wc -l
```
