Extract common archive formats from the current folder.
Run it where your .zip, .tar.gz, .tgz, or .tar.bz2 files are stored.

```bash
#!/usr/bin/env bash
set -euo pipefail

for file in *; do
  [ -f "$file" ] || continue
  case "$file" in
    *.zip) unzip -o "$file" ;;
    *.tar.gz|*.tgz) tar -xzf "$file" ;;
    *.tar.bz2) tar -xjf "$file" ;;
    *.tar.xz) tar -xJf "$file" ;;
  esac
done

echo "Archive extraction finished."
```
