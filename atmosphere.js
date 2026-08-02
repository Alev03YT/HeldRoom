(() => {
  const $ = (s) => document.querySelector(s);
  const body = document.body;
  let suspenseTimer;
  let breathTimer;
  let blackoutTimer;
  let lastFear = 0;

  function injectOverlays() {
    const ids = ['cinemaBars', 'lensDirt', 'breathFog', 'chromatic'];
    ids.forEach((id) => {
      if (!document.getElementById(id)) {
        const el = document.createElement('div');
        el.id = id;
        el.setAttribute('aria-hidden', 'true');
        body.appendChild(el);
      }
    });
  }

  function readFear() {
    const bar = $('#tensionBar');
    if (!bar) return 0;
    const width = parseFloat(bar.style.width || '0');
    return Number.isFinite(width) ? width : 0;
  }

  function updateFearClass() {
    const fear = readFear();
    body.classList.toggle('high-fear', fear >= 68);
    if (fear > lastFear + 8 && fear >= 45) triggerBreath();
    lastFear = fear;
  }

  function triggerBreath() {
    const fog = $('#breathFog');
    if (!fog) return;
    fog.classList.remove('active');
    void fog.offsetWidth;
    fog.classList.add('active');
  }

  function flickerBlackout() {
    if (!$('#playScreen')?.classList.contains('active')) return;
    if (!$('.modal.hidden') && $('.modal:not(.hidden)')) return;
    body.classList.add('event-blackout');
    clearTimeout(blackoutTimer);
    blackoutTimer = setTimeout(() => body.classList.remove('event-blackout'), 260 + Math.random() * 640);
  }

  function whisperMoment() {
    if (!$('#playScreen')?.classList.contains('active')) return;
    body.classList.add('event-whisper');
    triggerBreath();
    setTimeout(() => body.classList.remove('event-whisper'), 4200);
  }

  function subtleCameraDrift() {
    const camera = $('#camera');
    if (!camera) return;
    const x = (Math.random() - 0.5) * 0.35;
    const y = (Math.random() - 0.5) * 0.28;
    camera.style.setProperty('--drift-x', `${x}%`);
    camera.style.setProperty('--drift-y', `${y}%`);
  }

  function scheduleSuspense() {
    clearTimeout(suspenseTimer);
    suspenseTimer = setTimeout(() => {
      const roll = Math.random();
      if (roll < 0.26) flickerBlackout();
      else if (roll < 0.52) whisperMoment();
      else if (roll < 0.76) subtleCameraDrift();
      else triggerBreath();
      scheduleSuspense();
    }, 16000 + Math.random() * 24000);
  }

  function startBreathingCycle() {
    clearTimeout(breathTimer);
    const run = () => {
      if ($('#playScreen')?.classList.contains('active') && Math.random() < 0.45) triggerBreath();
      breathTimer = setTimeout(run, 26000 + Math.random() * 28000);
    };
    run();
  }

  function bindInteractions() {
    document.addEventListener('click', (event) => {
      if (event.target.closest('.hotspot, .action, #solvePuzzle')) {
        body.classList.remove('event-blackout');
        subtleCameraDrift();
      }
    });

    const observer = new MutationObserver(updateFearClass);
    const bar = $('#tensionBar');
    if (bar) observer.observe(bar, { attributes: true, attributeFilter: ['style'] });
  }

  injectOverlays();
  bindInteractions();
  updateFearClass();
  scheduleSuspense();
  startBreathingCycle();
})();
