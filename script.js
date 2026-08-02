const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const state={scene:'foyer',time:3600,muted:false,items:[],flags:{portrait:false,key:false,foyerSolved:false,record:false,parlorSolved:false,clock:false,nurserySolved:false},timer:null};
const rooms={
 foyer:{chapter:'CAPITOLO I',name:'L’atrio senza luce',objective:'Trova la chiave nascosta e apri la porta',hotspots:[
  {x:25,y:43,label:'Ritratto',action:'portrait'},
  {x:51,y:62,label:'Bambola',action:'doll'},
  {x:74,y:55,label:'Porta',action:'foyerDoor'}]},
 parlor:{chapter:'CAPITOLO II',name:'Il salotto del grammofono',objective:'Decifra il messaggio inciso sul disco',hotspots:[
  {x:28,y:45,label:'Grammofono',action:'record'},
  {x:72,y:50,label:'Tenda',action:'curtain'},
  {x:50,y:72,label:'Porta',action:'parlorDoor'}]},
 corridor:{chapter:'PASSAGGIO',name:'Il corridoio delle ombre',objective:'Raggiungi la nursery',hotspots:[
  {x:50,y:48,label:'Ombra',action:'shadow'},
  {x:50,y:72,label:'Nursery',action:'corridorDoor'}]},
 nursery:{chapter:'CAPITOLO III',name:'La nursery di Clara',objective:'Rimetti in moto l’orologio',hotspots:[
  {x:50,y:66,label:'Bambola',action:'nurseryDoll'},
  {x:70,y:38,label:'Orologio',action:'clock'},
  {x:25,y:65,label:'Letto',action:'bed'}]}
};
const dialogueQueue=[];let dialogueDone=null;
function showScreen(id){$$('.screen').forEach(x=>x.classList.remove('active'));$('#'+id).classList.add('active')}
function renderRoom(){const r=rooms[state.scene];$('#sceneLayer').dataset.scene=state.scene;$('#chapterText').textContent=r.chapter;$('#roomName').textContent=r.name;$('#objectiveText').textContent=r.objective;$('#hotspots').innerHTML=r.hotspots.map(h=>`<button class="hotspot" style="left:${h.x}%;top:${h.y}%" data-action="${h.action}" data-label="${h.label}" aria-label="${h.label}"></button>`).join('');$('#inventoryItems').textContent=state.items.length?state.items.join(' · '):'Vuoto';}
function addItem(item){if(!state.items.includes(item)){state.items.push(item);renderRoom()}}
function say(speaker,text,cb){$('#speaker').textContent=speaker;$('#dialogueText').textContent=text;$('#dialogue').classList.remove('hidden');dialogueDone=cb||null;playVoice(text,speaker)}
function closeDialogue(){stopVoice();$('#dialogue').classList.add('hidden');const cb=dialogueDone;dialogueDone=null;if(cb)cb()}
function playVoice(text,speaker){if(state.muted)return;const audio=$('#voiceAudio');audio.pause();audio.removeAttribute('src');if(!('speechSynthesis'in window))return;speechSynthesis.cancel();const chunks=text.match(/[^.!?]+[.!?]+|[^.!?]+$/g)||[text];let i=0;const next=()=>{if(i>=chunks.length)return;const u=new SpeechSynthesisUtterance(chunks[i++].trim());u.lang='it-IT';u.rate=speaker==='Clara'?.78:.82;u.pitch=speaker==='Clara'?.86:.68;u.volume=.92;const voices=speechSynthesis.getVoices();u.voice=voices.find(v=>v.lang?.toLowerCase().startsWith('it'))||null;u.onend=()=>setTimeout(next,120);u.onerror=()=>setTimeout(next,120);speechSynthesis.speak(u)};next()}
function stopVoice(){if('speechSynthesis'in window)speechSynthesis.cancel();$('#voiceAudio').pause()}
function inspect(title,text,actions=[]){$('#inspectTitle').textContent=title;$('#inspectText').textContent=text;$('#inspectActions').innerHTML=actions.map((a,i)=>`<button class="action ${a.secondary?'secondary':''}" data-inspect-action="${i}">${a.label}</button>`).join('');$('#inspectModal').classList.remove('hidden');$('#sceneLayer').classList.add('zooming');$('#inspectActions').onclick=e=>{const b=e.target.closest('[data-inspect-action]');if(!b)return;actions[+b.dataset.inspectAction].run()}}
function closeInspect(){ $('#inspectModal').classList.add('hidden');$('#sceneLayer').classList.remove('zooming') }
function puzzle(title,text,answer,onSuccess){$('#puzzleTitle').textContent=title;$('#puzzleText').textContent=text;$('#puzzleContent').innerHTML=`<input id="puzzleInput" autocomplete="off"><button class="action" id="solvePuzzle">CONFERMA</button>`;$('#puzzleFeedback').textContent='';$('#puzzleModal').classList.remove('hidden');setTimeout(()=>$('#puzzleInput').focus(),50);$('#solvePuzzle').onclick=()=>{const value=$('#puzzleInput').value.trim().toLowerCase();if(value===answer.toLowerCase()){ $('#puzzleFeedback').textContent='Corretto.';setTimeout(()=>{closePuzzle();onSuccess()},450)}else{$('#puzzleFeedback').textContent='La casa non accetta questa risposta.';shake()}}}
function closePuzzle(){$('#puzzleModal').classList.add('hidden')}
function shake(){const s=$('#sceneLayer');s.classList.remove('shake');void s.offsetWidth;s.classList.add('shake')}
function transitionTo(next){const t=$('#transition');t.classList.remove('hidden');t.classList.remove('new-scene');void t.offsetWidth;t.classList.add('new-scene');setTimeout(()=>{state.scene=next;renderRoom()},1500);setTimeout(()=>{t.classList.add('hidden');t.classList.remove('new-scene');if(next==='parlor')say('Clara','Il salotto ricorda ogni voce che ha ascoltato. Non lasciare che impari anche la tua.');if(next==='corridor')say('Narratore','La porta si chiude alle tue spalle. Davanti a te, il corridoio sembra allungarsi.');if(next==='nursery')say('Clara','Questa era la mia stanza. O almeno, è quello che la casa vuole farti credere.')},2700)}
function handleAction(action){
 if(action==='portrait'){if(!state.flags.portrait){inspect('Ritratto della famiglia Vale','La cornice è inclinata. Dietro il vetro, Clara guarda verso il bordo sinistro.',[{label:'Sposta il quadro',run:()=>{state.flags.portrait=true;addItem('Chiave annerita');closeInspect();say('Narratore','Il quadro scivola di lato. Nel muro è nascosta una chiave fredda e pesante.')}}])}else inspect('Ritratto spostato','Dietro la cornice resta soltanto un rettangolo più chiaro sulla parete.')}
 if(action==='doll'){shake();say('Clara','Non guardarla negli occhi. Ogni volta che qualcuno lo fa, lei cambia posizione.')}
 if(action==='foyerDoor'){if(!state.flags.portrait)return inspect('Porta chiusa','La serratura richiede una chiave.');inspect('Porta del salotto','La chiave annerita entra perfettamente nella serratura.',[{label:'Apri ed entra',run:()=>{closeInspect();state.flags.foyerSolved=true;transitionTo('parlor')}}])}
 if(action==='record'){puzzle('Il disco al contrario','La puntina gratta una parola: “ARUTREPA”. Scrivila nel verso corretto.','apertura',()=>{state.flags.record=true;addItem('Frammento di disco');say('Clara','Hai sentito anche tu la seconda voce? Non era sulla registrazione.')})}
 if(action==='curtain'){shake();inspect('La tenda che respira','Il tessuto si gonfia lentamente, anche se la finestra è chiusa.')}
 if(action==='parlorDoor'){if(!state.flags.record)return inspect('Porta del corridoio','Sulla maniglia è incisa una sola parola: “Apertura”.');closeInspect();state.flags.parlorSolved=true;transitionTo('corridor')}
 if(action==='shadow'){shake();say('Voce sconosciuta','Clara non è la bambina che devi salvare.')}
 if(action==='corridorDoor')transitionTo('nursery')
 if(action==='nurseryDoll'){shake();inspect('Bambola senza nome','La testa è ruotata verso l’orologio. Sul vestito sono cuciti i numeri 3, 9 e 12.')}
 if(action==='clock'){puzzle('L’orologio fermo','Inserisci i tre numeri cuciti sul vestito della bambola, nello stesso ordine.','3912',()=>{state.flags.clock=true;addItem('Chiave d’argento');say('Narratore','Le lancette ripartono. Dal muro arriva il rumore di un meccanismo che si sblocca.')})}
 if(action==='bed'){inspect('Sotto il letto','Trovi una ninna nanna strappata. La frase finale è stata cancellata con l’inchiostro.',[{label:'Raccogli il foglio',run:()=>{addItem('Ninna nanna strappata');closeInspect()}}])}
}
function startTimer(){clearInterval(state.timer);state.timer=setInterval(()=>{state.time--;const m=Math.floor(state.time/60),s=state.time%60;$('#timer').textContent=`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;if(state.time<=0){clearInterval(state.timer);say('Narratore','Il tempo è finito. La casa ha scelto chi resterà.')}},1000)}
$('#readyCheck').onchange=e=>$('#startButton').disabled=!e.target.checked;
$('#startButton').onclick=()=>{showScreen('playScreen');renderRoom();startTimer();setTimeout(()=>say('Clara','Se stai ascoltando questa registrazione, la casa ti ha già lasciato entrare. Non fidarti delle stanze. Non fidarti delle porte. E qualunque cosa accada, non permettere alla bambola di vederti uscire.'),500)};
$('#hotspots').onclick=e=>{const b=e.target.closest('[data-action]');if(b)handleAction(b.dataset.action)};
$('#continueDialogue').onclick=closeDialogue;$('#closeInspect').onclick=closeInspect;$('#closePuzzle').onclick=closePuzzle;
$('#soundButton').onclick=()=>{state.muted=!state.muted;$('#soundButton').textContent=state.muted?'🔇':'🔊';if(state.muted)stopVoice()};
