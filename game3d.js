import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';

const $ = (s) => document.querySelector(s);
const canvas = $('#gameCanvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.xr.enabled = true;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.72;

const vrButton = VRButton.createButton(renderer, { optionalFeatures: ['local-floor', 'bounded-floor'] });
vrButton.classList.add('vr-button');
document.body.appendChild(vrButton);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020202);
scene.fog = new THREE.FogExp2(0x090405, 0.055);

const cameraRig = new THREE.Group();
const camera = new THREE.PerspectiveCamera(68, innerWidth / innerHeight, 0.05, 120);
camera.position.set(0, 1.65, 5.6);
cameraRig.add(camera);
scene.add(cameraRig);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2(0, 0);
const clock = new THREE.Clock();
const interactables = [];
let hovered = null;
let yaw = 0;
let pitch = 0;
let dragging = false;
let lastX = 0;
let lastY = 0;
let started = false;
let muted = false;
let timeLeft = 3600;
let timerId = null;
let narrationToken = 0;
let currentAudio = null;
let activeRoom = 'foyer';
const inventory = [];
const flags = { portraitMoved: false, keyTaken: false, doorUnlocked: false, dollSeen: false };

const roomData = {
  foyer: { title: 'ATRIO DI ASHWOOD', objective: 'Trova ciò che la casa ha nascosto' },
  corridor: { title: 'CORRIDOIO DELLE OMBRE', objective: 'Segui la voce senza guardarti alle spalle' },
  nursery: { title: 'NURSERY DI CLARA', objective: 'Scopri perché l’orologio si è fermato' }
};

const audioFiles = {
  intro: 'audio/clara-intro.mp3',
  foyer: 'audio/clara-atrio.mp3',
  doll: 'audio/clara-bambola.mp3'
};

function material(color, roughness = .78, metalness = .05) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function meshBox(name, size, pos, color, opts = {}) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material(color, opts.roughness, opts.metalness));
  mesh.name = name;
  mesh.position.set(...pos);
  mesh.castShadow = opts.castShadow ?? true;
  mesh.receiveShadow = opts.receiveShadow ?? true;
  scene.add(mesh);
  return mesh;
}

function addInteraction(mesh, label, action) {
  mesh.userData.interactive = true;
  mesh.userData.label = label;
  mesh.userData.action = action;
  interactables.push(mesh);
}

function clearRoom() {
  [...scene.children].forEach(obj => {
    if (obj !== cameraRig && !(obj instanceof THREE.Light)) {
      scene.remove(obj);
      obj.geometry?.dispose?.();
      if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose?.());
      else obj.material?.dispose?.();
    }
  });
  interactables.length = 0;
  [...scene.children].filter(o => o instanceof THREE.Light).forEach(o => scene.remove(o));
}

function buildShell(width = 12, depth = 13, height = 5.2) {
  meshBox('floor', [width, .18, depth], [0, 0, 0], 0x211617, { roughness: .95 });
  meshBox('ceiling', [width, .18, depth], [0, height, 0], 0x080707, { roughness: 1 });
  meshBox('backWall', [width, height, .2], [0, height / 2, -depth / 2], 0x26191b);
  meshBox('leftWall', [.2, height, depth], [-width / 2, height / 2, 0], 0x1c1315);
  meshBox('rightWall', [.2, height, depth], [width / 2, height / 2, 0], 0x1c1315);
  meshBox('frontWallL', [4.7, height, .2], [-3.65, height / 2, depth / 2], 0x161011);
  meshBox('frontWallR', [4.7, height, .2], [3.65, height / 2, depth / 2], 0x161011);
}

function addLights(kind = 'foyer') {
  scene.add(new THREE.HemisphereLight(0x30151b, 0x060305, .32));
  const lamp = new THREE.PointLight(kind === 'nursery' ? 0xffd2b0 : 0xffb0a8, kind === 'corridor' ? 16 : 24, 13, 2.2);
  lamp.position.set(kind === 'corridor' ? -1.7 : 0, 4.15, 0);
  lamp.castShadow = true;
  lamp.shadow.mapSize.set(1024, 1024);
  scene.add(lamp);
  const cold = new THREE.PointLight(0x6079a8, 8, 10, 2);
  cold.position.set(3.8, 1.7, -4.8);
  scene.add(cold);
}

