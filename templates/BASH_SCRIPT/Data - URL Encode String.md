URL-encode text using Python from a Bash wrapper.
Replace the plain text input.

```bash
#!/usr/bin/env bash
set -euo pipefail

PLAIN_TEXT='[TEXT_TO_ENCODE]'

python3 -c 'import sys, urllib.parse; print(urllib.parse.quote(sys.argv[1]))' "$PLAIN_TEXT"
```
