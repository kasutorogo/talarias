Print the current disk usage and warn if it exceeds a threshold.
Set the mount point and percentage limit.

```bash
#!/usr/bin/env bash
set -euo pipefail

MOUNT_POINT="[MOUNT_POINT]"
THRESHOLD="[PERCENTAGE_LIMIT]"

used=$(df "$MOUNT_POINT" | awk 'NR==2 {gsub("%","",$5); print $5}')

if (( used >= THRESHOLD )); then
  echo "Warning: disk usage is ${used}% on $MOUNT_POINT"
else
  echo "Disk usage is ${used}% on $MOUNT_POINT"
fi
```
