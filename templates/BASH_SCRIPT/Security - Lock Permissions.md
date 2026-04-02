Restrict file permissions to owner read and write only.
Replace the file path before use.

```bash
#!/usr/bin/env bash
set -euo pipefail

TARGET_FILE="[FILE_PATH]"

chmod 600 "$TARGET_FILE"
echo "Permissions updated."
```
