import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Fernwood is a small, self-contained open world. The models below are real
// Polyfork low-poly GLBs, used under CC BY 4.0 with individual credits in-game.
const MODEL_DEFS = {
  backpacker: ['backpacker-f56207', 'Backpacker'],
  pine: ['campground-pine-stand-0bf4f2', 'Campground Pine Stand'],
  swingTree: ['lakeside-swing-tree-02c084', 'Lakeside Swing Tree'],
  aFrame: ['a-frame-cabin-6cb550', 'A-Frame Cabin'],
  cabin: ['porch-log-cabin-d2f3ef', 'Porch Log Cabin'],
  rangerStation: ['hip-roof-ranger-station-581dd5', 'Hip-Roof Ranger Station'],
  camper: ['pop-top-camper-van-62a322', 'Pop-Top Camper Van'],
  ridgeTent: ['canvas-ridge-tent-f0df0d', 'Canvas Ridge Tent'],
  campfire: ['stone-ring-campfire-8a0c6f', 'Stone-Ring Campfire'],
  dock: ['lake-dock-run-f5380e', 'Lake Dock Run'],
  canoe: ['camp-canoe-c65d2a', 'Camp Canoe'],
  trailSign: ['trailhead-sign-aa29e1', 'Trailhead Sign'],
  table: ['heavy-timber-picnic-table-1ac060', 'Heavy Timber Picnic Table'],
  notice: ['camp-notice-board-c0be42', 'Camp Notice Board'],
  ranger: ['park-ranger-c1697e', 'Park Ranger'],
  kid: ['kid-with-a-flashlight-1a9e4c', 'Kid with a Flashlight'],
  fence: ['campground-rail-fence-run-524013', 'Campground Rail Fence Run'],
  lily: ['lily-pads-b0c5d0', 'Lily Pads'],
  reeds: ['reed-bed-bbbefb', 'Reed Bed'],
  lantern: ['camping-lantern-21d14b', 'Camping Lantern'],
  bench: ['split-log-bench-289780', 'Split-Log Bench'],
  angler: ['lake-angler-1c4740', 'Lake Angler'],
  lookout: ['splay-leg-lookout-tower-6fae7e', 'Splay-Leg Lookout Tower'],
  pebbles: ['lake-pebbles-6c0359', 'Lake Pebbles'],
  hammock: ['hammock-on-posts-7d5c47', 'Hammock on Posts'],
  domeTent: ['dome-tent-9ee59d', 'Dome Tent']
};

const PLACES = [
  {id:'camp', name:'Pine Camp', x:6, z:6, radius:12, note:'Where every good wandering begins.', short:'The starting point'},
  {id:'dock', name:'Bluewater Dock', x:0, z:-10, radius:7, note:'A quiet place to watch the water.', short:'At the lake’s edge'},
  {id:'cabin', name:'Old Pine Cabin', x:28, z:19, radius:8, note:'The oldest little home in Fernwood.', short:'Beyond the meadow'},
  {id:'swing', name:'The Swing Tree', x:-30, z:1, radius:9, note:'Some things are worth a detour.', short:'West of the lake'},
  {id:'grove', name:'Whispering Pines', x:13, z:-21, radius:9, note:'The forest sounds different here.', short:'Deep in the woods'},
  {id:'lookout', name:'The Lookout', x:30, z:-28, radius:9, note:'The whole world looks small from up here.', short:'High above the trail'}
];

const CHARMS = [
  {name:'The First Light', x:0, z:4, place:'Pine Camp'},
  {name:'The Water Glimmer', x:-1, z:-8, place:'Bluewater Dock'},
  {name:'The Hearth Star', x:25, z:17, place:'Old Pine Cabin'},
  {name:'The Pine Whisper', x:13, z:-23, place:'Whispering Pines'},
  {name:'The Faraway Spark', x:-30, z:2, place:'The Swing Tree'}
];

const PATHS = [
  [[5,19],[5,13],[6,8],[5,4],[3,0],[1,-5],[0,-9]],
  [[6,8],[11,10],[17,14],[23,18],[28,19]],
  [[5,4],[10,-3],[14,-10],[13,-18],[18,-24],[29,-28]],
  [[5,13],[-4,15],[-13,13],[-22,10],[-28,4],[-30,1]],
  [[0,-9],[1,-15],[6,-18],[13,-21]]
];

const TIMES = [
  {label:'Sunlit morning', sky:'#d7eade', fog:'#c6dfd1', sun:'#fff3d8', sunPower:2.45, hemi:1.65, exposure:1.24, water:'#76afa9', fire:0.6},
  {label:'Golden hour', sky:'#f3dec3', fog:'#e8d1b2', sun:'#ffd39a', sunPower:2.7, hemi:1.38, exposure:1.29, water:'#9cae9d', fire:1.2},
  {label:'After dusk', sky:'#405d68', fog:'#465e65', sun:'#a5c4d3', sunPower:0.72, hemi:1.08, exposure:1.29, water:'#537f88', fire:3.6}
];
const SEASONS = [
  {label:'SUMMER', ground:'#729b67', outer:'#8fac83', path:'#c8b58b', grass:'#688c59', dot:'#79a86e'},
  {label:'AUTUMN', ground:'#aa955e', outer:'#b2a576', path:'#cfb88f', grass:'#a88e5c', dot:'#d3a75a'},
  {label:'WINTER', ground:'#c9d8ce', outer:'#ceddd5', path:'#d9d8cc', grass:'#bacbbd', dot:'#abc7c7'}
];

const $ = (sel) => document.querySelector(sel);
const dom = {
  app:$('#app'), scene:$('#scene'), loading:$('#loading'), loadingProgress:$('#loading-progress'), loadingCaption:$('#loading-caption'),
  timeButton:$('#time-button'), timeLabel:$('#time-label'), timeIcon:$('#time-icon use'), seasonButton:$('#season-button'), seasonLabel:$('#season-label'),
  soundButton:$('#sound-button'), helpButton:$('#help-button'), mapButton:$('#map-button'), journalButton:$('#journal-button'), questJournal:$('#quest-journal'),
  photoButton:$('#photo-button'), creditsShortcut:$('#credits-shortcut'), mapWidgetFoot:$('#map-widget-foot'), minimapButton:$('#minimap-button'),
  minimap:$('#minimap'), currentPlace:$('#current-place'), mapPlace:$('#map-place'), compassLetter:$('#compass-letter'),
  progressCount:$('#progress-count'), charmSlots:[...document.querySelectorAll('.charm-slot')], interactPrompt:$('#interact-prompt'), interactText:$('#interact-text'), mobileInteract:$('#mobile-interact'),
  questCard:$('#quest-card'), questToggle:$('#quest-toggle'), questMiniCount:$('#quest-mini-count'),
  touchLayer:$('#touch-layer'), stickBase:$('#stick-base'), stickKnob:$('#stick-knob'), stickRest:$('#stick-rest'), touchHint:$('#touch-hint'),
  mobilePhoto:$('#mobile-photo'), photoHint:$('#photo-hint'),
  miniTime:$('#mini-time'), miniTimeIcon:$('#mini-time-icon use'), miniSeason:$('#mini-season'), miniSeasonSwatch:$('#mini-season-swatch'),
  discoveryToast:$('#discovery-toast'), discoveryName:$('#discovery-name'), smallToast:$('#small-toast'), worldTag:$('#world-tag'), worldTagText:$('#world-tag-text'),
  dialogue:$('#dialogue'), dialogueName:$('#dialogue-name'), dialogueText:$('#dialogue-text'), dialogueClose:$('#dialogue-close'),
  overlay:$('#overlay'), overlayScrim:$('#overlay-scrim'), overlayClose:$('#overlay-close'), guideContent:$('#guide-content'), guideTabs:[...document.querySelectorAll('.guide-tab')]
};

const saved = (() => {try{return JSON.parse(localStorage.getItem('fernwood-save-v1') || '{}')}catch{return {}}})();
const state = {
  x:4, z:14, facing:Math.PI, keys:new Set(), touch:new Set(), stick:{x:0,y:0,active:false,run:false},
  yaw:0.39, pitch:0.59, distance:17, dragging:false, dragX:0, dragY:0,
  timeIndex:0, seasonIndex:0, soundOn:false, paused:false, photo:false, currentTab:'map',
  found:new Set(Array.isArray(saved.found) ? saved.found.filter(i=>Number.isInteger(i) && i>=0 && i<5) : []),
  discovered:new Set(['camp', ...(Array.isArray(saved.discovered) ? saved.discovered : [])]),
  waypoint:null, near:null, currentPlace:'Pine Camp', elapsed:0, mixerTime:0, lastMapDraw:0,
  currentAnimation:'Idle', dialogueOpen:false
};

const LAKE = {x:-16,z:-12,rx:17,rz:12};
let scene, camera, renderer, hemiLight, sunLight, campLight, cabinLight, waterMesh, waterMaterial, groundMaterial, outerMaterial;
let groundGeometry, groundNoise=[], grassInstances, flowerInstances, snowInstances, autumnLeaves, starField, clouds=[];
let playerRoot, playerMixer, playerActions={}, campfireMixer, npcMixers=[], charmObjects=[], worldModels={}, modelTemplates={};
let lastFrame=performance.now(), discoveryTimer=0, smallToastTimer=0, audioCtx, audioGain, birdTimer;
let guideMapCanvas=null;
const colliders=[];
const pinePlacements=[];
const tmpObject=new THREE.Object3D();
const tmpVec=new THREE.Vector3();
const clock=new THREE.Clock();
const rand=mulberry32(14873);

