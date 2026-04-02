Merge all matching text files into one output file.
Edit the source folder, pattern, and output path.

```bash
#!/usr/bin/env bash
set -euo pipefail

SOURCE_DIR="[FOLDER_PATH]"
PATTERN="[FILE_PATTERN]"
OUTPUT_FILE="[OUTPUT_FILE_PATH]"

find "$SOURCE_DIR" -type f -name "$PATTERN" -print0 | sort -z | xargs -0 cat > "$OUTPUT_FILE"
echo "Merged into: $OUTPUT_FILE"
```
