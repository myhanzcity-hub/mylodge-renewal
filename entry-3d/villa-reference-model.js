// Image-led reconstruction: ref-011/ref-002 modular villa; ref-007/009 shared pool.
// The pool and villa are composed for the intro, not an as-built architectural survey.
export function buildReferenceVilla(T,c){
 const {villa,register,box,cylinder,rail,led,roundedGeometry,mat,wood,fabric,pillow,black,marble,trim,cyan,warm,progressUniform}=c;
 const pearl=new T.MeshPhysicalMaterial({color:'#dedbd3',metalness:.12,roughness:.33,clearcoat:.48,clearcoatRoughness:.22,envMapIntensity:1.15});
 wood.map=null;wood.color.set('#ad825b');wood.metalness=0;wood.roughness=.62;wood.envMapIntensity=.2;
 wood.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>\nfloat woodGrain=sin(vStructure.x*125.+sin(vStructure.z*5.)*1.7);float boardLine=smoothstep(.94,.99,fract(vStructure.x*5.6));diffuseColor.rgb*=.83+woodGrain*.08-boardLine*.18;`)};
 const reveal=mat('#b7aaa0',.18,.46),seam=mat('#827c76',.25,.5),bronze=mat('#554e45',.72,.22),linen=mat('#e3d5bb',0,.96);
 const glass=new T.MeshPhysicalMaterial({color:'#c5d9dc',metalness:.12,roughness:.055,transparent:true,opacity:.12,side:T.DoubleSide,depthWrite:false,clearcoat:1,envMapIntensity:1.5});
 function roundedPath(w,h,r){const p=new T.Shape(),x=-w/2,y=-h/2;p.moveTo(x+r,y);p.lineTo(x+w-r,y);p.quadraticCurveTo(x+w,y,x+w,y+r);p.lineTo(x+w,y+h-r);p.quadraticCurveTo(x+w,y+h,x+w-r,y+h);p.lineTo(x+r,y+h);p.quadraticCurveTo(x,y+h,x,y+h-r);p.lineTo(x,y+r);p.quadraticCurveTo(x,y,x+r,y);return p}
 function shell(w,h,depth,x,y,z,r){const shape=roundedPath(w,h,r);shape.holes.push(roundedPath(w-.30,h-.28,r-.12));const g=new T.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSize:.015,bevelThickness:.016,bevelSegments:3,curveSegments:16,steps:1});g.translate(0,0,-depth/2);const m=new T.Mesh(g,pearl);m.position.set(x,y,z);register(m);return m}
 function outline(w,h,r,x,y,z,material=warm){const points=roundedPath(w,h,r).getPoints(72).map(p=>new T.Vector3(p.x+x,p.y+y,z));const curve=new T.CatmullRomCurve3(points,true,'centripetal');return register(new T.Mesh(new T.TubeGeometry(curve,160,.009,5,true),material),villa,false)}
 function rod(a,b,r=.012,material=bronze){const delta=new T.Vector3().subVectors(b,a);const m=new T.Mesh(new T.CylinderGeometry(r,r,delta.length(),8),material);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return register(m)}
 function cushion(w,h,d,x,y,z,material=fabric,r=.14){const m=new T.Mesh(roundedGeometry(w,h,d,r),material);m.position.set(x,y,z);return register(m)}
 function glassPanel(w,h,d,x,y,z){const m=box(w,h,d,x,y,z,glass,false,false);m.castShadow=false;return m}
 function lamp(x,y,z){cylinder(.065,.03,x,y-.2,z,trim);cylinder(.012,.32,x,y-.05,z,trim);const shade=new T.Mesh(new T.CylinderGeometry(.12,.16,.22,24),linen);shade.position.set(x,y+.15,z);register(shade);cylinder(.08,.008,x,y+.035,z,warm)}
 function chair(x,y,z,rotation=0){const seat=cushion(.46,.09,.45,x,y,z,linen,.12);const back=cushion(.46,.38,.085,x,y+.22,z-.19,pillow,.12);back.rotation.y=rotation;back.position.x=x-Math.sin(rotation)*.19;back.position.z=z-Math.cos(rotation)*.19;seat.rotation.y=rotation;for(const dx of [-.17,.17])for(const dz of [-.15,.15]){const xx=dx*Math.cos(rotation)-dz*Math.sin(rotation),zz=dx*Math.sin(rotation)+dz*Math.cos(rotation);box(.024,.38,.024,x+xx,y-.22,z+zz,bronze)}return {seat,back}}

 // Keep a minimal product-stage foundation; warm timber reads as the original terrace.
 box(10.6,.2,6.65,0,-1.20,.10,marble,true);box(10.5,.05,6.55,0,-1.065,.10,reveal,true);
 box(6.13,.07,5.96,-2.0,-1.00,.15,wood,true);
 for(let x=-4.9;x<1.0;x+=.18)box(.007,.004,5.82,x,-.958,.15,seam,false,false);
 // Two aligned, pearl-white modules with a continuous rounded shell.
 const cx=-1.64,zc=-.7,front=1.19;
 shell(5.34,2.28,3.76,cx,.17,zc,.37);
 shell(5.42,2.42,3.84,cx,2.48,zc-.02,.53);
 for(const x of [cx-2.68,cx+2.68])box(.12,.10,4,x,1.34,zc,pearl,true);
 for(const z of [zc-1.94,zc+1.94])box(5.48,.10,.12,cx,1.34,z,pearl,true);
 box(5.18,.045,3.52,cx,-.82,zc,wood,true);
 // Interior stair opening, rather than an outside flight to the upper room.
 const stairX=.30,stairZ=-.90,stairRadius=.49;
 function upperSlab(y,material){const s=new T.Shape();s.moveTo(cx-2.61,zc-1.75);s.lineTo(cx+2.61,zc-1.75);s.lineTo(cx+2.61,zc+1.75);s.lineTo(cx-2.61,zc+1.75);s.closePath();const hole=new T.Path();hole.absarc(stairX,stairZ,stairRadius+.04,0,Math.PI*2,true);s.holes.push(hole);const g=new T.ExtrudeGeometry(s,{depth:.045,bevelEnabled:false,curveSegments:36});g.rotateX(Math.PI/2);const m=new T.Mesh(g,material);m.position.y=y;return register(m);}
 upperSlab(1.42,wood);
 // Ceiling inserts, manufacturing seams and service hatch on the left side.
 upperSlab(1.39,linen);box(4.72,.035,3.24,cx,3.48,zc,linen,true);
 const sideX=cx-2.72;
 for(const z of [-2.0,-.65,.65])box(.008,1.55,.008,sideX,2.46,z,seam,false,false);
 box(.018,.57,.72,sideX-.005,2.52,-1.53,reveal,true);box(.025,.018,.22,sideX-.02,2.33,-1.5,trim,true,false);
 // Thin full-height sliding sashes sit behind the continuous exterior lip.
 const gx=4.86,gy=1.91,glassZ=.83;
 for(const [floor,centerY] of [[0,.17],[1,2.48]]){
  glassPanel(gx,gy,.012,cx,centerY,glassZ);
  for(let i=0;i<5;i++)box(.027,gy,.035,cx-gx/2+i*gx/4,centerY,glassZ+.01,bronze);
  for(const y of [centerY-gy/2,centerY+gy/2])box(gx,.026,.042,cx,y,glassZ+.01,bronze);
  box(.018,.15,.03,cx+.15,centerY,glassZ+.045,trim);
 }
 // Warm light follows the curved front profile instead of decorative cyan borders.
 outline(5.22,2.19,.43,cx,2.48,front+.045,warm);
 led(5.24,cx,1.355,front+.045,warm,.014);
 led(4.5,cx,1.105,-2.20,warm,.022);led(4.5,cx,3.425,-2.20,warm,.022);
 // Narrow upper front balcony and rail: two chairs, small round table.
 box(5.36,.085,.82,cx,1.39,1.17,pearl,true);
 glassPanel(5.12,.64,.012,cx,1.87,1.55);rail(cx-2.57,1.55,cx+2.57,1.55,2.205,bronze,.012);
 for(const x of [cx-2.56,cx-1.29,cx,cx+1.29,cx+2.56])box(.014,.72,.014,x,1.84,1.56,bronze);
 chair(-.64,1.62,1.10,.0);chair(.04,1.62,1.10,.0);cylinder(.15,.035,-.28,1.83,1.28,trim);cylinder(.018,.34,-.28,1.64,1.28,bronze);
 // Fully internal spiral: wedge treads, central support and continuous handrail.
 const stairBase=-.82,stairTop=1.42,n=17,start=Math.PI/2,turn=Math.PI*2.5;
 const core=cylinder(.045,stairTop-stairBase+.72,stairX,(stairBase+stairTop)/2+.36,stairZ,bronze);core.name='internal-spiral-core';
 for(let i=0;i<n;i++){const a=start+turn*i/n,b=start+turn*(i+.97)/n,s=new T.Shape();s.moveTo(Math.cos(a)*.06,-Math.sin(a)*.06);s.lineTo(Math.cos(a)*stairRadius,-Math.sin(a)*stairRadius);s.absarc(0,0,stairRadius,-a,-b,true);s.lineTo(Math.cos(b)*.06,-Math.sin(b)*.06);s.absarc(0,0,.06,-b,-a,false);s.closePath();const g=new T.ExtrudeGeometry(s,{depth:.035,bevelEnabled:false,curveSegments:8});g.rotateX(-Math.PI/2);const m=new T.Mesh(g,wood);const y=stairBase+(stairTop-stairBase)*(i+1)/n;m.position.set(stairX,y-.035,stairZ);m.name='internal-spiral-step-'+i;register(m);if(i%2===0)rod(new T.Vector3(stairX+Math.cos(a)*stairRadius,y,stairZ+Math.sin(a)*stairRadius),new T.Vector3(stairX+Math.cos(a)*stairRadius,y+.65,stairZ+Math.sin(a)*stairRadius),.008,bronze);}
 const helix=[];for(let i=0;i<=90;i++){const p=i/90,a=start+turn*p;helix.push(new T.Vector3(stairX+Math.cos(a)*stairRadius,stairBase+(stairTop-stairBase)*p+.65,stairZ+Math.sin(a)*stairRadius));}const handrail=register(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(helix),100,.014,6,false),bronze));handrail.name='internal-spiral-handrail';
 // Fabric curtains with curved folds, rather than a row of flat stripes.
 for(const xBase of [cx-2.34,cx+1.96])for(let i=0;i<7;i++){const x=xBase+i*.055;const m=new T.Mesh(new T.CylinderGeometry(.037,.043,1.86,8,1,true),linen);m.position.set(x,2.47,.67);m.scale.z=.72;register(m,villa,false)}
 // Upstairs bedroom, two pillows, reading lamps and large art panels.
 cushion(2.25,.24,1.65,cx,1.68,-.91,wood);cushion(2.12,.22,1.58,cx,1.88,-.91,linen);
 cushion(2.34,.75,.15,cx,2.02,-1.78,fabric);cushion(2.13,.04,.60,cx,2.01,-.37,pillow);
 for(const x of [cx-.52,cx+.52])cushion(.75,.14,.43,x,2.08,-1.40,fabric,.18);
 for(const x of [cx-1.5,cx+1.5]){box(.54,.07,.53,x,1.72,-1.4,wood,true);lamp(x,1.91,-1.4)}
 box(4.9,1.85,.08,cx,2.45,-2.53,linen);
 for(let i=0;i<3;i++){box(.60,.66,.035,cx-.66+i*.66,2.57,-2.475,reveal,true);box(.47,.02,.014,cx-.66+i*.66,2.50+i*.05,-2.45,trim)}
 // Downstairs lounge and dining: all geometry participates in the dust transform.
 cushion(2.16,.30,.84,-2.85,-.55,-.81,linen);cushion(2.20,.53,.15,-2.85,-.29,-1.17,linen);
 for(const x of [-3.55,-2.84,-2.13]){cushion(.66,.08,.72,x,-.34,-.81,fabric);const q=cushion(.37,.33,.13,x,-.12,-1.03,pillow);q.rotation.z=.13}
 cushion(.13,.36,.88,-3.99,-.35,-.81,linen);cushion(.13,.36,.88,-1.72,-.35,-.81,linen);
 box(1.48,.065,.64,-2.75,-.58,.27,marble,true);box(.8,.28,.17,-2.75,-.75,.27,bronze);
 for(const [x,z] of [[-3.0,.22],[-2.48,.32]])cylinder(.07,.12,x,-.48,z,trim);
 cylinder(.53,.065,-.26,-.39,-.77,wood,48);cylinder(.10,.55,-.26,-.71,-.77,bronze);
 for(const [x,z,a] of [[-.81,-.79,1.57],[.28,-.79,-1.57],[-.26,-1.34,0]])chair(x,-.48,z,a);
 // Pendant shade, electrical cable and practical interior light.
 rod(new T.Vector3(-.26,1.12,-.77),new T.Vector3(-.26,.74,-.77),.005,bronze);
 const shade=new T.Mesh(new T.SphereGeometry(.22,24,14,0,Math.PI*2,0,Math.PI/2),linen);shade.position.set(-.26,.58,-.77);register(shade);cylinder(.18,.008,-.26,.58,-.77,warm);
 // Outdoor table, real chair legs, stemware and a kettle-style barbecue grill.
 const tableX=-1.15,tableZ=2.31;cylinder(.59,.055,tableX,-.35,tableZ,wood,48);cylinder(.10,.60,tableX,-.68,tableZ,bronze);
 for(const [x,z,a] of [[tableX-.8,tableZ,1.57],[tableX+.8,tableZ,-1.57],[tableX,tableZ+.73,3.14]])chair(x,-.45,z,a);
 for(const [x,z] of [[tableX-.22,tableZ-.1],[tableX+.24,tableZ+.12]]){cylinder(.12,.009,x,-.315,z,linen);cylinder(.025,.12,x+.13,-.255,z,glass,16);cylinder(.006,.05,x+.13,-.34,z,trim,8)}
 const grill=new T.Mesh(new T.SphereGeometry(.26,28,16),black);grill.position.set(-3.68,-.31,2.14);grill.scale.y=.72;register(grill);
 for(const [x,z] of [[-3.85,2.01],[-3.51,2.01],[-3.68,2.32]])rod(new T.Vector3(-3.68,-.42,2.14),new T.Vector3(x,-.94,z),.014,bronze);
 for(let i=0;i<7;i++)box(.40,.009,.009,-3.68,-.19,2.01+i*.04,trim,false,false);
 for(const x of [-3.88,-.0]){cylinder(.06,.28,x,-.80,2.91,reveal);cylinder(.06,.06,x,-.64,2.91,warm)}
 for(let i=0;i<3;i++)box(2.4+i*.20,.085,.32,-2.0,-1.02-i*.085,3.12+i*.23,pearl,true);
 // Adjacent shared-pool vignette drawn from the park images, not the villa photo.
 const px=2.97,pz=.25,pw=3.66,pd=5.03;
 box(pw+.24,.16,pd+.24,px,-1.00,pz,pearl,true);box(pw,.10,pd,px,-.87,pz,marble,true);
 const poolShape=roundedPath(pw-.18,pd-.18,.42),waterGeo=new T.ShapeGeometry(poolShape,32);waterGeo.rotateX(-Math.PI/2);
 const waterBase=new T.MeshPhysicalMaterial({color:'#166674',metalness:.23,roughness:.12,transparent:true,opacity:.92,clearcoat:1,clearcoatRoughness:.08,envMapIntensity:1.8});
 const water=new T.Mesh(waterGeo,waterBase);water.position.set(px,-.76,pz);register(water);
 waterBase.onBeforeCompile=shader=>{shader.uniforms.uMotion=progressUniform;shader.vertexShader='uniform float uMotion;varying vec3 vWater;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>\nvWater=position;`);shader.fragmentShader='uniform float uMotion;varying vec3 vWater;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>\nfloat a=sin(vWater.x*12.+sin(vWater.z*5.+uMotion*5.)*1.9)+cos(vWater.z*14.+sin(vWater.x*6.)*1.8-uMotion*5.);float caustic=pow(clamp(1.-abs(a)*.52,0.,1.),7.);diffuseColor.rgb+=vec3(.04,.13,.14)*caustic;`);shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_begin>',`#include <normal_fragment_begin>\nnormal=normalize(normal+vec3(sin(vWater.x*13.+vWater.z*4.+uMotion*6.)*.025,cos(vWater.z*11.-uMotion*5.)*.025,0.));`)};
 const originalWaterHook=waterBase.onBeforeCompile;
 water.userData.poolReflection={texture:{value:null},matrix:{value:new T.Matrix4()}};
 waterBase.onBeforeCompile=shader=>{originalWaterHook(shader);shader.uniforms.uPoolReflection=water.userData.poolReflection.texture;shader.uniforms.uPoolTextureMatrix=water.userData.poolReflection.matrix;
  shader.vertexShader='uniform mat4 uPoolTextureMatrix;varying vec4 vPoolReflection;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nvPoolReflection=uPoolTextureMatrix*modelMatrix*vec4(transformed,1.);');
  shader.fragmentShader='uniform sampler2D uPoolReflection;varying vec4 vPoolReflection;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`vec2 poolUv=vPoolReflection.xy/vPoolReflection.w;poolUv+=vec2(sin(vWater.x*13.+uMotion*7.),cos(vWater.z*11.-uMotion*6.))*.002;vec3 poolReflected=texture2D(uPoolReflection,clamp(poolUv,.001,.999)).rgb;outgoingLight=mix(outgoingLight,poolReflected,.29);\n#include <opaque_fragment>`);
 };
 const waterHook=waterBase.onBeforeCompile;
 // Smooth infinity coping with warm outer and cyan inner light, no sports-lane pattern.
 function poolRing(w,d,r,y,material,radius=.012){const points=roundedPath(w,d,r).getPoints(96).map(p=>new T.Vector3(p.x+px,y,p.y+pz));const curve=new T.CatmullRomCurve3(points,true);return register(new T.Mesh(new T.TubeGeometry(curve,192,radius,6,true),material),villa,false)}
 poolRing(pw-.04,pd-.04,.47,-.74,cyan,.008);poolRing(pw+.15,pd+.15,.48,-.86,trim,.015);
 for(const z of [-1.60,-.58,.44,1.46,2.18])box(.04,.035,.14,px-pw/2+.05,-.79,z,cyan,false,false);
 // A compact club cabana at the rear emphasizes the shared resort setting.
 box(3.2,.10,.95,px,1.04,-2.64,pearl,true);for(const x of [px-1.48,px+1.48])box(.035,1.96,.035,x,.02,-2.98,bronze);
 cushion(2.7,.25,.70,px,-.63,-2.57,linen);cushion(2.7,.41,.13,px,-.37,-2.88,pillow);led(2.9,px,.975,-2.20,warm);
 const roomLight=new T.PointLight(0xffcf90,8,5,2);roomLight.position.set(-1.6,.38,-.50);villa.add(roomLight);
 const upperLight=new T.PointLight(0xffcd96,4,4,2);upperLight.position.set(-1.8,2.7,-.9);villa.add(upperLight);
 const poolLight=new T.PointLight(0x38c5dd,4,3.7,2);poolLight.position.set(px,.03,pz);villa.add(poolLight);
 // Fade this secondary practical with the same progress as the existing room light.
 upperLight.userData.introPractical=true;
 villa.updateMatrixWorld(true);
 return {water,waterHook,roomLight,poolLight,practicals:[upperLight],reference:'ref-011 / yangyang-modular-villa-original.png'};
}
