import {mkdir,copyFile,readFile} from 'node:fs/promises';
import path from 'node:path';
const vendor='assets/vendor/three';
const copies=[['build/three.module.js','three.module.js'],['build/three.core.js','three.core.js'],['examples/jsm/controls/OrbitControls.js','addons/controls/OrbitControls.js'],['examples/jsm/loaders/GLTFLoader.js','addons/loaders/GLTFLoader.js'],['examples/jsm/utils/BufferGeometryUtils.js','addons/utils/BufferGeometryUtils.js'],['examples/jsm/utils/SkeletonUtils.js','addons/utils/SkeletonUtils.js'],['LICENSE','LICENSE']];
for(const [source,dest] of copies){const output=path.join(vendor,dest);await mkdir(path.dirname(output),{recursive:true});await copyFile(path.join('node_modules/three',source),output);}
await copyFile('node_modules/three/examples/jsm/loaders/HDRLoader.js',path.join(vendor,'addons/loaders/HDRLoader.js'));
console.log('Prepared local Three.js '+JSON.parse(await readFile('node_modules/three/package.json','utf8')).version+' and required addons.');
