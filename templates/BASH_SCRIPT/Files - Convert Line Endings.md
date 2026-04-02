Convert CRLF line endings into LF using tr.
Useful when moving files from Windows to Unix environments.

```bash
#!/usr/bin/env bash
set -euo pipefail

INPUT_FILE="[INPUT_FILE_PATH]"
OUTPUT_FILE="[OUTPUT_FILE_PATH]"

tr -d '\r' < "$INPUT_FILE" > "$OUTPUT_FILE"
echo "Converted file saved to: $OUTPUT_FILE"
```
