"""Import user-selected official-site reference photography with source provenance.

No affiliation, ownership or image-license claim is inferred by this import.
Original composition and any embedded branding are retained.
"""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import urlparse
from PIL import Image, ImageOps, ImageDraw
import hashlib, io, json

ROOT=Path(__file__).resolve().parent.parent
BOT='https://www.botanicaluxuryvilla.com/'
LAG='https://www.lagunaphuket.com/'
ERA='https://erawana.com/erawana-grand/'
ROWS=[]
def add(key,title,page,url,roles):
    ROWS.append(dict(key=key,title=title,sourcePage=page,imageUrl=url,recommendedRoles=roles))

for key,title,p in [
 ('botanica-hero','Botanica luxury pool villa','2025/03/mainslide-botanicaluxuryvilla-1.webp'),
 ('botanica-hero-evening','Botanica luxury villa second perspective','2025/03/mainslide-botanicaluxuryvilla-2.webp'),
 ('botanica-grand-avenue-b','Botanica Grand Avenue Zone B','2025/03/photo-botanica-grand-avenue-zone-b.webp'),
 ('botanica-grand-avenue-a1','Botanica Grand Avenue Zone A1','2025/03/photo-botanica-grand-avenue-zone-a1.webp'),
 ('botanica-autumn','Botanica Four Seasons Autumn','2025/03/photo-botanica-four-seasons-autumn.webp'),
 ('botanica-kamala','Botanica Kamala Ocean Valley','2026/05/Kamala-Ocean-Valley_800x450.jpg'),
 ('botanica-verdant','The Verdant by Botanica','2026/05/the_verdant_800x450.png')]:
    add(key,title,BOT,BOT+'wp-content/uploads/'+p,['villa','architecture','pool','hero'])
for i in range(1,5):
    add('botanica-rawai-exterior-'+str(i),'Grand Sea Through view '+str(i),BOT+'projects/grand-sea-through-luxury-villas/',BOT+'wp-content/uploads/2026/06/Grand-Sea-Through-'+str(i)+'.jpg',['villa','architecture','pool'])
add('botanica-pru-jampa','Botanica Pru Jampa villa',BOT,BOT+'wp-content/uploads/2025/03/photo-botanica-pru-jampa.webp',['villa','architecture','pool'])

for i in range(1,9):
    add('erawana-grand-'+str(i).zfill(2),'Erawana Grand villa view '+str(i),ERA,'https://erawana.com/wp-content/uploads/2026/04/Erawan-Grand-'+str(i).zfill(2)+'.jpg',['villa','interior','architecture'])

for i in range(1,4):
    add('laguna-wedding-'+str(i).zfill(2),'Laguna Phuket wedding view '+str(i),LAG+'weddings/',LAG+'wp-content/uploads/2022/05/Laguna-Wedding-Phuket-'+str(i)+'.jpg',['wedding','romance','celebration'])
for key,title,page,p,roles in [
 ('laguna-wedding-beach','Laguna Phuket destination wedding',LAG+'weddings/','2022/05/Wedding-Phuket.jpg',['wedding','romance']),
 ('laguna-event-angsana','Angsana event venue at Laguna Phuket',LAG+'mice-venues/','2022/05/Angsana-Event-9.jpg',['business','events','hosting']),
 ('laguna-event-banyan','Banyan Tree event venue at Laguna Phuket',LAG+'mice-venues/','2022/05/Banyan-Tree-Phuket-Event-11.jpg',['business','events','hosting']),
 ('laguna-gala-dinner','SAii Laguna Phuket gala dinner',LAG+'mice-venues/','2025/07/07-SAii-Laguna-phuket-Meetings-gala-dinner.jpg',['friends','dining','events']),
 ('laguna-rava-aerial','Rava Beach Club aerial view',LAG,'2026/02/Rava_Aerial_Front_01_Retouch_Row-1.jpg',['destination','lifestyle','coast']),
 ('laguna-destination','Laguna Phuket hotels and coast',LAG,'2022/05/banner-hotels-1.jpg',['destination','coast']),
 ('laguna-experience','Laguna Phuket experience',LAG,'2022/05/box-experience.jpg',['lifestyle','friends','family'])]:
    add(key,title,page,LAG+'wp-content/uploads/'+p,roles)

