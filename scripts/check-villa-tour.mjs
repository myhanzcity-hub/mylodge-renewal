import {readFile,access,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {Vector3,Raycaster,PerspectiveCamera} from 'three';
import {TOUR_STOPS,FLOOR_HEIGHT,FLOOR_PORTALS,UPPER_PLAN_POSE,orbitFitScale,setModelView,isVisibleInHierarchy,lookAngles,clampPitch,DEFAULT_STOP,floorStops,renderPixelRatio} from '../villa-tour.js';
const data=await readFile('assets/model/mylodge-villa.glb');
const gltf=await new Promise((resolve,reject)=>new GLTFLoader().parse(data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength),'',resolve,reject));
gltf.scene.updateMatrixWorld(true);const opaque=[];
gltf.scene.traverse(node=>{if(node.isMesh&&!node.material.transparent)opaque.push(node);});
const ray=new Raycaster(),camera=new PerspectiveCamera(62,1.6,.035,100),clearance={};
for(const [name,stop] of Object.entries(TOUR_STOPS)){
  assert.ok(stop.eye[0]>-4.02&&stop.eye[0]<4.02&&stop.eye[2]>-3.34&&stop.eye[2]<3.34);
  const eyeHeight=stop.eye[1]-FLOOR_HEIGHT[stop.floor];assert.ok(eyeHeight>1.45&&eyeHeight<1.7,'Eye height: '+name);
  const angle=lookAngles(stop.eye,stop.target);camera.position.fromArray(stop.eye);camera.rotation.set(angle.pitch,angle.yaw,0,'YXZ');camera.updateMatrixWorld(true);
  const direction=camera.getWorldDirection(new Vector3()),expected=new Vector3().fromArray(stop.target).sub(camera.position).normalize();
  assert.ok(direction.dot(expected)>.99999,'Camera faces room: '+name);
  let nearest=Infinity;
  for(const direction of [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]){
    ray.set(camera.position,new Vector3(...direction));ray.near=0;ray.far=.2;
    const hit=ray.intersectObjects(opaque,false)[0];if(hit)nearest=Math.min(nearest,hit.distance);
  }
  assert.ok(nearest>.12,'Camera too close to solid surface: '+name+' '+nearest);
  clearance[name]={eyeHeightMetres:eyeHeight,clearOfSolidSurfaces:true};
  if(stop.floor==='upper'){
    // A teleport must land on a walkable floor patch, never the stair void or furniture.
    for(const [dx,dz] of [[0,0],[.15,0],[-.15,0],[0,.15],[0,-.15]]){
      ray.set(new Vector3(stop.eye[0]+dx,FLOOR_HEIGHT.upper+.3,stop.eye[2]+dz),new Vector3(0,-1,0));ray.far=.4;
      const hit=ray.intersectObjects(opaque,false)[0];
      assert.ok(hit&&Math.abs(hit.point.y-FLOOR_HEIGHT.upper)<.08,'Clear supported upper-floor footprint: '+name);
    }
    clearance[name].supportedFloorFootprint=true;
  }
}
assert.equal(DEFAULT_STOP.ground,'living');assert.equal(DEFAULT_STOP.upper,'bedroom');
assert.equal(floorStops('ground').length,4);assert.equal(floorStops('upper').length,5);
assert.ok(FLOOR_PORTALS.some(p=>p.floor==='ground'&&p.key==='landing'));
assert.ok(FLOOR_PORTALS.some(p=>p.floor==='upper'&&p.key==='living'));
for(const portal of FLOOR_PORTALS){
  assert.ok(TOUR_STOPS[portal.key]);
  ray.set(new Vector3(portal.position[0],FLOOR_HEIGHT[portal.floor]+.3,portal.position[2]),new Vector3(0,-1,0));ray.far=.4;
  const hit=ray.intersectObjects(opaque,false)[0];assert.ok(hit&&Math.abs(hit.point.y-FLOOR_HEIGHT[portal.floor])<.08,'Portal has floor support: '+portal.label);
}
setModelView(gltf.scene,'upper-plan');
assert.equal(gltf.scene.getObjectByName('ROOF').visible,false);
assert.equal(gltf.scene.getObjectByName('GF').visible,false);
assert.equal(gltf.scene.getObjectByName('FF').visible,true);
for(const name of ['TERRACE','TERRACE_GLASS'])assert.ok(isVisibleInHierarchy(gltf.scene.getObjectByName(name)),'Terrace retained in upper layout: '+name);
assert.ok(!isVisibleInHierarchy(gltf.scene.getObjectByName('ROOF').children[0]),'Hidden ancestor excludes roof from occlusion');
assert.ok(isVisibleInHierarchy(gltf.scene.getObjectByName('FF').children[0]));
for(const mode of ['upper','ground','overview']){
  setModelView(gltf.scene,mode);
  for(const group of ['GF','FF','ROOF','SHELL_UPPER','GLASS_UPPER','SHELL_GROUND','GLASS_GROUND','SITE'])assert.ok(isVisibleInHierarchy(gltf.scene.getObjectByName(group)),'Interior shell restored for '+mode);
  setModelView(gltf.scene,'upper-plan');
}
setModelView(gltf.scene,'upper');
for(const aspect of [16/9,390/844,320/740]){
  camera.aspect=aspect;camera.fov=42;camera.position.fromArray(UPPER_PLAN_POSE.eye);
  const target=new Vector3().fromArray(UPPER_PLAN_POSE.target);
  camera.position.sub(target).multiplyScalar(orbitFitScale(aspect)).add(target);
  camera.lookAt(target);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
  for(const x of [-4.1,4.1])for(const z of [-3.425,3.425]){
    const point=new Vector3(x,3.23,z).project(camera);
    assert.ok(Math.abs(point.x)<.95&&Math.abs(point.y)<.85,'Upper floor and terrace fit orbit view: '+aspect);
  }
}
assert.equal(clampPitch(4),1.15);assert.equal(clampPitch(-4),-1.15);
for(const [width,height] of [[320,568],[390,844],[430,932],[844,390],[1024,1366]]){
  for(const dpr of [1,2,3]){
    const ratio=renderPixelRatio(width,height,dpr,true);
    assert.ok(ratio>0&&ratio<=dpr&&ratio<=1.3,'Mobile resolution respects screen density');
    assert.ok(width*height*ratio*ratio<=640001,'Mobile framebuffer remains within the pixel budget after rotation');
  }
}
assert.equal(renderPixelRatio(1440,900,2,false),1.8,'Desktop resolution is unchanged');
assert.equal(renderPixelRatio(1440,900,1,false),1,'Do not upscale a standard-density display');
const html=await readFile('villa.html','utf8'),js=await readFile('villa-viewer.js','utf8');
for(const hook of ['data-hotspots','data-transition','data-fullscreen','data-xr','data-tour-hint','data-mode-label'])assert.ok(html.includes(hook));
for(const stop of Object.keys(TOUR_STOPS))assert.ok(html.includes('data-room="'+stop+'"'),'Every room has a direct accessible entry: '+stop);
assert.ok(html.includes('data-view="upper-plan"'));
assert.ok(/data-xr[^>]*hidden/.test(html));assert.ok(js.includes("isSessionSupported('immersive-vr')"));assert.ok(js.includes('isSecureContext&&navigator.xr'));
assert.ok(js.includes("selectStop('living',false)"));
await access('assets/model/xr-living.png');await access('assets/model/xr-bedroom.png');
const hdr=await readFile('assets/environment/forest-slope-1k.hdr');assert.ok(hdr.subarray(0,120).toString().includes('RADIANCE'));
await writeFile('review/villa-xr-validation.json',JSON.stringify({view:'eye-level interior tour and upper-floor cutaway',stops:Object.keys(TOUR_STOPS).length,upperStops:floorStops('upper').map(([key])=>key),clearance,upperFloorPlan:{shellRestoration:true,hiddenAncestorOcclusion:true,desktopAndPortraitFloorFraming:true},headsetEntry:'capability-gated, user-initiated',browserVisual:'not verified: browser access host unavailable',headsetHardware:'not tested',nativeEyeLevelRenders:2,existingModelDimensions:'unchanged: ground17 + upper10 pyeong'},null,2)+'\n');
console.log('PASS: 9 eye-level poses, upper-floor/portal support, cutaway shell restoration, desktop/portrait framing, spatial UI hooks and gated XR entry.');
