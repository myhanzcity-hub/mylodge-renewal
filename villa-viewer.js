import {TOUR_STOPS,FLOOR_HEIGHT,DEFAULT_STOP,EXTERIOR_POSE,UPPER_PLAN_POSE,orbitFitScale,FLOOR_PORTALS,setModelView,isVisibleInHierarchy,lookAngles,clampPitch,renderPixelRatio} from './villa-tour.js';

const $=selector=>document.querySelector(selector);
const host=$('#model-canvas'),stage=$('.model-stage'),loaderPanel=$('[data-loading]');
const title=$('[data-load-title]'),detail=$('[data-load-detail]'),transition=$('[data-transition]');
const viewButtons=[...document.querySelectorAll('[data-view]')],roomButtons=[...document.querySelectorAll('[data-room]')];
const resetButton=$('[data-reset]'),xrButton=$('[data-xr]'),fullscreenButton=$('[data-fullscreen]');
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)'),mobile=matchMedia('(max-width: 900px), (pointer: coarse)');
const allControls=[...viewButtons,...roomButtons,resetButton];
function showError(message){stage.dataset.ready='false';loaderPanel.hidden=false;loaderPanel.dataset.error='true';title.textContent='공간을 불러오지 못했습니다';detail.textContent=message;allControls.forEach(b=>b.disabled=true);xrButton.disabled=true;}

