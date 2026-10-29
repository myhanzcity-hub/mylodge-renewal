"""Copy built-in imagegen results into the project and make display-size copies."""
from pathlib import Path
import hashlib
import json
import shutil
from PIL import Image, ImageDraw, ImageOps

root = Path(__file__).resolve().parent.parent
jobs = json.loads((root / 'review/ai-refinement-jobs-final.json').read_text(encoding='utf-8'))
manifest = {'generator': 'built-in image_gen', 'date': '2026-10-29', 'mappings': {}, 'images': {}, 'edits': []}
sha = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()
display = root / 'assets/responsive/ai-refined'
display.mkdir(parents=True, exist_ok=True)
for job in jobs:
    original = root / job['source']
    generated = Path(job['generated'])
    destination = root / job['destination']
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(generated, destination)
    assert sha(original) != sha(destination), f"Unchanged output: {job['key']}"
    with Image.open(original) as source, Image.open(destination) as output:
        width, height = output.size
        assert abs(width / height - source.width / source.height) < 0.02, f"Aspect ratio changed: {job['key']}"
        image = output.convert('RGB')
        variants = []
        for size in sorted(set(min(width, value) for value in [480, 960, 1440])):
            scaled = image.resize((size, round(height * size / width)), Image.Resampling.LANCZOS)
            filename = display / f'{destination.stem}-{size}.webp'
            scaled.save(filename, 'WEBP', quality=86 if size < 1440 else 91, method=6)
            variants.append({'src': filename.relative_to(root).as_posix(), 'width': size, 'height': scaled.height, 'bytes': filename.stat().st_size})
    manifest['mappings'][job['source']] = job['destination']
    manifest['images'][job['destination']] = {'width': width, 'height': height, 'sourceBytes': destination.stat().st_size, 'sourceSha256': sha(destination), 'variants': variants}
    manifest['edits'].append({'source': job['source'], 'sourceSha256': sha(original), 'output': job['destination'], 'outputSha256': sha(destination), 'prompt': job['prompt']})

(root / 'assets/ai-refined/manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
for group in range(2):
    sheet = Image.new('RGB', (1440, 1040), '#f0ede9')
    draw = ImageDraw.Draw(sheet)
    for offset, job in enumerate(jobs[group * 8:(group + 1) * 8]):
        x, y = (offset % 2) * 720, (offset // 2) * 260
        for side, file in enumerate([job['source'], job['destination']]):
            with Image.open(root / file) as picture:
                thumb = ImageOps.contain(picture.convert('RGB'), (354, 226))
                sheet.paste(thumb, (x + side * 360 + (354 - thumb.width) // 2, y))
        draw.text((x + 6, y + 232), f"{job['key']}: original -> built-in AI refined", fill='#172d39')
    sheet.save(root / f'review/ai-refinement-before-after-{group+1}.jpg', quality=92)
print(f'Saved {len(jobs)} AI-refined images, their responsive variants, provenance and prompt set.')
