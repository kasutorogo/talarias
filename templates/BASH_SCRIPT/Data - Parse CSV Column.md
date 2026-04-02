Print one CSV column by number using awk.
Set the file path and column index.

```bash
#!/usr/bin/env bash
set -euo pipefail

CSV_FILE="[CSV_FILE_PATH]"
COLUMN_INDEX="[COLUMN_NUMBER]"

awk -F',' -v col="$COLUMN_INDEX" '{print $col}' "$CSV_FILE"
```
