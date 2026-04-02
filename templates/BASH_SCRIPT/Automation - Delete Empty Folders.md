Delete empty directories inside a target folder.
Useful after cleanup jobs or archive moves.

```bash
#!/usr/bin/env bash
set -euo pipefail

TARGET_DIR="[FOLDER_PATH]"

find "$TARGET_DIR" -type d -empty -delete
echo "Empty folders deleted."
```
