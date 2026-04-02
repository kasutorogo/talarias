Encrypt a file with symmetric GPG encryption.
Replace the input and output file paths.

```bash
#!/usr/bin/env bash
set -euo pipefail

INPUT_FILE="[INPUT_FILE_PATH]"
OUTPUT_FILE="[OUTPUT_FILE_PATH]"

gpg --symmetric --cipher-algo AES256 --output "$OUTPUT_FILE" "$INPUT_FILE"
```
