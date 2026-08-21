/* ============================================================
   Tefriciye Prayer Counter — app logic
   - multi-script prayer text (Kazakh / Russian / Latin / Arabic)
   - adjustable font size
   - tap-to-count button with bead-ring progress (per lap of 100)
   - offline-first (persists via localStorage, cached via sw.js)
   ============================================================ */

// -----------------------------------------------------------
// Prayer text (Salat al-Tafrijiyyah / "Tefriciye").
// Arabic + Latin transliteration are sourced from standard
// Islamic reference material. The Kazakh and Russian Cyrillic
// lines are phonetic transliterations of the same text — please
// double-check them against your local imam/community's
// preferred spelling before relying on them for recitation.
// -----------------------------------------------------------
const PRAYERS = {
  kk: {
    label: "Қазақша",
    dir: "ltr",
    text:
      "Аллаһуммә солли солатән камиләтән уә сәллим сәламән таммән, " +
      "алә сәйидина Мұхаммадин, алләзи тәнхаллу биһил уқоду, " +
      "уә тәнфарижу биһил куробу уә туқзо биһил хауаижу, " +
      "уә туналу биһир роғоибу уә хуснул хоуатими, " +
      "уә юстасқол ғомаму би уәжһиһил карими, " +
      "уә алә алиһи уә сохбиһи фи кулли ләмхатин уә нәфасин " +
      "би адади кулли маълумин лака." +
      "\n\n" +
      "Мағынасы: «Уа, Алла! Біздің қожамыз Мұхаммедке кәміл салауат пен ең әдемі сәлемді жолда! " +
      "Соның себебімен қиындықтар шешімін табады, мұң-қайғылар кетеді, қажеттер өтеледі, " +
      "армандар орындалады, игі істер соңына жетеді. Аса Мейірімді Алланың қалауымен жаңбыр жауады. " +
      "Сондай-ақ әр сәтте және әр демде Өзіңе мәлім сан мөлшерінде оның жанұясы мен сахабаларына да " +
      "мейірім мен тыныштықты нәсіп ет!»."
  },
  ar: {
    label: "العربية",
    dir: "rtl",
    text:
      "اللَّهُمَّ صَلِّ صَلَاةً كَامِلَةً، وَسَلِّمْ سَلَامًا تَامًّا، " +
      "عَلَى سَيِّدِنَا مُحَمَّدٍ الَّذِي تَنْحَلُّ بِهِ الْعُقَدُ، " +
      "وَتَنْفَرِجُ بِهِ الْكُرَبُ، وَتُقْضَى بِهِ الْحَوَائِجُ، " +
      "وَتُنَالُ بِهِ الرَّغَائِبُ وَحُسْنُ الْخَوَاتِمِ، " +
      "وَيُسْتَسْقَى الْغَمَامُ بِوَجْهِهِ الْكَرِيمِ، " +
      "وَعَلَى آلِهِ وَصَحْبِهِ، فِي كُلِّ لَمْحَةٍ وَنَفَسٍ " +
      "بِعَدَدِ كُلِّ مَعْلُومٍ لَكَ."
  }
};

const SCRIPT_ORDER = ["kk", "ar"];
const LAP_SIZE = 100;         // beads fill up once per 100 taps
const FONT_MIN = 14;
const FONT_MAX = 40;
const FONT_STEP = 2;
const FONT_DEFAULT = 21;

const STORAGE_KEY = "tefriciye:state:v1";

// -----------------------------------------------------------
// State (loaded from localStorage so the app resumes exactly
// where it left off — count, chosen script, and font size).
// -----------------------------------------------------------
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        count: Number.isFinite(parsed.count) ? parsed.count : 0,
        script: SCRIPT_ORDER.includes(parsed.script) ? parsed.script : "kk",
        fontSize: clampFont(parsed.fontSize ?? FONT_DEFAULT)
      };
    }
  } catch (e) {
    console.warn("Could not read saved state, starting fresh.", e);
  }
  return { count: 0, script: "kk", fontSize: FONT_DEFAULT };
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("Could not save state (storage may be full/disabled).", e);
  }
}

function clampFont(size) {
  return Math.min(FONT_MAX, Math.max(FONT_MIN, size));
}

let state = loadState();

