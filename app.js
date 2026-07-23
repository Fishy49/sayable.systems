/* =========================================================================
   Sayable site interactions
   1) Theme toggle (persisted)
   2) A real, speaking AAC demo board, the whole point of the page.
   No dependencies, no network calls.
   ========================================================================= */
(function () {
  "use strict";

  /* ---------------------------------------------------------------- theme */
  var root = document.documentElement;
  var toggle = document.getElementById("theme-toggle");
  var icon = toggle && toggle.querySelector(".theme-toggle-icon");

  function prefersDark() {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  function store(key, val) {
    try {
      localStorage.setItem(key, val);
    } catch (e) {
      /* private mode, ignore */
    }
  }
  function read(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }
  function syncToggle() {
    if (!toggle) return;
    var explicit = root.getAttribute("data-theme");
    var dark = explicit ? explicit === "dark" : prefersDark();
    if (icon) icon.textContent = dark ? "🌙" : "☀️";
    toggle.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
  }
  if (toggle) {
    toggle.addEventListener("click", function () {
      var explicit = root.getAttribute("data-theme");
      var next = explicit ? (explicit === "dark" ? "light" : "dark") : prefersDark() ? "light" : "dark";
      root.setAttribute("data-theme", next);
      store("sayable-theme", next);
      syncToggle();
    });
    syncToggle();
  }

  /* -------------------------------------------------------------- speech */
  var noteEl = document.getElementById("demo-note");
  var speakBtn = document.getElementById("btn-speak");
  var supportsSpeech = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  var warnedNoSpeech = false;

  function note(msg) {
    if (!noteEl) return;
    noteEl.textContent = msg;
    noteEl.hidden = false;
  }

  // TTS engines read a lone capital letter by name ("capital I"). Speak such
  // words as a homophone so a button sounds the same tapped alone as it does
  // mid-sentence. Only whole-utterance exact matches are rewritten (same fix
  // the app ships in speech.ts).
  var SPOKEN_FIXES = { I: "eye" };

  function speak(text) {
    if (!text) return;
    if (!supportsSpeech) {
      if (!warnedNoSpeech) {
        note("Heads up: this browser has no built-in speech. Everything else works. Try Chrome, Edge, or Safari to hear it talk.");
        warnedNoSpeech = true;
      }
      return;
    }
    var synth = window.speechSynthesis;
    try {
      synth.cancel();
      var phrase = SPOKEN_FIXES[text.trim()] || text;
      var u = new SpeechSynthesisUtterance(phrase);
      u.rate = 0.95;
      u.pitch = 1;
      var voice = pickedVoice();
      if (voice) {
        u.voice = voice;
        u.lang = voice.lang;
      }
      if (speakBtn) {
        speakBtn.classList.add("speaking");
        u.onend = u.onerror = function () {
          speakBtn.classList.remove("speaking");
        };
      }
      synth.speak(u);
    } catch (e) {
      /* no-op */
    }
  }

  /* -------------------------------------------------------------- voices */
  // Voice picker. Browsers hand out getVoices() lazily -- the list is often
  // empty until the async `voiceschanged` event fires -- so the picker is
  // built on both paths, and rebuilt if the engine changes its mind.
  var voicePickerEl = document.getElementById("voice-picker");
  var voiceTrigger = document.getElementById("voice-trigger");
  var voiceTriggerName = document.getElementById("voice-trigger-name");
  var voicePanel = document.getElementById("voice-panel");
  var VOICE_KEY = "sayable-demo-voice";
  var chosenVoiceURI = read(VOICE_KEY) || "";

  // Keep the demo inviting, not overwhelming: show the browser default plus a
  // few on-device English voices, not the whole 100+ catalog. The real app
  // ships the full tabbed picker; this is just a taste of it.
  var DEMO_VOICE_LIMIT = 6;
  // Light quality nudge so the shortlist leads with recognizable voices across
  // platforms instead of the alphabetical novelty voices (macOS "Bad News" etc).
  var PREFERRED = /samantha|alex|daniel|karen|moira|tessa|rishi|aaron|nicky|serena|google|microsoft|zira|david|mark|natural|enhanced|premium/i;

  function pickedVoice() {
    if (!chosenVoiceURI || !supportsSpeech) return null;
    var voices = window.speechSynthesis.getVoices();
    for (var i = 0; i < voices.length; i++) {
      if (voices[i].voiceURI === chosenVoiceURI) return voices[i];
    }
    return null; // saved voice vanished; browser default it is
  }

  // A short, deduped English shortlist: browser default first, then recognizable
  // and on-device voices, then alphabetical - capped so it stays a quick glance.
  function demoVoices() {
    var all = window.speechSynthesis.getVoices();
    var seen = {};
    var english = [];
    for (var i = 0; i < all.length; i++) {
      var v = all[i];
      if (seen[v.voiceURI]) continue;
      seen[v.voiceURI] = true;
      if (/^en/i.test(v.lang)) english.push(v);
    }
    english.sort(function (a, b) {
      if (a.default !== b.default) return a.default ? -1 : 1;
      var pa = PREFERRED.test(a.name);
      var pb = PREFERRED.test(b.name);
      if (pa !== pb) return pa ? -1 : 1;
      if (a.localService !== b.localService) return a.localService ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    return english.slice(0, DEMO_VOICE_LIMIT);
  }

  function voiceRow(v) {
    var uri = v ? v.voiceURI : "";
    var isSel = uri === chosenVoiceURI;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "voice-opt" + (isSel ? " sel" : "");
    btn.setAttribute("role", "menuitemradio");
    btn.setAttribute("aria-checked", isSel ? "true" : "false");

    var play = document.createElement("span");
    play.className = "voice-opt-play";
    play.setAttribute("aria-hidden", "true");
    play.textContent = v ? "▶" : "↺";

    var name = document.createElement("span");
    name.className = "voice-opt-name";
    name.textContent = v ? v.name : "Default voice";

    btn.appendChild(play);
    btn.appendChild(name);

    if (isSel) {
      var chk = document.createElement("span");
      chk.className = "voice-opt-check";
      chk.setAttribute("aria-hidden", "true");
      chk.textContent = "✓";
      btn.appendChild(chk);
    }
    btn.addEventListener("click", function () {
      selectVoice(uri);
    });
    return btn;
  }

  function buildPanel() {
    if (!voicePanel) return;
    voicePanel.textContent = "";
    voicePanel.appendChild(voiceRow(null)); // "Default voice"
    var list = demoVoices();
    // Keep the saved pick visible even if it fell outside the shortlist.
    if (chosenVoiceURI && !list.some(function (v) { return v.voiceURI === chosenVoiceURI; })) {
      var picked = pickedVoice();
      if (picked) list.unshift(picked);
    }
    list.forEach(function (v) {
      voicePanel.appendChild(voiceRow(v));
    });
  }

  function updateTriggerName() {
    if (!voiceTriggerName) return;
    var picked = pickedVoice();
    voiceTriggerName.textContent = picked ? picked.name : "Default voice";
  }

  function openPanel() {
    if (!voicePanel) return;
    buildPanel();
    voicePanel.hidden = false;
    if (voiceTrigger) voiceTrigger.setAttribute("aria-expanded", "true");
  }
  function closePanel() {
    if (!voicePanel) return;
    voicePanel.hidden = true;
    if (voiceTrigger) voiceTrigger.setAttribute("aria-expanded", "false");
  }
  function togglePanel() {
    if (voicePanel && voicePanel.hidden) openPanel();
    else closePanel();
  }

  function selectVoice(uri) {
    chosenVoiceURI = uri;
    store(VOICE_KEY, uri);
    updateTriggerName();
    buildPanel(); // refresh the selected highlight in place, panel stays open
    // Only real user taps reach here, so auditioning the pick is safe and fun.
    speak("Hi! This is how I sound.");
  }

  /* ------------------------------------------------------- board content */
  // cat -> { color var via --cat-<cat>, shape }
  var SHAPES = {
    people: "circle",
    action: "triangle",
    describe: "diamond",
    thing: "square",
    social: "heart",
    folder: "folder"
  };

  // Starter tiles show ARASAAC pictograms (the same set the app ships), looked
  // up by the tile's word. The emoji argument is left in place as a readable
  // inline reference. Symbols live at assets/symbols/<slug>.webp.
  function symPath(text) {
    return "assets/symbols/" + text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + ".webp";
  }
  function isImg(s) {
    return /\.(webp|png|svg|jpe?g|gif)$/i.test(s);
  }
  function w(text, sym, cat) {
    return { text: text, sym: symPath(text), cat: cat };
  }
  function folder(text, sym, to) {
    return { text: text, sym: symPath(text), cat: "folder", goto: to };
  }

  var BOARDS = {
    home: {
      name: "Home",
      cols: 4,
      tiles: [
        w("I", "🙋", "people"),
        w("want", "✋", "action"),
        w("more", "➕", "describe"),
        w("help", "🆘", "social"),
        w("you", "🫵", "people"),
        w("go", "🏃", "action"),
        w("like", "👍", "action"),
        w("stop", "🛑", "action"),
        w("yes", "✅", "social"),
        w("no", "❌", "social"),
        w("please", "🙏", "social"),
        w("thank you", "💖", "social"),
        folder("Food", "🍎", "food"),
        folder("Feelings", "😊", "feelings"),
        folder("Fun", "🎉", "fun"),
        folder("Places", "🏠", "places")
      ]
    },
    food: {
      name: "Food",
      cols: 3,
      tiles: [
        w("apple", "🍎", "thing"),
        w("banana", "🍌", "thing"),
        w("water", "💧", "thing"),
        w("cookie", "🍪", "thing"),
        w("pizza", "🍕", "thing"),
        w("milk", "🥛", "thing"),
        w("eat", "🍽️", "action"),
        w("more", "➕", "describe"),
        folder("Back", "🔙", "home")
      ]
    },
    feelings: {
      name: "Feelings",
      cols: 3,
      tiles: [
        w("happy", "😊", "describe"),
        w("sad", "😢", "describe"),
        w("mad", "😠", "describe"),
        w("tired", "😴", "describe"),
        w("excited", "🤩", "describe"),
        w("love", "❤️", "social"),
        w("I feel", "🙋", "people"),
        w("really", "❗", "describe"),
        folder("Back", "🔙", "home")
      ]
    },
    fun: {
      name: "Fun",
      cols: 3,
      tiles: [
        w("play", "🎮", "action"),
        w("music", "🎵", "thing"),
        w("ball", "⚽", "thing"),
        w("book", "📖", "thing"),
        w("dance", "💃", "action"),
        w("tablet", "📱", "thing"),
        w("again", "🔁", "describe"),
        w("my turn", "🙋", "people"),
        folder("Back", "🔙", "home")
      ]
    },
    places: {
      name: "Places",
      cols: 3,
      tiles: [
        w("home", "🏠", "thing"),
        w("school", "🏫", "thing"),
        w("park", "🏞️", "thing"),
        w("car", "🚗", "thing"),
        w("store", "🛒", "thing"),
        w("outside", "🌳", "thing"),
        w("go", "🏃", "action"),
        w("here", "📍", "describe"),
        folder("Back", "🔙", "home")
      ]
    }
  };

  // Category shape badge geometry (24x24 viewBox)
  var SHAPE_PATH = {
    circle: '<circle cx="12" cy="12" r="9"/>',
    triangle: '<path d="M12 3 L21 20 L3 20 Z"/>',
    diamond: '<path d="M12 2 L22 12 L12 22 L2 12 Z"/>',
    square: '<rect x="4" y="4" width="16" height="16" rx="2"/>',
    heart: '<path d="M12 21s-6.7-4.35-9-8C1.3 10 2.7 6.2 6 6.2c2 0 3.2 1.3 4 2.5 0.8-1.2 2-2.5 4-2.5 3.3 0 4.7 3.8 3 6.8-2.3 3.65-9 8-9 8z"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>'
  };
  function badge(cat) {
    var shape = SHAPES[cat] || "square";
    var span = document.createElement("span");
    span.className = "cat-badge";
    span.setAttribute("aria-hidden", "true");
    span.innerHTML = '<svg viewBox="0 0 24 24">' + (SHAPE_PATH[shape] || "") + "</svg>";
    return span;
  }

  /* --------------------------------------------------------- demo state */
  var boardEl = document.getElementById("board");
  var crumbEl = document.getElementById("demo-crumb");
  var stripEl = document.getElementById("strip");
  var placeholderEl = document.getElementById("placeholder");
  var shapesToggle = document.getElementById("shapes-toggle");

  if (!boardEl) return; // demo not on this page

  var current = "home";
  var utterance = []; // array of {text, sym}
  var shapesOn = false;

  function renderBoard() {
    var board = BOARDS[current];
    boardEl.style.setProperty("--cols", board.cols);
    if (crumbEl) crumbEl.textContent = board.name;
    boardEl.textContent = "";

    board.tiles.forEach(function (t) {
      var isFolder = !!t.goto;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tile" + (isFolder ? " folder" : "");
      btn.style.setProperty("--tile-bg", "var(--cat-" + t.cat + ")");
      btn.setAttribute("aria-label", isFolder ? "Open " + t.text + " folder" : "Speak " + t.text);

      if (shapesOn) btn.appendChild(badge(t.cat));

      var sym = document.createElement("span");
      sym.className = "tile-sym";
      sym.setAttribute("aria-hidden", "true");
      if (isImg(t.sym)) {
        var im = document.createElement("img");
        im.src = t.sym;
        im.alt = "";
        im.loading = "lazy";
        im.draggable = false;
        sym.appendChild(im);
      } else {
        sym.textContent = t.sym;
      }

      var lab = document.createElement("span");
      lab.className = "tile-label";
      lab.textContent = t.text;

      btn.appendChild(sym);
      btn.appendChild(lab);
      btn.addEventListener("click", function () {
        onTile(t, btn);
      });
      boardEl.appendChild(btn);
    });
  }

  function pop(el) {
    el.classList.remove("pop");
    // force reflow so the animation restarts on rapid taps
    void el.offsetWidth;
    el.classList.add("pop");
  }

  function onTile(t, btn) {
    if (t.goto) {
      current = t.goto;
      renderBoard();
      // move focus to the first tile of the new board for keyboard users
      var first = boardEl.querySelector(".tile");
      if (first) first.focus();
      return;
    }
    pop(btn);
    utterance.push({ text: t.text, sym: t.sym });
    renderStrip();
    speak(t.text);
  }

  function renderStrip() {
    if (!stripEl) return;
    stripEl.textContent = "";
    if (utterance.length === 0) {
      var ph = document.createElement("span");
      ph.className = "placeholder";
      ph.id = "placeholder";
      ph.textContent = "Tap tiles to build a sentence…";
      stripEl.appendChild(ph);
      stripEl.setAttribute("aria-label", "Empty sentence. Tap tiles to build one.");
      return;
    }
    utterance.forEach(function (word) {
      var chip = document.createElement("span");
      chip.className = "chip";
      var s = document.createElement("span");
      s.className = "chip-sym";
      s.setAttribute("aria-hidden", "true");
      if (isImg(word.sym)) {
        var csi = document.createElement("img");
        csi.src = word.sym;
        csi.alt = "";
        s.appendChild(csi);
      } else {
        s.textContent = word.sym;
      }
      var txt = document.createElement("span");
      txt.textContent = word.text;
      chip.appendChild(s);
      chip.appendChild(txt);
      stripEl.appendChild(chip);
    });
    stripEl.setAttribute("aria-label", "Sentence: " + sentence() + ". Tap to speak it aloud.");
  }

  function sentence() {
    return utterance
      .map(function (w) {
        return w.text;
      })
      .join(" ");
  }

  /* ------------------------------------------------------------ wiring */
  if (stripEl) {
    stripEl.addEventListener("click", function () {
      if (utterance.length) speak(sentence());
    });
  }
  if (speakBtn) {
    speakBtn.addEventListener("click", function () {
      speak(sentence());
    });
  }
  var backBtn = document.getElementById("btn-back");
  if (backBtn) {
    backBtn.addEventListener("click", function () {
      utterance.pop();
      renderStrip();
    });
  }
  var clearBtn = document.getElementById("btn-clear");
  if (clearBtn) {
    clearBtn.addEventListener("click", function () {
      utterance = [];
      renderStrip();
      if (supportsSpeech) window.speechSynthesis.cancel();
    });
  }
  if (shapesToggle) {
    shapesToggle.addEventListener("change", function () {
      shapesOn = shapesToggle.checked;
      renderBoard();
    });
  }
  if (voicePickerEl) {
    if (!supportsSpeech) {
      // No engine, no voices: don't dangle a dead control.
      voicePickerEl.hidden = true;
    } else if (voiceTrigger && voicePanel) {
      voiceTrigger.addEventListener("click", function (e) {
        e.stopPropagation();
        togglePanel();
      });
      // Taps inside the panel shouldn't bubble out to the close-on-outside.
      voicePanel.addEventListener("click", function (e) {
        e.stopPropagation();
      });
      document.addEventListener("click", function () {
        if (voicePanel && !voicePanel.hidden) closePanel();
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && voicePanel && !voicePanel.hidden) closePanel();
      });
    }
  }

  // Voices load asynchronously in some browsers; set the trigger label now if
  // they're ready, and refresh whenever the engine coughs them up.
  if (supportsSpeech && typeof window.speechSynthesis.getVoices === "function") {
    updateTriggerName();
    window.speechSynthesis.onvoiceschanged = function () {
      updateTriggerName();
      if (voicePanel && !voicePanel.hidden) buildPanel();
    };
  }

  renderBoard();
  renderStrip();
})();
