/* Align interactive targets and foyer state changes with the cinematic artwork. */
(function(){
  const originalRenderArt = renderArt;
  const originalRenderHotspots = renderHotspots;

  renderArt = function(){
    originalRenderArt();
    const art = document.querySelector('#roomArt');
    if (!art || state.scene !== 'foyer') return;

    art.classList.toggle('foyer-safe-visible', !!state.flags.safeVisible);
    art.classList.toggle('foyer-safe-open', !!state.flags.safeSolved);
    art.classList.toggle('foyer-doll-gone', !!state.flags.dollGone);
  };

  renderHotspots = function(){
    if (state.scene !== 'foyer') return originalRenderHotspots();
    const targets = [
      ['Ritratto', 73, 31, 'portrait'],
      ['Bambola', 72, 64, 'doll'],
      ['Orologio', 65, 36, 'clock'],
      ['Calendario', 29, 55, 'calendar'],
      ['Porta', 51, 50, 'foyerDoor']
    ];
    document.querySelector('#hotspots').innerHTML = targets.map(([label,x,y,action]) =>
      `<button class="hotspot" style="left:${x}%;top:${y}%" data-action="${action}" data-label="${label}" aria-label="${label}"></button>`
    ).join('');
  };

  const oldRenderRoom = renderRoom;
  renderRoom = function(){
    oldRenderRoom();
    const art = document.querySelector('#roomArt');
    if (state.scene === 'foyer' && art) {
      art.setAttribute('aria-label','Atrio vittoriano abbandonato illuminato da candele e temporale');
    }
  };
})();
