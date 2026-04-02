Delete local branches already merged into the current branch.
Review the list before using in important repositories.

```bash
#!/usr/bin/env bash
set -euo pipefail

git branch --merged | grep -vE '^\*|main|master|develop' | xargs -r git branch -d
```
