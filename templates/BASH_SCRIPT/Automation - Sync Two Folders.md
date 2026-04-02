Sync one folder into another with rsync.
Replace the bracketed paths. Useful for mirrors, external drives, and deployment copies.

```bash
#!/usr/bin/env bash
set -euo pipefail

SOURCE_DIR="[SOURCE_FOLDER_PATH]"
TARGET_DIR="[TARGET_FOLDER_PATH]"

rsync -avh --delete "$SOURCE_DIR"/ "$TARGET_DIR"/
echo "Sync complete."
```
