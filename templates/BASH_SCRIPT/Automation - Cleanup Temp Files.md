Delete temporary files older than a given age from a folder.
Set the temp path and number of days.

```bash
#!/usr/bin/env bash
set -euo pipefail

TEMP_DIR="[TEMP_FOLDER_PATH]"
DAYS_OLD="[DAYS_OLD]"

find "$TEMP_DIR" -type f -mtime +"$DAYS_OLD" -delete
echo "Temporary files cleaned."
```