function buildFoyer() {
  clearRoom();
  buildShell();
  addLights('foyer');
  cameraRig.position.set(0, 0, 0);
  camera.position.set(0, 1.65, 5.4);
  yaw = 0; pitch = 0;

  meshBox('rug', [4.8, .035, 6.4], [0, .12, .6], 0x4a1117, { roughness: 1 });
  const table = meshBox('console', [3.4, .22, 1], [0, 1.15, -4.8], 0x25120d);
  meshBox('leg1', [.22, 1.1, .22], [-1.35, .58, -4.8], 0x25120d);
  meshBox('leg2', [.22, 1.1, .22], [1.35, .58, -4.8], 0x25120d);
  const portrait = meshBox('portrait', [2.2, 2.7, .14], [-3.5, 2.65, -6.28], 0x382125);
  const portraitInner = meshBox('portraitFace', [1.72, 2.2, .08], [-3.5, 2.65, -6.18], 0x70504b);
  addInteraction(portraitInner, 'Esamina il ritratto', inspectPortrait);

  const door = meshBox('corridorDoor', [2.1, 3.65, .24], [3.2, 1.92, -6.24], 0x24100e);
  meshBox('doorFrameTop', [2.5, .22, .3], [3.2, 3.82, -6.18], 0x100807);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(.09, 20, 20), material(0x8f6b2d, .35, .7));
  knob.position.set(2.47, 1.86, -6.02); scene.add(knob);
  addInteraction(door, 'Apri la porta', () => {
    if (!flags.keyTaken) return showInspect('PORTA CHIUSA', 'La serratura è vecchia, ma ancora funzionante. Serve una chiave.', []);
    flags.doorUnlocked = true;
    transitionRoom('corridor');
  });

  const key = new THREE.Mesh(new THREE.TorusGeometry(.12, .035, 10, 24), material(0xb78a35, .25, .85));
  key.position.set(0.65, 1.38, -4.63); key.rotation.x = Math.PI / 2; key.visible = flags.portraitMoved && !flags.keyTaken; scene.add(key);
  addInteraction(key, 'Raccogli la chiave', () => {
    flags.keyTaken = true; key.visible = false; addItem('Chiave annerita');
    narrate('Clara', 'Non usarla sulla prima porta che trovi. La casa ama farti credere di avere scelto da solo.', 'foyer');
  });

  const doll = createDoll([1.2, .15, -1.9]);
  addInteraction(doll, 'Guarda la bambola', inspectDoll);

  const dust = createDust(900, 10, 5, 12);
  scene.add(dust);
  updateRoomUI();
}

function buildCorridor() {
  clearRoom();
  buildShell(6, 22, 4.7); addLights('corridor');
  cameraRig.position.set(0, 0, 0); camera.position.set(0, 1.65, 8.3); yaw = 0; pitch = 0;
  for (let i = 0; i < 6; i++) {
    const z = 5.7 - i * 3.2;
    meshBox('frame', [1.25, 1.55, .1], [i % 2 ? 2.72 : -2.72, 2.35, z], i % 2 ? 0x32171a : 0x231215);
  }
  const endDoor = meshBox('nurseryDoor', [2.1, 3.4, .24], [0, 1.8, -10.87], 0x301312);
  addInteraction(endDoor, 'Entra nella nursery', () => transitionRoom('nursery'));
  const shadow = meshBox('shadow', [.65, 2.35, .18], [-1.4, 1.25, -4.5], 0x020202);
  shadow.userData.animate = true;
  const whisper = meshBox('whisperPoint', [.6, 1.6, .3], [2.72, 1.3, -1], 0x141010);
  addInteraction(whisper, 'Avvicinati al sussurro', () => narrate('Voce sconosciuta', 'Clara non è la bambina che devi salvare.', null));
  scene.add(createDust(700, 5, 4, 20)); updateRoomUI();
}

