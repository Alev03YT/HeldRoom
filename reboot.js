const state={time:3600,fear:28,clues:0,puzzles:0,items:['◉','⚿','◍','▧'],muted:false};
const $=s=>document.querySelector(s);
function render(){const m=String(Math.floor(state.time/60)).padStart(2,'0'),s=String(state.time%60).padStart(2,'0');$('#timer').textContent=`${m}:${s}`;$('#clues').textContent=state.clues;$('#puzzles').textContent=state.puzzles;$('#fearValue').textContent=`${state.fear}%`;$('#fearBar').style.width=`${state.fear}%`}
setInterval(()=>{if(state.time>0){state.time--;render()}},1000);
function openInfo(title,text){$('#modalTitle').textContent=title;$('#modalText').textContent=text;$('#modal').classList.add('open')}
$('#closeModal').onclick=()=>$('#modal').classList.remove('open');
document.querySelectorAll('.hotspot').forEach(b=>b.addEventListener('click',()=>{const type=b.dataset.type;if(type==='door')openInfo('Porta dell’atrio','È chiusa. Il metallo della serratura è ancora caldo.');if(type==='doll'){state.fear=Math.min(100,state.fear+8);openInfo('La bambola','I suoi occhi non riflettono la luce. Quando distogli lo sguardo, la sedia scricchiola.')}if(type==='clock'){state.clues=Math.min(17,state.clues+1);openInfo('Orologio a pendolo','Le lancette sono ferme sulle diciannove. Un dettaglio utile per la cassaforte.')}if(type==='portrait'){state.clues=Math.min(17,state.clues+1);openInfo('Ritratto di famiglia','La cornice è leggermente staccata dal muro. Dietro potrebbe esserci qualcosa.')}render()}));
$('#flash').onclick=()=>document.body.classList.toggle('flash-on');
$('#sound').onclick=()=>{state.muted=!state.muted;$('#sound').textContent=state.muted?'🔇':'🔊'};
render();