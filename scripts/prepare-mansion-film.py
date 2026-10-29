"""Compose the Mansion film from reviewed local luxury images and existing audio."""
from pathlib import Path
import json
import subprocess
import imageio_ffmpeg

root = Path(__file__).resolve().parent.parent
ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
work = root / 'review' / 'mansion-film'
work.mkdir(parents=True, exist_ok=True)
images = [
    'assets/mylodge-edited/tropical-pool-villa.png',
    'assets/mylodge-thailand-concepts/phuket-living.png',
    'assets/feedback-v2/deck-06-shared-dinner.png',
    'assets/mylodge-thailand-concepts/phuket-bedroom.png',
    'assets/feedback-v2/deck-17-bangkok-city.png',
    'assets/feedback-v2/deck-20-homecoming-night.png',
]
def run(args):
    subprocess.run([ffmpeg, '-hide_banner', '-loglevel', 'error', '-y', *args], check=True, cwd=root)

for index, image in enumerate(images):
    run(['-i', image, '-vf', "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,zoompan=z='min(zoom+0.0005,1.04)':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=72:s=1280x720:fps=24,fade=t=in:st=0:d=0.25,fade=t=out:st=2.75:d=0.25", '-frames:v', '72', '-an', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '22', '-pix_fmt', 'yuv420p', str(work / f'clip-{index}.mp4')])
concat = work / 'clips.txt'
concat.write_text(''.join(f"file 'clip-{index}.mp4'\n" for index in range(len(images))), encoding='utf-8')
output = root / 'assets' / 'video' / 'private-mansion-film.mp4'
run(['-f', 'concat', '-safe', '0', '-i', str(concat), '-stream_loop', '-1', '-i', 'assets/video/mylodge-hero.mp4', '-map', '0:v:0', '-map', '1:a:0', '-t', '18', '-c:v', 'copy', '-af', 'afade=t=in:st=0:d=0.5,afade=t=out:st=17:d=1', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', str(output)])
(work / 'manifest.json').write_text(json.dumps({'output': str(output.relative_to(root)), 'seconds': 18, 'images': images, 'audioSource': 'assets/video/mylodge-hero.mp4', 'notes': 'Photo-based motion film, not footage of delivered inventory. Existing audio retained; human listening review pending.'}, indent=2), encoding='utf-8')
print(f'Prepared {output.name}: six reviewed luxury scenes, 18 seconds, existing audio track.')
