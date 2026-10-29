import {renderPresentation} from './render-presentation.mjs';
import {renderFree,freePhotos} from './render-free.mjs';
import {destinations,communities,lifeScenes,spaces} from '../presentation-options.js';
import {readFile,writeFile,access} from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const context={window:{}};
vm.runInNewContext(await readFile(path.join(root,'deck-data.js'),'utf8'),context);
const slides=context.window.MYLODGE_SLIDES;
const responsive=JSON.parse(await readFile(path.join(root,'review/responsive-images.json'),'utf8').catch(()=>'{}'));
const userMedia=JSON.parse(await readFile(path.join(root,'assets/user-media/manifest.json'),'utf8'));
const refined=JSON.parse(await readFile(path.join(root,'assets/ai-refined/manifest.json'),'utf8'));
Object.assign(responsive,userMedia.images,refined.images);
const activeImages=new Map();
const experiencePhotos=[...destinations,...communities,...lifeScenes,...spaces].map(item=>({image:item.image.startsWith('assets/')?item.image:'assets/reference-originals/'+item.image,imageAlt:item.imageAlt||item.title}));
for(const slide of [...slides,{id:'mylodge-free',gallery:freePhotos},{id:'experiences',gallery:experiencePhotos}]){
  for(const [index,visual] of [slide,...(slide.gallery||[]),...(slide.imageCollection||[])].entries()){
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
await renderFree(root,assets);
console.log('Prepared '+assets.length+' active images for the presentation.');
