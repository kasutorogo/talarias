Replace one string with another across matching files.
Review carefully before running on real data.

```bash
#!/usr/bin/env bash
set -euo pipefail

TARGET_DIR="[FOLDER_PATH]"
FILE_PATTERN="[FILE_PATTERN]"
OLD_TEXT="[TEXT_TO_REPLACE]"
NEW_TEXT="[REPLACEMENT_TEXT]"

find "$TARGET_DIR" -type f -name "$FILE_PATTERN" -exec sed -i '' "s/${OLD_TEXT}/${NEW_TEXT}/g" {} +
echo "Replacement complete."
```
