import {readFile,access,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {Box3} from 'three';
import path from 'node:path';
const file='assets/model/mylodge-villa.glb';
const binary=await readFile(file);
assert.equal(binary.readUInt32LE(0),0x46546c67);assert.equal(binary.readUInt32LE(4),2);
assert.equal(binary.readUInt32LE(8),binary.length);
const length=binary.readUInt32LE(12),json=JSON.parse(binary.subarray(20,20+length).toString());
assert.ok(json.meshes.length>30,'Model must contain furnished geometry');
assert.ok(!json.images?.some(image=>image.uri),'No external texture downloads');
const model=await new Promise((resolve,reject)=>new GLTFLoader().parse(binary.buffer.slice(binary.byteOffset,binary.byteOffset+binary.byteLength),'',resolve,reject));
const groups=['GF','FF','ROOF','SHELL_GROUND','SHELL_UPPER','GLASS_GROUND','GLASS_UPPER','SITE','TERRACE','TERRACE_GLASS'];
for(const name of groups){const group=model.scene.getObjectByName(name);assert.ok(group,`Missing ${name}`);assert.ok(group.children.length);}
const bounds={};let meshes=0,triangles=0;
model.scene.updateMatrixWorld(true);
model.scene.traverse(node=>{if(node.isMesh){meshes++;const p=node.geometry.getAttribute('position');for(const n of p.array)assert.ok(Number.isFinite(n));triangles+=(node.geometry.index?.count||p.count)/3;}});
for(const name of ['GF','FF']){const box=new Box3().setFromObject(model.scene.getObjectByName(name),true);bounds[name]={min:box.min.toArray(),max:box.max.toArray()};}
assert.equal(model.scene.getObjectByName('GF').userData.gross_area_m2,56.17);
assert.equal(model.scene.getObjectByName('FF').userData.gross_area_m2,33.0855);
assert.ok(Math.abs(bounds.GF.max[0]-bounds.GF.min[0]-8.2)<.05);
assert.ok(bounds.FF.min[1]>2.9&&bounds.FF.max[1]<6.1,'Upper floor is at the intended elevation');
for(const name of groups)assert.ok(model.scene.getObjectByName(name).visible,'Enclosed interior needs '+name);
const html=await readFile('index.html','utf8'),free=await readFile('free.html','utf8'),viewer=await readFile('villa.html','utf8');
assert.ok(/href="villa\.html(?:\?[^\"]*)?"/.test(free),'The legacy model remains reachable from MyLodge Free');
assert.ok(!html.includes('href="villa.html"'),'Do not present the legacy modular model as Private Mansion');
assert.ok(viewer.includes('index.html#page=1'),'The viewer return action leads to the introduction first page');
assert.ok(!viewer.includes('http-equiv="refresh"'),'3D viewer must not be overwritten by an alias');
for(const label of ['ground','upper','upper-plan','overview'])assert.ok(viewer.includes('data-view="'+label+'"'));
for(const label of ['living','kitchen','bedroom','bathroom'])assert.ok(viewer.includes('data-room="'+label+'"'));
for(const name of ['mylodge-villa.blend','overview.png','ground-interior.png','upper-interior.png','living-interior.png','xr-living.png','xr-bedroom.png'])await access('assets/model/'+name);
async function dependencies(file,seen=new Set()){
  if(seen.has(file))return seen;seen.add(file);
  const source=await readFile(file,'utf8');
  for(const match of source.matchAll(/(?:from\s*|import\s*\()\s*['"]([^'"]+)['"]/g)){
    const spec=match[1];let resolved;
    if(spec==='three')resolved='assets/vendor/three/three.module.js';
    else if(spec.startsWith('three/addons/'))resolved='assets/vendor/three/addons/'+spec.slice(13);
    else if(spec.startsWith('.'))resolved=path.join(path.dirname(file),spec);
    else continue;
    await access(resolved);await dependencies(resolved,seen);
  }return seen;
}
const imports=await dependencies('villa-viewer.js');
const result={format:'glTF 2.0 binary',bytes:binary.length,meshes,triangles,groups,bounds,grossAreasM2:[56.17,33.0855],localModules:imports.size,viewModes:4,interiorShell:'enclosed with optional upper-floor cutaway',posterRenders:6,freeProductLink:true,returnToIntroductionFirstPage:true,browserRender:'not verified: browser access host unavailable'};
await writeFile('review/villa-runtime-validation.json',JSON.stringify(result,null,2)+'\n');
console.log('PASS: real GLB decoded, '+meshes+' meshes, '+Math.round(triangles)+' triangles, floor bounds, enclosed shell, Free product link and first-page return, '+imports.size+' local modules, native model and 6 renders.');