function mulberry32(a){return function(){let t=a+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296}}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
const touchUI=()=>window.matchMedia('(hover:none) and (pointer:coarse)').matches||window.innerWidth<=760;
function resetTouchInput(){
  state.keys.clear();state.touch.clear();state.dragging=false;
  state.stick.x=0;state.stick.y=0;state.stick.active=false;state.stick.run=false;
  if(dom.stickBase){dom.stickBase.hidden=true;dom.stickBase.classList.remove('is-running')}
  if(dom.stickRest)dom.stickRest.style.opacity='1';
}
function smoothstep(a,b,x){const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)}
function dist2(a,b,x,z){return Math.hypot(a-x,b-z)}
function lakeRadius(x,z){const dx=(x-LAKE.x)/LAKE.rx, dz=(z-LAKE.z)/LAKE.rz, ang=Math.atan2(dz,dx);return Math.hypot(dx,dz)/(1+.045*Math.sin(5*ang+.6)+.027*Math.cos(8*ang))}
function heightAt(x,z){let h=.14*Math.sin(x*.115+z*.045)+.105*Math.sin(z*.23-x*.08)+.055*Math.sin(x*.42)*Math.cos(z*.27);const r=lakeRadius(x,z);h-=.76*(1-smoothstep(.77,1.14,r));return h}
function saveGame(){try{localStorage.setItem('fernwood-save-v1',JSON.stringify({found:[...state.found],discovered:[...state.discovered]}))}catch{}}

function setupScene(){
  scene=new THREE.Scene();scene.background=new THREE.Color(TIMES[0].sky);scene.fog=new THREE.FogExp2(TIMES[0].fog,.011);
  camera=new THREE.PerspectiveCamera(52,window.innerWidth/window.innerHeight,.1,280);
  renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:'high-performance'});
  renderer.setSize(window.innerWidth,window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,touchUI()?1.3:1.35));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=TIMES[0].exposure;
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate=false;
  renderer.shadowMap.needsUpdate=true;
  dom.scene.appendChild(renderer.domElement);
  hemiLight=new THREE.HemisphereLight(0xf8fcf0,0x82976f,TIMES[0].hemi);scene.add(hemiLight);
  sunLight=new THREE.DirectionalLight(TIMES[0].sun,TIMES[0].sunPower);sunLight.position.set(-28,49,24);sunLight.castShadow=true;
  sunLight.shadow.mapSize.set(1024,1024);sunLight.shadow.camera.left=-56;sunLight.shadow.camera.right=56;sunLight.shadow.camera.top=56;sunLight.shadow.camera.bottom=-56;
  sunLight.shadow.camera.near=1;sunLight.shadow.camera.far=135;sunLight.shadow.bias=-.00012;sunLight.shadow.normalBias=.025;
  sunLight.target.position.set(0,0,0);scene.add(sunLight,sunLight.target);
  campLight=new THREE.PointLight(0xffaa50,.6,14,2);campLight.position.set(5,1.6,5);scene.add(campLight);
  cabinLight=new THREE.PointLight(0xffc275,.3,13,2);cabinLight.position.set(27,2.8,19);scene.add(cabinLight);
  camera.position.set(12,12,27);camera.lookAt(4,0,8);
}

function makeGround(){
  const geo=new THREE.PlaneGeometry(180,180,105,105);geo.rotateX(-Math.PI/2);
  const pos=geo.attributes.position, colors=new Float32Array(pos.count*3);
  for(let i=0;i<pos.count;i++){
    const x=pos.getX(i),z=pos.getZ(i);pos.setY(i,heightAt(x,z));
    const n=.5+.25*Math.sin(x*.18+z*.13)+.15*Math.sin(z*.41-x*.23)+.10*Math.cos(x*.68+z*.29);
    groundNoise.push(n);
    const c=new THREE.Color();c.setHSL(.278+(.5-n)*.02,.31,.54+(n-.5)*.055);
    colors[i*3]=c.r;colors[i*3+1]=c.g;colors[i*3+2]=c.b;
  }
  geo.setAttribute('color',new THREE.BufferAttribute(colors,3));geo.computeVertexNormals();groundGeometry=geo;
  groundMaterial=new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide});
  const ground=new THREE.Mesh(geo,groundMaterial);ground.receiveShadow=true;scene.add(ground);
  outerMaterial=new THREE.MeshLambertMaterial({color:SEASONS[0].outer});
  const outer=new THREE.Mesh(new THREE.PlaneGeometry(1500,1500),outerMaterial);outer.rotation.x=-Math.PI/2;outer.position.y=-1.8;outer.receiveShadow=true;scene.add(outer);
  // Gentle far-away hills soften the edge of the walkable world.
  const hillMat=new THREE.MeshLambertMaterial({color:0x829f80,flatShading:true});
  const hills=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,1),hillMat,19);
  for(let i=0;i<19;i++){
    const a=(i/19)*Math.PI*2,rad=73+rand()*30;
    tmpObject.position.set(Math.cos(a)*rad,-5.5,Math.sin(a)*rad);
    tmpObject.rotation.set(0,rand()*6,0);tmpObject.scale.set(10+rand()*15,7+rand()*7,7+rand()*12);
    tmpObject.updateMatrix();hills.setMatrixAt(i,tmpObject.matrix);
  }
  hills.instanceMatrix.needsUpdate=true;hills.frustumCulled=false;scene.add(hills);
}

function makeLake(){
  // The uneven shoreline is generated as geometry, not an image.
  const segments=100;
  const waterVerts=[LAKE.x,-.145,LAKE.z],waterIndices=[];
  for(let i=0;i<=segments;i++){
    const a=i/segments*Math.PI*2, r=1.085,shape=1+.045*Math.sin(5*a+.6)+.027*Math.cos(8*a);
    waterVerts.push(LAKE.x+Math.cos(a)*LAKE.rx*r*shape,-.145,LAKE.z+Math.sin(a)*LAKE.rz*r*shape);
    if(i>0)waterIndices.push(0,i,i+1);
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(waterVerts,3));geo.setIndex(waterIndices);geo.computeVertexNormals();
  waterMaterial=new THREE.MeshBasicMaterial({color:TIMES[0].water,transparent:true,opacity:.97,side:THREE.DoubleSide,depthWrite:true});
  waterMesh=new THREE.Mesh(geo,waterMaterial);waterMesh.receiveShadow=true;scene.add(waterMesh);
  // A thin sandy margin follows the contours of the lake.
  const ringVerts=[],ringIndices=[];
  for(let i=0;i<=segments;i++){
    const a=i/segments*Math.PI*2,shape=1+.045*Math.sin(5*a+.6)+.027*Math.cos(8*a);
    for(const r of [1.055,1.19]){
      const x=LAKE.x+Math.cos(a)*LAKE.rx*r*shape,z=LAKE.z+Math.sin(a)*LAKE.rz*r*shape;
      ringVerts.push(x,heightAt(x,z)+.025,z);
    }
    if(i<segments){const j=i*2;ringIndices.push(j,j+1,j+2,j+1,j+3,j+2)}
  }
  const shore=new THREE.BufferGeometry();shore.setAttribute('position',new THREE.Float32BufferAttribute(ringVerts,3));shore.setIndex(ringIndices);shore.computeVertexNormals();
  const shoreMat=new THREE.MeshLambertMaterial({color:0xd9c9a1,side:THREE.DoubleSide});
  scene.add(new THREE.Mesh(shore,shoreMat));
  const rippleMat=new THREE.MeshBasicMaterial({color:0xebf7da,transparent:true,opacity:.30,depthWrite:false,side:THREE.DoubleSide});
  const ripples=new THREE.InstancedMesh(new THREE.TorusGeometry(.57,.018,3,32),rippleMat,24);
  for(let i=0;i<24;i++){
    const a=rand()*Math.PI*2,r=Math.sqrt(rand())*.8;
    const x=LAKE.x+Math.cos(a)*LAKE.rx*r,z=LAKE.z+Math.sin(a)*LAKE.rz*r;
    tmpObject.position.set(x,-.127,z);tmpObject.rotation.set(Math.PI/2,0,0);tmpObject.scale.set(.55+rand()*1.4,.24+rand()*.6,1);tmpObject.updateMatrix();ripples.setMatrixAt(i,tmpObject.matrix);
  }
  ripples.instanceMatrix.needsUpdate=true;ripples.frustumCulled=false;scene.add(ripples);
}

function makePath(points,width,material,yOffset){
  const curve=new THREE.CatmullRomCurve3(points.map(([x,z])=>new THREE.Vector3(x,0,z)),false,'centripetal',.4);
  const count=80,positions=[],uvs=[],indices=[];
  for(let i=0;i<=count;i++){
    const t=i/count,p=curve.getPoint(t),tangent=curve.getTangent(t);
    const nx=-tangent.z,nz=tangent.x;
    const sway=1+.08*Math.sin(i*.39)+.05*Math.sin(i*.92+2.1);
    for(const side of [-1,1]){
      const x=p.x+nx*width*.5*side*sway,z=p.z+nz*width*.5*side*sway;
      positions.push(x,heightAt(x,z)+yOffset,z);uvs.push(t,side);
    }
    if(i<count){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2)}
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();
  const mesh=new THREE.Mesh(geometry,material);mesh.receiveShadow=true;scene.add(mesh);return mesh;
}
function makePaths(){
  const edgeMaterial=new THREE.MeshLambertMaterial({color:0x88966e,side:THREE.DoubleSide,depthWrite:false});
  const pathMaterial=new THREE.MeshLambertMaterial({color:SEASONS[0].path,side:THREE.DoubleSide,depthWrite:false});
  state.pathMaterial=pathMaterial;
  for(const path of PATHS){makePath(path,3.8,edgeMaterial,.028);makePath(path,2.8,pathMaterial,.043)}
}

