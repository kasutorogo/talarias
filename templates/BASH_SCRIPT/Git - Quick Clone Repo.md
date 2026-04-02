Clone a Git repository into a target directory.
Replace the repository URL and destination folder.

```bash
#!/usr/bin/env bash
set -euo pipefail

REPO_URL="[GIT_REPOSITORY_URL]"
TARGET_DIR="[TARGET_FOLDER_PATH]"

git clone "$REPO_URL" "$TARGET_DIR"
```
