/* One responsive HUD; removes the overlapping experimental panels. */
(function(){
  const $=s=>document.querySelector(s);
  const play=$('#playScreen');
  if(!play)return;

  document.querySelectorAll('.premium-left,.premium-right,.premium-bottom-left,.premium-bottom-right').forEach(el=>el.remove());

  const left=document.createElement('aside');
  left.className='hr-left';
  left.innerHTML=`<h2 id="hrRoom">ATRIO</h2><p id="hrChapter">Prima stanza della casa.</p><p>Ascolta. Osserva.</p><p class="red">La casa non dimentica.</p><div class="hr-objective"><small>OBIETTIVO</small><strong id="hrObjective">Esplora la casa e scopri i suoi segreti.</strong></div>`;

  const right=document.createElement('aside');
  right.className='hr-right';
  right.innerHTML=`<div class="hr-card"><small>TEMPO DI GIOCO</small><b id="hrTimer">60:00</b></div><div class="hr-card"><small>PROGRESSI</small><p><span id="hrClues">0</span> / 17 INDIZI</p><p><span id="hrPuzzles">0</span> / 5 ENIGMI</p></div><div class="hr-card"><small>DIARIO</small><p>Nuova voce sbloccata</p><p>La bambola</p><p class="red">Guarda nel diario</p></div>`;

  const voice=document.createElement('aside');
  voice.className='hr-voice';
  voice.innerHTML=`<h3>VOCE NATURALE</h3><p><span class="red">Voce di Clara</span><br>La casa conserva ogni suono. Non lasciare che impari il tuo.</p><div class="hr-wave"></div>`;

  const flash=document.createElement('aside');
  flash.className='hr-flash';
  flash.innerHTML='<button type="button" aria-label="Torcia">▰</button>';
  play.append(left,right,voice,flash);

  const roomNames={foyer:'ATRIO',parlor:'SALOTTO',corridor:'CORRIDOIO',nursery:'NURSERY',attic:'SOFFITTA'};
  const roomSub={foyer:'Prima stanza della casa.',parlor:'Il salotto del grammofono.',corridor:'Il corridoio delle ombre.',nursery:'La stanza di Clara.',attic:'La soffitta dei nomi.'};
  const solved=['foyerSolved','parlorSolved','corridorSolved','nurserySolved','atticSeal'];

  function refresh(){
    const scene=window.state?.scene || $('#sceneLayer')?.dataset.scene || 'foyer';
    $('#hrRoom').textContent=roomNames[scene]||scene.toUpperCase();
    $('#hrChapter').textContent=roomSub[scene]||'';
    $('#hrTimer').textContent=$('#timer')?.textContent||'60:00';
    $('#hrObjective').textContent=$('#objectiveText')?.textContent||'Esplora la casa e scopri i suoi segreti.';
    if(window.state){
      const flags=Object.values(state.flags||{}).filter(Boolean).length;
      $('#hrClues').textContent=Math.min(17,flags+(state.items||[]).length);
      $('#hrPuzzles').textContent=solved.filter(k=>state.flags?.[k]).length;
    }
  }

  /* Existing saves could open in a later room while the old static ATRIO card remained.
     Keep progress, but synchronize every label to the actual room. */
  setInterval(refresh,300);
  refresh();

  flash.querySelector('button').addEventListener('click',()=>document.body.classList.toggle('flashlight-on'));
})();
