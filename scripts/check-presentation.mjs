import {readFile,access} from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {pageAliases} from './render-presentation.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const context={window:{}};
vm.runInNewContext(await readFile(path.join(root,'deck-data.js'),'utf8'),context);
const slides=context.window.MYLODGE_SLIDES;
const expectedIds=['opening','products','destinations','private-villa','privacy','lifestyle','maid','condo','comparison','community','ownership','pricing','rental','transfer','annual-schedule','domestic-schedule','thailand-schedule','application','platform-guide','closing'];
assert.equal(slides.length,20);
assert.equal(new Set(slides.map(slide=>slide.id)).size,20);
assert.deepEqual(Array.from(slides,slide=>slide.id),expectedIds);
const html=await readFile(path.join(root,'index.html'),'utf8');
for(const file of ['index.html','schedule.html','schedule.js','schedule-data.js','villa.html']){
  const publicContent=await readFile(path.join(root,file),'utf8');
  assert.ok(!/대표|녹취|녹음|통화|발언|원문|피드백|\d{2}:\d{2}:\d{2}/.test(publicContent),file+' must not expose internal conversation attribution');
}
const sections=[...html.matchAll(/<section class="slide\b[^>]*data-slide="(\d+)"[^>]*>([\s\S]*?)<\/section>/g)];
assert.equal(sections.length,20,'Every chapter must be present in the generated document');
assert.equal([...html.matchAll(/aria-labelledby="title-\d+" hidden/g)].length,19);
assert.equal([...html.matchAll(/<button\b[^>]*class="page-button /g)].length,2,'Keep the two-button presentation navigation');
const signup=[...html.matchAll(/<a class="signup-link" href="([^"]+)"([^>]*)>([^<]+)<\/a>/g)];
assert.equal(signup.length,1);assert.equal(signup[0][1],'https://hanzcity.com/auth/sign-in');assert.equal(signup[0][3],'회원가입');
assert.ok(signup[0][2].includes('target="_blank"')&&signup[0][2].includes('rel="noopener noreferrer"'),'Open the external signup outside the embedded preview');
assert.equal([...html.matchAll(/href="https:\/\/hanzcity\.com\/auth\/sign-in"/g)].length,1,'Use one shared signup destination button');
assert.equal([...html.matchAll(/<a href="villa\.html" class="overview-link">/g)].length,1);
assert.ok(sections[0][2].includes('기존 MyLodge 27평 모델 · 신규 태국 대형 빌라와 별도'),'Do not present the existing model as the new Thai mansion');
assert.ok(!Object.hasOwn(pageAliases,'villa.html'));
assert.ok(!Object.hasOwn(pageAliases,'schedule.html'));
assert.ok(!/<form\b|site-menu|desktop-nav/.test(html),'Keep the main presentation linear');
assert.equal([...html.matchAll(/<dialog\b/g)].length,2,'Video player and requested table of contents use dialogs');
assert.equal([...html.matchAll(/data-toc-page="\d+"/g)].length,20,'Every chapter is reachable from the contents');
assert.ok(html.includes('id="space-film-modal"')&&html.includes('aria-controls="space-film-modal"'));

const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const included=(section,value,label)=>{assert.equal(typeof value,'string',label+' must be text');assert.ok(value.trim(),label+' must not be empty');assert.ok(section.includes(escape(value)),label+' missing from its chapter');};
const visuals=[],referenceLinks=[];
for(let index=0;index<slides.length;index++){
  const slide=slides[index],section=sections[index][2];
  assert.equal(Number(sections[index][1]),index+1);
  assert.equal(slide.number,String(index+1).padStart(2,'0'));
  assert.equal(slide.layout,'split');
  for(const field of ['title','body','kicker'])included(section,slide[field],slide.id+'.'+field);
  if(slide.subtitle)included(section,slide.subtitle,slide.id+'.original subtitle');
  if(slide.brandBridge)for(const text of Object.values(slide.brandBridge))included(section,text,slide.id+'.brand connection');
  assert.ok((slide.points?.length||0)<=3,'Limit the first-level value points');
  assert.ok((slide.facts?.length||0)<=3,'Limit first-level facts');
  for(const point of slide.points||[])included(section,point,slide.id+'.point');
  for(const fact of slide.facts||[]){included(section,fact.label,slide.id+'.fact label');included(section,fact.value,slide.id+'.fact value');}
  if(slide.note)included(section,slide.note,slide.id+'.note');
  if(slide.featuredQuote){
    included(section,slide.featuredQuote.text,slide.id+'.original highlighted sentence');
    assert.ok(!slide.featuredQuote.source,'Internal attribution must not be in public content');
    if(slide.featuredQuote.qualification)included(section,slide.featuredQuote.qualification,slide.id+'.quote qualification');
  }
  for(const excerpt of slide.sourceExcerpts||[]){
    included(section,excerpt.title,slide.id+'.content title');assert.ok(!excerpt.source,'Internal call references must not be in public content');
    for(const text of excerpt.paragraphs)included(section,text,slide.id+'.original sentence');
    if(excerpt.qualification)included(section,excerpt.qualification,slide.id+'.source qualification');
  }
  for(const detail of slide.details||[]){
    included(section,detail.summary,slide.id+'.detail summary');
    for(const paragraph of detail.paragraphs||[])included(section,paragraph,slide.id+'.detail paragraph');
    for(const item of detail.items||[])included(section,item,slide.id+'.detail item');
  }
  for(const payment of slide.payments||[])for(const field of ['stage','amount','method','when'])included(section,payment[field],slide.id+'.payment '+field);
  for(const link of slide.links||[]){
    included(section,link.label,slide.id+'.link label');
    assert.ok(section.includes('href="'+escape(link.href)+'"'),slide.id+'.link destination');
    if(/^https?:\/\//.test(link.href))referenceLinks.push(new URL(link.href));
  }
  assert.ok(slide.image,'Every chapter must have a visible photo: '+slide.id);
  if(slide.image){
    assert.equal(slide.imageFit,'contain','Preserve the full existing concept image');
    if(slide.imageCaption)included(section,slide.imageCaption,slide.id+'.image caption');
    assert.ok(!slide.gallery||Array.isArray(slide.gallery)&&slide.gallery.length<=2);
    for(const visual of [slide,...(slide.gallery||[]),...(slide.imageCollection||[])]){
      const referenceFile=visual.image.startsWith('assets/reference-originals/');
      if(referenceFile){
        const name=path.basename(visual.image);
        assert.ok(['57794.jpg','57795.png','57796.png','57797.png','57798.png','57800.png','57801.png','57802.png','57803 (1).png','57804.png','57805.png','57808.png','57810.png','57821.png','57822.png'].includes(name),'Only approved folder photos; exclude spiral staircases');
        assert.deepEqual(await readFile(path.join(root,visual.image)),await readFile(path.join(root,'참고 이미지 (3D 도면화)',name)),'Preserve original photo bytes');
      }else if(visual.image.startsWith('assets/mylodge-thailand-concepts/')){
        assert.ok(['phuket-pool.png','phuket-living.png','phuket-bedroom.png'].includes(path.basename(visual.image)),'Use the reviewed original MyLodge concepts');
        assert.ok(['destinations','private-villa','thailand-schedule'].includes(slide.id),'Keep the new pool-villa concepts in the intended chapters');
      }else if(visual.image.startsWith('assets/mylodge-edited/')){
        assert.ok(['tropical-pool-villa.png','living-retreat.png','condo-retreat.png','poolside-terrace.png'].includes(path.basename(visual.image)),'Only reviewed image edits and new concepts');
      }else assert.ok(/^assets\/feedback-v2\/[^/]+\.png$/.test(visual.image),'Use supplied references or existing concepts');
      included(section,visual.imageAlt,slide.id+'.image alt');
      await access(path.join(root,visual.image));
      assert.ok(section.includes(escape(encodeURI(visual.image))),'Image missing: '+visual.image);
      if(visual!==slide)included(section,visual.label,slide.id+'.gallery label');
      visuals.push(visual);
    }
  }
  if(slide.panelInDetails){
    assert.ok(slide.panel,'Photo chapters preserve their information panels');
    assert.ok(section.includes('class="more-info panel-details"'),'Information panel remains accessible');
    for(const field of ['eyebrow','title','metric','note'])if(slide.panel[field])included(section,slide.panel[field],slide.id+'.panel '+field);
    for(const item of slide.panel.items||[]){included(section,item.label,slide.id+'.panel label');included(section,item.value,slide.id+'.panel value');if(item.detail)included(section,item.detail,slide.id+'.panel detail');}
  }
}

const linkedFiles=new Set([...html.matchAll(/(?:src|href)="([^"#]+)"/g)].map(match=>decodeURI(match[1].replaceAll('&amp;','&'))).filter(file=>!/^https?:\/\//.test(file)).map(file=>file.split(/[?#]/)[0]));
for(const file of linkedFiles)await access(path.join(root,file));
assert.equal(Object.keys(pageAliases).length,18);
for(const [file,number] of Object.entries(pageAliases)){
  if(file==='account.html'){
    assert.equal(number,'https://hanzcity.com/auth/sign-in');
    const account=await readFile(path.join(root,file),'utf8');
    assert.ok(account.includes('content="0;url=https://hanzcity.com/auth/sign-in"'));
    assert.ok(account.includes('href="https://hanzcity.com/auth/sign-in"'));
    assert.ok(!account.includes('index.html#page=19'),'Legacy account URL must lead to HanzCity signup');
    continue;
  }
  assert.ok(Number.isInteger(number)&&number>=1&&number<=20);
  assert.ok((await readFile(path.join(root,file),'utf8')).includes(`index.html#page=${number}`),'Old address points to its new chapter: '+file);
}
assert.equal(referenceLinks.length,0,'Do not expose developer reference links in the promotional deck');
for(const url of referenceLinks){
  assert.equal(url.protocol,'https:');
  assert.ok(['www.botanicaluxuryvilla.com','botanicaluxuryvilla.com','www.sansiri.com','sansiri.com','x.i360.city'].includes(url.hostname),'Use verified official developer/reference destinations: '+url.href);
}
assert.ok(html.includes('schedule.html'),'The annual schedule preview must be reachable');

const chapter=id=>JSON.stringify(slides.find(slide=>slide.id===id));
assert.ok(chapter('opening').includes('나 해외에 호화 별장 가진 사람이야'));
assert.ok(chapter('opening').includes('이 꿈 같은 로망이 즉시 현실이 되다'));
assert.ok(!/AI (?:공간 |편집 )?콘셉트|확정 후 안내/.test(html),'Remove repetitive concept and pending-notice copy');
const price=chapter('pricing');
assert.ok(price.includes('3,999')&&price.includes('4,149')&&price.includes('기존'),'Keep existing MyLodge prices scoped to the existing product');
const paymentPlan=slides.find(slide=>slide.id==='pricing').details.find(detail=>detail.summary.includes('5차 납입'));
const payments=Array.from(paymentPlan.items).filter(item=>/^\d차 USD /.test(item));
assert.deepEqual(payments.map(text=>Number(text.match(/^\d차 USD ([\d,]+)/)[1].replaceAll(',',''))),[100,1000,1000,1000,899]);
assert.ok(payments.slice(0,2).every(text=>text.includes('LC계좌 입금'))&&payments.slice(2).every(text=>text.includes('현금 납입')));
const community=chapter('community');
assert.ok(community.includes('17평')&&community.includes('10평')&&community.includes('27평')&&community.includes('기존'));
assert.ok(!/1층 약 10평|복층 포함 약 17평/.test(JSON.stringify(slides)));
assert.ok(/권리/.test(chapter('ownership'))&&/최종 계약/.test(chapter('ownership')));
assert.ok(chapter('maid').includes('29')&&/상품별|확인|조건/.test(chapter('maid')));
for(const id of ['rental','transfer'])assert.ok(/계약|조건/.test(chapter(id))&&/보장하지|보장되지|보장할 수 없/.test(chapter(id)),id+' must explain conditions and avoid guarantees');
assert.ok(chapter('annual-schedule').includes('365')&&/3일/.test(chapter('annual-schedule')));
assert.ok(chapter('domestic-schedule').includes('이용일')&&chapter('domestic-schedule').includes('최종 운영 조건'));
assert.ok(chapter('thailand-schedule').includes('성수기')&&chapter('thailand-schedule').includes('최종 운영 조건'));
assert.ok(/가입/.test(chapter('application'))&&/계약/.test(chapter('application'))&&/별도|구분|확정/.test(chapter('application')));

const excluded=['H5b864e2492f446ed9abd142df0bf80a94.jpg','KakaoTalk_20250114_081647842_01.jpg','Narrow-Space-Indoor-Staircase-Wood-Step-Steel-Round-Staircase-Steel-Indoor-Spiral-Stairs.avif','57807.png'];
for(const file of excluded)assert.ok(!decodeURI(html).includes(file));
assert.ok(!html.includes('assets/parks/'));
const photoDigests=new Set();
for(const visual of visuals){
  const digest=createHash('sha256').update(await readFile(path.join(root,visual.image))).digest('hex');
  assert.ok(!photoDigests.has(digest),'Each deck photo placement must be unique: '+visual.image);
  photoDigests.add(digest);
}
assert.equal([...html.matchAll(/<img\b/g)].filter(match=>!html.slice(match.index,html.indexOf('>',match.index)).includes('class="brand-logo"')).length,visuals.length+12,'Keep all existing photos, four previews and eight expanding gallery cards');
assert.equal([...html.matchAll(/class="photo-brand"/g)].length,visuals.length+12,'Every presentation photo has its own MyLodge branding, including gallery previews');
assert.ok(!/Botanica|Banyan|Laguna|Erawana|Erawan-Grand|Seacon|보타니카|반얀|라구나|에라와나/i.test(html),'Developer names must not appear in public presentation markup');
const manifestContext={window:{}};
vm.runInNewContext(await readFile(path.join(root,'assets-manifest.js'),'utf8'),manifestContext);
const manifestPaths=new Set(manifestContext.window.MYLODGE_ASSETS.flatMap(asset=>asset.variants.map(variant=>variant.src)));
for(const visual of visuals)assert.ok(manifestPaths.has(visual.image),'Image missing from manifest: '+visual.image);
for(const asset of manifestContext.window.MYLODGE_ASSETS){
  const variants=asset.variants.filter(v=>v.width>0);
  assert.ok(variants.length>=2&&variants.some(v=>v.width<=480),'Mobile display sizes exist: '+asset.src);
  const imageTag=[...html.matchAll(/<img\b[^>]*>/g)].find(([tag])=>tag.includes('src="'+escape(encodeURI(asset.src))+'"'))?.[0];
  assert.ok(imageTag?.includes('srcset="')&&imageTag.includes('sizes="'),'Browser can choose a smaller image: '+asset.src);
  assert.ok(imageTag.includes(`width="${asset.width}" height="${asset.height}"`),'Image reserves its aspect ratio');
  for(const variant of variants){await access(path.join(root,variant.src));assert.ok(imageTag.includes(escape(encodeURI(variant.src))+' '+variant.width+'w'));}
}
console.log(`PASS: 20 promotional chapters; all public copy rendered; one signup button; original-model context; ${visuals.length} photo placements; calendar entry; existing prices/payments; unconfirmed new-product conditions; ${linkedFiles.size} local resources.`);
const feedback=await readFile(path.join(root,'review/source-materials/renewal-feedback-verbatim-20261028.txt'),'utf8');
const originalSections=new Map();let sectionNumber;
for(const line of feedback.split(/\r?\n/)){
  const heading=line.match(/^## (\d+)\./);if(heading){sectionNumber=Number(heading[1]);originalSections.set(sectionNumber,[]);}
  const quote=line.match(/^> (.+)$/);if(quote&&sectionNumber)originalSections.get(sectionNumber).push(quote[1]);
}
for(const slide of slides){
  assert.ok(!slide.sourceExcerpts&&!slide.featuredQuote,'Conversation excerpts must not be published: '+slide.id);
  assert.equal(slide.points.length,3,'Each chapter has three customer-facing benefits');
  assert.ok(!/검토|확정 표시|담당자|발표자|시연|피드백|녹취|대표|원문/.test(slide.body),'Use promotional body copy: '+slide.id);
}
const verbatimMap=JSON.parse(await readFile(path.join(root,'review/renewal-verbatim-map.json'),'utf8'));
assert.equal(verbatimMap.sourceDocumentText,feedback,'The full original document must be preserved unchanged');
assert.equal(verbatimMap.sections.length,47);
for(const item of verbatimMap.sections)assert.deepEqual(item.paragraphs,originalSections.get(item.section),'Verbatim map omitted or changed source section '+item.section);
console.log('PASS: customer-facing promotional copy; internal source document preserved separately in review.');
