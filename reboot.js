const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const state={time:3600,fear:18,muted:false,hints:2,items:[['⚿','Chiave d’ottone']],seen:new Set(),completed:new Set()};
const data={
 desk:{title:'Scrivania del professore',text:'Una pagina strappata mostra tre costellazioni: Corvo, Luna e Sole. Accanto, una nota: «Ruotare dall’oscurità verso la luce».',action:'Raccogli la pagina'},
 globe:{title:'Globo astronomico',text:'Tre anelli di ottone circondano il globo. Ognuno porta inciso uno dei simboli trovati sulla pagina.',action:'Allinea gli anelli'},
 cabinet:{title:'Vetrina delle reliquie',text:'Una serratura meccanica protegge un sigillo nero. Sul bordo compare una sequenza: 3 · 1 · 4.',action:'Inserisci il codice'},
 door:{title:'Porta dell’archivio',text:'Tre sedi circolari interrompono il disegno della serratura. Solo i sigilli corretti possono completarlo.',action:'Inserisci i sigilli'}
};
function vibrate(p=15){navigator.vibrate?.(p)}
function hasItem(name){return state.items.some(item=>item[1]===name)}
function addItem(icon,name){if(!hasItem(name))state.items.push([icon,name])}
function sealCount(){return state.items.filter(item=>item[1].includes('Sigillo')).length}
function render(){
 const m=String(Math.floor(state.time/60)).padStart(2,'0');
 const s=String(state.time%60).padStart(2,'0');
 $('#timer').textContent=`${m}:${s}`;
 $('#fearValue').textContent=`${state.fear}%`;
 $('#fearBar').style.width=`${state.fear}%`;
 $('#inventoryCount').textContent=`${state.items.length} / 6`;
 $('#inventorySlots').innerHTML=[...state.items,...Array(Math.max(0,6-state.items.length)).fill(null)].map(item=>item?`<button class="slot" title="${item[1]}">${item[0]}</button>`:'<div class="slot"></div>').join('');
}
setInterval(()=>{if(state.time>0){state.time--;render()}},1000);
function closeInspect(){$('#inspect').classList.remove('open');$('#inspect').setAttribute('aria-hidden','true')}
function message(title,text,button='Continua'){$('#inspectTitle').textContent=title;$('#inspectText').textContent=text;$('#inspectActions').innerHTML=`<button>${button}</button>`;$('#inspectActions button').onclick=closeInspect}
function openInspect(type){
 const d=data[type];
 $('#inspectTitle').textContent=d.title;$('#inspectText').textContent=d.text;$('#inspectArt').dataset.type=type;
 $('#inspectActions').innerHTML=`<button>${d.action}</button>`;
 $('#inspect').classList.add('open');$('#inspect').setAttribute('aria-hidden','false');
 if(!state.seen.has(type)){state.seen.add(type);state.fear=Math.min(100,state.fear+2)}
 $('#inspectActions button').onclick=()=>resolve(type);render();vibrate(18);
}
function resolve(type){
 if(type==='desk'){
  state.completed.add('desk');addItem('▧','Pagina delle costellazioni');
  $('#objectiveText').textContent='Usa la pagina per allineare il globo astronomico.';
 }else if(type==='globe'){
  if(!state.completed.has('desk'))return message('Non basta girarlo','Manca un ordine preciso. Cerca un appunto che colleghi i simboli.','Continua a cercare');
  state.completed.add('globe');addItem('◐','Sigillo lunare');
  $('#objectiveText').textContent='Il globo ha rivelato 3 · 1 · 4. Cerca dove usare il codice.';
 }else if(type==='cabinet'){
  if(!state.completed.has('globe'))return message('Codice sconosciuto','I tre dischi non si muovono liberamente. Serve una sequenza.','Continua a cercare');
  state.completed.add('cabinet');addItem('◆','Sigillo del corvo');addItem('☼','Sigillo solare');
  $('#objectiveText').textContent='Hai trovato i tre sigilli. Portali alla porta dell’archivio.';
 }else if(type==='door'){
  if(sealCount()<3)return message('Porta incompleta',`Mancano ${3-sealCount()} sigilli. La serratura resta immobile.`,'Torna nella stanza');
  state.completed.add('door');state.fear=Math.min(100,state.fear+10);
  $('#objectiveText').textContent='La porta è aperta. L’archivio ti sta aspettando.';
  message('Archivio sbloccato','I tre sigilli ruotano insieme. La porta si apre lentamente e una luce fredda attraversa la stanza.','Entra nell’archivio');render();return;
 }
 render();closeInspect();
}
$$('.hotspot').forEach(btn=>btn.onclick=()=>openInspect(btn.dataset.type));
$('#closeInspect').onclick=closeInspect;$('#inspectBackdrop').onclick=closeInspect;
$('#flash').onclick=()=>{document.body.classList.toggle('flash-on');vibrate(10)};
$('#sound').onclick=()=>{state.muted=!state.muted;$('#sound').textContent=state.muted?'🔇':'🔊'};
function panelContent(type){
 if(type==='diary')return ['DIARIO',`<div class="sheet-item"><small>REGISTRAZIONE 01</small><b>Il professor Voss</b><p>«Non cercate la chiave. Cercate ciò che completa il disegno.»</p></div><div class="sheet-item"><small>SCOPERTE</small><b>${state.seen.size} oggetti esaminati</b></div>`];
 if(type==='inventory')return ['OGGETTI',`<div class="sheet-grid">${state.items.map(i=>`<div class="sheet-item"><small>OGGETTO</small><b>${i[0]} ${i[1]}</b></div>`).join('')}</div>`];
 if(type==='hints')return ['AIUTI',`<div class="sheet-grid"><div class="sheet-item"><small>DISPONIBILI</small><b>${state.hints}</b></div><div class="sheet-item"><small>SIGILLI</small><b>${sealCount()} / 3</b></div></div><button id="useHint" class="hint-button" style="width:100%;border-radius:4px;margin-top:14px">Usa un aiuto</button>`];
 return ['IMPOSTAZIONI','<div class="sheet-grid"><div class="sheet-item"><small>QUALITÀ</small><b>Alta</b></div><div class="sheet-item"><small>AUDIO</small><b>Spaziale</b></div><div class="sheet-item"><small>VIBRAZIONE</small><b>Attiva</b></div><div class="sheet-item"><small>SALVATAGGIO</small><b>Automatico</b></div></div>'];
}
function closeSheet(){$('#sheet').classList.remove('open');$('#sheet').setAttribute('aria-hidden','true');$$('.app-nav button').forEach(b=>b.classList.toggle('active',b.dataset.panel==='game'))}
function openSheet(type){
 if(type==='game')return closeSheet();
 const [title,html]=panelContent(type);$('#sheetTitle').textContent=title;$('#sheetBody').innerHTML=html;
 $('#sheet').classList.add('open');$('#sheet').setAttribute('aria-hidden','false');
 $$('.app-nav button').forEach(b=>b.classList.toggle('active',b.dataset.panel===type));
 $('#useHint')?.addEventListener('click',()=>{if(state.hints<1)return;state.hints--;closeSheet();$('#inspect').classList.add('open');$('#inspect').setAttribute('aria-hidden','false');message('Suggerimento',state.completed.has('desk')?'I simboli della pagina indicano l’ordine degli anelli del globo.':'La scrivania è il punto di partenza: osserva gli appunti sparsi.','Ho capito');render()});
}
$$('.app-nav button').forEach(b=>b.onclick=()=>openSheet(b.dataset.panel));
$('#closeSheet').onclick=closeSheet;$('#sheetBackdrop').onclick=closeSheet;$('#hintQuick').onclick=()=>openSheet('hints');
function ambientEvent(){setTimeout(()=>{if(!document.hidden){document.body.classList.add('flash-on');setTimeout(()=>document.body.classList.remove('flash-on'),160);state.fear=Math.min(100,state.fear+1);vibrate([10,30,15]);render()}ambientEvent()},14000+Math.random()*18000)}ambientEvent();
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
render();