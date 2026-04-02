Find world-writable files in a folder tree.
Useful for basic permission audits.

```bash
#!/usr/bin/env bash
set -euo pipefail

TARGET_DIR="[FOLDER_PATH]"

find "$TARGET_DIR" -type f -perm -002
```
