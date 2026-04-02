Create a SHA-256 hash from a plain text password.
Replace the input text first.

```bash
#!/usr/bin/env bash
set -euo pipefail

PLAIN_TEXT="[PASSWORD_TEXT]"

printf "%s" "$PLAIN_TEXT" | shasum -a 256
```