function makeGrassGeometry(){
  const vertices=[];
  for(let blade=0;blade<3;blade++){
    const a=blade*Math.PI*2/3, dx=Math.cos(a),dz=Math.sin(a);
    vertices.push(-dx*.11,0,-dz*.11,dx*.11,0,dz*.11,dx*.045,.48,dz*.045);
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.computeVertexNormals();return g;
}
function makeDetails(){
  const grassMat=new THREE.MeshLambertMaterial({color:0xffffff,side:THREE.DoubleSide});
  const grass=new THREE.InstancedMesh(makeGrassGeometry(),grassMat,560);grass.instanceMatrix.setUsage(THREE.StaticDrawUsage);
  const flowerMat=new THREE.MeshLambertMaterial({color:0xffffff,flatShading:true});
  const flower=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.12,0),flowerMat,155);
  const rockMat=new THREE.MeshLambertMaterial({color:0xffffff,flatShading:true});
  const rocks=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.45,0),rockMat,107);rocks.castShadow=false;rocks.receiveShadow=true;
  const greenColors=['#789f65','#85a269','#6c9364','#a5b773','#5e925e'];
  let g=0,f=0,r=0,tries=0;
  while((g<560||f<155||r<107) && tries<9000){
    tries++;
    const x=(rand()-.5)*135,z=(rand()-.5)*135;
    if(lakeRadius(x,z)<1.23)continue;
    if(dist2(x,z,6,6)<8 && rand()<.75)continue;
    const groundY=heightAt(x,z);
    if(g<560){
      tmpObject.position.set(x,groundY+.025,z);tmpObject.rotation.set(0,rand()*Math.PI*2,0);
      const size=.65+rand()*1.05;tmpObject.scale.set(size,size,size);tmpObject.updateMatrix();grass.setMatrixAt(g,tmpObject.matrix);
      grass.setColorAt(g,new THREE.Color(greenColors[Math.floor(rand()*greenColors.length)]));g++;
    }
    if(f<155 && rand()<.35){
      tmpObject.position.set(x+.3,groundY+.18,z+.3);tmpObject.scale.setScalar(.65+rand()*.9);tmpObject.updateMatrix();flower.setMatrixAt(f,tmpObject.matrix);
      flower.setColorAt(f,new THREE.Color(['#f5e4b3','#fff4d5','#ead8c2','#e3c7b6','#f7e7a1'][Math.floor(rand()*5)]));f++;
    }
    if(r<107 && rand()<.18 && dist2(x,z,6,6)>11){
      tmpObject.position.set(x,groundY+.10,z);tmpObject.rotation.set(rand(),rand()*6,rand()*.35);const s=.28+rand()*1.2;tmpObject.scale.set(s,s*.55,s*.7);tmpObject.updateMatrix();rocks.setMatrixAt(r,tmpObject.matrix);
      rocks.setColorAt(r,new THREE.Color(['#a2a28c','#8d9d83','#bbb6a0','#879b88'][Math.floor(rand()*4)]));r++;
    }
  }
  grass.count=g;flower.count=f;rocks.count=r;
  grass.instanceMatrix.needsUpdate=true;flower.instanceMatrix.needsUpdate=true;rocks.instanceMatrix.needsUpdate=true;
  if(grass.instanceColor)grass.instanceColor.needsUpdate=true;if(flower.instanceColor)flower.instanceColor.needsUpdate=true;if(rocks.instanceColor)rocks.instanceColor.needsUpdate=true;
  scene.add(grass,flower,rocks);grassInstances=grass;flowerInstances=flower;

  // Two season-only layers make the scene respond visibly to the season control.
  const leaf=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.27,0),new THREE.MeshLambertMaterial({color:0xffffff,flatShading:true}),190);
  const snow=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.14,0),new THREE.MeshLambertMaterial({color:0xfafdf3,flatShading:true}),410);
  for(let i=0;i<410;i++){
    let x,z;do{x=(rand()-.5)*126;z=(rand()-.5)*126}while(lakeRadius(x,z)<1.2);
    const y=heightAt(x,z);
    tmpObject.position.set(x,y+.12,z);tmpObject.rotation.set(rand()*2,rand()*6,rand());tmpObject.scale.setScalar(.4+rand()*.95);tmpObject.updateMatrix();snow.setMatrixAt(i,tmpObject.matrix);
    if(i<190){tmpObject.position.set(x,y+.05,z);tmpObject.rotation.set(rand()*6,rand()*6,rand()*6);tmpObject.scale.set(.5+rand()*.8,.16,.4+rand()*.8);tmpObject.updateMatrix();leaf.setMatrixAt(i,tmpObject.matrix);leaf.setColorAt(i,new THREE.Color(['#d68d4e','#ad7243','#dfae62','#c18644'][Math.floor(rand()*4)]))}
  }
  leaf.instanceMatrix.needsUpdate=true;snow.instanceMatrix.needsUpdate=true;if(leaf.instanceColor)leaf.instanceColor.needsUpdate=true;
  scene.add(leaf,snow);autumnLeaves=leaf;snowInstances=snow;leaf.visible=false;snow.visible=false;
}

function makeSky(){
  const cloudMaterial=new THREE.MeshLambertMaterial({color:0xfaf7e9,transparent:true,opacity:.63,flatShading:true,depthWrite:false});
  for(let i=0;i<12;i++){
    const group=new THREE.Group(),angle=rand()*Math.PI*2,range=40+rand()*70;
    const x=Math.cos(angle)*range,z=Math.sin(angle)*range;
    for(let j=0;j<3;j++){
      const cloud=new THREE.Mesh(new THREE.IcosahedronGeometry(1,1),cloudMaterial);
      cloud.scale.set(3.6+rand()*3,1.2+rand()*.8,1.6+rand()*.9);cloud.position.set((j-1)*3.1,rand()*.3,rand()*.7);group.add(cloud);
    }
    group.position.set(x,19+rand()*10,z);scene.add(group);clouds.push(group);
  }
  const starPositions=[];
  for(let i=0;i<230;i++){
    const x=(rand()-.5)*210,y=20+rand()*67,z=(rand()-.5)*210;
    starPositions.push(x,y,z);
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(starPositions,3));
  starField=new THREE.Points(geo,new THREE.PointsMaterial({color:0xf4f1df,size:.62,transparent:true,opacity:.9,sizeAttenuation:true,fog:false}));starField.visible=false;scene.add(starField);
  const sunCanvas=document.createElement('canvas');sunCanvas.width=sunCanvas.height=128;
  const ctx=sunCanvas.getContext('2d');const grad=ctx.createRadialGradient(64,64,3,64,64,64);
  grad.addColorStop(0,'rgba(255,249,219,0.95)');grad.addColorStop(.17,'rgba(255,238,188,.84)');grad.addColorStop(.48,'rgba(255,237,187,.27)');grad.addColorStop(1,'rgba(255,237,187,0)');
  ctx.fillStyle=grad;ctx.fillRect(0,0,128,128);
  const sunSprite=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(sunCanvas),transparent:true,depthWrite:false,fog:false}));
  sunSprite.position.set(-61,48,-89);sunSprite.scale.set(35,35,1);scene.add(sunSprite);state.sunSprite=sunSprite;
}

function makeCharm(index,def){
  const group=new THREE.Group();group.position.set(def.x,heightAt(def.x,def.z)+1.34,def.z);
  const core=new THREE.Mesh(new THREE.OctahedronGeometry(.35,0),new THREE.MeshStandardMaterial({color:0xffdfa1,emissive:0xf4b54f,emissiveIntensity:1.65,metalness:.12,roughness:.25,flatShading:true}));
  core.scale.set(.8,1.45,.8);core.rotation.z=Math.PI/4;group.add(core);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.56,.022,4,32),new THREE.MeshBasicMaterial({color:0xffe4a4,transparent:true,opacity:.83}));ring.rotation.x=Math.PI/2;group.add(ring);
  const lower=new THREE.Mesh(new THREE.RingGeometry(.42,.59,24),new THREE.MeshBasicMaterial({color:0xf3d48b,transparent:true,opacity:.30,side:THREE.DoubleSide,depthWrite:false}));lower.rotation.x=-Math.PI/2;lower.position.y=-1.18;group.add(lower);
  const canvas=document.createElement('canvas');canvas.width=canvas.height=64;
  const ctx=canvas.getContext('2d'),gr=ctx.createRadialGradient(32,32,3,32,32,32);
  gr.addColorStop(0,'rgba(255,221,135,.65)');gr.addColorStop(.32,'rgba(255,222,134,.24)');gr.addColorStop(1,'rgba(255,222,134,0)');ctx.fillStyle=gr;ctx.fillRect(0,0,64,64);
  const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(canvas),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));glow.scale.set(2.7,2.7,1);group.add(glow);
  for(let j=0;j<3;j++){
    const bit=new THREE.Mesh(new THREE.OctahedronGeometry(.065,0),new THREE.MeshBasicMaterial({color:0xffe3a1}));group.add(bit);group.userData['bit'+j]=bit;
  }
  group.userData={...group.userData,index,baseY:group.position.y,core,ring,glow};
  group.visible=!state.found.has(index);scene.add(group);charmObjects.push(group);
}
function makeCharms(){CHARMS.forEach((c,i)=>makeCharm(i,c))}

