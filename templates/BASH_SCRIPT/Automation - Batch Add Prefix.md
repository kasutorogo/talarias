Add a prefix to every file in the current directory.
Set the prefix text before running.

```bash
#!/usr/bin/env bash
set -euo pipefail

PREFIX="[PREFIX_TEXT]"

for file in *; do
  [ -e "$file" ] || continue
  mv -- "$file" "${PREFIX}${file}"
done

echo "Prefix added."
```
