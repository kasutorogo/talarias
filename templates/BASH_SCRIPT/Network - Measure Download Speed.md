Download a file to /dev/null to estimate transfer speed.
Use a large file URL for more realistic results.

```bash
#!/usr/bin/env bash
set -euo pipefail

FILE_URL="[FILE_URL]"

curl -L "$FILE_URL" -o /dev/null -w "Speed: %{speed_download} bytes/sec\n"
```
