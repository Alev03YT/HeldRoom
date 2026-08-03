/* One synchronized interface; no duplicate room labels or cards. */
(function(){
  const q=s=>document.querySelector(s);
  const play=q('#playScreen');
  if(!play)return;

  document.querySelectorAll('.premium-left,.premium-right,.premium-bottom-left,.premium-bottom-right,.hr-left,.hr-right,.hr-voice,.hr-flash,.game-info,.game-stats,.voice-card,.flash-control').forEach(el=>el.remove());

  const info=document.createElement('aside');
  info.className='game-info';
  info.innerHTML='<h2 id="cleanRoom">ATRIO</h2><p id="cleanSubtitle">Prima stanza della casa.</p><p>Ascolta. Osserva.</p><p class="danger">La casa non dimentica.</p><div class="game-objective"><small>OBIETTIVO</small><strong id="cleanObjective"></strong></div>';

  const stats=document.createElement('aside');
  stats.className='game-stats';
  stats.innerHTML='<div class="stat-card"><small>TEMPO DI GIOCO</small><b id="cleanTimer">60:00</b></div><div class="stat-card"><small>PROGRESSI</small><p><span id="cleanClues">0</span> / 17 INDIZI</p><p><span id="cleanPuzzles">0</span> / 5 ENIGMI</p></div><div class="stat-card"><small>DIARIO</small><p>Nuova voce sbloccata</p><p>La bambola</p><p class="danger">Guarda nel diario</p></div>';

  const voice=document.createElement('aside');
  voice.className='voice-card';
  voice.innerHTML='<h3>VOCE NATURALE</h3><p><span class="danger">Voce di Clara</span><br>La casa conserva ogni suono. Non lasciare che impari il tuo.</p><div class="voice-wave"></div>';

  const flash=document.createElement('aside');
  flash.className='flash-control';
  flash.innerHTML='<button type="button" aria-label="Torcia">▰</button>';

  play.append(info,stats,voice,flash);

  const names={foyer:'ATRIO',parlor:'SALOTTO',corridor:'CORRIDOIO',nursery:'NURSERY',attic:'SOFFITTA'};
  const subtitles={foyer:'Prima stanza della casa.',parlor:'Il salotto del grammofono.',corridor:'Il corridoio delle ombre.',nursery:'La stanza di Clara.',attic:'La soffitta dei nomi.'};
  const solved=['foyerSolved','parlorSolved','corridorSolved','nurserySolved','atticSeal'];

  function currentState(){return window.state||null}
  function update(){
    const s=currentState();
    const scene=s?.scene||q('#sceneLayer')?.dataset.scene||'foyer';
    q('#cleanRoom').textContent=names[scene]||String(scene).toUpperCase();
    q('#cleanSubtitle').textContent=subtitles[scene]||'';
    q('#cleanTimer').textContent=q('#timer')?.textContent||'60:00';
    q('#cleanObjective').textContent=q('#objectiveText')?.textContent||'Esplora la stanza e scopri ciò che nasconde.';
    if(s){
      const clues=Object.values(s.flags||{}).filter(Boolean).length+(s.items||[]).length;
      q('#cleanClues').textContent=Math.min(17,clues);
      q('#cleanPuzzles').textContent=solved.filter(k=>s.flags?.[k]).length;
    }
  }

  flash.querySelector('button').addEventListener('click',()=>document.body.classList.toggle('flashlight-on'));
  new MutationObserver(update).observe(q('#sceneLayer'),{attributes:true,attributeFilter:['data-scene']});
  setInterval(update,350);
  update();
})();
