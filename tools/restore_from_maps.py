import json
import os
import glob
from datetime import datetime

ROOT = os.path.dirname(os.path.dirname(__file__))
SRC_DIR = os.path.join(ROOT, 'src')
BUILD_DIR = os.path.join(ROOT, 'build')

# Backup src
timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
backup_zip = os.path.join(ROOT, f'src_backup_before_restore_{timestamp}.zip')
print('Backing up', SRC_DIR, 'to', backup_zip)
import zipfile
with zipfile.ZipFile(backup_zip, 'w', compression=zipfile.ZIP_DEFLATED) as zf:
    for root, dirs, files in os.walk(SRC_DIR):
        for f in files:
            full = os.path.join(root, f)
            arc = os.path.relpath(full, ROOT)
            zf.write(full, arc)

written = []
skipped = []

# find map files
js_maps = glob.glob(os.path.join(BUILD_DIR, 'static', 'js', '*.js.map'))
css_maps = glob.glob(os.path.join(BUILD_DIR, 'static', 'css', '*.css.map'))
all_maps = js_maps + css_maps
print('Found maps:', all_maps)

for map_path in all_maps:
    try:
        with open(map_path, 'r', encoding='utf-8') as fh:
            data = json.load(fh)
    except Exception as e:
        print('Failed to load', map_path, e)
        continue

    sources = data.get('sources') or []
    sourcesContent = data.get('sourcesContent') or []
    for i, src in enumerate(sources):
        # normalize path
        if src.startswith('../node_modules') or src.startswith('webpack'):
            skipped.append(src)
            continue
        content = None
        if i < len(sourcesContent):
            content = sourcesContent[i]
        if content is None:
            skipped.append(src)
            continue
        # decide target path
        target_rel = src.replace('../src/', '') if src.startswith('../src/') else src
        # if path has no dirs and looks like a css file, map to src/
        if os.path.dirname(target_rel) == '' and target_rel.endswith('.css'):
            target_path = os.path.join(SRC_DIR, target_rel)
        else:
            target_path = os.path.join(SRC_DIR, target_rel)

        target_dir = os.path.dirname(target_path)
        if not os.path.exists(target_dir):
            os.makedirs(target_dir, exist_ok=True)

        # backup existing file
        if os.path.exists(target_path):
            bak = target_path + f'.bak_restore_{timestamp}'
            if not os.path.exists(bak):
                os.rename(target_path, bak)
        try:
            with open(target_path, 'w', encoding='utf-8') as out:
                out.write(content)
            written.append(target_path)
        except Exception as e:
            print('Failed writing', target_path, e)
            skipped.append(src)

print('\nWritten files:')
for p in written:
    print('-', p)
print('\nSkipped sources:')
for s in skipped[:50]:
    print('-', s)

print('\nDone.')
print('Backup at:', backup_zip)
