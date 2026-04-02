Search text recursively in a folder with line numbers.
Replace the search term and path.

```bash
#!/usr/bin/env bash
set -euo pipefail

SEARCH_TEXT="[TEXT_TO_FIND]"
TARGET_DIR="[FOLDER_PATH]"

grep -Rni --color=always "$SEARCH_TEXT" "$TARGET_DIR"
```
