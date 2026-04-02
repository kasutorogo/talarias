Add a suffix before the file extension for every file in the current folder.
Edit the suffix value in brackets.

```bash
#!/usr/bin/env bash
set -euo pipefail

SUFFIX="[SUFFIX_TEXT]"

for file in *; do
  [ -e "$file" ] || continue
  if [[ -f "$file" && "$file" == *.* ]]; then
    ext="${file##*.}"
    name="${file%.*}"
    mv -- "$file" "${name}${SUFFIX}.${ext}"
  else
    mv -- "$file" "${file}${SUFFIX}"
  fi
done

echo "Suffix added."
```
