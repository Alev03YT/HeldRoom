const state = {
  scene: "gate",
  timeLeft: 60 * 60,
  timerId: null,
  started: false,
  muted: false,
  hintsLeft: 3,
  hintsUsed: 0,
  inventory: [],
  flags: {
    graveRead: false,
    gateOpen: false,
    dollSeen: false,
    drawerOpen: false,
    clockSolved: false,
    doorSolved: false,
    mirrorSolved: false,
    ritualSolved: false
  }
};

const scenes = {
  gate: {
    chapter: "CAPITOLO I",
    name: "Il cancello di Ashwood",
    objective: "Trova un modo per entrare nella villa",
    hint: "La lapide non ricorda soltanto un morto: osserva bene l'anno inciso."
  },
  foyer: {
    chapter: "CAPITOLO II",
    name: "L'atrio senza luce",
    objective: "Scopri dove conduce il pianto della bambina",
    hint: "La bambola indica ciò che gli adulti hanno cercato di nascondere."
  },
  nursery: {
    chapter: "CAPITOLO III",
    name: "La stanza dei giochi",
    objective: "Rimetti in moto l'orologio fermo",
    hint: "Le ore importanti sono scritte nella ninna nanna trovata nel cassetto."
  },
  hall: {
    chapter: "CAPITOLO IV",
    name: "Il corridoio degli specchi",
    objective: "Apri la porta della cappella",
    hint: "Non leggere i simboli da sinistra a destra: lo specchio inverte ogni cosa."
  },
  chapel: {
    chapter: "CAPITOLO V",
    name: "La cappella sotterranea",
    objective: "Spezza il legame prima che il tempo finisca",
    hint: "Il rituale segue tre passaggi: protezione, memoria, fuoco."
  }
};

const introLines = [
  "Ottobre, 1974.",
  "La famiglia Vale scomparve dalla villa di Ashwood senza lasciare traccia.",
  "Nella casa fu ritrovata soltanto una bambola seduta davanti alla porta della nursery.",
  "Questa notte hai ricevuto un nastro registrato da Clara Vale.",
  "La sua voce ti ha chiesto di entrare nella villa... e di terminare ciò che lei non riuscì a fare.",
  "Hai sessanta minuti prima che la casa si richiuda per sempre."
];

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const screens = {
  start: $("#startScreen"),
  intro: $("#introScreen"),
  game: $("#gameScreen"),
  ending: $("#endingScreen")
};

let audioCtx;
let ambientNodes = [];
let currentDialogueCallback = null;
let introCancelled = false;

function showScreen(name) {
  Object.values(screens).forEach(screen => screen.classList.remove("active"));
  screens[name].classList.add("active");
}

function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
  startAmbient();
}

function startAmbient() {
  stopAmbient();
  if (state.muted || !audioCtx) return;

  const master = audioCtx.createGain();
  master.gain.value = 0.085;
  master.connect(audioCtx.destination);

  const low = audioCtx.createOscillator();
  const lowGain = audioCtx.createGain();
  low.type = "sine";
  low.frequency.value = state.scene === "chapel" ? 41 : 48;
  lowGain.gain.value = 0.5;
  low.connect(lowGain).connect(master);
  low.start();

  const bufferSize = audioCtx.sampleRate * 2;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const noise = audioCtx.createBufferSource();
  const noiseFilter = audioCtx.createBiquadFilter();
  const noiseGain = audioCtx.createGain();
  noise.buffer = buffer;
  noise.loop = true;
  noiseFilter.type = "lowpass";
  noiseFilter.frequency.value = state.scene === "gate" ? 650 : 280;
  noiseGain.gain.value = state.scene === "gate" ? 0.16 : 0.08;
  noise.connect(noiseFilter).connect(noiseGain).connect(master);
  noise.start();

  ambientNodes = [low, noise, master];
}

function stopAmbient() {
  ambientNodes.forEach(node => {
    try { if (node.stop) node.stop(); } catch (_) {}
    try { node.disconnect(); } catch (_) {}
  });
  ambientNodes = [];
}

