Watch a file checksum and print a message when the file changes.
Set the target file path before use.

```bash
#!/usr/bin/env bash
set -euo pipefail

TARGET_FILE="[FILE_PATH]"
INTERVAL="[SECONDS]"

last_checksum=""

while true; do
  current_checksum=$(shasum "$TARGET_FILE" | awk '{print $1}')
  if [[ "$current_checksum" != "$last_checksum" ]]; then
    echo "File changed: $TARGET_FILE"
    last_checksum="$current_checksum"
  fi
  sleep "$INTERVAL"
done
```
