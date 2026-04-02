Extract error lines from a log file into a report file.
Replace the input log and output path.

```bash
#!/usr/bin/env bash
set -euo pipefail

LOG_FILE="[LOG_FILE_PATH]"
OUTPUT_FILE="[OUTPUT_FILE_PATH]"

grep -i "error" "$LOG_FILE" > "$OUTPUT_FILE"
echo "Error report saved to: $OUTPUT_FILE"
```
