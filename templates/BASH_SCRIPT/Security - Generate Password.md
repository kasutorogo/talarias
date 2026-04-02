Generate a random password from /dev/urandom.
Change the length value before use.

```bash
#!/usr/bin/env bash
set -euo pipefail

PASSWORD_LENGTH="[PASSWORD_LENGTH]"

LC_ALL=C tr -dc 'A-Za-z0-9!@#$%^&*()_+=' < /dev/urandom | head -c "$PASSWORD_LENGTH"
echo
```
