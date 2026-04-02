Scan a host for open TCP ports with nc.
Set the target host and port range.

```bash
#!/usr/bin/env bash
set -euo pipefail

TARGET_HOST="[HOST_OR_IP]"
START_PORT="[START_PORT]"
END_PORT="[END_PORT]"

for port in $(seq "$START_PORT" "$END_PORT"); do
  nc -z -w 1 "$TARGET_HOST" "$port" 2>/dev/null && echo "Open: $port"
done
```
