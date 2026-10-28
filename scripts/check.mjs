import {readFile,access} from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const context={window:{},URLSearchParams};
for(const name of ['site-data.js','assets-manifest.js','planning.js'])vm.runInNewContext(await readFile(path.join(root,name),'utf8'),context);
const pages=context.window.MYLODGE_PAGES,assets=context.window.MYLODGE_ASSETS;
assert.equal(pages.length,20);assert.equal(new Set(pages.map(p=>p.file)).size,20);
let references=0;
async function scan(value){
  if(Array.isArray(value)){for(const child of value)await scan(child);return;}
  if(!value||typeof value!=='object')return;
  for(const [key,child] of Object.entries(value)){
    if(['image','href','src','preview'].includes(key)&&typeof child==='string'&&!child.startsWith('#')&&!child.startsWith('http')){const file=child.split(/[?#]/)[0];await access(path.join(root,file));references++;}
    else if(typeof child==='object')await scan(child);
  }
}
await scan(pages);await scan(assets);
for(const page of pages){const html=await readFile(path.join(root,page.file),'utf8');assert.ok(html.includes(`data-page="${page.id}"`));assert.ok(page.hero.title&&page.hero.lead&&page.hero.image);assert.ok(page.sections.length>=2);}
const source=await readFile(path.join(root,'site.js'),'utf8');
for(const m of source.matchAll(/(?:href|src)="([^"$#]+\.(?:html|js|css|svg))(?:[?#][^"]*)?"/g))await access(path.join(root,m[1]));
const owner=pages.find(p=>p.id==='owner');
assert.ok(JSON.stringify(owner).includes('USD 899'));
const planning=context.window.MyLodgePlanning;
const basic=planning.calculate([{type:'basic',quantity:1}]);assert.equal(basic.total,3999);assert.deepEqual(Array.from(basic.installments),[100,1000,1000,1000,899]);
const luxury=planning.calculate([{type:'luxury',quantity:1}]);assert.equal(luxury.total,4149);assert.equal(luxury.installments[4],1049);
const mixed=planning.calculate([{region:'yangyang',section:'family',type:'basic',quantity:2},{region:'yangyang',section:'business',type:'luxury',quantity:1}]);
assert.equal(mixed.quantity,3);assert.equal(mixed.total,12147);assert.deepEqual(Array.from(mixed.installments),[300,3000,3000,3000,2847]);assert.equal(mixed.installments.reduce((a,b)=>a+b),mixed.total);
const transfer=planning.fromSearch('?'+new URLSearchParams({items:JSON.stringify(mixed.items)}));assert.equal(JSON.stringify(transfer),JSON.stringify(mixed.items));
assert.equal(planning.normalise({quantity:-3}).quantity,1);assert.equal(planning.normalise({quantity:999}).quantity,120);assert.equal(planning.normalise({quantity:Infinity}).quantity,1);
console.log(`PASS: 20 page shells, ${references} content/image references, local links, basic/luxury/mixed installment totals, selection transfer, and quantity bounds.`);
