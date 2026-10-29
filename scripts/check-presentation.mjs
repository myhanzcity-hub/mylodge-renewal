import {readFile,access} from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {pageAliases} from './render-presentation.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>readFile(path.join(root,file),'utf8');
async function data(file){const context={window:{}};vm.runInNewContext(await read(file),context);return context.window.MYLODGE_SLIDES;}
const slides=await data('deck-data.js'),freeSlides=await data('free-deck-data.js');
const html=await read('index.html'),free=await read('free.html');
const photoAudit=JSON.parse(await read('review/private-mansion-photo-sources.json'));
const photosByPath=new Map(photoAudit.images.map(photo=>[photo.image,photo]));
const photosByKey=new Map(photoAudit.images.map(photo=>[photo.key,photo]));
const expectedIds=['opening','economic-use','value','global-ownership','identity','recognition','connections','romance','celebrations','business','family','destinations','mansion-spaces','services','rights','pricing','application','questions','visit','closing'];
assert.equal(slides.length,20);
assert.deepEqual(Array.from(slides,slide=>slide.id),expectedIds,'Keep each requested value independent and family last among the values');
assert.equal(new Set(slides.map(slide=>slide.id)).size,20);
assert.equal(freeSlides.length,6);
assert.deepEqual(Array.from(freeSlides,slide=>slide.id),['community','ownership','pricing','annual-schedule','domestic-schedule','platform-guide']);
const sections=[...html.matchAll(/<section class="slide\b[^>]*data-slide="(\d+)"[^>]*>([\s\S]*?)<\/section>/g)];
assert.equal(sections.length,20);
assert.equal([...free.matchAll(/<section class="slide\b/g)].length,6);
assert.equal([...html.matchAll(/<button\b[^>]*class="page-button /g)].length,2,'The linear deck keeps previous and next controls');
assert.equal([...html.matchAll(/data-slide="\d+"[^>]* hidden/g)].length,19,'Only the first chapter is initially visible');
assert.ok(html.includes('MyLodge Private Mansion')&&html.includes('초호화 별장')&&html.includes('Global Network'));
assert.ok(html.includes('href="free.html#page=1"')&&free.includes('MyLodge Free'),'Keep product entry points explicit');
assert.ok(!html.includes('data-price-picker')&&!html.includes('data-selection')&&!html.includes('href="villa.html"'),'Legacy options and model belong to Free');
assert.ok(!/\b(?:USD|THB)\s*[\d,]+|\$\s*\d|수백\s*배|연\s*5\s*%/.test(html),'Do not invent mansion prices, price comparisons or investment returns');
assert.ok(!/<video\b|assets\/video\/mylodge-hero\.mp4/.test(html),'The Free video must not represent Private Mansion');
assert.ok(free.includes('data-price-picker')&&free.includes('data-selection')&&/href="villa\.html(?:\?[^\"]*)?"/.test(free)&&free.includes('schedule.html'),'Preserve legacy price, plan, model and calendar features in Free');
for(const file of ['index.html','free.html','schedule.html','schedule.js','schedule-data.js','villa.html'])assert.ok(!/녹취|녹음|통화|발언|피드백|\d{2}:\d{2}:\d{2}/.test(await read(file)),file+' must not expose internal conversation notes');

const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const included=(section,value,label)=>{assert.equal(typeof value,'string',label+' must be text');assert.ok(value.trim(),label+' must not be empty');assert.ok(section.includes(escape(value)),label+' missing from its chapter');};
const mainVisuals=[],sources=new Set(),digests=new Set(),usedPhotoKeys=new Set();
let officialPhotos=0,stagedPhotos=0;
for(let index=0;index<slides.length;index++){
  const slide=slides[index],section=sections[index][2];
  assert.equal(Number(sections[index][1]),index+1);
  assert.equal(slide.number,String(index+1).padStart(2,'0'));
  for(const field of ['title','body','kicker'])included(section,slide[field],slide.id+'.'+field);
  if(slide.subtitle)included(section,slide.subtitle,slide.id+'.subtitle');
  assert.ok((slide.points?.length||0)<=3);
  for(const point of slide.points||[])included(section,point,slide.id+'.point');
  for(const fact of slide.facts||[]){included(section,fact.label,slide.id+'.fact label');included(section,fact.value,slide.id+'.fact value');}
  if(slide.note)included(section,slide.note,slide.id+'.note');
  for(const detail of slide.details||[]){included(section,detail.summary,slide.id+'.detail');for(const paragraph of detail.paragraphs||[])included(section,paragraph,slide.id+'.paragraph');for(const item of detail.items||[])included(section,item,slide.id+'.detail item');}
  for(const link of [slide.cta,slide.secondaryCta,...(slide.links||[])].filter(Boolean)){included(section,link.label,slide.id+'.action');assert.ok(section.includes('href="'+escape(link.href)+'"'),slide.id+'.action href');}
  assert.ok(slide.image,'Each chapter needs a large, relevant photo');
  for(const visual of [slide,...(slide.heroGallery||[]),...(slide.gallery||[])]){
    assert.ok(visual.image.startsWith('assets/private-mansion-reference/'),'Use the requested photography or explicitly labelled AI lifestyle scenes');
    const record=photosByPath.get(visual.image);assert.ok(record,'Photo has a provenance record: '+visual.image);
    assert.equal(record.key,visual.imageKey,'Deck identifies its source asset');usedPhotoKeys.add(record.key);
    included(section,visual.imageAlt,slide.id+'.image alt');
    assert.ok(section.includes(escape(encodeURI(visual.image))),'Photo appears in its own chapter: '+visual.image);
    const source=visual.source;assert.ok(source?.name&&source?.url,'Every third-party photo has a visible source');
    assert.equal(source.name,record.sourceName);assert.equal(source.url,record.sourcePage);
    const url=new URL(source.url);assert.equal(url.protocol,'https:');const hostname=url.hostname.replace(/^www\./,'');
    assert.ok(['botanicaluxuryvilla.com','lagunaphuket.com','erawana.com'].includes(hostname),'Only the requested official sources are used');
    sources.add(hostname);included(section,source.name,slide.id+'.source name');
    assert.ok(section.includes('href="'+escape(source.url)+'"'),slide.id+'.source URL');
    const caption=visual.imageCaption||slide.imageCaption;
    if(record.sourceType==='ai-staged'){
      stagedPhotos++;assert.equal(visual.sourceType,'ai-staged','AI scenes must be explicitly typed in the deck');
      assert.ok(/AI.*연출/.test(caption)&&/실제 행사/.test(caption),'Identify staged people as AI, not an actual event');
      const original=photosByKey.get(record.derivedFrom);assert.equal(original?.sourceType,'reference','AI scene derives from a registered official reference');
      assert.equal(record.sourcePage,original.sourcePage);assert.equal(record.sourceName,original.sourceName);
      assert.equal(createHash('sha256').update(await readFile(path.join(root,original.image))).digest('hex'),original.sha256,'The recorded reference bytes are preserved');
    }else{
      officialPhotos++;assert.equal(record.sourceType,'reference');
      assert.ok(/참고/.test(caption)&&/MyLodge/.test(caption)&&/제공|제휴/.test(caption),'Identify official photography as reference, not MyLodge inventory');
    }
    const digest=createHash('sha256').update(await readFile(path.join(root,visual.image))).digest('hex');
    assert.equal(digest,record.sha256,'Photo bytes match the inspected source record');
    assert.ok(!digests.has(digest),'Each main-deck photo placement is a distinct image: '+visual.image);digests.add(digest);mainVisuals.push(visual);
  }
}
assert.equal(sources.size,3,'Use photographs from all three requested sources');
assert.equal(officialPhotos,30,'Use all thirty official-site reference photos');
assert.equal(stagedPhotos,4,'Four independently labelled people scenes illustrate the requested lifestyle values');
assert.equal(mainVisuals.length,34);
for(const photo of photoAudit.images)assert.ok(usedPhotoKeys.has(photo.key),'Use every selected official reference and staged scene: '+photo.key);
const first=sections[0][2],firstPhoto=first.indexOf('data-carousel');
assert.ok(first.indexOf('class="product-title"')>=0&&first.indexOf('class="product-title"')<first.indexOf('<h1'),'Product title precedes the main copy');
assert.ok(first.indexOf('Global Network')<first.indexOf('<h1'));
assert.ok(first.indexOf('호화 별장 오너 되러 가기')>=0&&first.indexOf('호화 별장 오너 되러 가기')<firstPhoto,'The action appears before media');
assert.ok(first.indexOf('hero-terms')>first.indexOf('<h1')&&first.indexOf('hero-terms')<firstPhoto,'Conditions appear before media');
assert.ok(first.includes('href="#page=16"'),'The main CTA reaches the correct mansion conditions chapter');
assert.ok(html.includes('data-photo-frame')&&html.includes('data-photo-source'),'Carousel frames retain source-specific captions');
assert.ok(/reverse/.test(html),'Desktop chapters alternate photo and text placement');
assert.ok(/상담|조건/.test(JSON.stringify(slides[15]))&&/권리/.test(JSON.stringify(slides[14])));
for(const file of ['villa.html','schedule.html'])assert.ok((await read(file)).includes('index.html#page=1'),file+' returns to the introduction first page');

const legacyPrice=freeSlides.find(slide=>slide.id==='pricing');
assert.ok(JSON.stringify(legacyPrice).includes('3,999')&&JSON.stringify(legacyPrice).includes('4,149'));
const paymentPlan=legacyPrice.details.find(detail=>detail.summary.includes('5차 납입'));assert.ok(paymentPlan,'Keep the existing payment schedule in its product');
const payments=Array.from(paymentPlan.items).filter(item=>/^\d차 USD /.test(item));
assert.deepEqual(payments.map(text=>Number(text.match(/^\d차 USD ([\d,]+)/)[1].replaceAll(',',''))),[100,1000,1000,1000,899]);
assert.ok(payments.slice(0,2).every(text=>text.includes('LC계좌 입금'))&&payments.slice(2).every(text=>text.includes('현금 납입')));
assert.ok(JSON.stringify(freeSlides[0]).includes('27평'),'Keep the model scope with the Free product');

const linkedFiles=new Set();
for(const [markup,total] of [[html,20],[free,6]]){
  const ids=[...markup.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);assert.equal(ids.length,new Set(ids).size,'Document IDs must be unique');
  for(const [,id] of markup.matchAll(/aria-controls="([^"]+)"/g))assert.ok(ids.includes(id),'Control target exists: '+id);
  for(const [,number] of markup.matchAll(/href="#page=(\d+)"/g))assert.ok(Number(number)>=1&&Number(number)<=total,'Chapter jump is in bounds');
  for(const [,target] of markup.matchAll(/(?:src|href)="([^"#]+)"/g)){
    const file=decodeURI(target.replaceAll('&amp;','&')).split(/[?#]/)[0];
    if(!/^(?:https?:|data:|mailto:|tel:)/.test(file)){await access(path.join(root,file));linkedFiles.add(file);}
  }
}
assert.ok(!Object.hasOwn(pageAliases,'villa.html')&&!Object.hasOwn(pageAliases,'schedule.html')&&!Object.hasOwn(pageAliases,'free.html'));
for(const [file,target] of Object.entries(pageAliases)){const alias=await read(file),href=typeof target==='number'?`index.html#page=${target}`:target;assert.ok(alias.includes(href),'Legacy address resolves to its intended product: '+file);}
const manifestContext={window:{}};vm.runInNewContext(await read('assets-manifest.js'),manifestContext);
const manifest=new Map(manifestContext.window.MYLODGE_ASSETS.map(asset=>[asset.src,asset]));
for(const visual of mainVisuals){
  const asset=manifest.get(visual.image);assert.ok(asset,'Photo is registered: '+visual.image);
  const variants=asset.variants.filter(v=>v.width>0);assert.ok(variants.length>=2&&variants.some(v=>v.width<=480),'Responsive variants include a mobile size');
  const tag=[...html.matchAll(/<img\b[^>]*>/g)].find(([tag])=>tag.includes('src="'+escape(encodeURI(asset.src))+'"'))?.[0];
  assert.ok(tag?.includes('srcset="')&&tag.includes('sizes="'),'Browser can choose a smaller photo');
  assert.ok(tag.includes(`width="${asset.width}" height="${asset.height}"`),'Image reserves its aspect ratio');
  for(const variant of variants){await access(path.join(root,variant.src));assert.ok(tag.includes(escape(encodeURI(variant.src))+' '+variant.width+'w'));}
}
for(const excluded of ['Narrow-Space-Indoor-Staircase-Wood-Step-Steel-Round-Staircase-Steel-Indoor-Spiral-Stairs.avif','57807.png'])assert.ok(!decodeURI(html+free).includes(excluded));
console.log(`PASS: 20 Private Mansion chapters; ten independent value stories; copy, conditions and CTA before media; ${officialPhotos} distinct attributed official photos from three sources plus ${stagedPhotos} labelled AI lifestyle scenes with verified reference provenance; responsive variants; Free six-page product boundary; existing prices/payments, model and calendar; ${linkedFiles.size} local resources.`);
