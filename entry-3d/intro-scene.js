import {buildReferenceVilla} from './villa-reference-model.js';
// MyLodge — original architectural study and reversible GPU choreography.
// Runtime: vendored Three.js r180, MIT. No third-party brand models or shaders.
export function buildLuxuryScene(T, hooks) {
 const canvas=document.querySelector('#intro-canvas'),stage=document.querySelector('.intro-stage');
 const mobile=()=>innerWidth<761;
 const renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,mobile()?1.4:1.7));
 renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.9;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(34,1,.1,120);
 const baseEye=new T.Vector3(-8,5.0,14).normalize();
 camera.position.copy(baseEye).multiplyScalar(18);camera.lookAt(0,0,0);
 const world=new T.Group(),villa=new T.Group(),coin=new T.Group();scene.add(world);world.add(villa,coin);
 const progressUniform={value:0},coinRotation={value:new T.Matrix3()};
 let width=1,height=1,currentProgress=0,lastTarget=0;
 const smooth=(a,b,x)=>T.MathUtils.smoothstep(x,a,b),mix=T.MathUtils.lerp;
 let randomSeed=17541;const random=()=>{randomSeed=(randomSeed*1664525+1013904223)>>>0;return randomSeed/4294967296};
 const surfaces=[],coinSurfaces=[],animatedMaterials=[],partMaterials=[];
 const noiseGLSL=`
 float hash31(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
 float noise3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash31(i),hash31(i+vec3(1,0,0)),f.x),mix(hash31(i+vec3(0,1,0)),hash31(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash31(i+vec3(0,0,1)),hash31(i+vec3(1,0,1)),f.x),mix(hash31(i+vec3(0,1,1)),hash31(i+vec3(1,1,1)),f.x),f.y),f.z);}
 float structureField(vec3 p){return clamp(.46+p.x*.059+p.y*.12+p.z*.045+(noise3(p*2.2)-.5)*.20,.015,.985);}
 `;
 const key=new T.DirectionalLight(0xffc991,2.1);key.position.set(-5,9,7);key.castShadow=true;
 key.shadow.mapSize.set(mobile()?1024:2048,mobile()?1024:2048);Object.assign(key.shadow.camera,{left:-8,right:8,top:7,bottom:-7,near:.1,far:40});key.shadow.bias=-.0008;key.shadow.normalBias=.04;key.shadow.radius=3;scene.add(key);
 scene.add(new T.HemisphereLight(0xa4bded,0x090b10,.65));
 const edgeLight=new T.DirectionalLight(0x63d5ff,1.3);edgeLight.position.set(4,5,-7);scene.add(edgeLight);
 const front=new T.DirectionalLight(0xf5f1e8,.8);front.position.set(3,1,8);scene.add(front);
 // Narrow softboxes, rather than a flat ambient gradient, define the metal and glass.
 const envCanvas=document.createElement('canvas');envCanvas.width=1024;envCanvas.height=512;
 const ec=envCanvas.getContext('2d');ec.fillStyle='#111722';ec.fillRect(0,0,1024,512);
 for(const [x,y,w,h,color] of [[90,90,80,280,'#c3c9d9'],[310,40,38,350,'#fff0d9'],[540,110,155,260,'#b6a992'],[740,90,90,140,'#578fa8'],[920,70,40,300,'#f0d9a5']]){const g=ec.createLinearGradient(x,0,x+w,0);g.addColorStop(0,'#17202e');g.addColorStop(.3,color);g.addColorStop(.7,color);g.addColorStop(1,'#17202e');ec.fillStyle=g;ec.fillRect(x,y,w,h)}
 const et=new T.CanvasTexture(envCanvas);et.mapping=T.EquirectangularReflectionMapping;et.colorSpace=T.SRGBColorSpace;
 const pmrem=new T.PMREMGenerator(renderer),envTarget=pmrem.fromEquirectangular(et);scene.environment=envTarget.texture;scene.environmentIntensity=.65;et.dispose();pmrem.dispose();

 function texture(kind){const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d');
  ctx.fillStyle=kind==='wood'?'#79624b':kind==='stone'?'#8f8c81':'#163a43';ctx.fillRect(0,0,512,512);
  for(let i=0;i<1800;i++){const a=random();ctx.strokeStyle=kind==='wood'?`rgba(27,14,5,${a*.13})`:`rgba(235,230,214,${a*.12})`;ctx.lineWidth=random()*1.5+.2;ctx.beginPath();const y=random()*512;ctx.moveTo(0,y);ctx.bezierCurveTo(150,y+random()*8,350,y-random()*8,512,y+random()*4);ctx.stroke()}
  if(kind==='tile'){ctx.strokeStyle='#517077';ctx.lineWidth=1;for(let i=0;i<=16;i++){ctx.beginPath();ctx.moveTo(i*32,0);ctx.lineTo(i*32,512);ctx.moveTo(0,i*32);ctx.lineTo(512,i*32);ctx.stroke()}}
  const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(kind==='wood'?2:1,kind==='wood'?6:1);tex.anisotropy=4;return tex;
 }
 const woodTex=texture('wood'),stoneTex=texture('stone'),tileTex=texture('tile');
 function mat(color,metalness=0,roughness=.45,extra={}){return new T.MeshStandardMaterial({color,metalness,roughness,...extra})}
 const graphite=mat('#22272d',.72,.29),trim=mat('#b7a180',.82,.26),ivory=mat('#a9a49a',.08,.5,{map:stoneTex}),wood=mat('#c2aa89',.04,.5,{map:woodTex});
 const fabric=mat('#c7c2b6',0,.95),pillow=mat('#666d73',0,.93),black=mat('#0b1118',.45,.3),marble=mat('#30363a',.26,.25,{map:stoneTex}),tile=mat('#3b808a',.2,.3,{map:tileTex});
 const glass=new T.MeshPhysicalMaterial({color:'#9ec0c8',metalness:.18,roughness:.08,transparent:true,opacity:.19,side:T.DoubleSide,depthWrite:false,clearcoat:1,clearcoatRoughness:.06});
 const warm=mat('#f2cc91',.05,.3,{emissive:'#ffc580',emissiveIntensity:2.3}),cyan=mat('#82dbe8',.15,.25,{emissive:'#35b6d2',emissiveIntensity:2.6}),screen=mat('#4a8596',.4,.2,{emissive:'#34849c',emissiveIntensity:1.1});
 // Rounded architectural slabs catch light along real bevels.
 const roundedCache=new Map();
 function roundedGeometry(w,h,d,r=.08){const k=[w,h,d,r].join('/');if(roundedCache.has(k))return roundedCache.get(k);r=Math.min(r,w/3,d/3);const s=new T.Shape(),x=-w/2,z=-d/2;s.moveTo(x+r,z);s.lineTo(x+w-r,z);s.quadraticCurveTo(x+w,z,x+w,z+r);s.lineTo(x+w,z+d-r);s.quadraticCurveTo(x+w,z+d,x+w-r,z+d);s.lineTo(x+r,z+d);s.quadraticCurveTo(x,z+d,x,z+d-r);s.lineTo(x,z+r);s.quadraticCurveTo(x,z,x+r,z);const g=new T.ExtrudeGeometry(s,{depth:h,bevelEnabled:true,bevelThickness:Math.min(h*.15,.025),bevelSize:.015,bevelSegments:2,steps:1,curveSegments:5});g.rotateX(-Math.PI/2);g.translate(0,-h/2,0);roundedCache.set(k,g);return g}
 function register(mesh,parent=villa,sample=true){parent.add(mesh);mesh.castShadow=true;mesh.receiveShadow=true;if(sample)(parent===villa?surfaces:coinSurfaces).push(mesh);return mesh}
 function box(w,h,d,x,y,z,material,bevel=false,sample=true){const m=new T.Mesh(bevel?roundedGeometry(w,h,d):new T.BoxGeometry(w,h,d),material);m.position.set(x,y,z);return register(m,villa,sample)}
 function cylinder(radius,h,x,y,z,material,segments=32){const m=new T.Mesh(new T.CylinderGeometry(radius,radius,h,segments),material);m.position.set(x,y,z);return register(m)}
 function rail(x1,z1,x2,z2,y,material=trim,r=.014){const curve=new T.LineCurve3(new T.Vector3(x1,y,z1),new T.Vector3(x2,y,z2));return register(new T.Mesh(new T.TubeGeometry(curve,1,r,6,false),material))}
 function led(w,x,y,z,material=warm,d=.018){return box(w,.016,d,x,y,z,material,false,false)}
 const {water,waterHook,roomLight,poolLight,practicals,reference}=buildReferenceVilla(T,{villa,register,box,cylinder,rail,led,roundedGeometry,mat,wood,fabric,pillow,black,marble,trim,cyan,warm,progressUniform});

 // Material-bound noise erodes actual geometry; particles use the identical field.
 for(const mesh of [...villa.children].filter(o=>o.isMesh)){
  const original=mesh.material,local=mesh.matrix.clone(),m=original.clone(),originalHook=mesh===water?waterHook:original.onBeforeCompile;
  const baseOpacity=original.opacity;mesh.material=m;partMaterials.push(m);mesh.userData.baseOpacity=baseOpacity;
  m.onBeforeCompile=shader=>{if(originalHook)originalHook(shader);shader.uniforms.uProgress=progressUniform;shader.uniforms.uPartMatrix={value:local};
   shader.vertexShader='uniform mat4 uPartMatrix;varying vec3 vStructure;\n'+shader.vertexShader;
   shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvStructure=(uPartMatrix*vec4(position,1.)).xyz;');
   shader.fragmentShader='uniform float uProgress;varying vec3 vStructure;\n'+noiseGLSL+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>',`#include <clipping_planes_fragment>\nfloat field=structureField(vStructure);float sweep=smoothstep(.10,.43,uProgress);if(field<sweep)discard;`);
   shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>\nfloat edge=1.-smoothstep(0.,.012,field-sweep);totalEmissiveRadiance+=vec3(.32,.78,.95)*edge*step(.105,uProgress)*1.2;`);
  };m.customProgramCacheKey=()=>mesh===water?'mylodge-water-reflection-v3':original===wood?'mylodge-wood-grain-v3':'mylodge-erode-v2';
 }

 // Sculpted coin: milled edge, concentric rings, brushed face and raised monogram.
 const coinMetal=mat('#cfab60',.96,.24,{envMapIntensity:1.9}),coinRecess=mat('#7d5a23',.88,.32),coinRaised=mat('#efce87',.91,.2),coinDark=mat('#3b2d17',.65,.4);
 const coinMats=[coinMetal,coinRecess,coinRaised,coinDark];
 const brushed=document.createElement('canvas');brushed.width=brushed.height=512;const bc=brushed.getContext('2d');bc.fillStyle='#888';bc.fillRect(0,0,512,512);for(let i=0;i<2500;i++){bc.strokeStyle=`rgba(255,255,255,${random()*.12})`;bc.beginPath();const r=random()*255;bc.arc(256,256,r,0,Math.PI*2);bc.stroke()}
 const bump=new T.CanvasTexture(brushed);coinMetal.bumpMap=bump;coinMetal.bumpScale=.013;coinRaised.bumpMap=bump;coinRaised.bumpScale=.007;
 function coinMesh(geometry,material){const m=new T.Mesh(geometry,material);coin.add(m);coinSurfaces.push(m);return m}
 const body=coinMesh(new T.CylinderGeometry(2.08,2.08,.26,128),coinRecess);body.rotation.x=Math.PI/2;
 const face=coinMesh(new T.CylinderGeometry(1.98,1.98,.29,128),coinMetal);face.rotation.x=Math.PI/2;
 for(const [r,t,z] of [[2.01,.033,.16],[1.89,.018,.168],[1.73,.007,.151]]){const ring=coinMesh(new T.TorusGeometry(r,t,8,160),coinRaised);ring.position.z=z}
 // Repeated coin milling is a single instanced draw.
 const ridges=new T.InstancedMesh(new T.BoxGeometry(.023,.09,.27),coinRaised,144),dummy=new T.Object3D();
 for(let i=0;i<144;i++){const a=i/144*Math.PI*2;dummy.position.set(Math.cos(a)*2.075,Math.sin(a)*2.075,0);dummy.rotation.z=a-Math.PI/2;dummy.updateMatrix();ridges.setMatrixAt(i,dummy.matrix)}coin.add(ridges);
 const mark=new T.Shape();mark.moveTo(-.73,-.55);mark.lineTo(-.73,.85);mark.lineTo(-.48,.85);mark.lineTo(0,.2);mark.lineTo(.48,.85);mark.lineTo(.73,.85);mark.lineTo(.73,-.55);mark.lineTo(.47,-.55);mark.lineTo(.47,.4);mark.lineTo(0,-.2);mark.lineTo(-.47,.4);mark.lineTo(-.47,-.55);mark.closePath();
 const mg=new T.ExtrudeGeometry(mark,{depth:.045,bevelEnabled:true,bevelSize:.016,bevelThickness:.012,bevelSegments:3,steps:1});const monogram=coinMesh(mg,coinRaised);monogram.position.set(0,0,.16);
 const labelCanvas=document.createElement('canvas');labelCanvas.width=labelCanvas.height=1024;const lc=labelCanvas.getContext('2d');lc.textAlign='center';lc.fillStyle='#ead5aa';lc.font='500 68px Arial';lc.fillText('MY LODGE',512,751);lc.font='24px Arial';lc.fillText('OWN THE EXTRAORDINARY',512,814);
 lc.font='22px Arial';const arcText='PRIVATE LIFE • GLOBAL CONNECTIONS';for(let i=0;i<arcText.length;i++){const a=-1.04+i/(arcText.length-1)*2.08;lc.save();lc.translate(512+Math.sin(a)*387,512-Math.cos(a)*387);lc.rotate(a);lc.fillText(arcText[i],0,0);lc.restore()}
 const labelTexture=new T.CanvasTexture(labelCanvas);labelTexture.colorSpace=T.SRGBColorSpace;const labelMaterial=new T.MeshBasicMaterial({map:labelTexture,transparent:true,depthWrite:false,toneMapped:false});const label=new T.Mesh(new T.PlaneGeometry(3.65,3.65),labelMaterial);label.position.z=.207;coin.add(label);
 coin.updateMatrixWorld(true);
 // Area-weighted samples are sampled once; all animation lives on the GPU.
 function sampler(meshes){let total=0;const triangles=[];for(const m of meshes){m.updateMatrix();const g=m.geometry,positions=g.attributes.position,index=g.index;for(let i=0;i<(index?index.count:positions.count);i+=3){const a=new T.Vector3().fromBufferAttribute(positions,index?index.getX(i):i).applyMatrix4(m.matrix),b=new T.Vector3().fromBufferAttribute(positions,index?index.getX(i+1):i+1).applyMatrix4(m.matrix),c=new T.Vector3().fromBufferAttribute(positions,index?index.getX(i+2):i+2).applyMatrix4(m.matrix),area=new T.Vector3().subVectors(b,a).cross(new T.Vector3().subVectors(c,a)).length()*.5;if(area<1e-9)continue;total+=area;triangles.push({a,b,c,total,color:m.material.color.clone(),glow:m.material.emissive?.getHex()>0})}}
  return ()=>{let lo=0,hi=triangles.length-1,r=random()*total;while(lo<hi){const mid=(lo+hi)>>1;if(triangles[mid].total<r)lo=mid+1;else hi=mid}const t=triangles[lo],u=Math.sqrt(random()),v=random();return {position:t.a.clone().multiplyScalar(1-u).addScaledVector(t.b,u*(1-v)).addScaledVector(t.c,u*v),color:t.color,glow:t.glow}}
 }
 const sampleVilla=sampler(surfaces),sampleCoin=sampler(coinSurfaces),count=mobile()?23000:48000;
 const source=new Float32Array(count*3),destination=new Float32Array(count*3),color=new Float32Array(count*3),seed=new Float32Array(count),size=new Float32Array(count);
 for(let i=0;i<count;i++){const a=sampleVilla(),b=sampleCoin();a.position.toArray(source,i*3);b.position.toArray(destination,i*3);a.color.toArray(color,i*3);seed[i]=random();size[i]=i%11===0?1.7+random():.6+random()*.8}
 const particleGeometry=new T.BufferGeometry();for(const [name,array,item] of [['position',source,3],['destination',destination,3],['color',color,3],['seed',seed,1],['size',size,1]])particleGeometry.setAttribute(name,new T.BufferAttribute(array,item));
 const rightAxis=new T.Vector3(1,0,0).applyQuaternion(camera.quaternion),upAxis=new T.Vector3(0,1,0).applyQuaternion(camera.quaternion),depthAxis=baseEye.clone();
 const particleMaterial=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.NormalBlending,vertexColors:true,toneMapped:false,
  uniforms:{uProgress:progressUniform,uPixel:{value:renderer.getPixelRatio()},uCoinRotation:coinRotation,uRight:{value:rightAxis},uUp:{value:upAxis},uDepth:{value:depthAxis}},
  vertexShader:`attribute vec3 destination;attribute float seed;attribute float size;uniform float uProgress;uniform float uPixel;uniform mat3 uCoinRotation;uniform vec3 uRight;uniform vec3 uUp;uniform vec3 uDepth;varying vec3 vColor;varying float vAlpha;varying float vGlint;${noiseGLSL}
  vec3 bezier(vec3 a,vec3 b,vec3 c,vec3 d,float t){float s=1.-t;return s*s*s*a+3.*s*s*t*b+3.*s*t*t*c+t*t*t*d;}
  void main(){float field=structureField(position);float depart=.10+field*.33;float t=clamp((uProgress-depart)/(.94-depart),0.,1.);float eased=t*t*(3.-2.*t);vec3 dest=uCoinRotation*destination;float lane=floor(seed*3.);float strand=fract(seed*3.);float angle=lane*2.094+sin(strand*15.)*.13;float radius=2.6+strand*.18;
   vec3 c1=position*.18+uRight*(cos(angle)*radius+.35)+uUp*(sin(angle)*radius*.8+.45)+uDepth*((strand-.5)*.45);
   vec3 c2=dest*.18+uRight*(cos(angle+2.2)*radius*1.1)+uUp*(sin(angle+2.2)*radius*.85-.25)+uDepth*((strand-.5)*.4);
   float theta=strand*3.8+lane*2.094+uProgress*4.;float orbitRadius=2.18+lane*.29+sin(strand*31.+lane)*.07;
   vec3 orbit=uRight*(cos(theta)*orbitRadius)+uUp*(sin(theta)*orbitRadius*(.58+lane*.12))+uDepth*(sin(theta*1.6+lane)*.42);
   vec3 dustWidth=vec3(hash31(position*7.+vec3(1,9,2)),hash31(position.yzx*5.+vec3(8,2,6)),hash31(position.zxy*9.+vec3(3,7,4)))-.5;
   orbit+=uRight*dustWidth.x*.55+uUp*dustWidth.y*.42+uDepth*dustWidth.z*.32;
   float released=smoothstep(depart,depart+.14,uProgress);float arrival=smoothstep(.60+strand*.10,.935+strand*.035,uProgress);
   vec3 p=mix(position,orbit,released);p=mix(p,dest,arrival);
   float envelope=sin(released*3.1415926)*(1.-arrival);vec3 curl=vec3(noise3(position*2.+vec3(t*5.,seed*9.,0.)),noise3(position.zxy*2.+vec3(0.,t*5.,seed*7.)),noise3(position.yzx*2.+vec3(seed*8.,0.,t*6.)))-.5;p+=curl*envelope*.14;
   float born=smoothstep(depart-.016,depart+.018,uProgress);float settle=smoothstep(.81+seed*.05,.955+seed*.025,uProgress);vAlpha=born*(1.-settle);vGlint=step(1.7,size);vec3 original=mix(color,vec3(.44,.76,.85),.4);vColor=mix(original,vec3(1.,.70,.30),smoothstep(.30,.84,uProgress));vColor*=mix(.95,2.1,vGlint);
   vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(size*uPixel*26./-mv.z,1.,5.5);
  }`,
  fragmentShader:`varying vec3 vColor;varying float vAlpha;varying float vGlint;void main(){vec2 q=gl_PointCoord-.5;float d=length(q);float core=1.-smoothstep(.08,.49,d);float spark=(exp(-abs(q.x)*45.)+exp(-abs(q.y)*45.))*.12*vGlint;float alpha=(core+spark)*vAlpha*.85;if(alpha<.01)discard;gl_FragColor=vec4(vColor,alpha);}`});
 const particles=new T.Points(particleGeometry,particleMaterial);particles.frustumCulled=false;world.add(particles);
 // Subtle two-pass optical bloom. Full resolution scene, half/quarter size light buffers.
 const target=new T.WebGLRenderTarget(1,1,{type:T.HalfFloatType,depthBuffer:true}),bright=new T.WebGLRenderTarget(1,1,{depthBuffer:false}),blurX=new T.WebGLRenderTarget(1,1,{depthBuffer:false}),blurY=new T.WebGLRenderTarget(1,1,{depthBuffer:false});
 const reflectionTarget=new T.WebGLRenderTarget(mobile()?256:512,mobile()?256:512,{type:T.HalfFloatType});
 const mirrorCamera=camera.clone();water.userData.poolReflection.texture.value=reflectionTarget.texture;
 function reflectPool(){if(currentProgress>.36)return;world.updateMatrixWorld(true);const origin=water.getWorldPosition(new T.Vector3()),normal=new T.Vector3(0,1,0).applyMatrix3(new T.Matrix3().getNormalMatrix(water.matrixWorld)).normalize();
  const eye=camera.position.clone(),look=camera.getWorldDirection(new T.Vector3()).add(eye),reflectedEye=eye.clone().addScaledVector(normal,-2*eye.clone().sub(origin).dot(normal)),reflectedLook=look.clone().addScaledVector(normal,-2*look.clone().sub(origin).dot(normal));
  mirrorCamera.copy(camera);mirrorCamera.position.copy(reflectedEye);mirrorCamera.up.copy(camera.up).reflect(normal);mirrorCamera.lookAt(reflectedLook);mirrorCamera.updateMatrixWorld();
  const bias=new T.Matrix4().set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1);water.userData.poolReflection.matrix.value.copy(bias).multiply(mirrorCamera.projectionMatrix).multiply(mirrorCamera.matrixWorldInverse);
  const oldShadow=renderer.shadowMap.autoUpdate;renderer.shadowMap.autoUpdate=false;water.visible=false;renderer.setRenderTarget(reflectionTarget);renderer.setClearColor('#090c12',1);renderer.clear();renderer.render(scene,mirrorCamera);water.visible=true;renderer.shadowMap.autoUpdate=oldShadow;
 }
 const postScene=new T.Scene(),postCamera=new T.OrthographicCamera(-1,1,1,-1,0,1),quad=new T.Mesh(new T.PlaneGeometry(2,2));postScene.add(quad);
 const postVertex='varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}';
 const thresholdMat=new T.ShaderMaterial({uniforms:{tInput:{value:target.texture}},vertexShader:postVertex,fragmentShader:'varying vec2 vUv;uniform sampler2D tInput;void main(){vec3 c=texture2D(tInput,vUv).rgb;float l=max(c.r,max(c.g,c.b));gl_FragColor=vec4(c*smoothstep(1.,2.6,l),1.);}',depthTest:false,depthWrite:false});
 const blurMat=new T.ShaderMaterial({uniforms:{tInput:{value:bright.texture},uDirection:{value:new T.Vector2()}},vertexShader:postVertex,fragmentShader:`varying vec2 vUv;uniform sampler2D tInput;uniform vec2 uDirection;void main(){vec3 c=texture2D(tInput,vUv).rgb*.227027;c+=(texture2D(tInput,vUv+uDirection*1.384615).rgb+texture2D(tInput,vUv-uDirection*1.384615).rgb)*.316216;c+=(texture2D(tInput,vUv+uDirection*3.230769).rgb+texture2D(tInput,vUv-uDirection*3.230769).rgb)*.070270;gl_FragColor=vec4(c,1.);}`,depthTest:false,depthWrite:false});
 const finalMat=new T.ShaderMaterial({uniforms:{tInput:{value:target.texture},tBloom:{value:blurY.texture},uBloom:{value:.16}},vertexShader:postVertex,fragmentShader:`varying vec2 vUv;uniform sampler2D tInput;uniform sampler2D tBloom;uniform float uBloom;void main(){vec3 c=texture2D(tInput,vUv).rgb+texture2D(tBloom,vUv).rgb*uBloom;float vignette=1.-smoothstep(.25,.8,length(vUv-vec2(.67,.48)));c+=vec3(.012,.016,.024)*vignette;gl_FragColor=vec4(c,1.);#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}`,depthTest:false,depthWrite:false});
 // GLSL preprocessor directives must start on their own line.
 finalMat.fragmentShader=finalMat.fragmentShader.replace(';#include',';\n#include');
 function post(){reflectPool();renderer.setRenderTarget(target);renderer.setClearColor('#090c12',1);renderer.clear();renderer.render(scene,camera);quad.material=thresholdMat;renderer.setRenderTarget(bright);renderer.render(postScene,postCamera);quad.material=blurMat;blurMat.uniforms.tInput.value=bright.texture;blurMat.uniforms.uDirection.value.set(1.7/bright.width,0);renderer.setRenderTarget(blurX);renderer.render(postScene,postCamera);blurMat.uniforms.tInput.value=blurX.texture;blurMat.uniforms.uDirection.value.set(0,1.7/bright.height);renderer.setRenderTarget(blurY);renderer.render(postScene,postCamera);quad.material=finalMat;renderer.setRenderTarget(null);renderer.render(postScene,postCamera)}
 const pointer={x:0,y:0,currentX:0,currentY:0};canvas.addEventListener('pointermove',e=>{if(e.pointerType==='touch'||hooks.reduced.matches)return;pointer.x=(e.clientX/innerWidth-.5)*.08;pointer.y=(e.clientY/innerHeight-.5)*.04;hooks.onFrame()});canvas.addEventListener('pointerleave',()=>{pointer.x=pointer.y=0;hooks.onFrame()});
 const raycaster=new T.Raycaster(),mouse=new T.Vector2();canvas.addEventListener('click',e=>{if(currentProgress>0&&currentProgress<.965)return;const rect=canvas.getBoundingClientRect();mouse.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(mouse,camera);if(raycaster.intersectObject(currentProgress<.01?villa:coin,true).length)hooks.onEnter()});
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();hooks.onContextLoss()});
 // Fit the architecture to the actual free area, including small mobile screens.
 const bounds=new T.Box3().setFromObject(villa),projected=[];
 for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){const v=new T.Vector3(x,y,z);projected.push([v.dot(rightAxis),v.dot(upAxis)])}
 const extents={minX:Math.min(...projected.map(v=>v[0])),maxX:Math.max(...projected.map(v=>v[0])),minY:Math.min(...projected.map(v=>v[1])),maxY:Math.max(...projected.map(v=>v[1]))};
 let fit={top:0,bottom:1,left:0,right:1};
 function resize(){width=innerWidth;height=Math.max(1,stage.clientHeight);renderer.setSize(width,height,false);camera.aspect=width/height;camera.fov=mobile()?40:34;camera.position.copy(baseEye).multiplyScalar(19);camera.lookAt(0,0,0);camera.updateProjectionMatrix();const ratio=renderer.getPixelRatio();target.setSize(Math.round(width*ratio),Math.round(height*ratio));const divisor=mobile()?4:3;for(const rt of [bright,blurX,blurY])rt.setSize(Math.max(1,Math.round(width*ratio/divisor)),Math.max(1,Math.round(height*ratio/divisor)));
  const copy=document.querySelector('.intro-copy'),note=document.querySelector('.intro-note');fit=mobile()?{top:copy.offsetTop+copy.offsetHeight+16,bottom:note.offsetTop-30,left:14,right:width-20}:{top:height<600?80:115,bottom:note.offsetTop-14,left:width*.385,right:width*.94};
  canvas.dataset.detail='reference-v3';canvas.dataset.reference=reference;canvas.dataset.particles=String(count);canvas.dataset.meshes=String(villa.children.filter(o=>o.isMesh).length);
 }
 function draw(p){currentProgress=p;progressUniform.value=p;const shape=smooth(.42,.96,p);const units=2*19*Math.tan(camera.fov*Math.PI/360)/height;
  const modelW=mix(extents.maxX-extents.minX,4.4,shape),modelH=mix(extents.maxY-extents.minY,4.4,shape),scale=Math.min((fit.right-fit.left)*units/modelW,(fit.bottom-fit.top)*units/modelH)*.93;
  world.scale.setScalar(scale);world.position.copy(rightAxis).multiplyScalar(((fit.left+fit.right)/2-width/2)*units-(extents.minX+extents.maxX)/2*scale*(1-shape)).addScaledVector(upAxis,(height/2-(fit.top+fit.bottom)/2)*units-(extents.minY+extents.maxY)/2*scale*(1-shape));
  pointer.currentX+=(pointer.x-pointer.currentX)*.12;pointer.currentY+=(pointer.y-pointer.currentY)*.12;world.rotation.y=pointer.currentX*(1-shape)+(hooks.reduced.matches?0:Math.sin(p*Math.PI)*.07);world.rotation.x=pointer.currentY*(1-shape);
  coin.quaternion.copy(camera.quaternion);coin.rotateY(mix(.85,.18,smooth(.6,1,p)));coinRotation.value.setFromMatrix4(new T.Matrix4().makeRotationFromQuaternion(coin.quaternion));
  villa.visible=p<.44;particles.visible=p>.10&&p<.985;coin.visible=p>.78;
  const coinAlpha=smooth(.78,.97,p);for(const m of coinMats){m.transparent=true;m.opacity=coinAlpha;m.depthWrite=coinAlpha>.95}labelMaterial.opacity=smooth(.88,.99,p);
  roomLight.intensity=8*scale*scale*(1-smooth(.13,.43,p));roomLight.distance=5*scale;poolLight.intensity=.9*scale*scale*(1-smooth(.13,.43,p));poolLight.distance=3.7*scale;for(const light of practicals){light.intensity=4*scale*scale*(1-smooth(.13,.43,p));light.distance=4*scale;}key.castShadow=p<.36;
  if(p<.44){world.updateMatrixWorld(true);const projectedBounds=[];for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){const v=new T.Vector3(x,y,z).applyMatrix4(world.matrixWorld).project(camera);projectedBounds.push([(v.x+1)*width/2,(1-v.y)*height/2])}document.querySelector('#entry-intro').dataset.modelBounds=JSON.stringify({left:Math.min(...projectedBounds.map(v=>v[0])),right:Math.max(...projectedBounds.map(v=>v[0])),top:Math.min(...projectedBounds.map(v=>v[1])),bottom:Math.max(...projectedBounds.map(v=>v[1]))})}
  // Position the touch hint beside the actual projected object, never the viewport corner.
  const touch=document.querySelector('#intro-enter');let hintX,hintY;
  if(p>.78){world.updateMatrixWorld(true);const center=world.position.clone().project(camera),edge=rightAxis.clone().multiplyScalar(2.13*scale).add(world.position).project(camera);const radius=Math.abs(edge.x-center.x)*width/2;hintX=(center.x+1)*width/2+radius*.48;hintY=(1-center.y)*height/2-radius*.78}
  else{const b=JSON.parse(document.querySelector('#entry-intro').dataset.modelBounds||'null');hintX=b?b.right-(b.right-b.left)*.38:width*.74;hintY=b?b.top+(b.bottom-b.top)*.035:height*.48}
  touch.style.left=Math.max(8,Math.min(width-76,hintX))+'px';touch.style.top=Math.max(82,Math.min(height-156,hintY))+'px';
  finalMat.uniforms.uBloom.value=mix(.16,.28,Math.sin(p*Math.PI));post();lastTarget=p;
 }
 resize();return {resize,draw,pointerMoving:()=>Math.abs(pointer.x-pointer.currentX)+Math.abs(pointer.y-pointer.currentY)>.0005,stats:()=>({particles:count,meshes:surfaces.length,drawCalls:renderer.info.render.calls})};
}
