from pathlib import Path
import re, shutil, sys

ROOT = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('.')
OUT = Path(sys.argv[2]) if len(sys.argv) > 2 else Path('cleaned_output')
OUT.mkdir(parents=True, exist_ok=True)

for md in ROOT.rglob('*.md'):
    if md.name.startswith('.') or 'Indice' in md.name:
        continue
    rel = md.relative_to(ROOT)
    text = md.read_text(encoding='utf-8', errors='ignore').replace('\r\n','\n').strip()
    text = re.sub(r'^#\s+.+\n+', '', text)
    text = re.split(r'^##\s+Relacionado\b.*$', text, flags=re.I|re.M)[0].strip()
    target = OUT / rel
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(text + '\n', encoding='utf-8')
