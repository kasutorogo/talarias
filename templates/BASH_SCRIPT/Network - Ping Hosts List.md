Ping multiple hosts from a list and print reachability.
Provide the path to a plain text file with one host per line.

```bash
#!/usr/bin/env bash
set -euo pipefail

HOSTS_FILE="[HOSTS_FILE_PATH]"

while IFS= read -r host; do
  if ping -c 1 -W 1000 "$host" >/dev/null 2>&1; then
    echo "$host: reachable"
  else
    echo "$host: unreachable"
  fi
done < "$HOSTS_FILE"
```
