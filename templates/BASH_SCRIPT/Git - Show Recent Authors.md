Show commit authors and counts for recent history.
Run in a Git repository. Change the commit range if needed.

```bash
#!/usr/bin/env bash
set -euo pipefail

git shortlog -sn --all
```