function addWorldModels(){
  function place(key,x,z,scale=1,rotation=0,offset=0,collision=0){
    const gltf=modelTemplates[key];if(!gltf)return null;
    // A skinned character must keep the original scene so its bones remain bound.
    const clone=key==='backpacker'?gltf.scene:gltf.scene.clone(true);clone.position.set(x,heightAt(x,z)+offset,z);clone.scale.setScalar(scale);clone.rotation.y=rotation;
    clone.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});scene.add(clone);
    if(collision)colliders.push({x,z,r:collision});return clone;
  }
  worldModels.aFrame=place('aFrame',-5,1,.75,-.17,0,2.35);
  worldModels.station=place('rangerStation',15,1,.83,Math.PI*.22,0,3.25);
  worldModels.camper=place('camper',19,11,.9,Math.PI*.50,0,1.35);
  worldModels.ridgeTent=place('ridgeTent',3,-3,1.08,.23,0,1.0);
  place('domeTent',-1,-3,1.12,-.3,0,1.2);
  worldModels.fire=place('campfire',5,5,1.3,0);
  place('table',9,4,1.2,-.1);place('bench',0,7,1.25,-.45);
  place('hammock',-8,9,1.1,Math.PI*.35,0,1.3);
  worldModels.sign=place('trailSign',5,12,1.08,Math.PI*.15);
  place('notice',12,9,1.05,-.45);
  place('lantern',3.7,5.6,1.6,0);
  place('fence',18,15,1.05,.1);place('fence',20,15,1.05,.1);place('fence',22,15,1.05,.1);
  place('fence',20,8,1.05,.1);place('fence',22,8,1.05,.1);
  worldModels.oldCabin=place('cabin',29,21,.78,-.25,0,3.0);
  place('lantern',27,18,1.4);place('bench',24,22,1.05,.4);
  worldModels.lookout=place('lookout',30,-28,.91,-.25,0,1.65);
  place('trailSign',23,-21,.92,.4);
  place('dock',-1,-11.7,1.25,Math.PI/2,.15);
  place('dock',-3.6,-11.7,1.25,Math.PI/2,.15);
  place('canoe',-5.5,-9,1.05,Math.PI*.43,.58);
  place('pebbles',1.7,-6.6,1.15);place('pebbles',-2.2,-4.1,.9);
  for(const [x,z,s] of [[-9,-9,1],[-18,-18,.83],[-21,-7,1.1]]){
    const pad=place('lily',x,z,s,rand()*6,0);if(pad)pad.position.y=-.116;
  }
  for(const [x,z,s] of [[-2,-3,1],[-29,-9,.75],[-6,-23,.9],[-27,-20,.9]])place('reeds',x,z,s,rand()*6);
  worldModels.swing=place('swingTree',-30,0,1.04,.35,0,1.05);
  place('pebbles',-29,-7,.8);
  // Character GLBs come with Idle, Walk and Run animation clips.
  const player=place('backpacker',state.x,state.z,1,Math.PI);playerRoot=player;
  if(player){playerMixer=new THREE.AnimationMixer(player);for(const clip of modelTemplates.backpacker.animations)playerActions[clip.name]=playerMixer.clipAction(clip);if(playerActions.Idle)playerActions.Idle.play()}
  addNPC('ranger',8.4,9.2,Math.PI+.35,'Mira');
  addNPC('kid',0,-.8,Math.PI*.6,'Pip');
  addNPC('angler',.1,-7.6,-Math.PI*.45,'Sol');
  if(worldModels.fire&&modelTemplates.campfire?.animations?.length){campfireMixer=new THREE.AnimationMixer(worldModels.fire);campfireMixer.clipAction(modelTemplates.campfire.animations[0]).play()}
  // Hand-placed pines frame the campground and give distant locations a silhouette.
  const fixed=[[-12,16,.94],[-16,6,.83],[-8,-8,1.05],[1,-12,.84],[20,-5,.9],[24,4,.97],[25,12,.86],[-18,17,1.11],[-35,8,.95],[-34,-10,1.07],[-25,-26,1.1],[22,-34,.82],[35,-17,.9],[36,15,.88],[14,-32,.96],[3,-29,1.05]];
  for(const [x,z,s] of fixed)placeTree(x,z,s);
  let pines=0,attempts=0;
  while(pines<43&&attempts<5000){attempts++;
    const x=(rand()-.5)*123,z=(rand()-.5)*123;
    if(lakeRadius(x,z)<1.32||dist2(x,z,9,27)<16)continue;
    if(PLACES.some(p=>dist2(x,z,p.x,p.z)<(p.id==='camp'?15:p.id==='grove'?4:7)))continue;
    if(PATHS.some(path=>path.some(([px,pz])=>dist2(x,z,px,pz)<3.7)))continue;
    placeTree(x,z,.68+rand()*.48);pines++;
  }
  for(const [x,z,s] of [[-40,18,.88],[-44,-4,.8],[-31,18,.76],[37,29,.7]]){
    const tree=place('swingTree',x,z,s,rand()*6,0,0);if(tree)tree.traverse(o=>{if(o.isMesh)o.castShadow=false});
  }
  buildInstancedPines();
}
function placeTree(x,z,s){
  if(!modelTemplates.pine)return;
  pinePlacements.push({x,z,s,rotation:rand()*Math.PI*2});
  if(dist2(x,z,4,10)<22)colliders.push({x,z,r:.55*s});
}
function buildInstancedPines(){
  // Six GPU draw calls paint every pine in the world, instead of hundreds of clones.
  const root=modelTemplates.pine?.scene;if(!root||!pinePlacements.length)return;
  root.updateMatrixWorld(true);
  const rootInverse=root.matrixWorld.clone().invert(),axis=new THREE.Vector3(0,1,0);
  root.traverse(part=>{
    if(!part.isMesh)return;
    const local=rootInverse.clone().multiply(part.matrixWorld);
    const instanced=new THREE.InstancedMesh(part.geometry,part.material,pinePlacements.length);
    instanced.castShadow=true;instanced.receiveShadow=true;instanced.frustumCulled=false;
    pinePlacements.forEach((p,i)=>{
      const transform=new THREE.Matrix4().compose(new THREE.Vector3(p.x,heightAt(p.x,p.z),p.z),new THREE.Quaternion().setFromAxisAngle(axis,p.rotation),new THREE.Vector3(p.s,p.s,p.s));
      transform.multiply(local);instanced.setMatrixAt(i,transform);
    });
    instanced.instanceMatrix.needsUpdate=true;scene.add(instanced);
  });
}
function addNPC(key,x,z,rotation,name){const gltf=modelTemplates[key];if(!gltf)return;
  const model=gltf.scene;model.position.set(x,heightAt(x,z),z);model.rotation.y=rotation;
  model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});scene.add(model);
  if(gltf.animations?.length){const mixer=new THREE.AnimationMixer(model);const idle=gltf.animations.find(a=>a.name==='Idle')||gltf.animations[0];mixer.clipAction(idle).play();npcMixers.push(mixer)}
  worldModels[name]=model;
}

function loadModels(){
  const loader=new GLTFLoader(),entries=Object.entries(MODEL_DEFS);let loaded=0;
  dom.loadingProgress.style.width='12%';
  Promise.all(entries.map(async ([key,[id]])=>{
    try{const gltf=await loader.loadAsync(`assets/models/${id}.glb`);modelTemplates[key]=gltf}
    catch(err){console.warn(`Could not load ${id}`,err)}
    finally{loaded++;dom.loadingProgress.style.width=`${12+Math.round(loaded/entries.length*88)}%`;if(loaded>entries.length*.43)dom.loadingCaption.textContent='Waking up the forest…';if(loaded>entries.length*.82)dom.loadingCaption.textContent='Nearly ready to wander…'}
  })).then(()=>{
    addWorldModels();
    renderer.shadowMap.needsUpdate=true; // bake static world shadows once
    dom.loadingProgress.style.width='100%';
    dom.loadingCaption.textContent='The trail is yours.';
    setTimeout(()=>{dom.loading.classList.add('done');setTimeout(()=>{dom.loading.hidden=true;showTouchHint()},850)},250);
    refreshProgress();
    setTimeout(()=>showDiscovery('Pine Camp'),1050);
  }).catch(err=>{console.error(err);dom.loadingCaption.textContent='The trail is ready — come on in.';dom.loading.classList.add('done')});
}

function animate(now){
  requestAnimationFrame(animate);
  const raw=(now-lastFrame)/1000;
  const dt=Math.min(raw,.15);lastFrame=now;
  tuneQuality(raw);
  const t=clock.getElapsedTime();state.elapsed=t;
  updatePlayer(dt);
  if(playerMixer)playerMixer.update(dt);
  if(campfireMixer)campfireMixer.update(dt);
  for(const mix of npcMixers)mix.update(dt);
  for(let i=0;i<charmObjects.length;i++){
    const obj=charmObjects[i];if(!obj.visible)continue;
    obj.position.y=obj.userData.baseY+Math.sin(t*2.1+i*1.3)*.14;
    obj.userData.core.rotation.y+=dt*.95;obj.userData.ring.rotation.z+=dt*.3;
    for(let j=0;j<3;j++){
      const bit=obj.userData['bit'+j];const a=t*(.7+j*.2)+j*2.094+i;
      bit.position.set(Math.cos(a)*(.63+j*.05),Math.sin(t*1.4+j*2.2)*.35,Math.sin(a)*(.63+j*.05));
    }
  }
  campLight.intensity=TIMES[state.timeIndex].fire*(.94+.12*Math.sin(t*15)+.08*Math.sin(t*27));
  clouds.forEach((cloud,i)=>{cloud.position.x+=dt*(.35+(i%3)*.1);if(cloud.position.x>120)cloud.position.x=-120});
  updateCamera(dt);
  updateWorldTag();
  if(t-state.lastMapDraw>.16){drawMap(dom.minimap,true);if(guideMapCanvas&&!dom.overlay.hidden&&state.currentTab==='map')drawMap(guideMapCanvas,false);state.lastMapDraw=t}
  if(!state.paused)renderer.render(scene,camera);
}