function buildNursery() {
  clearRoom(); buildShell(10, 12, 4.8); addLights('nursery');
  cameraRig.position.set(0, 0, 0); camera.position.set(0, 1.65, 4.8); yaw = 0; pitch = 0;
  meshBox('bed', [3.3, .7, 5.2], [-2.7, .48, -2.1], 0x3a2525);
  meshBox('headboard', [3.3, 2.2, .25], [-2.7, 1.4, -4.65], 0x2b1715);
  const clockFace = new THREE.Mesh(new THREE.CylinderGeometry(.62, .62, .16, 40), material(0xddd1b4, .8, .05));
  clockFace.rotation.x = Math.PI / 2; clockFace.position.set(2.8, 2.5, -5.78); scene.add(clockFace);
  addInteraction(clockFace, 'Esamina l’orologio', () => showInspect('OROLOGIO FERMO', 'Le lancette segnano le 3:09. Sul vetro è inciso: «Quando la madre canta, la figlia conta».', [{ label:'Memorizza 3:09', action:()=>addItem('Ora: 3:09') }]));
  const cradle = meshBox('cradle', [2.2, 1.25, 1.2], [2.6, .85, -1.1], 0x43271b);
  addInteraction(cradle, 'Guarda nella culla', () => {
    flash(); narrate('Clara', 'Non sono mai stata in quella culla. Ma ogni notte qualcosa respirava al posto mio.', 'doll');
  });
  scene.add(createDust(800, 9, 4, 11)); updateRoomUI();
}

function createDoll(pos) {
  const group = new THREE.Group();
  const dress = new THREE.Mesh(new THREE.ConeGeometry(.36, 1.05, 18), material(0x4e1217));
  dress.position.y = .62; group.add(dress);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.28, 26, 20), material(0xb88d75, .68));
  head.position.y = 1.28; head.scale.y = 1.12; group.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(.3, 22, 15, 0, Math.PI * 2, 0, Math.PI * .56), material(0x1b0c08, .9));
  hair.position.y = 1.36; hair.rotation.x = -.18; group.add(hair);
  [-.1,.1].forEach(x=>{const eye=new THREE.Mesh(new THREE.SphereGeometry(.025,10,10),material(0x090303,.2,.2));eye.position.set(x,1.31,.265);group.add(eye)});
  group.position.set(...pos); group.rotation.y = -.18; scene.add(group); return group;
}

function createDust(count, width, height, depth) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  for (let i=0;i<count;i++) { positions[i*3]=(Math.random()-.5)*width; positions[i*3+1]=Math.random()*height; positions[i*3+2]=(Math.random()-.5)*depth; }
  geometry.setAttribute('position', new THREE.BufferAttribute(positions,3));
  return new THREE.Points(geometry,new THREE.PointsMaterial({color:0xbfa9a1,size:.012,transparent:true,opacity:.28}));
}

function inspectPortrait() {
  if (!flags.portraitMoved) {
    flags.portraitMoved = true;
    const portrait = scene.getObjectByName('portrait');
    const face = scene.getObjectByName('portraitFace');
    portrait.rotation.z = -.16; face.rotation.z = -.16;
    const key = interactables.find(o=>o.userData.label==='Raccogli la chiave'); if (key) key.visible = true;
    narrate('Narratore', 'Il ritratto cede con un gemito del legno. Dietro la cornice, una chiave annerita riflette una luce che non esiste.', null);
  } else showInspect('RITRATTO DI FAMIGLIA', 'Gli occhi della madre sono stati graffiati via. Clara, invece, guarda direttamente verso la porta.', []);
}

function inspectDoll() {
  if (!flags.dollSeen) { flags.dollSeen = true; flash(); cameraShake(.22); narrate('Clara', 'Non guardarla troppo a lungo. Quando imparò il mio volto, cominciò a usarlo nei sogni di mia madre.', 'doll'); }
  else showInspect('BAMBOLA SENZA NOME', 'La testa sembra essersi girata di pochi gradi. Forse era già così.', []);
}

