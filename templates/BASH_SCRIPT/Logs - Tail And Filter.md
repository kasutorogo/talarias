Follow a log file and show only lines matching a pattern.
Set the log path and text filter.

```bash
#!/usr/bin/env bash
set -euo pipefail

LOG_FILE="[LOG_FILE_PATH]"
FILTER_TEXT="[TEXT_PATTERN]"

tail -f "$LOG_FILE" | grep --line-buffered "$FILTER_TEXT"
```
