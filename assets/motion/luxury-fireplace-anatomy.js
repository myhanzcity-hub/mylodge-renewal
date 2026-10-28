// Luxury fireplace study. Geometry and the WebGL layer use the installed
// Anatomy kit's projection, solid renderer, camera contract and light helpers.
import * as K from './anatomy/iso-kit.mjs';
import { glCamera, glLayer, settle } from './anatomy/gl.mjs';

const W = 900;
const H = 520;
const APERTURE = { x0: -78, x1: 78, z0: 32, z1: 95 };
const FIRE_PLANE_Y = 9;

const boxCorners = (part) => K.boxCorners(part.plan, part.z, part.z + part.h);
const rectPlan = (x0, y0, x1, y1, r = 1) => ({ x: x0, y: y0, w: x1 - x0, d: y1 - y0, r });

function installAnatomyStyles() {
  if (document.getElementById('mylodge-anatomy-kit-style')) return;
  const style = document.createElement('style');
  style.id = 'mylodge-anatomy-kit-style';
  style.textContent = K.ISO_CSS;
  document.head.append(style);
}

function buildModel() {
  const mainParts = [
    { id: 'wall-left', plan: rectPlan(-150, -34, -78, 0), z: 0, h: 164, material: 'wall', tone: 'mid' },
    { id: 'wall-right', plan: rectPlan(78, -34, 150, 0), z: 0, h: 164, material: 'wall', tone: 'mid' },
    { id: 'wall-lintel', plan: rectPlan(-78, -34, 78, 0), z: 95, h: 69, material: 'wall', tone: 'mid' },
    { id: 'wall-sill', plan: rectPlan(-78, -34, 78, 0), z: 0, h: 32, material: 'wall', tone: 'mid' },
    { id: 'wall-return', plan: rectPlan(140, -92, 158, -34), z: 0, h: 164, material: 'wall-side', tone: 'mid' },
    { id: 'floor', plan: rectPlan(-154, -38, 158, 28), z: -7, h: 7, material: 'floor', tone: 'mid' },
  ];
  const cavityParts = [
    { id: 'cavity-back', plan: rectPlan(-75, -48, 75, -38), z: 35, h: 57, material: 'cavity', tone: 'lo' },
    { id: 'cavity-left-cheek', plan: rectPlan(-78, -38, -69, -1), z: 32, h: 63, material: 'cavity-metal', tone: 'lo' },
    { id: 'cavity-right-cheek', plan: rectPlan(69, -38, 78, -1), z: 32, h: 63, material: 'cavity-metal', tone: 'lo' },
    { id: 'cavity-head', plan: rectPlan(-69, -38, 69, -1), z: 86, h: 9, material: 'cavity-metal', tone: 'lo' },
    { id: 'cavity-sill', plan: rectPlan(-69, -38, 69, -1), z: 32, h: 7, material: 'cavity-metal', tone: 'lo' },
  ];
  const fireboxParts = [
    { id: 'chamber-shell', plan: rectPlan(-68, -30, 68, -18), z: 39, h: 48, material: 'firebox', tone: 'lo' },
    { id: 'refractory-back', plan: rectPlan(-60, -17, 60, -10), z: 43, h: 39, material: 'refractory', tone: 'faint' },
    { id: 'refractory-left', plan: rectPlan(-66, -19, -59, -8), z: 39, h: 47, material: 'refractory-side', tone: 'lo' },
    { id: 'refractory-right', plan: rectPlan(59, -19, 66, -8), z: 39, h: 47, material: 'refractory-side', tone: 'lo' },
    { id: 'chamber-head', plan: rectPlan(-65, -20, 65, -7), z: 82, h: 4, material: 'firebox', tone: 'lo' },
  ];
  const innerFrame = [
    { id: 'firebox-rail-left', plan: rectPlan(-72, -5, -66, 3), z: 34, h: 59, material: 'metal-edge', tone: 'mid' },
    { id: 'firebox-rail-right', plan: rectPlan(66, -5, 72, 3), z: 34, h: 59, material: 'metal-edge', tone: 'mid' },
    { id: 'firebox-rail-top', plan: rectPlan(-72, -5, 72, 3), z: 88, h: 6, material: 'metal-edge', tone: 'mid' },
    { id: 'firebox-rail-bottom', plan: rectPlan(-72, -5, 72, 3), z: 34, h: 5, material: 'metal-edge', tone: 'mid' },
  ];
  const burnerParts = [
    { id: 'burner-trough', plan: rectPlan(-60, -23, 60, -6), z: 35, h: 4, material: 'burner', tone: 'lo' },
    { id: 'burner-lip-front', plan: rectPlan(-58, -6, 58, -3), z: 36, h: 2, material: 'burner-lip', tone: 'mid' },
    { id: 'burner-lip-rear', plan: rectPlan(-58, -26, 58, -23), z: 36, h: 2, material: 'burner-lip', tone: 'mid' },
    { id: 'burner-support-left', plan: rectPlan(-55, -19, -51, -10), z: 33, h: 3, material: 'metal-edge', tone: 'lo' },
    { id: 'burner-support-right', plan: rectPlan(51, -19, 55, -10), z: 33, h: 3, material: 'metal-edge', tone: 'lo' },
  ];

  const deco = [];
  // Two quiet, built-up wall panels flank the fire and keep the architectural context legible.
  for (const side of [-1, 1]) {
    const center = side * 123;
    deco.push({ id: `wall-panel-${side}`, plan: rectPlan(center - 22, -2, center + 22, 2), z: 18, h: 122, material: 'timber-panel', tone: 'mid' });
    deco.push({ id: `wall-panel-cap-top-${side}`, plan: rectPlan(center - 24, 0, center + 24, 5), z: 138, h: 3, material: 'stone-trim', tone: 'hi' });
    deco.push({ id: `wall-panel-cap-bottom-${side}`, plan: rectPlan(center - 24, 0, center + 24, 5), z: 16, h: 3, material: 'stone-trim', tone: 'hi' });
    for (let i = 0; i < 5; i++) {
      const x = center - 17 + i * 8.5;
      deco.push({ id: `wall-flute-${side}-${i}`, plan: rectPlan(x - .7, 2, x + .7, 4.2), z: 24, h: 109, material: 'timber-flute', tone: 'mid' });
    }
  }
  const surround = [
    { id: 'surround-left', plan: rectPlan(-99, 2, -78, 14), z: 16, h: 94, material: 'limestone', tone: 'hi' },
    { id: 'surround-right', plan: rectPlan(78, 2, 99, 14), z: 16, h: 94, material: 'limestone', tone: 'hi' },
    { id: 'surround-head', plan: rectPlan(-99, 2, 99, 14), z: 95, h: 15, material: 'limestone-top', tone: 'hi' },
    { id: 'surround-plinth', plan: rectPlan(-99, 2, 99, 14), z: 16, h: 16, material: 'limestone', tone: 'hi' },
    { id: 'surround-inset-left', plan: rectPlan(-78, 14, -75, 17), z: 32, h: 63, material: 'stone-highlight', tone: 'mid' },
    { id: 'surround-inset-right', plan: rectPlan(75, 14, 78, 17), z: 32, h: 63, material: 'stone-highlight', tone: 'mid' },
    { id: 'surround-inset-head', plan: rectPlan(-78, 14, 78, 17), z: 92, h: 3, material: 'stone-highlight', tone: 'mid' },
    { id: 'surround-inset-foot', plan: rectPlan(-78, 14, 78, 17), z: 31, h: 3, material: 'stone-highlight', tone: 'mid' },
  ];
  const hearth = [
    { id: 'hearth-shadow', plan: rectPlan(-108, 7, 108, 48), z: -3, h: 1.5, material: 'shadow', tone: 'faint' },
    { id: 'hearth-core', plan: rectPlan(-105, 1, 105, 46), z: -1.5, h: 7, material: 'hearth-side', tone: 'mid' },
    { id: 'hearth-top', plan: rectPlan(-108, 0, 108, 46), z: 5.5, h: 3, material: 'hearth', tone: 'hi' },
    { id: 'hearth-front-lip', plan: rectPlan(-103, 43, 103, 47), z: 1, h: 4.5, material: 'hearth-lip', tone: 'mid' },
    { id: 'hearth-foot-left', plan: rectPlan(-84, 8, -76, 20), z: -5, h: 4, material: 'metal-edge', tone: 'lo' },
    { id: 'hearth-foot-right', plan: rectPlan(76, 8, 84, 20), z: -5, h: 4, material: 'metal-edge', tone: 'lo' },
  ];
  const flameBed = [];
  // Burner details are restrained architectural fittings; they do not specify a fuel type.
  for (let i = 0; i < 13; i++) {
    const x = -49 + i * 8.2;
    flameBed.push({ id: `burner-inset-${i}`, plan: rectPlan(x - 1.5, -18, x + 1.5, -12), z: 39, h: 1.1, material: i % 3 === 0 ? 'ember-bed' : 'burner-hole', tone: i % 3 === 0 ? 'mid' : 'lo' });
  }
  const parts = [...mainParts, ...deco, ...cavityParts, ...fireboxParts, ...innerFrame, ...burnerParts, ...flameBed, ...surround, ...hearth];
  const P = K.fitProjection(parts.flatMap(boxCorners), W, H, { pad: 34, azimuth: 43, elevation: 28 });
  const camera = glCamera(P);
  const renderPart = part => {
    const paths = K.slabOf(part.plan, part.z, part.h, P, part.h < 3 ? 3 : 6, part.h > 2 ? .8 : .35);
    const canInset = part.plan.w > 8 && part.plan.d > 8;
    const extra = part.h > 40 && canInset ? K.planOutline(K.insetPlan(part.plan, 3.2), part.z + part.h, P, 4) : '';
    const inner = extra ? K.lineSvg(extra, { tone: 'faint' }) : '';
    return `<g data-part-id="${part.id}" class="fp-part ${part.material}">${K.solidSvg(paths, { tone: part.tone, crease: 'faint', halo: part.id === 'hearth-core', inner })}</g>`;
  };
  const pathOnY = (points, y, close = false) => K.pathOf(points.map(([x, z]) => K.iso([x, y, z], P)), close);
  const plane = (x0, z0, x1, z1, y) => pathOnY([[x0, z0], [x1, z0], [x1, z1], [x0, z1]], y, true);

  const wallParts = [...mainParts, ...deco];
  const deepParts = [...cavityParts, ...innerFrame, ...burnerParts, ...flameBed];
  const fireTongue = (x, width, height, phase) => {
    const z0=39;
    const p=(xx,zz)=>K.iso([xx,FIRE_PLANE_Y,zz],P);
    const a=p(x-width,z0), b=p(x-width*.58,z0+height*.72), c=p(x+width*.52,z0+height*.79), d=p(x+width*.18,z0+height);
    const e=p(x+width*.84,z0+height*.56), f=p(x+width*.6,z0+height*.1), g=p(x+width,z0);
    return `M${a[0]} ${a[1]} C${b[0]} ${b[1]} ${c[0]} ${c[1]} ${d[0]} ${d[1]} C${e[0]} ${e[1]} ${f[0]} ${f[1]} ${g[0]} ${g[1]} Z`;
  };
  const fallbackFlames=Array.from({length:8},(_,i)=>{
    const x=-52+i*14.8;
    return `<path class="fp-fallback-tongue" data-flame="${i}" d="${fireTongue(x,4.3+(i%3)*.55,23+(i%4)*4.4,i*.83)}"/>`;
  }).join('');
  const backMarkup = `<svg class="iso-svg fp-svg fp-back" viewBox="0 0 ${W} ${H}" aria-hidden="true">
    <g class="fp-wall" data-build="wall">${wallParts.map(renderPart).join('')}</g>
    <g class="fp-cavity" data-build="cavity">${cavityParts.map(renderPart).join('')}</g>
    <g class="fp-firebox" data-build="firebox">${[...fireboxParts,...innerFrame].map(renderPart).join('')}</g>
    <g class="fp-burner" data-build="burner">${[...burnerParts, ...flameBed].map(renderPart).join('')}${fallbackFlames}
    </g>
  </svg>`;
  const surroundGroups=[
    ['stone-left',surround.filter(p=>p.id.endsWith('left'))],
    ['stone-right',surround.filter(p=>p.id.endsWith('right'))],
    ['stone-head',surround.filter(p=>p.id.endsWith('head'))],
    ['stone-plinth',surround.filter(p=>p.id.endsWith('foot')||p.id==='surround-plinth')],
  ];
  const frontMarkup = `<svg class="iso-svg fp-svg fp-front" viewBox="0 0 ${W} ${H}" aria-hidden="true">
    ${surroundGroups.map(([name,group])=>`<g class="fp-surround ${name}" data-build="${name}">${group.map(renderPart).join('')}</g>`).join('')}
    <g class="fp-glass" data-build="glass">
      <path class="fp-glass-pane" d="${plane(APERTURE.x0 + 4, APERTURE.z0 + 3, APERTURE.x1 - 4, APERTURE.z1 - 3, 13)}"/>
      <path class="fp-glass-outline" d="${plane(APERTURE.x0 + 4, APERTURE.z0 + 3, APERTURE.x1 - 4, APERTURE.z1 - 3, 13)}"/>
      <path class="fp-glass-reflection" d="${pathOnY([[-53, 84],[-48, 86],[-20, 40]], 13.2)}"/>
      <path class="fp-glass-reflection fp-reflection-short" d="${pathOnY([[48, 83],[57, 85]], 13.2)}"/>
      <path class="fp-glass-edge-glint" d="${pathOnY([[-71, 88],[65, 88]], 13.3)}"/>
    </g>
    <g class="fp-hearth" data-build="hearth">${hearth.map(renderPart).join('')}</g>
    <g class="fp-stone-finish" data-build="finish">
      ${[-91,91].map(x => `<path d="${pathOnY([[x,19],[x,106]],14.5)}"/>`).join('')}
      <path d="${pathOnY([[-91,106],[91,106]],14.5)}"/>
      <path d="${pathOnY([[-91,16],[91,16]],14.5)}"/>
      ${[-87,-82,82,87].map(x => `<circle cx="${K.iso([x,15,58],P)[0]}" cy="${K.iso([x,15,58],P)[1]}" r="1.05"/>`).join('')}
    </g>
  </svg>`;
    return { P, camera, backMarkup, frontMarkup, view: [W, H], aperture: APERTURE, flamePlaneY: FIRE_PLANE_Y, solidCount: parts.length };
}

