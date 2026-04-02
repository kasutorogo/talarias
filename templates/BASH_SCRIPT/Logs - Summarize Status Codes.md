Count HTTP status codes inside an access log.
Adjust the field index if your log format is different.

```bash
#!/usr/bin/env bash
set -euo pipefail

LOG_FILE="[ACCESS_LOG_PATH]"

awk '{print $9}' "$LOG_FILE" | sort | uniq -c | sort -n
```
