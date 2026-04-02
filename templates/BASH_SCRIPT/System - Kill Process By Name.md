Kill all processes matching a name.
Replace the process name carefully.

```bash
#!/usr/bin/env bash
set -euo pipefail

PROCESS_NAME="[PROCESS_NAME]"

pkill -f "$PROCESS_NAME"
echo "Process kill command sent."
```
