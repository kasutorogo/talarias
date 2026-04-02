Pretty-print a JSON file with jq.
Replace the input file path before running.

```bash
#!/usr/bin/env bash
set -euo pipefail

JSON_FILE="[JSON_FILE_PATH]"

jq '.' "$JSON_FILE"
```