const FIRE_FRAGMENT = `
uniform float uFire;
void main(){
  vec2 vb=viewOf(gl_FragCoord.xy);
  vec3 p=onWallY(vb, ${FIRE_PLANE_Y.toFixed(1)});
  float x=p.x;
  float z=p.z;
  float inside=window(x, ${APERTURE.x0 + 3}.0, ${APERTURE.x1 - 3}.0, .9)*window(z, ${APERTURE.z0 + 4}.0, ${APERTURE.z1 - 3}.0, .9);
  float field=0.;
  float core=0.;
  float lower=37.5;
  for(int i=0;i<9;i++){
    float fi=float(i);
    float seed=fi*1.719;
    float base=mix(-55.,55.,fi/8.);
    float flicker=sin(uTime*(2.0+fi*.11)+seed)+.35*sin(uTime*(3.7+fi*.07)-seed*1.3);
    float height=28.0+5.5*sin(seed+uTime*.83)+2.8*noise2(vec2(seed,uTime*.42));
    float q=(z-lower)/height;
    float drift=(.7+q)*flicker*2.7+1.6*sin(q*4.2+seed+uTime*1.4);
    float center=base+drift;
    float width=mix(5.9,1.05,clamp(q,0.,1.));
    float profile=exp(-pow((x-center)/width,2.0)*1.25);
    float body=profile*smoothstep(-.03,.10,q)*(1.-smoothstep(.76,1.01,q));
    body*=.68+.22*sin(uTime*1.8+seed)+.1*noise2(vec2(x*.12+seed,z*.14-uTime*.55));
    field=max(field,body);
    float hotWidth=max(.65,width*.34);
    float hot=exp(-pow((x-center)/hotWidth,2.0)*1.45)*smoothstep(.02,.17,q)*(1.-smoothstep(.48,.79,q));
    core=max(core,hot*body);
  }
  float interiorGlow=exp(-pow((x/69.),2.)-pow((z-48.)/30.,2.))*.17*inside*uFire;
  float level=inside*uFire;
  vec3 amber=mix(vec3(.34,.085,.018),vec3(.94,.29,.055),smoothstep(.03,.82,field));
  float a=clamp(1.-exp(-2.3*field),0.,.94);
  vec4 bodyInk=vec4(amber*a,a);
  vec3 coreColor=vec3(1.,.86,.52);
  float ca=clamp(core*.68,0.,.88);
  vec4 coreInk=vec4(coreColor*ca,ca);
  vec4 flame=coreInk+bodyInk*(1.-coreInk.a);
  vec4 glow=vec4(vec3(.42,.14,.035)*interiorGlow,interiorGlow);
  vec4 hot=flame+glow*(1.-flame.a);
  hot*=uFire;
  float noise=(hash12(gl_FragCoord.xy+vec2(uTime*17.,-uTime*11.))-.5)/255.;
  hot.rgb=clamp(hot.rgb+noise*step(.001,hot.a),vec3(0.),vec3(hot.a));
  float wall=window(x,-149.,149.,1.)*window(z,1.,163.,1.)*(1.-inside);
  float wallGlow=exp(-pow(x/118.,2.)-pow((z-62.)/62.,2.))*.13*wall*uFire;
  vec4 tint=vec4(vec3(.38,.16,.038)*wallGlow,wallGlow);
  gl_FragColor=hot+tint*(1.-hot.a);
}`;