// -----------------------------------------------------------
// DOM references
// -----------------------------------------------------------
const els = {
  prayerText: document.getElementById("prayerText"),
  scriptSelect: document.getElementById("scriptSelect"),
  fontLabel: document.getElementById("fontLabel"),
  fontMinus: document.getElementById("fontMinus"),
  fontPlus: document.getElementById("fontPlus"),
  countNum: document.getElementById("countNum"),
  tapBtn: document.getElementById("tapBtn"),
  resetBtn: document.getElementById("resetBtn"),
  beadFill: document.getElementById("beadFill"),
  lapLabel: document.getElementById("lapLabel")
};

const BEAD_RADIUS = 46;
const BEAD_CIRC = 2 * Math.PI * BEAD_RADIUS;
els.beadFill.style.strokeDasharray = `${BEAD_CIRC}`;

// -----------------------------------------------------------
// Rendering
// -----------------------------------------------------------
function renderPrayerText() {
  const p = PRAYERS[state.script];
  els.prayerText.textContent = p.text;
  els.prayerText.setAttribute("dir", p.dir);
  els.prayerText.style.setProperty("--font-size", state.fontSize + "px");

  [...els.scriptSelect.children].forEach(btn => {
    const active = btn.dataset.script === state.script;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-pressed", String(active));
  });
}

function renderFontLabel() {
  els.fontLabel.textContent = state.fontSize + " px";
  els.fontMinus.disabled = state.fontSize <= FONT_MIN;
  els.fontPlus.disabled = state.fontSize >= FONT_MAX;
}

function renderCount() {
  els.countNum.textContent = state.count;

  const inLap = state.count % LAP_SIZE;
  const lapsDone = Math.floor(state.count / LAP_SIZE);
  const progress = state.count > 0 && inLap === 0 ? 1 : inLap / LAP_SIZE;

  const offset = BEAD_CIRC * (1 - progress);
  els.beadFill.style.strokeDashoffset = String(offset);

  els.lapLabel.textContent = lapsDone > 0 ? `${lapsDone} × ${LAP_SIZE} done` : "";
}

function renderAll() {
  renderPrayerText();
  renderFontLabel();
  renderCount();
}

// -----------------------------------------------------------
// Interaction
// -----------------------------------------------------------
els.scriptSelect.addEventListener("click", e => {
  const btn = e.target.closest("button[data-script]");
  if (!btn) return;
  state.script = btn.dataset.script;
  saveState();
  renderPrayerText();
});

els.fontMinus.addEventListener("click", () => {
  state.fontSize = clampFont(state.fontSize - FONT_STEP);
  saveState();
  renderPrayerText();
  renderFontLabel();
});

els.fontPlus.addEventListener("click", () => {
  state.fontSize = clampFont(state.fontSize + FONT_STEP);
  saveState();
  renderPrayerText();
  renderFontLabel();
});

els.tapBtn.addEventListener("click", () => {
  state.count += 1;
  saveState();
  renderCount();
  if (navigator.vibrate) navigator.vibrate(12);
});

els.resetBtn.addEventListener("click", () => {
  if (state.count === 0) return;
  const ok = window.confirm("Санақты 0-ге қайта бастау керек пе? Бұл әрекетті кері қайтару мүмкін емес.");
  if (!ok) return;
  state.count = 0;
  saveState();
  renderCount();
});

// -----------------------------------------------------------
// Init + service worker registration (offline support)
// -----------------------------------------------------------
renderAll();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js")
      .then(registration => {
        // A version was already controlling this page before this
        // registration call — so any "new" worker found from here on
        // is an update, not the very first install.
        const isUpdate = !!navigator.serviceWorker.controller;

        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && isUpdate) {
              showUpdateBanner(newWorker);
            }
          });
        });
      })
      .catch(err => {
        console.warn("Service worker registration failed:", err);
      });

    // Reload once, right after the new worker takes control.
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  });
}

function showUpdateBanner(waitingWorker) {
  const banner = document.getElementById("updateBanner");
  const btn = document.getElementById("updateBtn");
  if (!banner || !btn) return;

  banner.hidden = false;
  btn.addEventListener("click", () => {
    waitingWorker.postMessage({ type: "SKIP_WAITING" });
    banner.hidden = true;
  }, { once: true });
}
