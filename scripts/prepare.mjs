import {renderPresentation} from './render-presentation.mjs';
import {readFile,writeFile,access} from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {communities,spaces} from '../presentation-options.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const decks=[];
for(const file of ['deck-data.js','free-deck-data.js']){
  const context={window:{}};
  vm.runInNewContext(await readFile(path.join(root,file),'utf8'),context);
  decks.push(context.window.MYLODGE_SLIDES);
}
const responsive=JSON.parse(await readFile(path.join(root,'review/responsive-images.json'),'utf8').catch(()=>'{}'));
const photoSources=JSON.parse(await readFile(path.join(root,'review/private-mansion-photo-sources.json'),'utf8').catch(()=>'{}'));
for(const photo of photoSources.images||[])responsive[photo.image||photo.localImage]=photo;
const activeImages=new Map();
const experienceImages=[...communities,...spaces].map((item,index)=>({id:'free-experience-'+index,image:item.image.startsWith('assets/')?item.image:'assets/reference-originals/'+item.image,imageAlt:item.imageAlt||item.title}));
for(const slide of [...decks.flat(),...experienceImages]){
  for(const [index,visual] of [slide,...(slide.heroGallery||[]),...(slide.gallery||[]),...(slide.imageCollection||[])].entries()){
    if(!visual.image)continue;
    await access(path.join(root,visual.image));
    if(!activeImages.has(visual.image)){
      let optimized=responsive[visual.image];
      if(optimized){
        const digest=createHash('sha256').update(await readFile(path.join(root,visual.image))).digest('hex');
        if(digest!==optimized.sourceSha256)optimized=null;
        else for(const variant of optimized.variants)await access(path.join(root,variant.src));
      }
      activeImages.set(visual.image,{key:index?`${slide.id}-${index}`:slide.id,title:visual.imageAlt,category:/^assets\/(?:feedback-v2|mylodge-edited|mylodge-thailand-concepts)\//.test(visual.image)?'concept':'reference',src:visual.image,preview:visual.image,width:optimized?.width,height:optimized?.height,variants:[{src:visual.image,width:0},...(optimized?.variants||[])]});
    }
  }
}
const assets=[...activeImages.values()];
await writeFile(path.join(root,'assets-manifest.js'),'window.MYLODGE_ASSETS = '+JSON.stringify(assets,null,2)+';\n');
await renderPresentation(root,assets);
await renderPresentation(root,assets,{kind:'free',dataFile:'free-deck-data.js',output:'free.html',aliases:false});
console.log('Prepared '+assets.length+' active images for the presentation.');
