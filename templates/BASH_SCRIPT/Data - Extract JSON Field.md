Extract a field from JSON with jq.
Set the input file and jq filter.

```bash
#!/usr/bin/env bash
set -euo pipefail

JSON_FILE="[JSON_FILE_PATH]"
JQ_FILTER='[JQ_FILTER]'

jq -r "$JQ_FILTER" "$JSON_FILE"
```