def fetch(row):
    url=row['imageUrl']
    # The official Botanica origin times out from this workstation. This public
    # image delivery URL fetches the very same official URL without visual edits.
    retrieval='https://images.weserv.nl/?url='+url.removeprefix('https://') if 'botanicaluxuryvilla.com' in url else url
    raw=urlopen(Request(retrieval,headers={'User-Agent':'Mozilla/5.0','Referer':row['sourcePage']}),timeout=55).read()
    image=Image.open(io.BytesIO(raw));image.load()
    suffix={'JPEG':'.jpg','WEBP':'.webp','PNG':'.png'}[image.format]
    relative='assets/private-mansion-reference/'+row['key']+suffix
    target=ROOT/relative;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(raw)
    image=ImageOps.exif_transpose(image).convert('RGB');width,height=image.size
    if min(width,height)<300:raise RuntimeError('Image too small: '+row['key'])
    variants=[]
    for size in sorted(set(min(width,n) for n in [480,960,1440])):
        path=ROOT/'assets/responsive/private-mansion-reference'/f"{row['key']}-{size}.webp"
        path.parent.mkdir(parents=True,exist_ok=True)
        image.resize((size,round(height*size/width)),Image.Resampling.LANCZOS).save(path,'WEBP',quality=84 if size<=960 else 90,method=6)
        variants.append(dict(src=path.relative_to(ROOT).as_posix(),width=size,height=round(height*size/width),bytes=path.stat().st_size))
    source='BOTANICA Luxury Villas' if 'botanicaluxuryvilla' in url else 'Laguna Phuket' if 'lagunaphuket' in url else 'Erawana'
    row.update(sourceName=source,image=relative,localImage=relative,width=width,height=height,sourceBytes=len(raw),sha256=hashlib.sha256(raw).hexdigest(),sourceSha256=hashlib.sha256(raw).hexdigest(),sourceType='reference',capturedDate='2026-10-29',retrievalUrl=retrieval,variants=variants,attribution='Official-site reference photography; not MyLodge inventory or partnership evidence.')
    return row

def main():
    with ThreadPoolExecutor(max_workers=6) as pool: rows=list(pool.map(fetch,ROWS))
    digests=[r['sha256'] for r in rows]
    if len(set(digests))!=len(digests):raise RuntimeError('Duplicate image bytes')
    report=dict(capturedDate='2026-10-29',referenceOnly=True,affiliationConfirmed=False,sourcePages=[BOT,LAG,'https://erawana.com/land-for-sale/#about_erawanagrand'],images=rows)
    (ROOT/'review/private-mansion-photo-sources.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    thumbw,thumbh=300,240
    sheet=Image.new('RGB',(thumbw*5,thumbh*6),'#eee9df');draw=ImageDraw.Draw(sheet)
    for i,r in enumerate(rows):
        with Image.open(ROOT/r['image']) as im:
            thumb=ImageOps.contain(im.convert('RGB'),(thumbw,200));x=(i%5)*thumbw;y=(i//5)*thumbh
            sheet.paste(thumb,(x+(thumbw-thumb.width)//2,y));draw.text((x+6,y+202),r['key'],fill='black');draw.text((x+6,y+218),str(r['width'])+' x '+str(r['height']),fill='black')
    sheet.save(ROOT/'review/private-mansion-photo-contact-sheet.jpg',quality=90)
    print(json.dumps(dict(images=len(rows),sources={s:sum(r['sourceName']==s for r in rows)for s in ['BOTANICA Luxury Villas','Laguna Phuket','Erawana']},unique=len(set(digests))),ensure_ascii=False))

if __name__=='__main__':main()
