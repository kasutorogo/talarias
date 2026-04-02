Scan a folder and list the largest files.
Change the folder path and number of results as needed.

```bash
#!/usr/bin/env bash
set -euo pipefail

SEARCH_DIR="[FOLDER_PATH]"
TOP_COUNT="[NUMBER_OF_RESULTS]"

find "$SEARCH_DIR" -type f -print0 | xargs -0 du -h | sort -hr | head -n "$TOP_COUNT"
```
