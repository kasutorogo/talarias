Keep only the newest backup folders and delete older ones.
Set the backup root path and how many copies to keep.

```bash
#!/usr/bin/env bash
set -euo pipefail

BACKUP_ROOT="[BACKUP_FOLDER_PATH]"
KEEP_COUNT="[NUMBER_TO_KEEP]"

ls -1dt "$BACKUP_ROOT"/* | tail -n +"$((KEEP_COUNT + 1))" | xargs -r rm -rf
echo "Old backups removed."
```
