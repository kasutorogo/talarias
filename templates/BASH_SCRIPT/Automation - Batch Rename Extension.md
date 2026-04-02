Rename all files with one extension into another extension in the current folder.
Set both extensions in brackets before use.

```bash
#!/usr/bin/env bash
set -euo pipefail

OLD_EXT="[OLD_EXTENSION]"
NEW_EXT="[NEW_EXTENSION]"

for file in *."$OLD_EXT"; do
  [ -e "$file" ] || continue
  mv -- "$file" "${file%.$OLD_EXT}.$NEW_EXT"
done

echo "Rename complete."
```
