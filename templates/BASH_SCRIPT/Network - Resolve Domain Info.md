Resolve DNS records for a domain with dig.
Set the domain name and record type.

```bash
#!/usr/bin/env bash
set -euo pipefail

DOMAIN_NAME="[DOMAIN_NAME]"
RECORD_TYPE="[RECORD_TYPE]"

dig "$DOMAIN_NAME" "$RECORD_TYPE" +short
```
