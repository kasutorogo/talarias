Compare two folders and print differences using diff.
Set both folder paths before running.

```bash
#!/usr/bin/env bash
set -euo pipefail

DIR_ONE="[FIRST_FOLDER_PATH]"
DIR_TWO="[SECOND_FOLDER_PATH]"

diff -rq "$DIR_ONE" "$DIR_TWO"
```
