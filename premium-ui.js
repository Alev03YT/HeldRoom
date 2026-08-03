/* Builds the premium HUD over the existing game without replacing puzzle logic. */
(function(){
  const hud=document.querySelector('.hud');
  if(hud&&!hud.querySelector('.premium-nav')){
    const nav=document.createElement('nav');
    nav.className='premium-nav';
    nav.innerHTML='<span>GIOCA</span><span>DIARIO</span><span>INVENTARIO</span><span>PROFILO</span><span>IMPOSTAZIONI</span>';
    hud.insertBefore(nav,hud.querySelector('.tension'));
  }

  const left=document.createElement('aside');
  left.className='premium-left';
  left.innerHTML='<h2>ATRIO</h2><p>Prima stanza della casa.</p><p>Ascolta. Osserva.</p><p class="red">La casa non dimentica.</p><div class="objective-box"><small>OBIETTIVO</small><strong id="premiumObjective">Esplora la casa<br>e scopri i suoi segreti.</strong></div>';

  const right=document.createElement('aside');
  right.className='premium-right';
  right.innerHTML='<div class="premium-card"><small>TEMPO DI GIOCO</small><b id="premiumTimer">60:00</b></div><div class="premium-card"><small>PROGRESSI</small><p><span id="premiumClues">0</span> / 17 INDIZI</p><p><span id="premiumPuzzles">0</span> / 5 ENIGMI</p></div><div class="premium-card"><small>DIARIO</small><p>Nuova voce sbloccata</p><p>La bambola</p><p class="red">Guarda nel diario</p></div>';

  const voice=document.createElement('aside');
  voice.className='premium-bottom-left';
  voice.innerHTML='<h3>VOCE NATURALE</h3><div class="voice-layout"><div class="voice-icon">◖</div><div class="voice-copy"><span class="red">Voce di Clara</span><br>La casa conserva ogni suono.<br>Non lasciare che impari il tuo.<div class="voice-wave"></div></div></div>';

  const flash=document.createElement('aside');
  flash.className='premium-bottom-right';
  flash.innerHTML='<button class="flashlight-btn" aria-label="Torcia">▰</button>';

  const play=document.querySelector('#playScreen');
  if(play){play.append(left,right,voice,flash)}

  function refreshPremium(){
    const timer=document.querySelector('#timer');
    const objective=document.querySelector('#objectiveText');
    const pt=document.querySelector('#premiumTimer');
    const po=document.querySelector('#premiumObjective');
    if(timer&&pt)pt.textContent=timer.textContent;
    if(objective&&po)po.textContent=objective.textContent;
    if(window.state){
      const flags=Object.values(state.flags||{}).filter(Boolean).length;
      const items=(state.items||[]).length;
      const clues=document.querySelector('#premiumClues');
      const puzzles=document.querySelector('#premiumPuzzles');
      if(clues)clues.textContent=Math.min(17,flags+items);
      if(puzzles)puzzles.textContent=Math.min(5,['foyerSolved','parlorSolved','corridorSolved','nurserySolved','atticSeal'].filter(k=>state.flags&&state.flags[k]).length);
      const fear=document.querySelector('.tension span');
      if(fear)fear.textContent='LIVELLO PAURA';
    }
  }
  setInterval(refreshPremium,500);
  refreshPremium();

  document.querySelector('.flashlight-btn')?.addEventListener('click',()=>{
    document.body.classList.toggle('flashlight-on');
  });
})();
