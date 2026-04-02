Decrypt a GPG-encrypted file into a plain output file.
Edit the input and output paths before use.

```bash
#!/usr/bin/env bash
set -euo pipefail

INPUT_FILE="[ENCRYPTED_FILE_PATH]"
OUTPUT_FILE="[OUTPUT_FILE_PATH]"

gpg --output "$OUTPUT_FILE" --decrypt "$INPUT_FILE"
```