function addItem(item) {
  if (!inventory.includes(item)) inventory.push(item);
  $('#inventoryItems').textContent = inventory.length ? inventory.join(' · ') : 'Vuoto';
}

function updateRoomUI() {
  $('#roomTitle').textContent = roomData[activeRoom].title;
  $('#objectiveText').textContent = roomData[activeRoom].objective;
}

function transitionRoom(room) {
  $('#transitionCurtain').classList.add('active');
  setTimeout(() => {
    activeRoom = room;
    if (room === 'foyer') buildFoyer();
    if (room === 'corridor') buildCorridor();
    if (room === 'nursery') buildNursery();
  }, 780);
  setTimeout(() => $('#transitionCurtain').classList.remove('active'), 1850);
}

function showInspect(title, text, actions=[]) {
  $('#inspectTitle').textContent = title; $('#inspectText').textContent = text;
  const wrap = $('#inspectActions'); wrap.innerHTML='';
  actions.forEach(a=>{ const b=document.createElement('button');b.className='action';b.textContent=a.label;b.onclick=()=>{a.action();hideInspect()};wrap.appendChild(b); });
  $('#inspectPanel').classList.remove('hidden');
}
function hideInspect(){ $('#inspectPanel').classList.add('hidden'); }

function chooseVoice(speaker) {
  const voices = speechSynthesis.getVoices().filter(v=>v.lang?.toLowerCase().startsWith('it'));
  const female = voices.find(v=>/elsa|isabella|alice|female|femmina/i.test(v.name));
  const male = voices.find(v=>/diego|male|maschio/i.test(v.name));
  return speaker==='Clara' ? (female||voices[0]) : (male||voices[0]);
}

function splitSpeech(text) {
  return text.match(/[^.!?…]+[.!?…]?/g)?.map(s=>s.trim()).filter(Boolean) || [text];
}

async function narrate(speaker, text, audioKey=null) {
  const token = ++narrationToken;
  $('#speaker').textContent=speaker; $('#narrationText').textContent=text; $('#narration').classList.remove('hidden');
  $('#narrationProgress').style.width='0%';
  if (!muted && audioKey && audioFiles[audioKey]) {
    const played = await playRecorded(audioFiles[audioKey], token);
    if (played || token!==narrationToken) return;
  }
  if (!muted && 'speechSynthesis' in window) await playSpeechQueue(speaker,text,token);
}

function playRecorded(src, token) {
  return new Promise(resolve=>{
    if(currentAudio){currentAudio.pause();currentAudio=null}
    const audio=new Audio(src); currentAudio=audio;
    audio.onloadedmetadata=()=>animateProgress(audio.duration*1000,token);
    audio.onended=()=>{ if(token===narrationToken) $('#narration').classList.add('hidden'); resolve(true); };
    audio.onerror=()=>resolve(false);
    audio.play().catch(()=>resolve(false));
  });
}

async function playSpeechQueue(speaker,text,token) {
  speechSynthesis.cancel();
  const parts=splitSpeech(text);
  for(let i=0;i<parts.length;i++){
    if(token!==narrationToken) return;
    await new Promise(resolve=>{
      const u=new SpeechSynthesisUtterance(parts[i]);
      u.lang='it-IT';u.voice=chooseVoice(speaker);u.rate=speaker==='Clara'?.76:.72;u.pitch=speaker==='Clara'?.82:.58;u.volume=.95;
      u.onend=resolve;u.onerror=resolve;
      speechSynthesis.speak(u);
      const keepAlive=setInterval(()=>{if(!speechSynthesis.speaking){clearInterval(keepAlive);resolve()}else{speechSynthesis.pause();speechSynthesis.resume()}},7000);
      u.onend=()=>{clearInterval(keepAlive);resolve()};u.onerror=()=>{clearInterval(keepAlive);resolve()};
    });
    $('#narrationProgress').style.width=`${((i+1)/parts.length)*100}%`;
  }
  if(token===narrationToken) setTimeout(()=>$('#narration').classList.add('hidden'),350);
}

