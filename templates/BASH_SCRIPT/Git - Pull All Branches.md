Fetch all remotes and prune deleted refs in the current repo.
Run this inside a Git repository.

```bash
#!/usr/bin/env bash
set -euo pipefail

git fetch --all --prune
echo "Git fetch complete."
```
