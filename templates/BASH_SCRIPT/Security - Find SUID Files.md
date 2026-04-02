List SUID files on the current system.
Use this for audits and privilege review.

```bash
#!/usr/bin/env bash
set -euo pipefail

find / -perm -4000 -type f 2>/dev/null
```
