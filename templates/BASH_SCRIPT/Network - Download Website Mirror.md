Create a simple local mirror of a website with wget.
Replace the target URL and output folder.

```bash
#!/usr/bin/env bash
set -euo pipefail

TARGET_URL="[WEBSITE_URL]"
OUTPUT_DIR="[OUTPUT_FOLDER_PATH]"

wget --mirror --convert-links --adjust-extension --page-requisites --no-parent -P "$OUTPUT_DIR" "$TARGET_URL"
```
