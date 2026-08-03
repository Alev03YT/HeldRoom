/* Responsive HUD mirrors live game state without changing puzzle logic. */
(function(){
  const ui=document.createElement('div');
  ui.id='premiumUi';
  ui.innerHTML=`<section class="pui-left"><h2 id="puiRoom">ATRIO</h2><p>Prima stanza della casa.</p><p>Ascolta. Osserva.</p><p><em>La casa non dimentica.</em></p><p class="pui-objective"><span class="pui-label">OBIETTIVO</span><br><span id="puiObjective"></span></p></section><section class="pui-right"><p class="pui-label">TEMPO DI GIOCO</p><strong id="puiTime">60:00</strong><hr><p class="pui-label">PROGRESSI</p><p id="puiProgress">0 / 17 INDIZI<br>0 / 5 ENIGMI</p><hr><p class="pui-label">DIARIO</p><p>Nuova voce sbloccata<br>La bambola</p></section>`;
  document.querySelector('#playScreen')?.appendChild(ui);
  const names={foyer:'ATRIO',parlor:'SALOTTO',corridor:'CORRIDOIO',nursery:'NURSERY',attic:'SOFFITTA'};
  function sync(){
    const scene=window.state?.scene||document.querySelector('#sceneLayer')?.dataset.scene||'foyer';
    document.querySelector('#puiRoom').textContent=names[scene]||scene.toUpperCase();
    document.querySelector('#puiObjective').textContent=document.querySelector('#objectiveText')?.textContent||'';
    document.querySelector('#puiTime').textContent=document.querySelector('#timer')?.textContent||'60:00';
    if(window.state){
      const clues=Object.values(state.flags||{}).filter(Boolean).length;
      const solved=['foyerSolved','parlorSolved','corridorSolved','nurserySolved','atticSeal'].filter(k=>state.flags?.[k]).length;
      document.querySelector('#puiProgress').innerHTML=`${Math.min(clues,17)} / 17 INDIZI<br>${solved} / 5 ENIGMI`;
    }
    requestAnimationFrame(sync);
  }
  sync();
})();
