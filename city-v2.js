import * as THREE from 'https://esm.sh/three@0.169.0';

const $=id=>document.getElementById(id);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
let seed=5938;const rng=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
const rnd=(a,b)=>a+(b-a)*rng(),pick=a=>a[Math.floor(rng()*a.length)];
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile=innerWidth<720;
const quality=mobile?.85:1;
const scene=new THREE.Scene();scene.background=new THREE.Color('#93a79f');scene.fog=new THREE.FogExp2('#809b91',mobile?.016:.010);
const camera=new THREE.PerspectiveCamera(mobile?68:61,innerWidth/innerHeight,.08,500);
const renderer=new THREE.WebGLRenderer({antialias:!mobile,alpha:false,powerPreference:'high-performance'});
renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.15:1.65));
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
renderer.shadowMap.enabled=!mobile;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
$('stage').replaceChildren(renderer.domElement);
const hemi=new THREE.HemisphereLight('#b9dad5','#313e34',1.75);scene.add(hemi);
const sun=new THREE.DirectionalLight('#ffe9af',3.0);sun.position.set(-43,76,-78);sun.castShadow=!mobile;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-85;sun.shadow.camera.right=85;sun.shadow.camera.top=85;sun.shadow.camera.bottom=-85;sun.shadow.bias=-.0008;scene.add(sun);
const glow=new THREE.PointLight('#f6ae70',38,20,2);glow.position.set(10,5,-53);scene.add(glow);
const type=(color,roughness=.85,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
const steel=type('#363f40',.66,.52),rust=type('#775646',.92,.2),glass=type('#2a4146',.25,.35),concrete=type('#737c75'),dark=type('#1c2b29'),moss=type('#335b3e'),wood=type('#574c3e'),rubber=type('#202626',.96);
const drawTex=(base,add)=>{
  const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d');ctx.fillStyle=base;ctx.fillRect(0,0,512,512);
  for(let i=0;i<2700;i++){let x=rnd(0,512),y=rnd(0,512),a=rnd(.02,.24);ctx.fillStyle=i%3===0?'rgba(9,28,19,'+a+')':'rgba(212,220,188,'+(a*.46)+')';ctx.fillRect(x,y,rnd(1,11),rnd(1,18))}
  for(let i=0;i<36;i++){const x=rnd(0,512),y=rnd(0,512),len=rnd(30,220);ctx.strokeStyle=pick(['#304a3b44','#0d211b55','#b8b3a03d']);ctx.lineWidth=rnd(1,5);ctx.beginPath();ctx.moveTo(x,y);ctx.bezierCurveTo(x+12,y+len*.2,x-13,y+len*.65,x+3,y+len);ctx.stroke()}
  for(let i=0;i<95;i++){ctx.fillStyle=pick(['#315b3366','#23442466','#596c4866','#76563b55']);ctx.beginPath();ctx.ellipse(rnd(0,512),rnd(0,512),rnd(2,30),rnd(1,15),rnd(-1,1),0,Math.PI*2);ctx.fill()}
  if(add)add(ctx);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t;
};
const wallMats=['#83847c','#667b79','#858579','#a1a08e','#697779','#6b7770'].map(c=>new THREE.MeshStandardMaterial({map:drawTex(c),roughness:.94}));
const roadTex=drawTex('#4e5146',ctx=>{
  for(let i=0;i<125;i++){ctx.fillStyle=pick(['#262b28','#3e423a','#85816c','#62674e']);ctx.beginPath();ctx.ellipse(rnd(0,512),rnd(0,512),rnd(8,95),rnd(3,30),rnd(-.3,.3),0,Math.PI*2);ctx.fill()}
});
roadTex.repeat.set(1,20);
const roadMat=new THREE.MeshStandardMaterial({map:roadTex,roughness:1,vertexColors:true,side:THREE.DoubleSide});
const pavement=type('#606860');const soil=type('#4b5042');
function box(w,h,d,m,x,y,z,parent=scene){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=!mobile;o.receiveShadow=true;parent.add(o);return o}
function cyl(rt,rb,h,m,x,y,z,parent=scene){const o=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,8),m);o.position.set(x,y,z);o.castShadow=!mobile;parent.add(o);return o}
function sphere(r,m,x,y,z,parent=scene,detail=1){const o=new THREE.Mesh(new THREE.IcosahedronGeometry(r,detail),m);o.position.set(x,y,z);parent.add(o);return o}
function rod(from,to,r,m,parent=scene){const a=new THREE.Vector3(...from),b=new THREE.Vector3(...to);const d=b.clone().sub(a);const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,d.length(),6),m);o.position.copy(a.add(b).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());parent.add(o);return o}
const ground=new THREE.Mesh(new THREE.PlaneGeometry(380,580,1,1),type('#435b42'));ground.rotation.x=-Math.PI/2;ground.position.set(0,-.19,-230);ground.receiveShadow=true;scene.add(ground);
const mainX=z=>1.25*Math.sin(z*.029)+.45*Math.sin(z*.086);
const pathPoint=d=>new THREE.Vector3(mainX(-d),.06,-d);
function ribbon(points,width,material,vertical=.035){const vertices=[],colors=[],uv=[],ids=[];
 for(let i=0;i<points.length;i++){const p=points[i],prev=points[Math.max(0,i-1)],next=points[Math.min(points.length-1,i+1)];const dx=next.x-prev.x,dz=next.z-prev.z;const len=Math.sqrt(dx*dx+dz*dz)||1;const nx=-dz/len,nz=dx/len;for(const side of [-1,1]){const jaggle=Math.sin(i*1.9+side)*.12;vertices.push(p.x+(side*width/2+jaggle)*nx,p.y+vertical,p.z+(side*width/2+jaggle)*nz);const v=rnd(.68,1);colors.push(v,v*.99,v*.94);uv.push(side===-1?0:1,i/2.8)}
 if(i>0){const n=i*2;ids.push(n-2,n-1,n,n-1,n+1,n)}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(ids);g.computeVertexNormals();const o=new THREE.Mesh(g,material);o.receiveShadow=true;scene.add(o);return o}
const mainPoints=[];for(let d=-24;d<=320;d+=1.6)mainPoints.push(pathPoint(d));ribbon(mainPoints,6.4,roadMat);
const routes=[
{id:'poster',at:58,side:-1,title:'The Poster District',label:'01 / LEFT TURN / POSTER WORLD',desc:'Weathered billboards hold a visual campaign. Enter the abandoned street to see the artwork up close.',project:0},
{id:'website',at:142,side:1,title:'The Digital Archive',label:'02 / RIGHT TURN / WEBSITE WORLD',desc:'Beyond the ruins, a forgotten studio has one working screen. Follow its light to a digital case study.',project:1},
{id:'branding',at:221,side:-1,title:'The Identity Station',label:'03 / LEFT TURN / BRAND WORLD',desc:'An old service station becomes a visual identity exhibition. Explore the third project.',project:2}
];
routes[0].curve=new THREE.CatmullRomCurve3([pathPoint(58),new THREE.Vector3(-9,0,-60),new THREE.Vector3(-22,0,-67),new THREE.Vector3(-37,0,-80)],false,'catmullrom',.35);
routes[1].curve=new THREE.CatmullRomCurve3([pathPoint(142),new THREE.Vector3(11,0,-146),new THREE.Vector3(23,0,-156),new THREE.Vector3(36,0,-165)],false,'catmullrom',.35);
routes[2].curve=new THREE.CatmullRomCurve3([pathPoint(221),new THREE.Vector3(-11,0,-224),new THREE.Vector3(-23,0,-231),new THREE.Vector3(-38,0,-240)],false,'catmullrom',.35);
for(const r of routes){const pts=[];for(let i=0;i<=70;i++)pts.push(r.curve.getPoint(i/70));ribbon(pts,5,roadMat,.037)}
const leafMats=['#31543e','#42674b','#628255','#527b4b','#254637','#75905b'].map(c=>type(c));
const treeStem=type('#454637');const branchMat=type('#3e4938');
function tree(x,z,s=1){const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);
 cyl(.11*s,.25*s,4.1*s,treeStem,0,2.05*s,0,g);
 for(let j=0;j<4;j++){const ang=j*Math.PI*.6+rnd(-.3,.3),r=rnd(1.4,2.6)*s;rod([0,3.3*s,0],[Math.sin(ang)*r,4.1*s+rnd(0,1.1)*s,Math.cos(ang)*r],.085*s,branchMat,g)}
 for(let j=0;j<7;j++){const a=rnd(0,6.28),r=rnd(.4,2.7)*s;const foliage=sphere(rnd(1.2,2.0)*s,pick(leafMats),Math.cos(a)*r,rnd(4.2,5.8)*s,Math.sin(a)*r,g,1);foliage.scale.set(rnd(.7,1.3),rnd(.7,1.4),rnd(.7,1.3))}
 for(let i=0;i<10;i++){const a=rnd(0,6.28);const vine=rod([rnd(-1,1)*s,3.7*s,rnd(-1,1)*s],[Math.cos(a)*2*s,rnd(2,4)*s,Math.sin(a)*1.6*s],.022*s,pick(leafMats),g)}}
