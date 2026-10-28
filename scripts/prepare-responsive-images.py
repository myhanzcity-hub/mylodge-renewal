"""Create lightweight display copies; retain all user-supplied originals unchanged."""
import hashlib,json,subprocess
from pathlib import Path
from PIL import Image,ImageOps

root=Path(__file__).resolve().parent.parent
script="const fs=require('fs'),vm=require('vm');const c={window:{}};vm.runInNewContext(fs.readFileSync('deck-data.js','utf8'),c);console.log(JSON.stringify([...new Set(c.window.MYLODGE_SLIDES.flatMap(s=>[s,...(s.gallery||[]),...(s.imageCollection||[])]).map(s=>s.image).filter(Boolean))]));"
paths=json.loads(subprocess.check_output(['node','-e',script],cwd=root,encoding='utf-8'))
result={}
for relative in paths:
    source=root/relative
    with Image.open(source) as raw:
        image=ImageOps.exif_transpose(raw).convert('RGB')
        width,height=image.size
        variants=[]
        for size in sorted(set(min(width,w) for w in [480,960,1440])):
            filename=f'{source.stem}-{size}.webp'
            destination=root/'assets/responsive'/source.parent.name/filename
            destination.parent.mkdir(parents=True,exist_ok=True)
            scaled=image.resize((size,round(height*size/width)),Image.Resampling.LANCZOS)
            scaled.save(destination,'WEBP',quality=84 if size<=960 else 90,method=6)
            variants.append({'src':destination.relative_to(root).as_posix(),'width':size,'height':scaled.height,'bytes':destination.stat().st_size})
    result[relative]={'width':width,'height':height,'sourceBytes':source.stat().st_size,'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'variants':variants}
(root/'review/responsive-images.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
original=sum(v['sourceBytes'] for v in result.values());mobile=sum(v['variants'][0]['bytes'] for v in result.values())
print(f'{len(result)} images: originals {original:,} bytes; 480px copies {mobile:,} bytes; saved {(1-mobile/original):.1%}.')