function animateProgress(duration,token){const start=performance.now();function tick(now){if(token!==narrationToken)return;const p=Math.min(100,(now-start)/duration*100);$('#narrationProgress').style.width=p+'%';if(p<100)requestAnimationFrame(tick)}requestAnimationFrame(tick)}
function stopNarration(){narrationToken++;speechSynthesis.cancel();if(currentAudio){currentAudio.pause();currentAudio=null}$('#narration').classList.add('hidden')}
function flash(){const el=$('#damageFlash');el.classList.remove('flash');void el.offsetWidth;el.classList.add('flash')}
let shake=0;function cameraShake(amount){shake=Math.max(shake,amount)}

function updateLook() {
  pitch=Math.max(-1.05,Math.min(1.05,pitch));
  cameraRig.rotation.y=yaw; camera.rotation.x=pitch;
}

function updateRaycast() {
  raycaster.setFromCamera(pointer,camera);
  const hits=raycaster.intersectObjects(interactables,true).filter(h=>h.object.visible);
  hovered=hits[0]?.object||null;
  while(hovered && !hovered.userData.interactive) hovered=hovered.parent;
  $('#crosshair').classList.toggle('active',!!hovered);
  $('#interactionLabel').classList.toggle('hidden',!hovered);
  if(hovered) $('#interactionLabel').textContent=hovered.userData.label;
}

function activateHovered(){if(hovered?.userData?.action && $('#inspectPanel').classList.contains('hidden'))hovered.userData.action()}

function startGame(){
  started=true;$('#startScreen').classList.remove('active');$('#hud').classList.remove('hidden');buildFoyer();startTimer();
  setTimeout(()=>narrate('Clara','Se stai ascoltando questa registrazione, la casa ti ha già lasciato entrare. Non fidarti delle stanze. Non fidarti delle porte. E qualunque cosa accada, non permettere alla bambola di vederti uscire.','intro'),650);
}

function startTimer(){clearInterval(timerId);timerId=setInterval(()=>{timeLeft=Math.max(0,timeLeft-1);const m=Math.floor(timeLeft/60),s=timeLeft%60;$('#timer').textContent=`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;if(timeLeft===0){clearInterval(timerId);narrate('Narratore','La casa chiude tutte le porte. Questa volta, nessuno verrà a cercarti.',null)}},1000)}

$('#headphonesCheck').addEventListener('change',e=>$('#startButton').disabled=!e.target.checked);
$('#startButton').addEventListener('click',startGame);
$('#audioButton').addEventListener('click',()=>{muted=!muted;$('#audioButton').textContent=muted?'🔇':'🔊';if(muted)stopNarration()});
$('#skipNarration').addEventListener('click',stopNarration);
$('#closeInspect').addEventListener('click',hideInspect);

canvas.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture?.(e.pointerId)});
canvas.addEventListener('pointermove',e=>{if(!dragging)return;const dx=e.clientX-lastX,dy=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;yaw-=dx*.0042;pitch-=dy*.0035;updateLook()});
canvas.addEventListener('pointerup',e=>{dragging=false;canvas.releasePointerCapture?.(e.pointerId);if(Math.abs(e.clientX-lastX)<8&&Math.abs(e.clientY-lastY)<8)activateHovered()});
canvas.addEventListener('click',activateHovered);
window.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')activateHovered();if(e.key==='Escape'){hideInspect();stopNarration()}});
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});

function animate(){
  const t=clock.getElapsedTime();
  if(started){
    updateRaycast();
    scene.traverse(o=>{if(o.userData.animate)o.position.x=-1.4+Math.sin(t*.7)*.12});
    const lamp=scene.children.find(o=>o.isPointLight);if(lamp)lamp.intensity*=.985+Math.random()*.03;
    camera.position.y=1.65+Math.sin(t*1.3)*.007;
    if(shake>0){camera.position.x=(Math.random()-.5)*shake;camera.position.y+= (Math.random()-.5)*shake;shake*=.86}else camera.position.x=0;
  }
  renderer.render(scene,camera);
}
renderer.setAnimationLoop(animate);

buildFoyer();