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

  // Some browsers populate voices asynchronously; nudge them to load early.
  if (supportsSpeech && typeof window.speechSynthesis.getVoices === "function") {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = function () {
      window.speechSynthesis.getVoices();
    };
  }

  renderBoard();
  renderStrip();
})();