// Phones get a gentle auto-resolution: if frames start slipping we drop the
// render scale a notch instead of stuttering. It only ever steps downwards.
const perf={dpr:null,frames:0,total:0};
function maxPixelRatio(){return Math.min(window.devicePixelRatio||1,touchUI()?1.4:1.6)}
function tuneQuality(raw){
  if(!renderer||raw>.5)return; // ignore tab-switch spikes
  perf.frames++;perf.total+=raw;
  if(perf.frames<90)return;
  const avg=perf.total/perf.frames;perf.frames=0;perf.total=0;
  const current=renderer.getPixelRatio();
  if(avg>0.034&&current>1.001){
    const next=Math.max(1,current-0.2);renderer.setPixelRatio(next);
    renderer.setSize(window.innerWidth,window.innerHeight);
    drawMap(dom.minimap,true);if(guideMapCanvas)drawMap(guideMapCanvas,false);
  }
}
function setAnimation(name){if(!playerActions[name]||state.currentAnimation===name)return;
  playerActions[state.currentAnimation]?.fadeOut(.2);
  const next=playerActions[name];next.reset().fadeIn(.2).play();state.currentAnimation=name;
}
function isWalkable(x,z){
  if(Math.hypot(x,z)>66)return false;
  if(lakeRadius(x,z)<1.05){const dockWalk=x>-4.4&&x<.8&&z>-13.2&&z<-10.0;if(!dockWalk)return false}
  for(const c of colliders)if(dist2(x,z,c.x,c.z)<c.r+.28)return false;
  return true;
}
function updatePlayer(dt){
  let forward=0,strafe=0,analog=0;
  if(state.keys.has('KeyW')||state.keys.has('ArrowUp')||state.touch.has('forward'))forward++;
  if(state.keys.has('KeyS')||state.keys.has('ArrowDown')||state.touch.has('back'))forward--;
  if(state.keys.has('KeyD')||state.keys.has('ArrowRight')||state.touch.has('right'))strafe++;
  if(state.keys.has('KeyA')||state.keys.has('ArrowLeft')||state.touch.has('left'))strafe--;
  if(state.stick.active){
    // Stick is analog: a gentle push creeps, a full push runs.
    const mag=Math.hypot(state.stick.x,state.stick.y);
    if(mag>.14){forward+=-state.stick.y;strafe+=state.stick.x;analog=Math.min(1,mag)}
  }
  const moving=(forward!==0||strafe!==0)&&!state.paused&&!state.dialogueOpen;
  if(moving){
    const length=Math.hypot(forward,strafe);forward/=length;strafe/=length;
    const dx=(-Math.sin(state.yaw)*forward+Math.cos(state.yaw)*strafe),dz=(-Math.cos(state.yaw)*forward-Math.sin(state.yaw)*strafe);
    const running=(state.keys.has('ShiftLeft')||state.keys.has('ShiftRight'))||(analog>.84);
    const speed=(running?9.1:5.25)*(analog?clamp(analog,.45,1):1);
    if(isWalkable(state.x+dx*speed*dt,state.z))state.x+=dx*speed*dt;
    if(isWalkable(state.x,state.z+dz*speed*dt))state.z+=dz*speed*dt;
    const targetAngle=Math.atan2(dx,dz);state.facing+=Math.atan2(Math.sin(targetAngle-state.facing),Math.cos(targetAngle-state.facing))*Math.min(1,dt*12);
    setAnimation(running?'Run':'Walk');
  }else setAnimation('Idle');
  if(playerRoot){playerRoot.position.set(state.x,heightAt(state.x,state.z),state.z);playerRoot.rotation.y=state.facing}
  // Locations and interactions stay live while the player walks.
  if(!state.paused){updatePlace();updateNearby()}
}
function updateCamera(dt){
  const horizontal=state.distance*Math.cos(state.pitch),vertical=state.distance*Math.sin(state.pitch);
  const desired=new THREE.Vector3(state.x+Math.sin(state.yaw)*horizontal,heightAt(state.x,state.z)+vertical+1.5,state.z+Math.cos(state.yaw)*horizontal);
  camera.position.lerp(desired,Math.min(1,dt*6.5));
  camera.lookAt(state.x-Math.sin(state.yaw)*4.8,heightAt(state.x,state.z)+1.4,state.z-Math.cos(state.yaw)*4.8);
}
function updatePlace(){
  let closest=null,lowest=Infinity;
  for(const place of PLACES){
    const d=dist2(state.x,state.z,place.x,place.z);
    if(d<lowest){closest=place;lowest=d}
    if(d<place.radius&&!state.discovered.has(place.id)){
      state.discovered.add(place.id);saveGame();showDiscovery(place.name);
      if(!dom.overlay.hidden&&state.currentTab==='journal')renderTab('journal');
    }
  }
  const name=lowest<closest.radius+4?closest.name:'The open trail';
  if(name!==state.currentPlace){state.currentPlace=name;dom.currentPlace.textContent=name;dom.mapPlace.textContent=name}
  const directions=['N','NE','E','SE','S','SW','W','NW'];
  const angle=((state.facing+Math.PI)/(Math.PI*2)*8+8)%8;
  dom.compassLetter.textContent=directions[Math.round(angle)%8];
}
function updateNearby(){
  let near=null,best=Infinity;
  for(let i=0;i<CHARMS.length;i++){
    if(state.found.has(i))continue;
    const charm=CHARMS[i],d=dist2(state.x,state.z,charm.x,charm.z);
    if(d<2.4&&d<best){near={kind:'charm',index:i,label:`Collect ${charm.name}`};best=d}
  }
  const actions=[
    {x:8.4,z:9.2,r:3.1,label:'Talk to Mira',kind:'mira'},
    {x:5,z:12,r:2.65,label:'Read the trailhead sign',kind:'sign'},
    {x:0,z:-.8,r:2.6,label:'Talk to Pip',kind:'pip'},
    {x:.1,z:-7.6,r:2.7,label:'Talk to Sol',kind:'sol'},
    {x:29,z:21,r:5.0,label:'Visit the old cabin',kind:'cabin'},
    {x:30,z:-28,r:3.7,label:'Climb the lookout',kind:'lookout'},
    {x:-30,z:0,r:3.0,label:'Sit by the swing tree',kind:'swing'},
    {x:15,z:1,r:4.4,label:'Visit the ranger station',kind:'station'}
  ];
  for(const action of actions){const d=dist2(state.x,state.z,action.x,action.z);if(d<action.r&&d<best){near=action;best=d}}
  if(near?.label!==state.near?.label){
    state.near=near;
    dom.interactPrompt.hidden=!near;dom.mobileInteract.hidden=!near;
    if(near)dom.interactText.textContent=near.label;
  }
}
function interact(){
  if(!dom.overlay.hidden){closeGuide();return}
  if(state.dialogueOpen){closeDialogue();return}
  const near=state.near;if(!near)return;
  if(near.kind==='charm'){
    state.found.add(near.index);charmObjects[near.index].visible=false;saveGame();refreshProgress();
    showSmallToast(`✦  ${CHARMS[near.index].name} found!  ${state.found.size} / 5`);
    updateNearby();
    if(state.found.size===5)setTimeout(()=>openDialogue('THE FOREST REMEMBERS','You found every little light. Fernwood feels a little brighter with you in it. The trails are still yours to wander.'),1050);
    if(!dom.overlay.hidden&&state.currentTab==='journal')renderTab('journal');
    return;
  }
  const lines={
    mira:['MIRA · PARK RANGER','Welcome to Fernwood! Five wayfinder charms are hiding around the trails. No hurry, though. The best things happen when you get a little lost.'],
    sign:['TRAILHEAD NOTICE','Bluewater Dock lies west, the old cabin east, and the lookout past the whispering pines. Stay on the path… or don’t.'],
    pip:['PIP · LITTLE EXPLORER','I saw a tiny light by the lake! It looked like a falling star, only it forgot to fall.'],
    sol:['SOL · LAKE ANGLER','The lake keeps all sorts of secrets. If you spot a gold glimmer near the water, it probably isn’t a fish.'],
    cabin:['OLD PINE CABIN','The porch boards creak gently in the breeze. Someone has left a warm lantern burning for wandering guests.'],
    lookout:['THE LOOKOUT','From up here, every trail leads somewhere good. There is a little something waiting where the pines grow close.'],
    swing:['THE SWING TREE','The swing sways, even when the air is still. For a moment, it feels like the forest is saying hello.'],
    station:['RANGER STATION','A hand-painted map on the wall reads: “Take only memories. Leave the little world a little kinder.”']
  };
  const [name,text]=lines[near.kind]||['FERNWOOD','There is more to find if you keep wandering.'];openDialogue(name,text);
}
function openDialogue(name,text){dom.dialogueName.textContent=name;dom.dialogueText.textContent=text;dom.dialogue.hidden=false;state.dialogueOpen=true;resetTouchInput();dom.interactPrompt.hidden=true;dom.mobileInteract.hidden=true}
function closeDialogue(){dom.dialogue.hidden=true;state.dialogueOpen=false;state.near=null;updateNearby()}
function refreshProgress(){dom.progressCount.innerHTML=`${state.found.size} <span>/ 5</span>`;dom.questMiniCount.textContent=`${state.found.size} / 5`;dom.charmSlots.forEach((slot,i)=>slot.classList.toggle('found',state.found.has(i)));$('#charm-progress').setAttribute('aria-label',`${state.found.size} of 5 charms found`)}
function setQuestCollapsed(collapsed,save=true){
  dom.questCard.classList.toggle('is-collapsed',collapsed);
  dom.questToggle.setAttribute('aria-expanded',collapsed?'false':'true');
  if(save)try{localStorage.setItem('fernwood-quest-fold',collapsed?'1':'0')}catch{}
}
function toggleQuestCard(){setQuestCollapsed(!dom.questCard.classList.contains('is-collapsed'))}
let touchHintTimer=0;
function showTouchHint(){
  if(!touchUI()||!dom.touchHint)return;
  dom.touchHint.hidden=false;
  clearTimeout(touchHintTimer);
  touchHintTimer=setTimeout(()=>{dom.touchHint.hidden=true},5200);
  const hide=()=>{dom.touchHint.hidden=true;clearTimeout(touchHintTimer);window.removeEventListener('pointerdown',hide,true)};
  window.addEventListener('pointerdown',hide,true);
}
function showDiscovery(name){dom.discoveryName.textContent=name;dom.smallToast.classList.remove('show');dom.discoveryToast.classList.add('show');clearTimeout(discoveryTimer);discoveryTimer=setTimeout(()=>dom.discoveryToast.classList.remove('show'),3300)}
function showSmallToast(text){dom.smallToast.textContent=text;dom.discoveryToast.classList.remove('show');dom.smallToast.classList.add('show');clearTimeout(smallToastTimer);smallToastTimer=setTimeout(()=>dom.smallToast.classList.remove('show'),3100)}
function updateWorldTag(){
  let target=null,label='';let best=14;
  for(let i=0;i<CHARMS.length;i++){
    if(state.found.has(i))continue;const c=CHARMS[i],d=dist2(state.x,state.z,c.x,c.z);
    if(d<best){target={x:c.x,y:heightAt(c.x,c.z)+2.18,z:c.z};best=d;label='WAYFINDER CHARM'}
  }
  if(!target&&state.waypoint){const p=state.waypoint,d=dist2(state.x,state.z,p.x,p.z);if(d<34){target={x:p.x,y:heightAt(p.x,p.z)+3.2,z:p.z};label=`TRAIL SET · ${p.name.toUpperCase()}`}}
  if(!target||state.paused||state.photo){dom.worldTag.classList.remove('show');return}
  tmpVec.set(target.x,target.y,target.z).project(camera);
  const x=(tmpVec.x*.5+.5)*window.innerWidth,y=(-tmpVec.y*.5+.5)*window.innerHeight;
  if(tmpVec.z>1||x<55||x>window.innerWidth-55||y<92||y>window.innerHeight-120||x<360&&y<495||x>window.innerWidth-260&&y<395){dom.worldTag.classList.remove('show');return}
  dom.worldTag.style.left=x+'px';dom.worldTag.style.top=y+'px';dom.worldTag.style.transform='translate(-50%,-50%)';dom.worldTagText.textContent=label;dom.worldTag.classList.add('show');
}

