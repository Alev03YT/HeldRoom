/* Detailed cinematic sets for all rooms beyond the foyer. */
(function(){
  const previousRenderArt = renderArt;
  const previousRenderHotspots = renderHotspots;

  function corridorMarkup(){
    return `
      <div class="premium-set corridor-set">
        <div class="corridor-ceiling"></div>
        <div class="corridor-floor"></div>
        <div class="corridor-left-wall"></div>
        <div class="corridor-right-wall"></div>
        <div class="corridor-end-door"></div>
        <div class="corridor-runner"></div>
        <div class="corridor-lamp lamp-a"></div>
        <div class="corridor-lamp lamp-b"></div>
        <div class="corridor-frame frame-a"><span></span></div>
        <div class="corridor-frame frame-b"><span></span></div>
        <div class="corridor-frame frame-c"><span></span></div>
        <div class="corridor-frame frame-d"><span></span></div>
        <div class="corridor-console"><i></i><b></b></div>
        <div class="corridor-doll-shadow"></div>
        <div class="corridor-fog"></div>
        <div class="premium-dust"></div>
      </div>`;
  }

  function parlorMarkup(){
    return `
      <div class="premium-set parlor-set">
        <div class="parlor-wall"></div>
        <div class="parlor-window"></div>
        <div class="parlor-curtain curtain-l"></div>
        <div class="parlor-curtain curtain-r"></div>
        <div class="parlor-floor"></div>
        <div class="parlor-rug"></div>
        <div class="parlor-fireplace"><div class="embers"></div></div>
        <div class="parlor-gramophone"><i></i><b></b></div>
        <div class="parlor-chair"></div>
        <div class="parlor-table"><span></span></div>
        <div class="parlor-portrait"></div>
        <div class="parlor-door"></div>
        <div class="premium-dust"></div>
      </div>`;
  }

  function nurseryMarkup(){
    return `
      <div class="premium-set nursery-set">
        <div class="nursery-wall"></div>
        <div class="nursery-window"></div>
        <div class="nursery-floor"></div>
        <div class="nursery-rug"></div>
        <div class="nursery-bed"><i></i></div>
        <div class="nursery-wardrobe"></div>
        <div class="nursery-clock"></div>
        <div class="nursery-cradle"></div>
        <div class="nursery-horse"></div>
        <div class="nursery-doll"></div>
        <div class="nursery-drawings"></div>
        <div class="nursery-hatch"></div>
        <div class="premium-dust"></div>
      </div>`;
  }

  function atticMarkup(){
    return `
      <div class="premium-set attic-set">
        <div class="attic-roof"></div>
        <div class="attic-beam beam-1"></div>
        <div class="attic-beam beam-2"></div>
        <div class="attic-floor"></div>
        <div class="attic-window"></div>
        <div class="attic-trunk"></div>
        <div class="attic-tags"></div>
        <div class="attic-mirror"></div>
        <div class="attic-sheet"></div>
        <div class="attic-chair"></div>
        <div class="attic-rope"></div>
        <div class="premium-dust"></div>
      </div>`;
  }

  renderArt = function(){
    if(state.scene === 'foyer') return previousRenderArt();
    const art = document.querySelector('#roomArt');
    if(!art) return;
    art.dataset.room = state.scene;
    art.style.background = '';
    const markup = {
      parlor: parlorMarkup,
      corridor: corridorMarkup,
      nursery: nurseryMarkup,
      attic: atticMarkup
    }[state.scene];
    art.innerHTML = markup ? markup() : '';
  };

  renderHotspots = function(){
    const premiumTargets = {
      parlor:[['Grammofono',30,59,'record'],['Tenda',18,39,'curtain'],['Porta',84,52,'parlorDoor']],
      corridor:[['Quadri',24,44,'frames'],['Ombra',52,44,'shadow'],['Nursery',50,58,'corridorDoor']],
      nursery:[['Bambola',53,70,'nurseryDoll'],['Orologio',72,34,'nurseryClock'],['Letto',25,64,'bed'],['Botola',87,64,'nurseryDoor']],
      attic:[['Baule',25,66,'trunk'],['Cartellini',56,43,'names'],['Specchio',79,54,'atticMirror']]
    };
    if(!premiumTargets[state.scene]) return previousRenderHotspots();
    document.querySelector('#hotspots').innerHTML = premiumTargets[state.scene].map(([label,x,y,action]) =>
      `<button class="hotspot premium-hotspot" style="left:${x}%;top:${y}%" data-action="${action}" data-label="${label}" aria-label="${label}"></button>`
    ).join('');
  };
})();