Verify whether a command is installed before running later steps.
Replace the command name as needed.

```bash
#!/usr/bin/env bash
set -euo pipefail

COMMAND_NAME="[COMMAND_NAME]"

if command -v "$COMMAND_NAME" >/dev/null 2>&1; then
  echo "$COMMAND_NAME is installed."
else
  echo "$COMMAND_NAME is not installed."
fi
```
