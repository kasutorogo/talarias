List failed systemd services on Linux.
Useful for troubleshooting after boot or deploy changes.

```bash
#!/usr/bin/env bash
set -euo pipefail

systemctl --failed
```
