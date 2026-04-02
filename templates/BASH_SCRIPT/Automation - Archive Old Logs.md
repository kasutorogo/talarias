Compress log files older than a number of days.
Set the log folder and retention age first.

```bash
#!/usr/bin/env bash
set -euo pipefail

LOG_DIR="[LOG_FOLDER_PATH]"
DAYS_OLD="[DAYS_OLD]"

find "$LOG_DIR" -type f -name "*.log" -mtime +"$DAYS_OLD" -print0 | while IFS= read -r -d '' file; do
  gzip "$file"
done

echo "Old logs archived."
```