async function start(){
  const [THREE,{OrbitControls},{GLTFLoader},{HDRLoader}]=await Promise.all([import('three'),import('three/addons/controls/OrbitControls.js'),import('three/addons/loaders/GLTFLoader.js'),import('three/addons/loaders/HDRLoader.js')]);
  const renderer=new THREE.WebGLRenderer({antialias:!mobile.matches,alpha:false,powerPreference:mobile.matches?'low-power':'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,mobile.matches?1.3:1.8));renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
  renderer.shadowMap.enabled=!mobile.matches;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.xr.enabled=true;renderer.xr.setReferenceSpaceType('local-floor');
  const canvas=renderer.domElement;canvas.tabIndex=0;canvas.setAttribute('aria-label','별장 안 둘러보기 드래그 또는 방향키로 시선을 이동합니다');canvas.setAttribute('aria-describedby','canvas-key-help');host.append(canvas);
  const scene=new THREE.Scene();scene.background=new THREE.Color(0x8baec9);
  const camera=new THREE.PerspectiveCamera(62,1,.035,100);camera.rotation.order='YXZ';
  const rig=new THREE.Group();rig.add(camera);scene.add(rig);
  const controls=new OrbitControls(camera,canvas);controls.enabled=false;controls.enableDamping=true;controls.dampingFactor=.09;
  controls.listenToKeyEvents(canvas);
  controls.minDistance=7;controls.maxDistance=28;controls.maxPolarAngle=Math.PI*.48;controls.minPolarAngle=.13;
  scene.add(new THREE.HemisphereLight(0xfff3df,0x6d796d,.85));
  const sun=new THREE.DirectionalLight(0xffe4bf,2.4);sun.position.set(-5,9,-7);sun.castShadow=!mobile.matches;sun.shadow.mapSize.set(1536,1536);
  Object.assign(sun.shadow.camera,{left:-9,right:9,top:9,bottom:-9,near:.5,far:30});sun.shadow.normalBias=.015;sun.shadow.bias=-.0001;scene.add(sun);
  const fill=new THREE.DirectionalLight(0xe1eaf6,.65);fill.position.set(5,6,3);scene.add(fill);
  for(const [x,y,z,power] of [[-2.4,2.7,-.5,45],[1.6,2.5,-1.2,50],[.2,2.6,2.7,35],[-2.7,2.7,2.1,18],[1.4,5.6,-1.2,40],[.3,5.6,2.3,32],[2.8,5.6,.55,20]]){const light=new THREE.PointLight(0xffe3b6,power,5,2);light.position.set(x,y,z);scene.add(light);}

  let model,currentStop='living',currentView='ground',yaw=0,pitch=0,dirty=true,disposed=false,transitionTimer=0,xrSession=null;
  let savedStop='living',savedView='ground';
  const pointers=new Map();let drag=null,pinch=null;const markers=[],occluders=[];
  const raycaster=new THREE.Raycaster(),v=new THREE.Vector3(),cameraWorld=new THREE.Vector3();
  const markDirty=()=>{dirty=true;};controls.addEventListener('change',markDirty);
  function poseCamera(stop){
    rig.position.set(0,0,0);rig.rotation.set(0,0,0);camera.position.fromArray(stop.eye);
    ({yaw,pitch}=lookAngles(stop.eye,stop.target));camera.rotation.set(pitch,yaw,0,'YXZ');camera.fov=62;camera.updateProjectionMatrix();dirty=true;
  }
  const isOrbitView=()=>currentView==='overview'||currentView==='upper-plan';
  function updateCopy(){
    const stop=TOUR_STOPS[currentStop],overview=currentView==='overview',plan=currentView==='upper-plan',orbit=isOrbitView();
    $('[data-space-heading]').textContent=plan?'2층의 공간 구성':overview?'별장의 전체 모습':stop.heading;
    $('[data-space-description]').textContent=plan?'실내 약 10평과 별도 테라스의 배치입니다 아래 공간 이름을 눌러 침실·서재·계단홀로 들어가 보세요':overview?'건물을 돌려 외관과 테라스를 살펴보세요':stop.description;
    $('[data-view-label]').textContent=plan?'2F LAYOUT / 10 PYEONG':overview?'EXTERIOR / 27 PYEONG':`${stop.floor==='ground'?'1F':'2F'} / ${stop.label}`;
    $('[data-mode-label]').textContent=plan?'2층 구조 보기':overview?'조감도':'실내 둘러보기';
    $('[data-tour-hint]').textContent=mobile.matches?(orbit?'한 손가락으로 회전 · 두 손가락으로 확대':'드래그로 둘러보기 · 공간 이름을 눌러 이동'):(orbit?'드래그로 회전 · 휠로 확대 · 공간 이름으로 입장':'드래그로 둘러보기 · 바닥 지점으로 이동');
    canvas.setAttribute('aria-label',orbit?'별장 구조 보기 드래그로 회전하고 휠로 확대합니다':'별장 안 둘러보기 드래그 또는 방향키로 시선을 이동합니다');
    viewButtons.forEach(b=>{b.disabled=Boolean(xrSession);b.setAttribute('aria-pressed',String(b.dataset.view===currentView));});
    roomButtons.forEach(b=>{b.hidden=overview||TOUR_STOPS[b.dataset.room].floor!==(plan?'upper':stop.floor);b.setAttribute('aria-pressed',String(!orbit&&b.dataset.room===currentStop));});
    $('[data-room-divider]').hidden=overview;
    stage.dataset.view=currentView;stage.dataset.room=currentStop;
    for(const marker of markers){marker.available=!orbit&&(marker.floor===stop.floor)&&marker.key!==currentStop;marker.object.visible=marker.available;marker.button.hidden=!marker.available;}
  }
  function selectStop(key,animate=true){
    if(!model||!TOUR_STOPS[key])return;
    clearTimeout(transitionTimer);pointers.clear();drag=null;pinch=null;
    const apply=()=>{
      currentStop=key;currentView=TOUR_STOPS[key].floor;controls.enabled=false;setModelView(model,currentView);
      if(xrSession){const stop=TOUR_STOPS[key];const heading=lookAngles(stop.eye,stop.target);rig.position.set(stop.eye[0],FLOOR_HEIGHT[stop.floor],stop.eye[2]);rig.rotation.set(0,heading.yaw,0);camera.position.set(0,0,0);camera.rotation.set(0,0,0);}
      else poseCamera(TOUR_STOPS[key]);
      updateCopy();transition.classList.remove('is-active');dirty=true;
    };
    if(animate&&!reducedMotion.matches&&!xrSession){transition.classList.add('is-active');transitionTimer=setTimeout(apply,160);}else apply();
  }
  function selectView(key){
    if(!model||xrSession)return;
    if(key!=='overview'&&key!=='upper-plan'){selectStop(DEFAULT_STOP[key]);return;}
    clearTimeout(transitionTimer);pointers.clear();drag=null;pinch=null;transition.classList.remove('is-active');currentView=key;controls.enabled=true;setModelView(model,key);
    if(key==='upper-plan'&&TOUR_STOPS[currentStop].floor!=='upper')currentStop=DEFAULT_STOP.upper;
    const pose=key==='upper-plan'?UPPER_PLAN_POSE:EXTERIOR_POSE;
    controls.minDistance=key==='upper-plan'?5:7;controls.maxDistance=key==='upper-plan'?23:28;
    controls.maxPolarAngle=key==='upper-plan'?Math.PI*.42:Math.PI*.48;
    rig.position.set(0,0,0);rig.rotation.set(0,0,0);camera.fov=42;camera.updateProjectionMatrix();camera.position.fromArray(pose.eye);
    controls.target.fromArray(pose.target);
    camera.position.sub(controls.target).multiplyScalar(orbitFitScale(camera.aspect)).add(controls.target);
    controls.maxDistance=Math.max(controls.maxDistance,camera.position.distanceTo(controls.target)*1.25);
    controls.update();updateCopy();dirty=true;
  }
  function reset(){if(isOrbitView())selectView(currentView);else selectStop(currentStop,false);}
  viewButtons.forEach(b=>b.addEventListener('click',()=>selectView(b.dataset.view)));
  roomButtons.forEach(b=>b.addEventListener('click',()=>selectStop(b.dataset.room)));
  resetButton.addEventListener('click',reset);
  function resize(){const {width,height}=host.getBoundingClientRect();if(!width||!height)return;const oldAspect=camera.aspect;renderer.setPixelRatio(renderPixelRatio(width,height,devicePixelRatio,mobile.matches));renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();if(model&&isOrbitView()&&Math.abs(oldAspect-camera.aspect)>.1)selectView(currentView);dirty=true;}
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(host);resize();
  function look(){camera.rotation.set(pitch,yaw,0,'YXZ');dirty=true;}
  canvas.addEventListener('pointerdown',event=>{
    if(isOrbitView()||!model||xrSession||event.button>0)return;
    canvas.focus({preventScroll:true});canvas.setPointerCapture(event.pointerId);pointers.set(event.pointerId,[event.clientX,event.clientY]);drag={x:event.clientX,y:event.clientY};
    if(pointers.size===2){const [a,b]=[...pointers.values()];pinch={distance:Math.hypot(a[0]-b[0],a[1]-b[1]),fov:camera.fov};}
  });
  canvas.addEventListener('pointermove',event=>{
    if(!pointers.has(event.pointerId)||isOrbitView()||xrSession)return;
    pointers.set(event.pointerId,[event.clientX,event.clientY]);
    if(pointers.size===2&&pinch){const [a,b]=[...pointers.values()];camera.fov=THREE.MathUtils.clamp(pinch.fov*pinch.distance/Math.max(1,Math.hypot(a[0]-b[0],a[1]-b[1])),48,82);camera.updateProjectionMatrix();dirty=true;return;}
    if(drag){yaw+=(event.clientX-drag.x)*.0035;pitch=clampPitch(pitch+(event.clientY-drag.y)*.003);look();}drag={x:event.clientX,y:event.clientY};
  });
  function release(event){pointers.delete(event.pointerId);pinch=null;drag=null;if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);}
  canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('lostpointercapture',event=>{pointers.delete(event.pointerId);drag=null;pinch=null;});
  canvas.addEventListener('wheel',event=>{if(isOrbitView()||xrSession)return;event.preventDefault();camera.fov=THREE.MathUtils.clamp(camera.fov+event.deltaY*.025,48,82);camera.updateProjectionMatrix();dirty=true;},{passive:false});
  canvas.addEventListener('keydown',event=>{
    if(event.altKey||event.ctrlKey||event.metaKey||xrSession)return;
    if(event.key==='Home'){event.preventDefault();reset();return;}
    if(isOrbitView())return;
    if(event.key==='ArrowLeft')yaw+=.12;else if(event.key==='ArrowRight')yaw-=.12;
    else if(event.key==='ArrowUp')pitch=clampPitch(pitch+.08);else if(event.key==='ArrowDown')pitch=clampPitch(pitch-.08);
    else return;
    event.preventDefault();look();
  });
  function createMarkers(){
    const markerGroup=new THREE.Group();scene.add(markerGroup);
    const entries=Object.entries(TOUR_STOPS).map(([key,stop])=>({key,floor:stop.floor,label:stop.label,position:[stop.eye[0],FLOOR_HEIGHT[stop.floor]+.025,stop.eye[2]]}));
    entries.push(...FLOOR_PORTALS);
    for(const data of entries){
      const object=new THREE.Group();object.position.fromArray(data.position);markerGroup.add(object);
      const ring=new THREE.Mesh(new THREE.TorusGeometry(.17,.012,6,32),new THREE.MeshBasicMaterial({color:0xfcf7e8,transparent:true,opacity:.88}));ring.rotation.x=-Math.PI/2;object.add(ring);
      const hit=new THREE.Mesh(new THREE.CircleGeometry(.24,24),new THREE.MeshBasicMaterial({color:0xf5d7ab,transparent:true,opacity:.12,side:THREE.DoubleSide,depthWrite:false}));hit.rotation.x=-Math.PI/2;hit.userData.stop=data.key;object.add(hit);
      const button=document.createElement('button');button.type='button';button.className='tour-hotspot';button.setAttribute('aria-label',data.label+'로 이동');button.innerHTML='<span class="hotspot-ring" aria-hidden="true"></span><span class="hotspot-label"></span>';button.lastElementChild.textContent=data.label;button.addEventListener('click',()=>selectStop(data.key));$('[data-hotspots]').append(button);
      markers.push({...data,object,hit,button,available:false});
    }
  }
  function placeMarkers(){
    if(xrSession)return;
    camera.getWorldPosition(cameraWorld);const {width,height}=host.getBoundingClientRect();
    for(const marker of markers){
      if(!marker.available){marker.button.hidden=true;continue;}
      const world=marker.object.position,projected=v.copy(world).project(camera),distance=cameraWorld.distanceTo(world);
      let visible=projected.z>-1&&projected.z<1&&Math.abs(projected.x)<.87&&projected.y>-.68&&projected.y<.82&&distance>.5;
      if(visible){raycaster.set(cameraWorld,new THREE.Vector3().subVectors(world,cameraWorld).normalize());raycaster.far=distance-.18;visible=raycaster.intersectObjects(occluders.filter(isVisibleInHierarchy),false).length===0;}
      marker.button.hidden=!visible;if(visible)marker.button.style.transform=`translate(${(projected.x+1)*width/2}px,${(1-projected.y)*height/2}px) translate(-50%,-50%)`;
    }
  }
  const controllers=[];
  for(let i=0;i<2;i++){
    const controller=renderer.xr.getController(i);rig.add(controller);controllers.push(controller);
    const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0),new THREE.Vector3(0,0,-4)]),new THREE.LineBasicMaterial({color:0xffe6bf}));controller.add(line);
    controller.addEventListener('select',()=>{if(!xrSession)return;const origin=new THREE.Vector3().setFromMatrixPosition(controller.matrixWorld),direction=new THREE.Vector3(0,0,-1).transformDirection(controller.matrixWorld);raycaster.set(origin,direction);raycaster.far=15;const hit=raycaster.intersectObjects(markers.filter(m=>m.available).map(m=>m.hit),false)[0];if(hit){const block=raycaster.intersectObjects(occluders.filter(isVisibleInHierarchy),false)[0];if(!block||block.distance>hit.distance-.12)selectStop(hit.object.userData.stop,false);}});
  }
  function xrLabel(label){xrButton.querySelector('b').textContent=label;xrButton.setAttribute('aria-label',label);xrButton.title=label;}
  xrLabel('헤드셋으로 보기');
  async function startXR(){
    if(!model||!navigator.xr||disposed)return;
    xrButton.disabled=true;
    try{
      if(xrSession){await xrSession.end();return;}
      savedStop=currentStop;savedView=currentView;
      const session=await navigator.xr.requestSession('immersive-vr',{requiredFeatures:['local-floor']});
      xrSession=session;controls.enabled=false;selectStop(currentStop,false);
      session.addEventListener('end',()=>{xrSession=null;if(disposed)return;rig.position.set(0,0,0);rig.rotation.set(0,0,0);xrLabel('헤드셋으로 보기');xrButton.disabled=false;if(savedView==='overview'||savedView==='upper-plan')selectView(savedView);else selectStop(savedStop,false);},{once:true});
      await renderer.xr.setSession(session);xrLabel('XR 나가기');xrButton.disabled=false;
    }catch(error){if(xrSession){await xrSession.end().catch(()=>{});xrSession=null;}xrButton.disabled=disposed;if(!disposed){xrLabel('헤드셋으로 보기');if(savedView==='overview'||savedView==='upper-plan')selectView(savedView);else selectStop(savedStop,false);$('[data-tour-hint]').textContent='헤드셋을 연결하거나 화면에서 계속 둘러보세요';}}
  }
  xrButton.addEventListener('click',startXR);
  fullscreenButton.addEventListener('click',async()=>{
    try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}
    catch{$('[data-tour-hint]').textContent='이 브라우저에서는 현재 화면으로 둘러볼 수 있습니다';}
  });
  if(!document.documentElement.requestFullscreen)fullscreenButton.hidden=true;
  document.addEventListener('fullscreenchange',()=>{fullscreenButton.setAttribute('aria-pressed',String(Boolean(document.fullscreenElement)));fullscreenButton.setAttribute('aria-label',document.fullscreenElement?'전체 화면 나가기':'전체 화면으로 보기');resize();});
  const [loaded,environment]=await Promise.all([
    new GLTFLoader().loadAsync('assets/model/mylodge-villa.glb',event=>{if(event.total)detail.textContent=`공간을 준비하는 중 · ${Math.round(event.loaded/event.total*100)}%`;}),
    new HDRLoader().loadAsync('assets/environment/forest-slope-1k.hdr').catch(()=>null)
  ]);
  // Keep soft image-based illumination, with a plain blue backdrop in every view.
  if(environment){environment.mapping=THREE.EquirectangularReflectionMapping;scene.environment=environment;scene.environmentIntensity=.65;}
  model=loaded.scene;let meshes=0;
  model.traverse(node=>{if(node.isMesh){meshes++;node.castShadow=!mobile.matches&&!node.material.transparent;node.receiveShadow=!mobile.matches;if(!node.material.transparent)occluders.push(node);}});
  if(!meshes)throw Error('Empty model');scene.add(model);createMarkers();selectStop('living',false);
  allControls.forEach(b=>b.disabled=false);loaderPanel.hidden=true;stage.dataset.ready='true';stage.dataset.meshCount=String(meshes);
  if(isSecureContext&&navigator.xr)navigator.xr.isSessionSupported('immersive-vr').then(supported=>{if(supported&&!disposed){xrButton.hidden=false;xrButton.disabled=false;}}).catch(()=>{});
  renderer.setAnimationLoop(()=>{
    if(disposed)return;
    const moved=controls.enabled&&controls.update();if(!dirty&&!moved&&!renderer.xr.isPresenting)return;
    scene.updateMatrixWorld(true);camera.updateMatrixWorld();placeMarkers();renderer.render(scene,camera);dirty=false;
  });
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();disposed=true;clearTimeout(transitionTimer);xrSession?.end().catch(()=>{});renderer.setAnimationLoop(null);showError('그래픽 연결이 끊겼습니다 새로고침하여 다시 둘러볼 수 있습니다');});
  addEventListener('pagehide',event=>{
    if(event.persisted)return;disposed=true;clearTimeout(transitionTimer);xrSession?.end().catch(()=>{});resizeObserver.disconnect();renderer.setAnimationLoop(null);controls.dispose();environment?.dispose();
    scene.traverse(node=>{if(node.isMesh){node.geometry.dispose();(Array.isArray(node.material)?node.material:[node.material]).forEach(m=>m.dispose());}});renderer.dispose();
  });
}
start().catch(error=>{console.error('MyLodge spatial view:',error);showError(location.protocol==='file:'?'START-LOCAL.cmd로 실행한 뒤 다시 열어 주세요':'새로고침하거나 모델 파일을 내려받아 확인해 주세요');});
