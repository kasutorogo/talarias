Delete zero-byte files inside a target folder.
Replace the folder path before running.

```bash
#!/usr/bin/env bash
set -euo pipefail

TARGET_DIR="[FOLDER_PATH]"

find "$TARGET_DIR" -type f -empty -delete
echo "Empty files deleted."
```