function applyTime(){
  const p=TIMES[state.timeIndex];scene.background.set(p.sky);scene.fog.color.set(p.fog);sunLight.color.set(p.sun);sunLight.intensity=p.sunPower;hemiLight.intensity=p.hemi;renderer.toneMappingExposure=p.exposure;
  waterMaterial.color.set(p.water);cabinLight.intensity=state.timeIndex===2?2.8:.3;
  starField.visible=state.timeIndex===2;state.sunSprite.visible=state.timeIndex!==2;clouds.forEach(cloud=>cloud.visible=state.timeIndex!==2);
  dom.timeLabel.textContent=p.label;dom.timeIcon.setAttribute('href',state.timeIndex===2?'#i-moon':'#i-sun');
  dom.miniTimeIcon.setAttribute('href',state.timeIndex===2?'#i-moon':state.timeIndex===1?'#i-sun':'#i-sun');
  dom.miniTimeIcon.parentElement.setAttribute('aria-label',`Time of day: ${p.label}. Tap to change.`);
  $('.control-orb').style.background=state.timeIndex===2?'#d8e6e7':state.timeIndex===1?'#f5ddba':'#f1dfb9';
  $('.control-orb').style.color=state.timeIndex===2?'#416474':'#9a6f2b';
  showSmallToast(`The sky has changed · ${p.label}`);
}
function applySeason(notify=true){
  const s=SEASONS[state.seasonIndex];const colors=groundGeometry.attributes.color;
  const base=new THREE.Color(s.ground);
  for(let i=0;i<colors.count;i++){
    const n=groundNoise[i];const c=base.clone().offsetHSL((n-.5)*.016,(n-.5)*.045,(n-.5)*.12);
    colors.setXYZ(i,c.r,c.g,c.b);
  }
  colors.needsUpdate=true;outerMaterial.color.set(s.outer);state.pathMaterial.color.set(s.path);
  if(grassInstances)grassInstances.visible=state.seasonIndex!==2;
  if(flowerInstances)flowerInstances.visible=state.seasonIndex!==2;
  if(autumnLeaves)autumnLeaves.visible=state.seasonIndex===1;
  if(snowInstances)snowInstances.visible=state.seasonIndex===2;
  if(state.seasonIndex===2){scene.fog.density=.010;sunLight.color.set(TIMES[state.timeIndex].sun).lerp(new THREE.Color('#e9f4f8'),.18)}else{scene.fog.density=.011;sunLight.color.set(TIMES[state.timeIndex].sun)}
  dom.seasonLabel.textContent=s.label;$('.season-dot').style.background=s.dot;$('.season-dot').style.boxShadow=`0 0 0 3px ${s.dot}30`;
  dom.miniSeasonSwatch.style.background=s.dot;dom.miniSeason.setAttribute('aria-label',`Season: ${s.label}. Tap to change.`);
  if(notify)showSmallToast(`Fernwood is now in ${s.label.toLowerCase()}`);
  drawMap(dom.minimap,true);if(guideMapCanvas&&!dom.overlay.hidden)drawMap(guideMapCanvas,false);
}

function paintLakeOnMap(ctx,to){
  ctx.beginPath();
  for(let i=0;i<=100;i++){
    const a=i/100*Math.PI*2,shape=1+.045*Math.sin(5*a+.6)+.027*Math.cos(8*a);
    const p=to(LAKE.x+Math.cos(a)*LAKE.rx*1.085*shape,LAKE.z+Math.sin(a)*LAKE.rz*1.085*shape);
    if(i===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);
  }
  ctx.closePath();ctx.fillStyle=state.seasonIndex===2?'#b4d4d2':'#9bc7bb';ctx.strokeStyle='#f1e4c2';ctx.lineWidth=5;ctx.stroke();ctx.fill();
  ctx.save();ctx.clip();ctx.strokeStyle='rgba(245,252,238,.38)';ctx.lineWidth=1.3;
  for(let i=0;i<12;i++){
    const p=to(-29+(i%4)*7,-20+Math.floor(i/4)*7);ctx.beginPath();ctx.ellipse(p.x,p.y,5+(i%3)*2,1.4,0,0,Math.PI*2);ctx.stroke();
  }ctx.restore();
}
function drawMap(canvas,small){
  if(!canvas)return;const rect=canvas.getBoundingClientRect();
  if(rect.width<20||rect.height<20)return;
  const dpr=Math.min(window.devicePixelRatio||1,2),w=rect.width,h=rect.height;
  if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr)}
  const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.fillStyle=state.seasonIndex===2?'#e5ebe3':state.seasonIndex===1?'#ece6d3':'#e9eedf';ctx.fillRect(0,0,w,h);
  const sc=Math.min((w-(small?17:36))/112,(h-(small?15:28))/94),to=(x,z)=>({x:w/2+x*sc,y:h/2+z*sc});
  const seed=mulberry32(98123);
  // Gentle patches, contour rings and little canopy dots make this a hand-drawn map.
  for(const [x,z,rx,ry] of [[-42,22,15,11],[31,-15,18,14],[22,30,18,9],[-40,-30,14,13],[6,-31,12,10]]){
    const p=to(x,z);ctx.beginPath();ctx.ellipse(p.x,p.y,rx*sc,ry*sc,.25,0,Math.PI*2);
    ctx.fillStyle=state.seasonIndex===1?'#e4d9b9':'#dce8d5';ctx.fill();
  }
  for(let i=0;i<17;i++){
    const x=(seed()-.5)*110,z=(seed()-.5)*90,p=to(x,z),r=(4+seed()*8)*sc;
    ctx.beginPath();ctx.ellipse(p.x,p.y,r,r*.65,seed()*3,0,Math.PI*2);ctx.strokeStyle='rgba(105,143,106,.14)';ctx.lineWidth=.9;ctx.stroke();
  }
  for(let i=0;i<(small?110:260);i++){
    const x=(seed()-.5)*110,z=(seed()-.5)*95;if(lakeRadius(x,z)<1.18)continue;
    const p=to(x,z);ctx.beginPath();ctx.arc(p.x,p.y,small?.65:1.2,0,Math.PI*2);
    ctx.fillStyle=i%4===0?'#b9d1ad':'#c8daba';ctx.fill();
  }
  paintLakeOnMap(ctx,to);
  for(const path of PATHS){
    ctx.beginPath();path.forEach(([x,z],i)=>{const p=to(x,z);i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y)});
    ctx.strokeStyle='#c4b58b';ctx.lineWidth=small?2.5:5;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();
    ctx.strokeStyle='#f3e8ca';ctx.lineWidth=small?1.4:2.8;ctx.stroke();
  }
  // Tree silhouettes are decorative, not map markers.
  const treeSeed=mulberry32(43765);
  for(let i=0;i<(small?54:110);i++){
    const x=(treeSeed()-.5)*105,z=(treeSeed()-.5)*88;
    if(lakeRadius(x,z)<1.35||dist2(x,z,6,6)<10)continue;
    const p=to(x,z);ctx.fillStyle=state.seasonIndex===1?'#9ca884':'#8aaf8d';
    ctx.beginPath();ctx.moveTo(p.x,p.y-(small?1.2:2.5));ctx.lineTo(p.x-(small?1.3:2.7),p.y+(small?1.4:2.9));ctx.lineTo(p.x+(small?1.3:2.7),p.y+(small?1.4:2.9));ctx.fill();
  }
  for(let i=0;i<PLACES.length;i++){
    const place=PLACES[i],p=to(place.x,place.z),discovered=state.discovered.has(place.id);
    ctx.beginPath();ctx.arc(p.x,p.y,small?3.2:6,0,Math.PI*2);ctx.fillStyle=discovered?'#497752':'#f6f4e7';ctx.fill();ctx.lineWidth=small?1:1.6;ctx.strokeStyle='#6e9a76';ctx.stroke();
    if(!small){
      const fs=w<440?9:10;ctx.font=`700 ${fs}px "DM Sans", sans-serif`;ctx.textBaseline='middle';
      const tw=ctx.measureText(place.name).width;
      // keep names inside the frame: flip to the left edge when the dot is near the right side
      let tx=p.x+10;if(tx+tw>w-10)tx=p.x-10-tw;
      ctx.fillStyle='#44694d';ctx.fillText(place.name,tx,p.y+1);
    }
  }
  if(state.waypoint){const p=to(state.waypoint.x,state.waypoint.z);ctx.beginPath();ctx.arc(p.x,p.y,small?6:10,0,Math.PI*2);ctx.strokeStyle='#cf9750';ctx.lineWidth=small?1.4:2.2;ctx.stroke()}
  // Player is the bright warm arrow, facing the direction of travel.
  const you=to(state.x,state.z);ctx.save();ctx.translate(you.x,you.y);ctx.rotate(Math.PI-state.facing);ctx.beginPath();const sz=small?7:10;ctx.moveTo(0,-sz);ctx.lineTo(sz*.72,sz*.72);ctx.lineTo(0,sz*.35);ctx.lineTo(-sz*.72,sz*.72);ctx.closePath();ctx.fillStyle='#d39550';ctx.strokeStyle='#fffdf2';ctx.lineWidth=small?2:2.7;ctx.stroke();ctx.fill();ctx.restore();
  if(!small){ctx.fillStyle='#769278';ctx.font='800 9px "DM Sans", sans-serif';ctx.letterSpacing='2px';ctx.fillText('FERNWOOD FOREST',18,22)}
}

