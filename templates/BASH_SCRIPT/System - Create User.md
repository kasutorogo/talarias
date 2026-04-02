Create a new system user and set a password.
Run as root or with sudo. Replace the username first.

```bash
#!/usr/bin/env bash
set -euo pipefail

NEW_USER="[USERNAME]"

sudo useradd -m "$NEW_USER"
sudo passwd "$NEW_USER"
```
