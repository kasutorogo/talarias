Compare a file hash against an expected SHA-256 value.
Replace the file path and expected checksum.

```bash
#!/usr/bin/env bash
set -euo pipefail

TARGET_FILE="[FILE_PATH]"
EXPECTED_HASH="[EXPECTED_SHA256_HASH]"

ACTUAL_HASH=$(shasum -a 256 "$TARGET_FILE" | awk '{print $1}')

if [[ "$ACTUAL_HASH" == "$EXPECTED_HASH" ]]; then
  echo "Checksum verified."
else
  echo "Checksum mismatch."
fi
```