const windowDark=type('#18292b',.32,.2),windowLit=new THREE.MeshBasicMaterial({color:'#c8b891'}),frameMat=type('#353b35');
function building(x,z,depth=12,height=16,width=12){const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);const w=width,d=depth,h=height,wall=pick(wallMats),side=Math.sign(x);
 box(w,h,d,wall,0,h/2-.8,0,g);box(w+.6,.35,d+.5,concrete,0,h-.8,0,g);
 const frontX=side===1?-w/2-.035:w/2+.035;
 for(let y=3;y<h-2;y+=3.45){for(let zz=-d/2+1.6;zz<d/2-1;zz+=2.6){
  const lit=rng()<.09;const win=box(.10,1.58,1.55,lit?windowLit:windowDark,frontX+(side===1?-.07:.07),y,zz,g);
  box(.19,1.8,.10,frameMat,frontX+(side===1?-.1:.1),y,zz-.78,g);
  box(.19,1.8,.10,frameMat,frontX+(side===1?-.1:.1),y,zz+.78,g);
  box(.21,.10,1.68,frameMat,frontX+(side===1?-.1:.1),y+.82,zz,g);
  box(.21,.10,1.68,frameMat,frontX+(side===1?-.1:.1),y-.82,zz,g);
  if(rng()<.22)box(.17,1.78,1.7,wood,frontX+(side===1?-.15:.15),y,zz,g);
 }}
 const door=box(.15,2.9,2.2,dark,frontX+(side===1?-.13:.13),1.25,0,g);
 box(.3,.16,2.8,rust,frontX+(side===1?-.15:.15),2.8,0,g);
 for(let i=0;i<24;i++){const az=rnd(-d/2,d/2);const len=rnd(.65,4);const v=rod([rnd(-w/2,w/2),h-.7,az],[rnd(-w/2,w/2),h-.7-len,az+rnd(-.5,.5)],rnd(.012,.045),pick(leafMats),g)}
 for(let i=0;i<28;i++){const yy=rnd(1,h-1),zz=rnd(-d/2,d/2);const m=sphere(rnd(.08,.24),pick(leafMats),frontX+(side===1?-.2:.2),yy,zz,g,0);m.scale.set(.4,2.2,1)}
 if(rng()<.25){for(let y=2;y<h-3;y+=3.4){box(1,.1,3.8,steel,frontX+side*.85,y+.12,0,g);rod([frontX+side*1.4,y,1.5],[frontX+side*.25,y+2.8,-1.5],.035,steel,g)}}
 return g}