function groupVectors(P) {
  const vector = ([x,y,z]) => {
    const a=K.iso([0,0,0],P), b=K.iso([x,y,z],P);
    return { x:b[0]-a[0], y:b[1]-a[1] };
  };
  return {
    wall: vector([0,0,21]), cavity: vector([0,-20,0]), firebox: vector([0,-28,0]),
    'stone-left': vector([-18,0,0]), 'stone-right': vector([18,0,0]), 'stone-head': vector([0,0,20]), 'stone-plinth': vector([0,0,-16]),
    glass: vector([0,30,0]), hearth: vector([0,24,0]), finish: vector([0,0,12]), burner: vector([0,-10,0]),
  };
}

export function mountLuxuryFireplace(stage, { english, gsap, reducedMotion, active = true, onStatus = () => {} }) {
  installAnatomyStyles();
  const model=buildModel();
  const vectors=groupVectors(model.P);
  const words=english
    ? { assemble:'ASSEMBLE', ignite:'IGNITE', extinguish:'EXTINGUISH', building:'Assembling fireplace', done:'Fireplace complete', off:'Fire off', on:'Fire on' }
    : { assemble:'조립하기', ignite:'불 켜기', extinguish:'불 끄기', building:'벽난로를 조립하고 있습니다', done:'벽난로 조립 완료', off:'불 꺼짐', on:'불 켜짐' };
  stage.innerHTML=`<div class="anatomy-fireplace-figure iso" data-theme="light">
      <div class="fp-stage" data-fp-stage>
        ${model.backMarkup}
        <canvas class="fp-fire-gl" aria-hidden="true"></canvas>
        ${model.frontMarkup}
      </div>
      <div class="fp-controls" role="group" aria-label="${english ? 'Fireplace visualization controls' : '벽난로 시각화 조작'}">
        <button type="button" data-fp-assemble>${words.assemble}</button>
        <button type="button" data-fp-ignite>${words.ignite}</button>
        <span class="fp-status" data-fp-status aria-live="polite">${words.building}</span>
      </div>
      <p class="fp-figure-note">${english ? 'Concept visualization · final installation details are not confirmed.' : '콘셉트 시각화 · 실제 설치 사양은 확정되지 않았습니다'}</p>
    </div>`;
  const fpStage=stage.querySelector('[data-fp-stage]');
  const canvas=stage.querySelector('.fp-fire-gl');
  const status=stage.querySelector('[data-fp-status]');
  const buildGroups=[...fpStage.querySelectorAll('[data-build]')];
  const fire={x:0,v:0};
  let fireTarget=0, clock=0, last=0, raf=0, visible=false, inView=false, disposed=false, timeline=null;
  let gl=null;
  const reduced=typeof reducedMotion==='object' ? reducedMotion : matchMedia('(prefers-reduced-motion: reduce)');
  const setStatus=(key)=>{status.textContent=words[key];onStatus(words[key]);};

  try {
    gl=glLayer({canvas,fragment:FIRE_FRAGMENT,view:model.view,camera:model.camera,uniforms:['uFire'],maxRatio:1.5,onError:(message)=>{console.warn('Luxury fireplace WebGL fallback:',message);}});
  } catch (error) { console.warn('Luxury fireplace WebGL fallback:',error); }
  if(gl) fpStage.dataset.webgl='true';

  const renderFire=()=>{
    const level=Math.max(0,Math.min(1,fire.x));
    stage.style.setProperty('--fp-fire-level',String(level));
    if(gl){ if(level>.001) gl.draw({uFire:level},reduced.matches?.8:clock); else gl.clear(); }
    return level;
  };
  const tick=now=>{
    raf=0;
    if(disposed||!visible)return;
    const dt=last?Math.min((now-last)/1000,1/30):1/60;
    last=now; clock+=dt;
    const moving=settle(fire,fireTarget,dt,.42,reduced.matches);
    renderFire();
    if(!gl && fire.x>.01 && !reduced.matches){ /* CSS-driven SVG fallback remains active. */ }
    if(visible&&(moving||(!reduced.matches&&fireTarget>.001))) raf=requestAnimationFrame(tick);
  };
  const run=()=>{ if(!raf&&visible){last=0;raf=requestAnimationFrame(tick);} };
  const setFire=on=>{
    fireTarget=on?1:0;
    setStatus(on?'on':'off');
    if(igniteButton){igniteButton.textContent=fireTarget>.5?words.extinguish:words.ignite;igniteButton.setAttribute('aria-pressed',String(fireTarget>.5));}
    if(reduced.matches){fire.x=fireTarget;fire.v=0;renderFire();return;}
    run();
  };

  const resetParts=()=>{
    for(const group of buildGroups){
      gsap?.killTweensOf(group);
      group.removeAttribute('transform');
      group.style.removeProperty('transform');
      group.style.opacity='1';
      group.style.visibility='visible';
      if(gsap) gsap.set(group,{clearProps:'x,y,opacity,visibility,transform'});
    }
  };
  const setOffset=(group,vector)=>{
    if(!group)return;
    group.removeAttribute('transform');
    if(gsap) gsap.set(group,{x:vector.x,y:vector.y});
    else group.setAttribute('transform',`translate(${vector.x.toFixed(2)} ${vector.y.toFixed(2)})`);
  };
  const assemble=()=>{
    timeline?.kill();timeline=null;
    if(!gsap||reduced.matches){
      resetParts();fire.x=1;fire.v=0;fireTarget=1;renderFire();setStatus('done');syncIgnite();return;
    }
    resetParts();
    for(const group of buildGroups){setOffset(group,vectors[group.dataset.build]||{x:0,y:-18});group.style.opacity='0';group.style.visibility='hidden';}
    const reveal=(name,at,duration=.5)=>{
      const group=fpStage.querySelector(`[data-build="${name}"]`);
      if(!group)return;
      timeline.set(group,{visibility:'visible'},at);
      timeline.to(group,{x:0,y:0,autoAlpha:1,duration,ease:'power2.out'},at);
    };
    fire.x=0;fire.v=0;fireTarget=0;renderFire();
    timeline=gsap.timeline({paused:!visible,onComplete:()=>{setStatus('done');setFire(true);}});
    setStatus('building');
    reveal('wall',0,.65);
    reveal('cavity','>-0.10',.55);
    reveal('firebox','>-0.02',.52);
    reveal('burner','>-0.08',.5);
    reveal('stone-left','>-0.02',.52);
    reveal('stone-right','>-0.07',.52);
    reveal('stone-head','>-0.06',.5);
    reveal('stone-plinth','>-0.06',.5);
    reveal('glass','>-0.01',.48);
    reveal('hearth','>-0.02',.58);
    reveal('finish','>-0.02',.45);
    timeline.call(()=>setFire(true),[],'>-0.02');
    timeline.play(0);
    if(!visible)timeline.pause();
  };
  const assembleButton=stage.querySelector('[data-fp-assemble]');
  const igniteButton=stage.querySelector('[data-fp-ignite]');
  assembleButton.addEventListener('click',assemble);
  igniteButton.addEventListener('click',()=>setFire(fireTarget<.5));
  const syncIgnite=()=>{igniteButton.textContent=fireTarget>.5?words.extinguish:words.ignite;igniteButton.setAttribute('aria-pressed',String(fireTarget>.5));};

  const syncVisibility=()=>{
    visible=inView&&active;
    if(visible){timeline?.resume();run();}
    else{timeline?.pause();if(raf){cancelAnimationFrame(raf);raf=0;last=0;}gl?.clear();}
  };
  const observer='IntersectionObserver' in window?new IntersectionObserver(entries=>{
    const entry=entries[entries.length-1];
    inView=!!entry?.isIntersecting;
    syncVisibility();
  },{rootMargin:'120px 0px'}):null;
  if(observer) observer.observe(fpStage); else {inView=true;syncVisibility();}
  assemble();
  if(visible)run();

  return {
    assemble,
    setActive(value){active=Boolean(value);syncVisibility();},
    dispose(){disposed=true;timeline?.kill();if(raf)cancelAnimationFrame(raf);observer?.disconnect();gl?.clear();},
  };
}
