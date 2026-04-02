Short backup script that copies one folder into a timestamped backup location.
Edit the bracketed paths before running. Good for quick manual backups or cron jobs.

```bash
#!/usr/bin/env bash
set -euo pipefail

SOURCE_DIR="[SOURCE_FOLDER_PATH]"
BACKUP_ROOT="[BACKUP_DESTINATION_PATH]"
TIMESTAMP="$(date +%Y-%m-%d_%H-%M-%S)"
DEST_DIR="$BACKUP_ROOT/backup_$TIMESTAMP"

mkdir -p "$DEST_DIR"
cp -R "$SOURCE_DIR" "$DEST_DIR/"

echo "Backup created at: $DEST_DIR"
```