function tone(frequency = 180, duration = 0.25, type = "sine", volume = 0.15) {
  if (state.muted || !audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

function thunder() {
  flash();
  tone(62, 1.4, "sawtooth", 0.22);
}

function flash() {
  const el = $("#flash");
  el.classList.remove("active");
  void el.offsetWidth;
  el.classList.add("active");
}

function speak(text, options = {}) {
  if (state.muted || !("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "it-IT";
  utterance.rate = options.rate || 0.82;
  utterance.pitch = options.pitch || 0.72;
  utterance.volume = options.volume || 0.88;
  const voices = speechSynthesis.getVoices();
  const italian = voices.find(v => v.lang.toLowerCase().startsWith("it"));
  if (italian) utterance.voice = italian;
  speechSynthesis.speak(utterance);
}

function typeText(element, text, speed = 30) {
  return new Promise(resolve => {
    element.textContent = "";
    let i = 0;
    const interval = setInterval(() => {
      if (introCancelled) {
        clearInterval(interval);
        resolve();
        return;
      }
      element.textContent += text[i] || "";
      i++;
      if (i >= text.length) {
        clearInterval(interval);
        resolve();
      }
    }, speed);
  });
}

async function playIntro() {
  introCancelled = false;
  showScreen("intro");
  const introText = $("#introText");
  for (const line of introLines) {
    if (introCancelled) break;
    await typeText(introText, line, 36);
    speak(line, { rate: 0.78, pitch: 0.65 });
    await wait(Math.max(2100, line.length * 58));
    if (!introCancelled) introText.textContent = "";
    await wait(350);
  }
  beginGame();
}

function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

function beginGame() {
  if (state.started) return;
  introCancelled = true;
  speechSynthesis.cancel();
  state.started = true;
  showScreen("game");
  renderScene();
  startTimer();
  thunder();
  setTimeout(() => dialogue("Narratore", "Il cancello si è chiuso alle tue spalle. Da questo momento, la casa sa che sei qui."), 700);
  saveGame();
}

function startTimer() {
  clearInterval(state.timerId);
  state.timerId = setInterval(() => {
    state.timeLeft--;
    renderTimer();
    if (state.timeLeft % 20 === 0) saveGame();
    if ([2700, 1800, 900, 300, 60].includes(state.timeLeft)) timeWarning();
    if (state.timeLeft <= 0) finishGame(false);
  }, 1000);
  renderTimer();
}

function timeWarning() {
  if (state.timeLeft <= 300) {
    tone(90, 0.7, "square", 0.18);
    speak(state.timeLeft === 60 ? "Un minuto." : "Il tempo sta finendo.", { pitch: 0.5 });
  }
}

function renderTimer() {
  const minutes = Math.floor(Math.max(0, state.timeLeft) / 60);
  const seconds = Math.max(0, state.timeLeft) % 60;
  $("#timer").textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  $("#timer").classList.toggle("danger", state.timeLeft <= 300);
}

function renderScene() {
  const scene = scenes[state.scene];
  $("#scene").dataset.scene = state.scene;
  $("#chapterLabel").textContent = scene.chapter;
  $("#sceneName").textContent = scene.name;
  $("#objectiveText").textContent = scene.objective;
  $$(".hotspot").forEach(h => h.classList.add("hidden"));

  if (state.scene === "gate") {
    $(".hotspot-gate").classList.remove("hidden");
    $(".hotspot-grave").classList.remove("hidden");
    if (state.flags.gateOpen) $(".hotspot-window").classList.remove("hidden");
  }
  if (state.scene === "foyer") {
    $(".hotspot-doll").classList.remove("hidden");
    if (state.flags.dollSeen) $(".hotspot-drawer").classList.remove("hidden");
  }
  if (state.scene === "nursery") {
    $(".hotspot-clock").classList.remove("hidden");
    if (state.flags.clockSolved) $(".hotspot-door").classList.remove("hidden");
  }
  if (state.scene === "hall") {
    $(".hotspot-mirror").classList.remove("hidden");
    $(".hotspot-door").classList.remove("hidden");
  }
  if (state.scene === "chapel") $(".hotspot-ritual").classList.remove("hidden");

  renderInventory();
  startAmbient();
  saveGame();
}

function renderInventory() {
  const container = $("#inventoryItems");
  if (!state.inventory.length) {
    container.innerHTML = '<span class="empty-inventory">Vuoto</span>';
    return;
  }
  container.innerHTML = state.inventory.map(item => `<span class="inventory-item">${item}</span>`).join("");
}

function addItem(item) {
  if (!state.inventory.includes(item)) {
    state.inventory.push(item);
    renderInventory();
    tone(520, 0.2, "sine", 0.12);
  }
}

function dialogue(speaker, text, callback = null) {
  $("#speaker").textContent = speaker;
  $("#dialogueText").textContent = text;
  $("#dialogue").classList.remove("hidden");
  currentDialogueCallback = callback;
  speak(text, speaker === "Clara" ? { pitch: 1.1, rate: 0.88 } : { pitch: 0.68 });
}

function closeDialogue() {
  $("#dialogue").classList.add("hidden");
  const cb = currentDialogueCallback;
  currentDialogueCallback = null;
  if (cb) cb();
}

function openPuzzle({ kicker = "ENIGMA", title, description, content }) {
  $("#puzzleKicker").textContent = kicker;
  $("#puzzleTitle").textContent = title;
  $("#puzzleDescription").textContent = description;
  $("#puzzleContent").innerHTML = content;
  $("#puzzleFeedback").textContent = "";
  $("#puzzleModal").classList.remove("hidden");
}

function closePuzzle() { $("#puzzleModal").classList.add("hidden"); }

function inspectGate() {
  if (state.flags.gateOpen) return dialogue("Narratore", "Il cancello è aperto. Oltre il vialetto, una finestra della villa è socchiusa.");
  openPuzzle({
    title: "Il lucchetto del custode",
    description: "Quattro cilindri di ottone bloccano il cancello. Sulla placca è inciso: «L'anno in cui Clara smise di crescere». ",
    content: `
      <div class="code-input">
        ${[0,1,2,3].map(i => `<input maxlength="1" inputmode="numeric" data-code="${i}" />`).join("")}
      </div>
      <button class="solve-button" data-solve="gate">APRI IL LUCCHETTO</button>`
  });
}

function inspectGrave() {
  state.flags.graveRead = true;
  dialogue("Narratore", "CLARA VALE — 1966–1974. Sotto il nome, qualcuno ha graffiato la frase: «Non sono mai uscita da quella stanza». ");
  saveGame();
}

function solveGate() {
  const code = $$('[data-code]').map(i => i.value).join("");
  if (code === "1974") {
    state.flags.gateOpen = true;
    $("#puzzleFeedback").textContent = "Il metallo scatta. Qualcosa ride dalla villa.";
    tone(120, .5, "square", .18);
    setTimeout(() => { closePuzzle(); renderScene(); jumpscare(false); }, 900);
  } else {
    $("#puzzleFeedback").textContent = state.flags.graveRead ? "L'anno sulla lapide ha quattro cifre." : "Forse una lapide conserva la risposta.";
    tone(70, .25, "sawtooth", .1);
  }
}

function enterHouse() {
  transitionTo("foyer", () => dialogue("Clara", "Non guardarla negli occhi. Lei impara il volto di chi la vede."));
}

function inspectDoll() {
  if (!state.flags.dollSeen) {
    state.flags.dollSeen = true;
    addItem("Medaglione di Clara");
    jumpscare(true);
    setTimeout(() => {
      renderScene();
      dialogue("Narratore", "La bambola non era lì un istante fa. Al collo porta un medaglione. Dietro di lei, un cassetto si apre da solo.");
    }, 950);
  } else dialogue("Narratore", "I suoi occhi di vetro sembrano seguire ogni tuo movimento.");
}

function inspectDrawer() {
  if (!state.flags.drawerOpen) {
    state.flags.drawerOpen = true;
    addItem("Ninna nanna strappata");
    dialogue("Clara", "Tre rintocchi quando mamma chiudeva la porta. Nove quando lui arrivava. Dodici quando la casa si svegliava.", () => transitionTo("nursery"));
  } else transitionTo("nursery");
}

function inspectClock() {
  if (state.flags.clockSolved) return dialogue("Narratore", "Le lancette sono ferme sulle 3, 9 e 12. Dietro il quadrante si è aperto un passaggio.");
  openPuzzle({
    title: "L'orologio della nursery",
    description: "Premi le ore nell'ordine raccontato dalla ninna nanna.",
    content: `
      <div class="symbol-grid">
        ${[12,3,6,9,1,11].map(n => `<button class="symbol-button" data-hour="${n}">${n}</button>`).join("")}
      </div>
      <button class="solve-button" data-solve="clock">CONFERMA LA SEQUENZA</button>`
  });
  window.clockSequence = [];
}

function solveClock() {
  const answer = (window.clockSequence || []).join("-");
  if (answer === "3-9-12") {
    state.flags.clockSolved = true;
    addItem("Chiave della cappella");
    $("#puzzleFeedback").textContent = "Le lancette girano all'indietro. Una porta appare nella parete.";
    setTimeout(() => { closePuzzle(); renderScene(); thunder(); }, 1000);
  } else {
    window.clockSequence = [];
    $$("[data-hour]").forEach(b => b.classList.remove("selected"));
    $("#puzzleFeedback").textContent = "La ninna nanna ricominciava sempre da capo.";
  }
}

function inspectDoor() {
  if (state.scene === "nursery") {
    if (!state.flags.clockSolved) return dialogue("Narratore", "Non c'è alcuna porta. Solo carta da parati marcia.");
    return transitionTo("hall", () => dialogue("Narratore", "Ogni specchio mostra il corridoio... ma in nessuno dei riflessi compari tu."));
  }
  if (state.scene === "hall") {
    if (!state.flags.mirrorSolved) return dialogue("Narratore", "La chiave entra nella serratura, ma una seconda protezione impedisce alla porta di aprirsi.");
    transitionTo("chapel", () => dialogue("Clara", "Lei non è la bambola. La bambola è soltanto la porta."));
  }
}

function inspectMirror() {
  if (state.flags.mirrorSolved) return dialogue("Narratore", "Sul vetro resta la parola rovesciata: ASH.");
  openPuzzle({
    title: "La frase nello specchio",
    description: "Sul vetro compare: «ERIF — YROMEM — DLEIHS». Tocca i simboli nel giusto ordine.",
    content: `
      <div class="symbol-grid">
        <button class="symbol-button" data-symbol="shield">🛡</button>
        <button class="symbol-button" data-symbol="fire">🔥</button>
        <button class="symbol-button" data-symbol="memory">◉</button>
      </div>
      <button class="solve-button" data-solve="mirror">CONFERMA</button>`
  });
  window.symbolSequence = [];
}

function solveMirror() {
  const answer = (window.symbolSequence || []).join("-");
  if (answer === "shield-memory-fire") {
    state.flags.mirrorSolved = true;
    addItem("Sigillo protettivo");
    $("#puzzleFeedback").textContent = "Lo specchio si incrina dall'interno.";
    setTimeout(() => { closePuzzle(); renderScene(); jumpscare(false); }, 900);
  } else {
    window.symbolSequence = [];
    $$("[data-symbol]").forEach(b => b.classList.remove("selected"));
    $("#puzzleFeedback").textContent = "Leggi le parole come farebbe il tuo riflesso.";
  }
}

function inspectRitual() {
  openPuzzle({
    kicker: "ULTIMO RITUALE",
    title: "Spezza il legame",
    description: "Disponi gli oggetti secondo la formula: protezione, memoria, fuoco.",
    content: `
      <div class="symbol-grid">
        <button class="symbol-button" data-ritual="medallion">📿<br><small>Memoria</small></button>
        <button class="symbol-button" data-ritual="seal">🛡<br><small>Protezione</small></button>
        <button class="symbol-button" data-ritual="flame">🕯<br><small>Fuoco</small></button>
      </div>
      <button class="solve-button" data-solve="ritual">COMPLETA IL RITUALE</button>`
  });
  window.ritualSequence = [];
}

function solveRitual() {
  const answer = (window.ritualSequence || []).join("-");
  if (answer === "seal-medallion-flame") {
    state.flags.ritualSolved = true;
    $("#puzzleFeedback").textContent = "La casa urla. Il legame sta cedendo.";
    tone(45, 2, "sawtooth", .25);
    setTimeout(() => finishGame(true), 1600);
  } else {
    window.ritualSequence = [];
    $$('[data-ritual]').forEach(b => b.classList.remove("selected"));
    $("#puzzleFeedback").textContent = "L'ordine è sbagliato. Qualcosa si avvicina alle tue spalle.";
    jumpscare(true);
  }
}

function transitionTo(nextScene, callback) {
  flash();
  tone(75, .8, "sawtooth", .13);
  setTimeout(() => {
    state.scene = nextScene;
    renderScene();
    if (callback) callback();
  }, 500);
}

function jumpscare(withSound = true) {
  const el = $("#jumpscare");
  el.classList.add("active");
  if (withSound) tone(420, .7, "sawtooth", .35);
  setTimeout(() => el.classList.remove("active"), 820);
}

function useHint() {
  if (state.hintsLeft <= 0) {
    $("#hintText").textContent = "La casa non ti aiuterà più.";
  } else {
    state.hintsLeft--;
    state.hintsUsed++;
    $("#hintText").textContent = scenes[state.scene].hint;
    $("#hintCount").textContent = state.hintsLeft;
    speak(scenes[state.scene].hint, { pitch: .45, rate: .72 });
    saveGame();
  }
  $("#hintModal").classList.remove("hidden");
}

function finishGame(won) {
  clearInterval(state.timerId);
  stopAmbient();
  speechSynthesis.cancel();
  localStorage.removeItem("heldroom-save");
  closePuzzle();
  showScreen("ending");
  if (won) {
    $("#endingKicker").textContent = "HAI SPEZZATO IL LEGAME";
    $("#endingTitle").textContent = "Sei fuggito da Ashwood";
    $("#endingText").textContent = "La bambola brucia senza consumarsi. Per un istante, una bambina ti sorride tra le fiamme. Poi la villa scompare nella nebbia.";
  } else {
    $("#endingKicker").textContent = "IL TEMPO È FINITO";
    $("#endingTitle").textContent = "La casa ti ha trattenuto";
    $("#endingText").textContent = "Allo scoccare dell'ultima ora, ogni porta è scomparsa. Ora una nuova bambola siede nella nursery. Ha il tuo volto.";
  }
  $("#finalTime").textContent = $("#timer").textContent;
  $("#finalHints").textContent = state.hintsUsed;
}

function saveGame() {
  if (!state.started) return;
  const save = {
    scene: state.scene,
    timeLeft: state.timeLeft,
    hintsLeft: state.hintsLeft,
    hintsUsed: state.hintsUsed,
    inventory: state.inventory,
    flags: state.flags,
    savedAt: Date.now()
  };
  localStorage.setItem("heldroom-save", JSON.stringify(save));
}

function loadGame() {
  const raw = localStorage.getItem("heldroom-save");
  if (!raw) return false;
  try {
    const save = JSON.parse(raw);
    const elapsed = Math.floor((Date.now() - save.savedAt) / 1000);
    Object.assign(state, save);
    state.timeLeft = Math.max(1, save.timeLeft - elapsed);
    state.started = true;
    initAudio();
    showScreen("game");
    $("#hintCount").textContent = state.hintsLeft;
    renderScene();
    startTimer();
    return true;
  } catch (_) {
    localStorage.removeItem("heldroom-save");
    return false;
  }
}

$("#headphonesCheck").addEventListener("change", e => $("#startButton").disabled = !e.target.checked);
$("#startButton").addEventListener("click", () => { initAudio(); playIntro(); });
$("#continueButton").addEventListener("click", loadGame);
$("#skipIntro").addEventListener("click", beginGame);
$("#dialogueContinue").addEventListener("click", closeDialogue);
$("#closeModal").addEventListener("click", closePuzzle);
$("#hintButton").addEventListener("click", useHint);
$("#closeHint").addEventListener("click", () => $("#hintModal").classList.add("hidden"));
$("#restartButton").addEventListener("click", () => location.reload());
$("#audioToggle").addEventListener("click", () => {
  state.muted = !state.muted;
  $("#audioToggle").textContent = state.muted ? "🔇" : "🔊";
  if (state.muted) { stopAmbient(); speechSynthesis.cancel(); }
  else { initAudio(); }
});

$("#scene").addEventListener("click", e => {
  const action = e.target.closest("[data-action]")?.dataset.action;
  const actions = {
    "inspect-gate": inspectGate,
    "inspect-grave": inspectGrave,
    "enter-house": enterHouse,
    "inspect-doll": inspectDoll,
    "inspect-drawer": inspectDrawer,
    "inspect-clock": inspectClock,
    "inspect-door": inspectDoor,
    "inspect-mirror": inspectMirror,
    "inspect-ritual": inspectRitual
  };
  if (actions[action]) actions[action]();
});

$("#puzzleContent").addEventListener("click", e => {
  const hour = e.target.closest("[data-hour]");
  const symbol = e.target.closest("[data-symbol]");
  const ritual = e.target.closest("[data-ritual]");
  const solve = e.target.closest("[data-solve]")?.dataset.solve;

  if (hour && window.clockSequence.length < 3) {
    window.clockSequence.push(Number(hour.dataset.hour));
    hour.classList.add("selected");
    tone(150 + Number(hour.dataset.hour) * 12, .16, "sine", .1);
  }
  if (symbol && window.symbolSequence.length < 3) {
    window.symbolSequence.push(symbol.dataset.symbol);
    symbol.classList.add("selected");
  }
  if (ritual && window.ritualSequence.length < 3) {
    window.ritualSequence.push(ritual.dataset.ritual);
    ritual.classList.add("selected");
  }

  if (solve === "gate") solveGate();
  if (solve === "clock") solveClock();
  if (solve === "mirror") solveMirror();
  if (solve === "ritual") solveRitual();
});

$("#puzzleContent").addEventListener("input", e => {
  if (e.target.matches("[data-code]")) {
    e.target.value = e.target.value.replace(/\D/g, "").slice(0, 1);
    if (e.target.value) e.target.nextElementSibling?.focus();
  }
});

window.addEventListener("beforeunload", saveGame);
window.addEventListener("keydown", e => {
  if (e.key === "Escape") { closePuzzle(); $("#hintModal").classList.add("hidden"); }
});

if (localStorage.getItem("heldroom-save")) $("#continueButton").classList.remove("hidden");
setInterval(() => {
  if (state.started && Math.random() > .68) thunder();
}, 18000);
