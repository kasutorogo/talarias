List the top CPU-consuming processes.
Useful for quick server or desktop checks.

```bash
#!/usr/bin/env bash
set -euo pipefail

ps aux | sort -nrk 3 | head -n 10
```
