Check an HTTP status code for a website.
Replace the URL before running.

```bash
#!/usr/bin/env bash
set -euo pipefail

TARGET_URL="[WEBSITE_URL]"

curl -o /dev/null -s -w "%{http_code}\n" "$TARGET_URL"
```
