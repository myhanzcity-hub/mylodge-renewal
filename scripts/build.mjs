import './prepare.mjs';
import './prepare-villa-assets.mjs';
import {mkdir,copyFile,readFile,readdir,rename} from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {pageAliases} from './render-presentation.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,'dist');
await mkdir(out,{recursive:true});
const context={window:{}};
vm.runInNewContext(await readFile(path.join(root,'assets-manifest.js'),'utf8'),context);
async function treeFiles(relative){
  const result=[];
  for(const entry of await readdir(path.join(root,relative),{withFileTypes:true})){
    const name=relative+'/'+entry.name;
    if(entry.isDirectory())result.push(...await treeFiles(name));else result.push(name);
  }
  return result;
}
const modelFiles=['mylodge-villa.glb','mylodge-villa.blend','overview.png','ground-interior.png','upper-interior.png','living-interior.png','xr-living.png','xr-bedroom.png'].map(name=>'assets/model/'+name);
const files=['assets/brand/mylodge-logo.png','intro.html','entry-route.js','index.html','presentation.css','presentation.js','presentation-extras.js','presentation-options.js','presentation-motion.js','assets/vendor/gsap.min.js','assets/video/mylodge-hero.mp4','favicon.svg','villa.html','villa.css','villa-viewer.js','villa-tour.js','schedule.html','schedule.css','schedule-data.js','schedule.js','assets/environment/forest-slope-1k.hdr',...Object.keys(pageAliases),...context.window.MYLODGE_ASSETS.flatMap(a=>a.variants.map(v=>v.src)),...modelFiles,...await treeFiles('assets/vendor/three'),...await treeFiles('assets/motion'),...await treeFiles('entry-3d')];
for(const name of files){const destination=path.join(out,name);await mkdir(path.dirname(destination),{recursive:true});await copyFile(path.join(root,name),destination);}
// Retain superseded build files outside the public output; some are the only
// remaining copies of old source images. Never delete user-supplied originals.
const keep=new Set(files.map(name=>path.normalize(name)));
const archive=path.join(root,'review','superseded-build',new Date().toISOString().replace(/[:.]/g,'-'));
const within=(base,target)=>{const rel=path.relative(base,target);if(!rel||rel.startsWith('..')||path.isAbsolute(rel))throw new Error('Unsafe build path: '+target);};
within(root,out);within(root,archive);
async function archiveUnused(directory){
  let count=0;
  for(const entry of await readdir(directory,{withFileTypes:true})){
    const source=path.join(directory,entry.name);within(out,source);
    if(entry.isDirectory())count+=await archiveUnused(source);
    else {
      const relative=path.relative(out,source);
      if(keep.has(relative))continue;
      const destination=path.join(archive,relative);within(archive,destination);
      await mkdir(path.dirname(destination),{recursive:true});await rename(source,destination);count++;
    }
  }
  return count;
}
const archived=await archiveUnused(out);
if(archived)console.log(`Preserved ${archived} superseded files in ${path.relative(root,archive)} (outside public dist).`);
console.log(`Built ${files.length} public files into dist.`);