function renderTab(tab){
  state.currentTab=tab;dom.guideTabs.forEach(btn=>btn.classList.toggle('active',btn.dataset.tab===tab));guideMapCanvas=null;
  const count=state.discovered.size;
  if(tab==='map'){
    dom.guideContent.innerHTML=`<div class="guide-section"><div class="section-kicker">THE WORLD IS YOURS</div><h2 class="section-title" id="guide-title">Find your <em>own way.</em></h2><p class="section-subtitle">Six little places, a hundred ways to get there. Choose a place to set a trail marker.</p><div class="map-layout"><div class="big-map-wrap"><canvas id="big-map" aria-label="Map of Fernwood"></canvas><div class="map-compass">N ↑</div><div class="map-scale">✦ YOU ARE THE GOLD ARROW</div></div><div class="map-side"><div class="map-side-title">PLACES TO WANDER · ${count} / 6 DISCOVERED</div><div class="place-list">${PLACES.map((p,i)=>`<button class="place-row ${state.discovered.has(p.id)?'found':''} ${state.waypoint?.id===p.id?'selected':''}" data-place="${p.id}" type="button"><span class="place-index">${String(i+1).padStart(2,'0')}</span><span class="place-row-copy"><strong>${p.name}</strong><small>${state.discovered.has(p.id)?'Discovered':'Not discovered yet'} · ${Math.round(dist2(state.x,state.z,p.x,p.z))} steps away</small></span><span class="place-row-arrow">↗</span></button>`).join('')}</div><p class="map-tip"><strong>TIP</strong> · Click a place to mark it, then follow the path. You can also simply wander.</p></div></div></div>`;
    guideMapCanvas=$('#big-map');
    document.querySelectorAll('.place-row').forEach(btn=>btn.addEventListener('click',()=>setWaypoint(PLACES.find(p=>p.id===btn.dataset.place))));
    guideMapCanvas.addEventListener('click',e=>{
      const rect=guideMapCanvas.getBoundingClientRect(),sc=Math.min((rect.width-36)/112,(rect.height-28)/94),mx=e.clientX-rect.left,my=e.clientY-rect.top;
      let nearest=null,d=25;
      for(const p of PLACES){const px=rect.width/2+p.x*sc,py=rect.height/2+p.z*sc;const delta=Math.hypot(mx-px,my-py);if(delta<d){d=delta;nearest=p}}
      if(nearest)setWaypoint(nearest);
    });
    requestAnimationFrame(()=>drawMap(guideMapCanvas,false));
  } else if(tab==='journal'){
    dom.guideContent.innerHTML=`<div class="guide-section"><div class="section-kicker">PAGES FROM THE TRAIL</div><h2 class="section-title" id="guide-title">Your <em>field journal.</em></h2><p class="section-subtitle">A collection of small discoveries. There is no wrong way to fill these pages.</p><div class="journal-overview"><div class="stat-tile"><strong>${state.found.size} <span style="font-size:16px;color:#9fb294">/ 5</span></strong><small>CHARMS FOUND</small></div><div class="stat-tile"><strong>${count} <span style="font-size:16px;color:#9fb294">/ 6</span></strong><small>PLACES DISCOVERED</small></div><div class="stat-tile"><strong>${Math.round(Math.hypot(state.x-4,state.z-14)+state.found.size*14+count*8)}</strong><small>A GOOD START</small></div></div><div class="journal-grid"><div><h3 class="journal-subhead">The wayfinder charms</h3><div class="charm-list">${CHARMS.map((c,i)=>`<div class="charm-item ${state.found.has(i)?'collected':''}"><span class="charm-item-icon">✦</span><span><strong>${state.found.has(i)?c.name:'A little light, still out there'}</strong><small>${state.found.has(i)?`Found at ${c.place}`:'Keep wandering to find this one'}</small></span></div>`).join('')}</div></div><div><h3 class="journal-subhead">Places you have seen</h3><div class="journal-discoveries"><p>Every part of the forest has a story. Which ones have you found?</p>${PLACES.map(p=>`<div class="journal-place ${state.discovered.has(p.id)?'':'undiscovered'}"><span>${state.discovered.has(p.id)?'✧':'○'}</span><span>${state.discovered.has(p.id)?p.name:'Somewhere undiscovered'}</span></div>`).join('')}</div></div></div></div>`;
  } else if(tab==='help'){
    const touch=touchUI();
    const rows=touch?[
      ['Walk around','Push the stick, bottom-left'],
      ['Run','Push the stick all the way out'],
      ['Look around','Drag anywhere on the world'],
      ['Zoom in / out','Pinch with two fingers'],
      ['Talk, read, collect','Tap the <kbd>USE</kbd> button'],
      ['Map / journal','Tap <kbd>MAP</kbd> or <kbd>JOURNAL</kbd> up top'],
      ['Change sky / season','Tap the sun and leaf buttons'],
      ['Close any window','Tap the <kbd>✕</kbd>']
    ]:[
      ['Walk around','<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> or arrow keys'],
      ['Run a little faster','<kbd>SHIFT</kbd> + move'],
      ['Look around / zoom','Drag mouse / scroll'],
      ['Talk, read, collect','<kbd>E</kbd> or <kbd>SPACE</kbd>'],
      ['Map / journal / photo','<kbd>M</kbd> <kbd>J</kbd> <kbd>P</kbd>'],
      ['Change sky / season','Click the controls above'],
      ['Close any window','<kbd>ESC</kbd>']
    ];
    const helpLines=rows.map(([label,keys])=>`<div class="help-line"><span>${label}</span><span>${keys}</span></div>`).join('');
    const collectHint=touch?'tap the gold USE button':'press E';
    dom.guideContent.innerHTML=`<div class="guide-section"><div class="section-kicker">WELCOME TO FERNWOOD</div><h2 class="section-title" id="guide-title">Go on, <em>get lost.</em></h2><p class="section-subtitle">It is a real little game. Walk wherever the trail takes you, meet the locals, and collect five glowing charms.</p><div class="help-grid"><div class="help-card"><h3>The little essentials</h3>${helpLines}</div><div class="help-note"><div><div class="note-star">✦</div><h3>Take the scenic route.</h3><p>The golden glimmers are wayfinder charms. They float close to the ground near the lake, the cabins and the deeper forest. When you are close enough, ${collectHint} to collect one.</p></div><button id="help-map" type="button">LOOK AT THE MAP ↗</button></div></div></div>`;
    $('#help-map').addEventListener('click',()=>renderTab('map'));
  } else {
    const creditLinks=Object.values(MODEL_DEFS).map(([id,name])=>`<a href="https://polyfork.dev/asset/${id}" target="_blank" rel="noopener noreferrer" title="${name} by Polyfork, CC BY 4.0">${name} ↗</a>`).join('');
    dom.guideContent.innerHTML=`<div class="guide-section"><div class="section-kicker">THE PEOPLE BEHIND THE POLYGONS</div><h2 class="section-title" id="guide-title">Made with <em>Polyfork.</em></h2><p class="section-subtitle">A tiny playable world, made from a collection of wonderfully cohesive low-poly things.</p><div class="credits-intro"><strong>3D model credits.</strong> The 26 bundled mesh models listed below are by <a href="https://polyfork.dev/" target="_blank" rel="noopener noreferrer">Polyfork</a>, created by Lucas Martinic, and are used under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>. Each link opens its model page. The GLB models are unmodified; the land, trails, charms, lighting, seasons, interactions and interface were made for this game.</div><div class="credit-grid">${creditLinks}</div><p class="credit-footer">Three.js is MIT-licensed. Fernwood is an independent little demo and is not endorsed by Polyfork. Individual asset attribution is also available in the included CREDITS.md file.</p></div>`;
  }
  dom.guideContent.scrollTop=0;
}
function openGuide(tab){if(state.photo)togglePhoto();if(state.dialogueOpen)closeDialogue();dom.overlay.hidden=false;state.paused=true;resetTouchInput();renderTab(tab)}
function closeGuide(){dom.overlay.hidden=true;state.paused=false;guideMapCanvas=null}
function setWaypoint(place){if(!place)return;state.waypoint=place;closeGuide();showSmallToast(`Trail set · ${place.name}`);drawMap(dom.minimap,true)}
function togglePhoto(){state.photo=!state.photo;dom.app.classList.toggle('photo-mode',state.photo);resetTouchInput()}

