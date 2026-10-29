"""Import only the eight named originals and the requested film, preserving bytes."""
from pathlib import Path
import hashlib
import json
import shutil
from PIL import Image

root = Path(__file__).resolve().parent.parent
downloads = Path.home() / 'Downloads'
target = root / 'assets' / 'user-media'
target.mkdir(parents=True, exist_ok=True)
display = root / 'assets' / 'responsive' / 'user-media'
display.mkdir(parents=True, exist_ok=True)
records = {}
for index in range(8):
    name = 'image.png' if index == 0 else f'image ({index}).png'
    original = downloads / name
    copied = target / f'image-{index}.png'
    shutil.copyfile(original, copied)
    digest = hashlib.sha256(original.read_bytes()).hexdigest()
    assert hashlib.sha256(copied.read_bytes()).hexdigest() == digest
    with Image.open(copied) as source:
        image = source.convert('RGB')
        width, height = image.size
        variants = []
        for size in [480, 960, 1440]:
            resized = image.resize((size, round(height * size / width)), Image.Resampling.LANCZOS)
            output = display / f'image-{index}-{size}.webp'
            resized.save(output, 'WEBP', quality=86 if size < 1440 else 91, method=6)
            variants.append({'src': output.relative_to(root).as_posix(), 'width': size, 'height': resized.height, 'bytes': output.stat().st_size})
    records[copied.relative_to(root).as_posix()] = {'originalName': name, 'width': width, 'height': height, 'sourceBytes': copied.stat().st_size, 'sourceSha256': digest, 'variants': variants}

video = root / 'assets' / 'video' / 'mylodge-user-film.mp4'
shutil.copyfile(downloads / 'download (8).mp4', video)
video_hash = hashlib.sha256(video.read_bytes()).hexdigest()
assert video_hash == hashlib.sha256((downloads / 'download (8).mp4').read_bytes()).hexdigest()
(target / 'manifest.json').write_text(json.dumps({'images': records, 'video': {'originalName': 'download (8).mp4', 'src': video.relative_to(root).as_posix(), 'sha256': video_hash}, 'excluded': 'Seven photographs of a person operating a phone were UI references, not website media.'}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print('Imported 8 unchanged PNG originals, 24 responsive WebP copies, and unchanged download (8).mp4.')
