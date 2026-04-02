Split a large text file into smaller files by line count.
Set the source file and chunk size.

```bash
#!/usr/bin/env bash
set -euo pipefail

SOURCE_FILE="[SOURCE_FILE_PATH]"
LINES_PER_FILE="[LINES_PER_FILE]"
OUTPUT_PREFIX="[OUTPUT_PREFIX]"

split -l "$LINES_PER_FILE" "$SOURCE_FILE" "$OUTPUT_PREFIX"
echo "Split complete."
```