function toggleSound(){
  if(!audioCtx){
    const AudioContext=window.AudioContext||window.webkitAudioContext;
    if(!AudioContext){showSmallToast('Sound is unavailable in this browser');return}
    audioCtx=new AudioContext();audioGain=audioCtx.createGain();audioGain.gain.value=0;audioGain.connect(audioCtx.destination);
    const buffer=audioCtx.createBuffer(1,audioCtx.sampleRate*3,audioCtx.sampleRate),data=buffer.getChannelData(0);
    for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*.5;
    const wind=audioCtx.createBufferSource();wind.buffer=buffer;wind.loop=true;
    const lowpass=audioCtx.createBiquadFilter();lowpass.type='lowpass';lowpass.frequency.value=350;
    wind.connect(lowpass);lowpass.connect(audioGain);wind.start();
    birdTimer=setInterval(()=>{
      if(!state.soundOn||!audioCtx)return;
      const o=audioCtx.createOscillator(),g=audioCtx.createGain(),start=audioCtx.currentTime;
      o.type='sine';o.frequency.setValueAtTime(1020+Math.random()*270,start);o.frequency.exponentialRampToValueAtTime(1450+Math.random()*180,start+.12);
      o.frequency.exponentialRampToValueAtTime(790,start+.29);g.gain.setValueAtTime(.0001,start);g.gain.exponentialRampToValueAtTime(.019,start+.035);g.gain.exponentialRampToValueAtTime(.0001,start+.32);
      o.connect(g);g.connect(audioGain);o.start(start);o.stop(start+.34);
    },3600);
  }
  state.soundOn=!state.soundOn;
  if(audioCtx.state==='suspended')audioCtx.resume();
  audioGain.gain.cancelScheduledValues(audioCtx.currentTime);audioGain.gain.setTargetAtTime(state.soundOn?.075:0,audioCtx.currentTime,.25);
  dom.soundButton.querySelector('use').setAttribute('href',state.soundOn?'#i-sound':'#i-sound-off');
  dom.soundButton.setAttribute('aria-label',state.soundOn?'Mute ambient sound':'Turn ambient sound on');
  dom.soundButton.title=state.soundOn?'Mute ambient sound':'Turn ambient sound on';
  showSmallToast(state.soundOn?'Forest ambience on':'Forest ambience off');
}

function addEvents(){
  const cycleTime=()=>{state.timeIndex=(state.timeIndex+1)%TIMES.length;applyTime()};
  const cycleSeason=()=>{state.seasonIndex=(state.seasonIndex+1)%SEASONS.length;applySeason()};
  dom.timeButton.addEventListener('click',cycleTime);
  dom.seasonButton.addEventListener('click',cycleSeason);
  dom.miniTime.addEventListener('click',cycleTime);
  dom.miniSeason.addEventListener('click',cycleSeason);
  dom.soundButton.addEventListener('click',toggleSound);
  dom.helpButton.addEventListener('click',()=>openGuide('help'));
  dom.mapButton.addEventListener('click',()=>openGuide('map'));
  dom.journalButton.addEventListener('click',()=>openGuide('journal'));
  dom.questJournal.addEventListener('click',()=>openGuide('journal'));
  dom.minimapButton.addEventListener('click',()=>openGuide('map'));
  dom.mapWidgetFoot.addEventListener('click',()=>openGuide('map'));
  dom.creditsShortcut.addEventListener('click',()=>openGuide('credits'));
  dom.photoButton.addEventListener('click',togglePhoto);
  dom.overlayClose.addEventListener('click',closeGuide);dom.overlayScrim.addEventListener('click',closeGuide);
  dom.guideTabs.forEach(btn=>btn.addEventListener('click',()=>renderTab(btn.dataset.tab)));
  dom.dialogueClose.addEventListener('click',closeDialogue);
  dom.mobileInteract.addEventListener('click',interact);
  dom.dialogue.addEventListener('click',closeDialogue);
  dom.photoHint.addEventListener('click',()=>{if(state.photo)togglePhoto()});
  dom.mobilePhoto.addEventListener('click',()=>{if(!state.paused)togglePhoto()});
  dom.questToggle.addEventListener('click',toggleQuestCard);
  // Touch devices start with the quest card folded away so the world is visible.
  if(touchUI())setQuestCollapsed(true,false);
  document.addEventListener('gesturestart',e=>e.preventDefault());
  window.addEventListener('keydown',e=>{
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();
    if(e.code==='Escape'){
      if(!dom.overlay.hidden)closeGuide();else if(state.dialogueOpen)closeDialogue();else if(state.photo)togglePhoto();return;
    }
    if(!e.repeat){
      if(e.code==='KeyM'){dom.overlay.hidden?openGuide('map'):closeGuide();return}
      if(e.code==='KeyJ'){dom.overlay.hidden?openGuide('journal'):closeGuide();return}
      if(e.code==='KeyH'){dom.overlay.hidden?openGuide('help'):closeGuide();return}
      if(e.code==='KeyP'&&dom.overlay.hidden){togglePhoto();return}
      if((e.code==='KeyE'||e.code==='Space')&&!state.photo){interact();return}
    }
    if(!state.paused&&!state.dialogueOpen)state.keys.add(e.code);
  });
  window.addEventListener('keyup',e=>state.keys.delete(e.code));
  window.addEventListener('blur',resetTouchInput);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)resetTouchInput()});

  // ---- one pointer system for mouse, pen and multi-touch ----
  const pointers=new Map();
  let stickPointer=null,lookPointer=null,pinchStart=0,pinchDistance=state.distance,lastTap=0;
  const stickRadius=()=>dom.stickBase.clientWidth?dom.stickBase.clientWidth*.42:46;
  function isStickZone(x,y){
    if(!touchUI())return false;
    return x<window.innerWidth*.55 && y>window.innerHeight*.42;
  }
  function showStick(x,y){
    dom.stickBase.hidden=false;dom.stickBase.style.left=x+'px';dom.stickBase.style.top=y+'px';
    dom.stickKnob.style.transform='translate(0,0)';
    dom.stickRest.style.opacity='0';
  }
  function moveStick(x,y){
    const r=stickRadius();
    const cx=dom.stickBase.offsetLeft+dom.stickBase.offsetWidth/2;
    const cy=dom.stickBase.offsetTop+dom.stickBase.offsetHeight/2;
    let dx=x-cx,dy=y-cy;
    const mag=Math.hypot(dx,dy);
    if(mag>r){dx=dx/mag*r;dy=dy/mag*r}
    state.stick.x=dx/r;state.stick.y=dy/r;state.stick.active=true;
    const run=Math.hypot(state.stick.x,state.stick.y)>.84;
    if(run!==state.stick.run){state.stick.run=run;dom.stickBase.classList.toggle('is-running',run)}
    dom.stickKnob.style.transform=`translate(${dx}px,${dy}px)`;
  }
  function releaseStick(){
    stickPointer=null;state.stick.x=0;state.stick.y=0;state.stick.active=false;state.stick.run=false;
    dom.stickBase.classList.remove('is-running');dom.stickBase.hidden=true;dom.stickRest.style.opacity='1';
  }
  dom.scene.addEventListener('pointerdown',e=>{
    if(state.paused||state.dialogueOpen)return;
    pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    // second finger on the world = pinch to change camera distance
    if(pointers.size===2){
      const [a,b]=[...pointers.values()];pinchStart=Math.hypot(a.x-b.x,a.y-b.y)||1;pinchDistance=state.distance;return;
    }
    if(pointers.size>2)return;
    if(isStickZone(e.clientX,e.clientY)){
      stickPointer=e.pointerId;showStick(e.clientX,e.clientY);moveStick(e.clientX,e.clientY);
    }else{
      lookPointer=e.pointerId;state.dragging=true;state.dragX=e.clientX;state.dragY=e.clientY;
      const now=performance.now();
      if(now-lastTap<300){state.pitch=clamp(state.pitch+.35,.24,1.17);}
      lastTap=now;
    }
    dom.scene.setPointerCapture?.(e.pointerId);
  });
  dom.scene.addEventListener('pointermove',e=>{
    if(pointers.has(e.pointerId))pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pointers.size===2&&pinchStart){
      const [a,b]=[...pointers.values()];
      const d=Math.hypot(a.x-b.x,a.y-b.y);
      state.distance=clamp(pinchDistance*(pinchStart/d),9.5,30);return;
    }
    if(e.pointerId===stickPointer){moveStick(e.clientX,e.clientY);return}
    if(e.pointerId===lookPointer&&state.dragging){
      const dx=e.clientX-state.dragX,dy=e.clientY-state.dragY;state.dragX=e.clientX;state.dragY=e.clientY;
      state.yaw-=dx*.0054;state.pitch=clamp(state.pitch+dy*.0045,.24,1.17);
    }
  });
  function endPointer(e){
    pointers.delete(e.pointerId);
    if(pointers.size<2)pinchStart=0;
    if(e.pointerId===stickPointer)releaseStick();
    if(e.pointerId===lookPointer){lookPointer=null;state.dragging=false}
  }
  dom.scene.addEventListener('pointerup',endPointer);
  dom.scene.addEventListener('pointercancel',endPointer);
  dom.scene.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse')endPointer(e)});
  dom.scene.addEventListener('contextmenu',e=>e.preventDefault());
  dom.scene.addEventListener('wheel',e=>{e.preventDefault();state.distance=clamp(state.distance+Math.sign(e.deltaY)*1.3,9.5,30)},{passive:false});


  window.addEventListener('resize',()=>{
    camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();renderer.setSize(window.innerWidth,window.innerHeight);
    renderer.setPixelRatio(Math.min(renderer.getPixelRatio(),maxPixelRatio()));drawMap(dom.minimap,true);if(guideMapCanvas)drawMap(guideMapCanvas,false);
  });
}

function init(){
  try{
    setupScene();makeGround();makeLake();makePaths();makeDetails();makeSky();makeCharms();
    if(location.search.includes('debug'))window.__ferndebug={renderer,scene,state};
    applySeason(false);addEvents();refreshProgress();drawMap(dom.minimap,true);
    if(touchUI()){const fold=localStorage.getItem('fernwood-quest-fold');setQuestCollapsed(fold===null?true:fold==='1',false)}
    requestAnimationFrame(animate);loadModels();
  }catch(err){console.error('Fernwood could not start:',err);dom.loadingCaption.textContent='This little world needs WebGL to grow.';dom.loadingProgress.style.width='100%'}
}
function applySeasonInitial(){
  // Ground is created with more varied vertex colours; only the controls below change it.
  dom.seasonLabel.textContent=SEASONS[0].label;
}
init();
