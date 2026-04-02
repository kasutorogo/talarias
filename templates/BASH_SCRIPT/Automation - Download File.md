Download a remote file with curl and save it locally.
Replace both the URL and output path.

```bash
#!/usr/bin/env bash
set -euo pipefail

FILE_URL="[FILE_URL]"
OUTPUT_PATH="[OUTPUT_FILE_PATH]"

curl -L "$FILE_URL" -o "$OUTPUT_PATH"
echo "Download complete: $OUTPUT_PATH"
```