for(let i=0;i<37;i++){const z=12-i*9.1;for(const side of [-1,1]){if(rng()<.88)building(side*rnd(14,25),z,rnd(8,15),rnd(10,30),rnd(9,15));if(rng()<.5)tree(side*rnd(7,12),z+rnd(-3,3),rnd(.6,1.3))}}
for(let i=0;i<22;i++){const z=-35-i*14;const side=i%2?-1:1;box(rnd(5,9),rnd(17,51),rnd(5,11),pick(wallMats),side*rnd(38,83),rnd(10,26),z)}
// Distant overpass / bridge
function bridge(z){for(const x of [-39,-12,12,39]){box(3,13,4,concrete,x,6.5,z);box(4,1.1,6,concrete,x,13,z)}
box(100,2.3,11,pick(wallMats),0,14,z);for(let x=-48;x<=48;x+=5){box(1.8,.8,11,concrete,x,12.4,z);if(rng()<.6)rod([x,14.5,z+4],[x+rnd(-1,1),14.5-rnd(2,7),z+4+rnd(-.2,.2)],.04,pick(leafMats))}
for(let x=-48;x<48;x+=2.2){box(.09,1.3,.13,steel,x,16,z-4.8)}box(96,.1,.13,steel,0,16.7,z-4.8)}
bridge(-102);bridge(-272);
// Road debris, rocks and thick vegetation via instancing
const rockGeo=new THREE.DodecahedronGeometry(.16,0),rockMat=type('#66716b');
const rockCount=mobile?420:890,rocks=new THREE.InstancedMesh(rockGeo,rockMat,rockCount),dummy=new THREE.Object3D();
for(let i=0;i<rockCount;i++){const z=rnd(-313,20),x=mainX(z)+(rng()<.55?rnd(-3,3):pick([-1,1])*rnd(3,14));dummy.position.set(x,rnd(.01,.09),z);dummy.scale.set(rnd(.6,3),rnd(.3,.7),rnd(.6,2));dummy.rotation.set(rnd(-1,1),rnd(0,6),rnd(-1,1));dummy.updateMatrix();rocks.setMatrixAt(i,dummy.matrix)}
rocks.instanceMatrix.needsUpdate=true;scene.add(rocks);
const grassGeo=new THREE.ConeGeometry(.13,.8,4),grassMat=type('#48704a',1),grassCount=mobile?700:1400,grassInstances=new THREE.InstancedMesh(grassGeo,grassMat,grassCount);
for(let i=0;i<grassCount;i++){const z=rnd(-323,22),x=mainX(z)+pick([-1,1])*rnd(3.2,45);dummy.position.set(x,rnd(.14,.38),z);dummy.scale.set(rnd(.3,1.2),rnd(.45,1.8),rnd(.3,1.2));dummy.rotation.set(0,rnd(0,6.3),rnd(-.3,.3));dummy.updateMatrix();grassInstances.setMatrixAt(i,dummy.matrix)}grassInstances.instanceMatrix.needsUpdate=true;scene.add(grassInstances);
// Wet puddles sit above mud, including irregular reflective patches.
const puddleMat=new THREE.MeshPhysicalMaterial({color:'#526969',roughness:.16,metalness:.25,clearcoat:1,clearcoatRoughness:.10,transparent:true,opacity:.82,depthWrite:false,side:THREE.DoubleSide});
for(let i=0;i<65;i++){const z=rnd(-314,12),x=mainX(z)+rnd(-2.2,2.2),p=new THREE.Mesh(new THREE.CircleGeometry(rnd(.25,1.1),16),puddleMat);p.rotation.x=-Math.PI/2;p.scale.y=rnd(.28,.55);p.position.set(x,.115,z);scene.add(p)}
function car(x,z,angle=0){const g=new THREE.Group();g.position.set(x,.15,z);g.rotation.y=angle;scene.add(g);const paint=pick([type('#596965'),type('#6f6055'),type('#657982'),type('#77795f')]);
box(2.5,.66,5.2,paint,0,.83,0,g);box(2.13,.98,2.6,paint,0,1.53,-.35,g);box(2.08,.65,1.45,glass,0,1.65,.82,g);box(2.08,.65,.12,glass,0,1.65,-1.48,g);
for(const x1 of [-1.2,1.2])for(const z1 of [-1.67,1.67]){const wheel=cyl(.5,.5,.24,rubber,x1,.47,z1,g);wheel.rotation.z=Math.PI/2;const hub=cyl(.21,.21,.26,steel,x1+(x1<0?-.1:.1),.47,z1,g);hub.rotation.z=Math.PI/2}
for(let j=0;j<16;j++)box(rnd(.15,.65),.009,rnd(.15,.8),pick([rust,moss]),rnd(-1.15,1.15),1.174,rnd(-2.45,2.45),g);
box(2.5,.1,.11,steel,0,.55,2.62,g);box(2.5,.1,.11,steel,0,.55,-2.62,g);return g}
car(-7.7,-37,.17);car(10,-83,-.34);car(-8.5,-155,.23);car(8.3,-190,-.45);car(-10.5,-254,.33);
// Derelict roadside service area, with a rusted canopy.
function serviceStation(x,z){box(19,.65,11,rust,x,8,z);for(const xx of [-7.5,7.5])for(const zz of [-4.5,4.5])cyl(.18,.25,7.8,steel,x+xx,4, z+zz);
box(4,2.2,2.1,wallMats[1],x-3,1.25,z);box(1.1,1.7,.7,steel,x-5,1,z+1.8);box(.7,.45,.08,dark,x-5,.99,z+2.2);
box(1.1,1.7,.7,steel,x+4,1,z+1.4);box(.7,.45,.08,dark,x+4,1,z+1.8);car(x+2,z-1,.6);
for(let i=0;i<20;i++)rod([x+rnd(-9,9),8,z+rnd(-5,5)],[x+rnd(-9,9),8-rnd(.7,3.5),z+rnd(-5,5)],.03,pick(leafMats));
}serviceStation(23,-51);serviceStation(-46,-241);
// Light cones, fog boards, power lines and street clutter
const pale=type('#73807c');for(let i=0;i<18;i++){const z=6-i*18,side=i%2?-1:1;rod([side*8,0,z],[side*8,9.4,z],.07,steel);rod([side*8,9.25,z],[side*4.1,9.25,z],.06,steel);
const bulb=new THREE.Mesh(new THREE.SphereGeometry(.16,8,6),new THREE.MeshBasicMaterial({color:'#ead8a6'}));bulb.position.set(side*4.1,8.95,z);scene.add(bulb)}
// Three custom concept artworks for sample projects. These are canvas textures on REAL 3D surfaces.
const projects=[
{id:0,title:'UP T20 — MATCHDAY',category:'01 / SPORTS CAMPAIGN',kind:'poster',subtitle:'Visual storytelling & art direction',desc:'Sample creative: a bold matchday poster exploring sport, typography, momentum and visual storytelling.',tone:'#f27e34'},
{id:1,title:'UPCA — DIGITAL EXPERIENCE',category:'02 / UX & PRODUCT DESIGN',kind:'website',subtitle:'A new digital matchday',desc:'Sample interface: a redesigned sports association home, with match-centre, editorial content and gallery modules.',tone:'#2c6d83'},
{id:2,title:'DESYNK — THE CREATIVE WORLD',category:'03 / BRAND & DIGITAL',kind:'brand',subtitle:'Less searching. More creating.',desc:'Sample brand concept: a flexible creative-platform identity shown across the abandoned city.',tone:'#7465ed'}
];
function artCanvas(project){const cv=document.createElement('canvas');cv.width=1100;cv.height=730;const g=cv.getContext('2d');g.fillStyle=project.kind==='poster'?'#1b241f':project.kind==='website'?'#edf3ef':'#181b21';g.fillRect(0,0,1100,730);
if(project.kind==='poster'){const grad=g.createLinearGradient(0,0,1100,730);grad.addColorStop(0,'#111b1d');grad.addColorStop(1,'#ae431e');g.fillStyle=grad;g.fillRect(0,0,1100,730);
for(let i=0;i<16;i++){g.save();g.translate(rnd(-150,1100),rnd(0,730));g.rotate(-.3);g.fillStyle=i%2?'#f7982730':'#fff7dc12';g.fillRect(0,0,rnd(10,160),1000);g.restore()}
g.strokeStyle='#f4a047';g.lineWidth=14;g.beginPath();g.arc(800,440,310,-Math.PI*.8,Math.PI*.6);g.stroke();
g.fillStyle='#fbf7e8';g.font='bold 26px Arial';g.fillText('RISHI STUDIO   /   CREATIVE CAMPAIGN',56,62);g.font='bold 148px Arial Black,Arial';g.fillText('MATCH',42,270);g.fillText('DAY.',42,414);g.fillStyle='#f6ab53';g.font='bold 40px Arial';g.fillText('THE GAME IS ON',53,507);g.fillStyle='#faf3d5';g.fillRect(55,549,410,4);g.font='bold 22px Arial';g.fillText('UP T20  /  CONCEPT 01',55,606);
}else if(project.kind==='website'){g.fillStyle='#183f50';g.fillRect(0,0,1100,92);g.fillStyle='#fff';g.font='bold 34px Arial';g.fillText('UPCA',47,57);g.font='18px Arial';g.fillText('HOME     MATCHES     PLAYERS     NEWS     MEDIA',370,58);
let grad=g.createLinearGradient(0,92,950,600);grad.addColorStop(0,'#214663');grad.addColorStop(1,'#74b7ba');g.fillStyle=grad;g.fillRect(25,117,1050,390);g.fillStyle='#fafafa';g.font='bold 21px Arial';g.fillText('THE PRIDE OF UTTAR PRADESH',70,200);g.font='bold 81px Georgia';g.fillText('Beyond',65,305);g.fillText('The Boundary',65,394);g.fillStyle='#ffc366';g.fillRect(65,427,180,7);g.fillStyle='#f7faf8';g.fillRect(25,530,330,174);g.fillRect(383,530,330,174);g.fillRect(741,530,333,174);g.fillStyle='#193b4a';g.font='bold 28px Arial';['MATCH CENTRE','LATEST NEWS','STAR PLAYERS'].forEach((x,i)=>g.fillText(x,47+358*i,610));g.font='18px Arial';['Live updates','Stories that matter','The people behind the game'].forEach((x,i)=>g.fillText(x,47+358*i,654));
}else{let grad=g.createRadialGradient(600,260,80,600,300,740);grad.addColorStop(0,'#4d496c');grad.addColorStop(1,'#171b22');g.fillStyle=grad;g.fillRect(0,0,1100,730);
for(let i=0;i<11;i++){g.strokeStyle=i%2?'#d9cfef26':'#ad9bff22';g.lineWidth=2;g.beginPath();g.arc(510,365,80+i*34,0,Math.PI*2);g.stroke()}
g.fillStyle='#d1c9ff';g.font='bold 28px Arial';g.fillText('A CREATIVE HOME FOR EVERY DESIGNER',55,77);g.fillStyle='#f7f1ff';g.font='bold 139px Arial Black,Arial';g.fillText('DESYNK',42,407);g.font='31px Arial';g.fillText('A LITTLE LESS SEARCHING.',53,510);g.fillText('A LOT MORE CREATING.',53,560);g.fillStyle='#bcaaff';g.fillRect(53,605,410,8);}
return cv}
for(const p of projects){p.canvas=artCanvas(p);p.texture=new THREE.CanvasTexture(p.canvas);p.texture.colorSpace=THREE.SRGBColorSpace;p.texture.anisotropy=8}
const targets=[];
function projectPanel(p,x,y,z,width=6.2,height=4.15){const g=new THREE.Group();g.position.set(x,y,z);scene.add(g);box(width+.25,height+.25,.25,steel,0,0,-.12,g);const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshBasicMaterial({map:p.texture,side:THREE.DoubleSide,toneMapped:false}));mesh.position.z=.09;mesh.userData.project=p;g.add(mesh);targets.push(mesh);box(width+.6,.12,.4,steel,0,-height/2-.1,0,g);return g}
building(-44,-79,13,20,13);projectPanel(projects[0],-37.3,5,-77.4,6,4.0);
function studio(){const x=40,z=-174;box(20,.25,21,wallMats[2],x,.05,z+3);box(.55,12,21,wallMats[1],x-10,5.8,z+3);box(.55,12,21,wallMats[1],x+10,5.8,z+3);box(20,12,.6,wallMats[2],x,5.8,z-7.5);box(20,.5,21,concrete,x,12,z+3);
for(let j=0;j<9;j++)rod([x+rnd(-9,9),11.8,z+rnd(-7,8)],[x+rnd(-9,9),rnd(4,9),z+rnd(-7,8)],.035,pick(leafMats));
for(let i=0;i<3;i++){box(6,.3,2.7,wood,x+(i-1)*6,2.1,z+2);box(.16,2,3,steel,x+(i-1)*6-2.7,1,z+2);box(.16,2,3,steel,x+(i-1)*6+2.7,1,z+2)}
projectPanel(projects[1],x,5.15,z-3.1,6.5,4.3);
for(let i=0;i<6;i++){const win=box(.1,2,2.0,windowDark,x-9.65,7,z-4+i*2);box(.2,2.3,.2,steel,x-9.6,7,z-4+i*2);tree(x+rnd(-12,12),z+rnd(-8,7),rnd(.3,.65))}
const light=new THREE.PointLight('#78bbaa',35,23,2);light.position.set(x,7,z-2);scene.add(light)}
studio();
projectPanel(projects[2],-45,5.4,-241,7.2,4.75);
// Small signposts at each junction, 3D and readable from the road.
function sign(text,x,z){const c=document.createElement('canvas');c.width=600;c.height=155;let g=c.getContext('2d');g.fillStyle='#4d5b50';g.fillRect(0,0,600,155);g.strokeStyle='#c9c5a1';g.lineWidth=8;g.strokeRect(8,8,584,139);g.fillStyle='#ede9c9';g.font='bold 50px Arial';g.textAlign='center';g.fillText(text,300,95);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const o=new THREE.Mesh(new THREE.PlaneGeometry(6.1,1.57),new THREE.MeshBasicMaterial({map:t,side:THREE.DoubleSide}));o.position.set(x,4.9,z);scene.add(o);rod([x,0,z],[x,4.2,z],.12,steel)}
sign('← POSTERS',-7,-52);sign('WEB / UI →',7,-136);sign('← BRANDING',-7,-218);
// Cyclist in the third-person camera; real meshes, articulated wheels and rider.
const rider=new THREE.Group();scene.add(rider);
const bikeMetal=type('#b0b9a8',.54,.55),shirt=type('#bc9b66'),skin=type('#9d765a'),pants=type('#353f43');
const wheels=[];for(const z of [-.89,.89]){const wh=new THREE.Mesh(new THREE.TorusGeometry(.65,.075,7,28),rubber);wh.position.set(0,.72,z);wh.rotation.y=Math.PI/2;rider.add(wh);wheels.push(wh);for(let i=0;i<8;i++){const angle=i*Math.PI/4;rod([0,.72,z],[0,.72+Math.cos(angle)*.55,z+Math.sin(angle)*.55],.01,bikeMetal,rider)}}
rod([0,.72,-.87],[0,1.45,0],.055,bikeMetal,rider);rod([0,1.45,0],[0,.72,.89],.055,bikeMetal,rider);rod([0,.72,.89],[0,.72,-.87],.052,bikeMetal,rider);rod([0,1.45,0],[0,1.68,-.36],.05,bikeMetal,rider);
rod([-.38,1.7,-.38],[.38,1.7,-.38],.047,bikeMetal,rider);box(.42,.08,.25,skin,0,1.48,.18,rider);
rod([0,1.48,.1],[0,2.32,-.22],.2,shirt,rider);sphere(.27,skin,0,2.73,-.29,rider,2);sphere(.3,dark,0,2.87,-.32,rider,1);
rod([0,2.23,-.16],[.36,1.72,-.41],.085,skin,rider);rod([0,2.23,-.16],[-.36,1.72,-.41],.085,skin,rider);rod([0,1.53,.14],[.18,.99,.30],.095,pants,rider);rod([0,1.53,.14],[-.17,1.01,-.12],.095,pants,rider);
// UI
const extraCSS=document.createElement('style');extraCSS.textContent='#projectGuide{position:absolute;right:4vw;top:88px;z-index:5;text-align:right;max-width:270px}#projectGuide button{display:block;margin:7px 0 7px auto;border:1px solid #d2e5d54d;background:#17261cc9;color:#f8f4e5;padding:9px 12px;border-radius:100px;font-size:10px;letter-spacing:.075em;backdrop-filter:blur(12px)}#projectGuide button:hover{background:#405446d9}#projectGuide .smalltitle{font-size:9px;letter-spacing:.18em;color:#e2e5d2;margin-bottom:12px;text-transform:uppercase}.preview{background:#182923;display:flex;align-items:center;justify-content:center}.preview img{object-fit:contain;width:100%;height:100%;border-radius:6px}.shade{background:linear-gradient(180deg,#0b1b1a88,transparent 28%,transparent 62%,#08130da3)}.grain{opacity:.08}@media(max-width:700px){#projectGuide{top:79px;right:14px}#projectGuide button{font-size:9px;padding:8px 9px}#projectGuide .smalltitle{display:none}#projectGuide button:nth-child(3){display:none}}';
document.head.appendChild(extraCSS);
const projectGuide=document.createElement('div');projectGuide.id='projectGuide';projectGuide.innerHTML='<div class="smalltitle">CHOOSE YOUR OWN ROUTE / 3 SAMPLE PROJECTS</div>'+routes.map((r,i)=>'<button data-route="'+i+'">'+String(i+1).padStart(2,'0')+' &nbsp; '+(i===0?'POSTERS':i===1?'WEBSITES':'BRANDING')+' ↗</button>').join('');document.body.appendChild(projectGuide);
let started=false,mode='main',position=0,target=0,checkpoint=0,branchProgress=0,branchTarget=0,activeRoute=null,pending=null,modalOpen=false,lastInput=performance.now(),lastWheel=0,look=0,lookTarget=0,warning=false,passed=new Set();
const notice=message=>{$('notice').textContent=message;$('notice').style.display='block';clearTimeout(notice.timer);notice.timer=setTimeout(()=>$('notice').style.display='none',3400)};
function openProject(p){modalOpen=true;lastInput=performance.now();$('previewTitle').textContent=p.title;$('previewCategory').textContent=p.category+' / SAMPLE';$('previewDescription').textContent=p.desc;$('previewVisual').innerHTML='';const img=new Image();img.src=p.canvas.toDataURL('image/png');img.alt=p.title+' sample artwork';$('previewVisual').appendChild(img);$('modal').style.display='block'}
function closeProject(){modalOpen=false;$('modal').style.display='none';lastInput=performance.now()}
function showTurn(r){pending=r;target=position;$('choiceLabel').textContent=r.label;$('choiceTitle').textContent=r.title;$('choiceDesc').textContent=r.desc;$('choice').style.display='block';$('chapter').textContent=r.label;$('heading').textContent='A new road appears.'}
function hideTurn(){pending=null;$('choice').style.display='none'}
function enter(r){if(!r)return;hideTurn();activeRoute=r;checkpoint=r.at;mode='branch';branchProgress=0;branchTarget=0;lastInput=performance.now();warning=false;$('chapter').textContent=r.label;$('heading').textContent=r.title+'.';$('hint').innerHTML='Scroll to enter the scene. Click the artwork to inspect it.<br/>Return to the road anytime.';notice('Take the detour. Explore the '+(r.id==='website'?'screen.':'artwork.'))}
function goMain(){hideTurn();closeProject();if(mode!=='main'){mode='main';position=checkpoint;target=checkpoint;branchProgress=0;branchTarget=0;activeRoute=null;lastInput=performance.now();$('chapter').textContent='THE MAIN PATH';$('heading').textContent='The road continues.';$('hint').innerHTML='Scroll to discover more.<br/>There is always another story ahead.';notice('Back at your saved checkpoint')}}
function restart(){hideTurn();closeProject();mode='main';position=0;target=0;checkpoint=0;branchProgress=0;branchTarget=0;activeRoute=null;passed.clear();warning=false;lastInput=performance.now();$('heading').textContent='A little further.';$('chapter').textContent='01 / THE BEGINNING';$('hint').innerHTML='Scroll to pedal through a city time forgot.<br/>Drag to look around. Choose the roads less travelled.';notice('A new journey begins')}
function advance(amount){if(!started||modalOpen)return;lastInput=performance.now();warning=false;if(mode==='main'){target=clamp(target+amount,0,298);if(pending){if(amount>0)passed.add(pending.at);hideTurn()}}else{branchTarget=clamp(branchTarget+amount/65,0,1)}}
$('begin').onclick=()=>{started=true;$('welcome').style.display='none';notice('Scroll to pedal. The city is yours to explore.')};
$('mainBtn').onclick=goMain;$('resetBtn').onclick=restart;$('enter').onclick=()=>{if(pending)enter(pending)};$('skip').onclick=()=>{if(pending)passed.add(pending.at);hideTurn();target+=5};
$('pedal').onclick=()=>advance(3.8);$('mobileForward').onclick=()=>advance(5);$('mobileBack').onclick=()=>advance(-4);
$('close').onclick=closeProject;$('previewBack').onclick=closeProject;$('previewMain').onclick=goMain;
projectGuide.querySelectorAll('button').forEach(b=>b.onclick=()=>{const r=routes[Number(b.dataset.route)];if(!started){started=true;$('welcome').style.display='none'};closeProject();target=r.at;position=r.at;passed.add(r.at);enter(r)});
addEventListener('wheel',e=>{if(!started||modalOpen)return;e.preventDefault();const d=Math.sign(e.deltaY)*clamp(Math.abs(e.deltaY)*.038,.6,5.7);advance(d)},{passive:false});
let down=null,dragging=false;
renderer.domElement.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY};dragging=false});
renderer.domElement.addEventListener('pointermove',e=>{if(!down)return;const dx=e.clientX-down.x,dy=e.clientY-down.y;if(Math.abs(dx)+Math.abs(dy)>7)dragging=true;if(dragging){lookTarget=clamp(lookTarget-dx*.003,-.64,.64);down.x=e.clientX;down.y=e.clientY}});
renderer.domElement.addEventListener('pointerup',e=>{if(!down)return;const moved=dragging;const dy=e.clientY-down.y;down=null;dragging=false;if(!started)return;if(moved){if(mobile&&Math.abs(dy)>20)advance(-dy*.065);return}if(mode==='branch'){const ndc=new THREE.Vector2(2*e.clientX/innerWidth-1,1-2*e.clientY/innerHeight);const ray=new THREE.Raycaster();ray.setFromCamera(ndc,camera);const hits=ray.intersectObjects(targets,false);if(hits.length&&hits[0].distance<42)openProject(hits[0].object.userData.project)}});
addEventListener('keydown',e=>{if(e.key==='Escape'){if(modalOpen)closeProject();else goMain()}if(['ArrowUp','ArrowDown','w','s'].includes(e.key)){e.preventDefault();advance(['ArrowUp','w'].includes(e.key)?4:-4)}}); 
let last=0,autoPreviewed=false;
function loop(ms){const dt=Math.min(.06,(ms-last)/1000||.016);last=ms;look+=(lookTarget-look)*Math.min(1,dt*3);let focus=new THREE.Vector3(),cp=new THREE.Vector3();
if(mode==='main'){position+=(target-position)*Math.min(1,dt*2.6);const p=pathPoint(position),next=pathPoint(position+10);
rider.position.set(p.x,.11,p.z-3.9);const lookForward=Math.atan2(next.x-p.x,-(next.z-p.z));rider.rotation.y=lookForward;cp.set(p.x+1.2,4.3,p.z+5.5);focus.set(next.x+look*4,2,next.z-4);
if(started&&!pending){for(const r of routes){if(!passed.has(r.at)&&position>r.at-1&&position<r.at+3&&Math.abs(position-target)<2){target=r.at;position=r.at;showTurn(r);break}}}
$('progress').style.width=String(Math.min(100,position/298*100))+'%';
if(position>287){$('heading').textContent='Thanks for taking the long way.';$('chapter').textContent='THE END / OR THE BEGINNING';$('hint').textContent='Restart to discover another forgotten story.'}
}else if(activeRoute){branchProgress+=(branchTarget-branchProgress)*Math.min(1,dt*2.4);const r=activeRoute,t=r.curve.getPoint(clamp(branchProgress,0,1)),next=r.curve.getPoint(clamp(branchProgress+.09,0,1));const tangent=r.curve.getTangent(clamp(branchProgress+.04,0,1));rider.position.set(t.x,.12,t.z);rider.rotation.y=Math.atan2(-tangent.x,-tangent.z);
cp.copy(t).add(new THREE.Vector3(-tangent.x*5,4.4,-tangent.z*7));focus.copy(next).add(new THREE.Vector3(look*3,2,-tangent.z*2));
$('progress').style.width=String(branchProgress*100)+'%';
if(branchProgress>.78&&!autoPreviewed&&r.id==='website'){autoPreviewed=true;openProject(projects[1])}
const idle=(performance.now()-lastInput)/1000;if(!modalOpen&&idle>20&&!warning){warning=true;notice('Still here? You return to the main path in 10 seconds.')}if(!modalOpen&&idle>30)goMain();
}
camera.position.lerp(cp,Math.min(1,dt*(reduce?8:3.2)));const lookAt=focus;camera.lookAt(lookAt);
if(started)for(const wh of wheels)wh.rotation.x-=dt*3.1;
renderer.render(scene,camera)}
// Starting view.
camera.position.set(1.2,4.3,16);camera.lookAt(0,2,-13);rider.position.set(0,0,6);renderer.setAnimationLoop(loop);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.fov=innerWidth<720?68:61;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<720?1.15:1.65))});
