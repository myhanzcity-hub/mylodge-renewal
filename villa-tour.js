// Model coordinates in metres, glTF Y-up. Each stop is placed on clear floor.
export const TOUR_STOPS={
  living:{floor:'ground',label:'거실',heading:'햇살이 머무는 거실',description:'크림 패브릭과 오크, 세이지 컬러가 어우러진 휴식 공간',eye:[-.35,1.72,-2.7],target:[-2.3,1.2,-.1]},
  kitchen:{floor:'ground',label:'주방',heading:'일상이 편안해지는 주방',description:'조리대와 수납을 가까이 둘러보세요',eye:[.1,1.72,.25],target:[.1,1.45,2.98]},
  dining:{floor:'ground',label:'다이닝',heading:'함께하는 한 끼',description:'작은 식탁을 둘러싼 따뜻한 다이닝 공간',eye:[.15,1.72,-3.0],target:[1.65,1.0,-1.2]},
  bathroom:{floor:'ground',label:'욕실',heading:'하루를 정돈하는 공간',description:'샤워와 세면, 수납의 구성을 살펴보세요',eye:[-2.1,1.72,1.53],target:[-3.3,1.25,2.5]},
  bedroom:{floor:'upper',label:'침실',heading:'나만의 조용한 밤',description:'침대와 양옆 협탁, 은은한 조명이 어우러진 2층 침실을 둘러보세요',eye:[2.85,4.78,-2.85],target:[1.4,4.05,-.1]},
  landing:{floor:'upper',label:'계단홀',heading:'1층에서 이어지는 계단홀',description:'계단의 도착 지점과 유리 난간, 침실과 서재로 이어지는 동선을 확인하세요',eye:[1.15,4.78,1.35],target:[2.7,3.8,2.15]},
  study:{floor:'upper',label:'서재',heading:'잠시 집중하는 나만의 서재',description:'오크 책상과 수납, 작업 의자가 놓인 2층의 작은 업무 공간입니다',eye:[.85,4.78,.85],target:[.35,4.15,2.7]},
  dressing:{floor:'upper',label:'드레스존',heading:'생활을 정돈하는 수납 공간',description:'침실 옆 옷장과 수납 구성을 가까이 살펴보세요',eye:[2.7,4.78,.45],target:[3.67,4.3,.15]},
  terrace:{floor:'upper',label:'테라스',heading:'바람을 맞는 작은 쉼터',description:'두 개의 의자와 차 한 잔을 위한 테라스',eye:[-2.35,4.78,.15],target:[-2.15,4.0,-2.0]}
};
export const FLOOR_HEIGHT={ground:.175,upper:3.23};
export const DEFAULT_STOP={ground:'living',upper:'bedroom'};
export const EXTERIOR_POSE={eye:[13,10,-15],target:[0,2.2,0]};
export const UPPER_PLAN_POSE={eye:[9,12,-11],target:[.1,3.3,0]};
export function orbitFitScale(aspect){return aspect<.8?.95/aspect:1;}
export const FLOOR_PORTALS=[
  {key:'landing',floor:'ground',label:'2층 계단홀',position:[2.55,.2,.8]},
  {key:'living',floor:'upper',label:'1층 거실',position:[1.35,3.255,2.45]},
  {key:'terrace',floor:'upper',label:'테라스',position:[-.35,3.255,-2.65]},
  {key:'bedroom',floor:'upper',label:'침실',position:[-1.05,3.255,-2.65]}
];
// The plan reveals furniture and circulation; every interior view restores the shell.
const PLAN_HIDDEN_GROUPS=['GF','ROOF','SHELL_UPPER','GLASS_UPPER','SHELL_GROUND','GLASS_GROUND','SITE'];
export function setModelView(model,view){for(const name of PLAN_HIDDEN_GROUPS){const group=model.getObjectByName(name);if(group)group.visible=view!=='upper-plan';}}
export function isVisibleInHierarchy(object){for(let node=object;node;node=node.parent)if(!node.visible)return false;return true;}
export function lookAngles(eye,target){const dx=target[0]-eye[0],dy=target[1]-eye[1],dz=target[2]-eye[2];return{yaw:Math.atan2(-dx,-dz),pitch:Math.asin(dy/Math.hypot(dx,dy,dz))};}
export function clampPitch(pitch){return Math.max(-1.15,Math.min(1.15,pitch));}
export function floorStops(floor){return Object.entries(TOUR_STOPS).filter(([,stop])=>stop.floor===floor);}
export function renderPixelRatio(width,height,deviceRatio,mobile){
  const pixelCap=mobile?Math.sqrt(640000/(Math.max(1,width)*Math.max(1,height))):Infinity;
  return Math.min(deviceRatio||1,mobile?1.3:1.8,pixelCap);
}
