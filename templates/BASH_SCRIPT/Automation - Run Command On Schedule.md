Simple endless loop that runs a command every N seconds.
Replace the command and interval.

```bash
#!/usr/bin/env bash
set -euo pipefail

INTERVAL="[SECONDS]"
COMMAND='[COMMAND_TO_RUN]'

while true; do
  eval "$COMMAND"
  sleep "$INTERVAL"
done
```
