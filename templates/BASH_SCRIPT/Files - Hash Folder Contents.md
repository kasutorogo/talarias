Generate SHA-256 hashes for all files in a folder.
Useful for integrity checks or release manifests.

```bash
#!/usr/bin/env bash
set -euo pipefail

TARGET_DIR="[FOLDER_PATH]"
OUTPUT_FILE="[OUTPUT_HASH_FILE]"

find "$TARGET_DIR" -type f -print0 | sort -z | xargs -0 shasum -a 256 > "$OUTPUT_FILE"
echo "Hashes saved to: $OUTPUT_FILE"
```
