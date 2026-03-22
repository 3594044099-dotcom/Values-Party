/**
 * Pass-and-play “align your values” party game (English UI).
 * All-ages build: Adult category is omitted.
 */

/** @typedef {{ id: string; label: string; hint: string; themes: string[] }} ThemeCategory */

/** @type {ThemeCategory[]} */
const THEME_CATEGORIES = [
  {
    id: "normal",
    label: "Normal",
    hint: "Everyday life, trust, and how you weigh things—nothing too wild.",
    themes: [
      "How much does this match your personal definition of “living well”?",
      "How much would you trust this person with a secret that could embarrass you?",
      "How fair does this feel—if your own happiness were the only stake?",
      "How much does this line up with your idea of a “good person”?",
      "How peaceful would you feel if this worry disappeared forever?",
      "How much is this worth to you compared to a close friend’s approval?",
      "How strongly do you feel this should be a universal human right?",
      "How much does this feel like “success” to you—not to others’ eyes?",
      "How thrilled would you be to unwrap this as a surprise gift? (1 = regift quietly, 100 = keep forever)",
    ],
  },
  {
    id: "humor",
    label: "Humor",
    hint: "Silly hypotheticals—don’t take the scale too seriously.",
    themes: [
      "How much would you want this as a pet—if it were the size of a bus?",
      "How embarrassing would it be if your search history showed you’d watched this for three hours straight?",
      "How much would you pay to never hear this joke again?",
      "How much does this food deserve to be a minor crime?",
      "How much would you want to wrestle this person in a foam pit—just for fun?",
      "How much would you want this song on repeat at your funeral (for laughs)?",
      "How much would you want your group chat renamed to this?",
      "How much would you want a reality show about your life if the narrator only said this word?",
    ],
  },
  {
    id: "romance",
    label: "Romance",
    hint: "Crushes, couples, soft feelings—keep it playful and consensual.",
    themes: [
      "How much would you want a second date after one awkward coffee—if this happened?",
      "How much would you forgive someone who forgot your anniversary—for this excuse?",
      "How much would you want this line in a love letter from your crush?",
      "How much would you bend your “no PDA” rule for this?",
      "How much would you want your partner to genuinely laugh at this?",
      "How much would you want to wake up next to someone whose worst habit is this?",
      "How much would this make you text your ex—if you were honest with yourself?",
      "How much would you want “our song” to be about this—if you had to pick today?",
    ],
  },
  {
    id: "deep",
    label: "Deep",
    hint: "Heavy stuff—meaning, regret, legacy. Skip if the mood’s too light.",
    themes: [
      "How much would you regret not doing this when you look back on your life?",
      "How much would you want this carved on your tombstone—metaphorically?",
      "How much would this belong on your life’s “highlight reel” (the good kind)?",
      "How much would you miss this if it vanished from the world tomorrow?",
      "How much would you trade a year of comfort for a year of this in your life?",
      "How much would you rather be known for this than for being rich?",
      "How much would you forgive someone who did this to you—without an apology?",
      "How much would you want your future self to be proud you chose this?",
      "How much does this deserve to go viral—for reasons you’d stand behind?",
    ],
  },
];

const RANDOM_ANY_ID = "random_any";

function getAllThemesFlat() {
  return THEME_CATEGORIES.flatMap((c) => c.themes);
}

function pickRandomFromCategory(catId) {
  const cat = THEME_CATEGORIES.find((c) => c.id === catId);
  if (!cat || cat.themes.length === 0) {
    const all = getAllThemesFlat();
    return all[Math.floor(Math.random() * all.length)];
  }
  const t = cat.themes;
  return t[Math.floor(Math.random() * t.length)];
}

function pickRandomAnyCategory() {
  const all = getAllThemesFlat();
  return all[Math.floor(Math.random() * all.length)];
}

/** @typedef {{ id: string; name: string; number: number; clue: string }} Player */

/** @type {Player[]} */
let players = [];
let themeText = "";
let dealIndex = 0;
let clueIndex = 0;
let revealedForDeal = false;

const screens = {
  home: /** @type {HTMLElement} */ (document.getElementById("screen-home")),
  setup: /** @type {HTMLElement} */ (document.getElementById("screen-setup")),
  deal: /** @type {HTMLElement} */ (document.getElementById("screen-deal")),
  clues: /** @type {HTMLElement} */ (document.getElementById("screen-clues")),
  arrange: /** @type {HTMLElement} */ (
    document.getElementById("screen-arrange")
  ),
  result: /** @type {HTMLElement} */ (document.getElementById("screen-result")),
};

function showScreen(name) {
  Object.keys(screens).forEach((key) => {
    const el = screens[/** @type {keyof typeof screens} */ (key)];
    const on = key === name;
    el.classList.toggle("hidden", !on);
    el.hidden = !on;
  });
}

function uniqueRandomNumbers(count, min, max) {
  const pool = [];
  for (let n = min; n <= max; n++) pool.push(n);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function updateCategoryHint() {
  const catSel = /** @type {HTMLSelectElement} */ (
    document.getElementById("theme-category")
  );
  const hintEl = document.getElementById("category-hint");
  if (!hintEl) return;
  const catId = catSel.value;
  if (catId === RANDOM_ANY_ID) {
    hintEl.textContent =
      "We’ll pick one random question from any category when you start.";
    hintEl.classList.remove("hidden");
    hintEl.hidden = false;
    return;
  }
  const cat = THEME_CATEGORIES.find((c) => c.id === catId);
  const text = cat?.hint ?? "";
  hintEl.textContent = text;
  const show = Boolean(text);
  hintEl.classList.toggle("hidden", !show);
  hintEl.hidden = !show;
}

function populateThemeSelect() {
  const catSel = /** @type {HTMLSelectElement} */ (
    document.getElementById("theme-category")
  );
  const themeSel = /** @type {HTMLSelectElement} */ (
    document.getElementById("theme-select")
  );
  const catId = catSel.value;

  if (catId === RANDOM_ANY_ID) {
    themeSel.innerHTML = "";
    const opt = document.createElement("option");
    opt.value = "random";
    opt.textContent = "Surprise me (random from all categories)";
    themeSel.appendChild(opt);
    themeSel.disabled = true;
    updateCategoryHint();
    return;
  }

  themeSel.disabled = false;
  const cat = THEME_CATEGORIES.find((c) => c.id === catId);
  themeSel.innerHTML = "";
  if (!cat) {
    updateCategoryHint();
    return;
  }
  cat.themes.forEach((t, i) => {
    const opt = document.createElement("option");
    opt.value = `${cat.id}:${i}`;
    opt.textContent = t.length > 72 ? `${t.slice(0, 69)}…` : t;
    opt.title = t;
    themeSel.appendChild(opt);
  });
  const randomOpt = document.createElement("option");
  randomOpt.value = "random";
  randomOpt.textContent = "Random in this category";
  themeSel.appendChild(randomOpt);
  updateCategoryHint();
}

function initSetup() {
  const countSel = /** @type {HTMLSelectElement} */ (
    document.getElementById("player-count")
  );
  countSel.innerHTML = "";
  for (let n = 3; n <= 8; n++) {
    const opt = document.createElement("option");
    opt.value = String(n);
    opt.textContent = `${n} players`;
    countSel.appendChild(opt);
  }

  const catSel = /** @type {HTMLSelectElement} */ (
    document.getElementById("theme-category")
  );
  catSel.innerHTML = "";
  THEME_CATEGORIES.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = c.label;
    catSel.appendChild(opt);
  });
  const anyOpt = document.createElement("option");
  anyOpt.value = RANDOM_ANY_ID;
  anyOpt.textContent = "Random (any category)";
  catSel.appendChild(anyOpt);

  catSel.addEventListener("change", populateThemeSelect);
  populateThemeSelect();

  countSel.addEventListener("change", renderNameFields);
  renderNameFields();
}

function renderNameFields() {
  const countSel = /** @type {HTMLSelectElement} */ (
    document.getElementById("player-count")
  );
  const n = parseInt(countSel.value, 10) || 3;
  const wrap = document.getElementById("player-names");
  if (!wrap) return;
  wrap.innerHTML = "";
  for (let i = 0; i < n; i++) {
    const label = document.createElement("label");
    label.className = "field";
    label.innerHTML = `<span>Player ${i + 1} name</span>`;
    const input = document.createElement("input");
    input.type = "text";
    input.maxLength = 32;
    input.autocomplete = "off";
    input.placeholder = `Player ${i + 1}`;
    input.id = `player-name-${i}`;
    input.dataset.index = String(i);
    label.appendChild(input);
    wrap.appendChild(label);
  }
}

function getThemeFromForm() {
  const custom = /** @type {HTMLInputElement} */ (
    document.getElementById("theme-custom")
  ).value.trim();
  if (custom) return custom;

  const catSel = /** @type {HTMLSelectElement} */ (
    document.getElementById("theme-category")
  );
  const themeSel = /** @type {HTMLSelectElement} */ (
    document.getElementById("theme-select")
  );
  const catId = catSel.value;

  if (catId === RANDOM_ANY_ID) {
    return pickRandomAnyCategory();
  }

  if (themeSel.value === "random") {
    return pickRandomFromCategory(catId);
  }

  const parts = themeSel.value.split(":");
  const cid = parts[0];
  const idx = parseInt(parts[1], 10);
  const cat = THEME_CATEGORIES.find((c) => c.id === cid);
  const line = cat?.themes[idx];
  if (line) return line;
  return pickRandomFromCategory(catId);
}

function collectPlayers() {
  const countSel = /** @type {HTMLSelectElement} */ (
    document.getElementById("player-count")
  );
  const n = parseInt(countSel.value, 10) || 3;
  /** @type {Player[]} */
  const out = [];
  const nums = uniqueRandomNumbers(n, 1, 100);
  for (let i = 0; i < n; i++) {
    const el = /** @type {HTMLInputElement | null} */ (
      document.getElementById(`player-name-${i}`)
    );
    const name = (el?.value.trim() || `Player ${i + 1}`).slice(0, 32);
    out.push({
      id: `p${i}`,
      name,
      number: nums[i],
      clue: "",
    });
  }
  return out;
}

function startDeal() {
  dealIndex = 0;
  revealedForDeal = false;
  showDealStep();
}

function showDealStep() {
  const p = players[dealIndex];
  document.getElementById("deal-player-name").textContent = p.name;
  const btnReveal = /** @type {HTMLButtonElement} */ (
    document.getElementById("btn-reveal-number")
  );
  const big = /** @type {HTMLElement} */ (document.getElementById("big-number"));
  const btnNext = /** @type {HTMLButtonElement} */ (
    document.getElementById("btn-deal-next")
  );

  btnReveal.classList.remove("hidden");
  btnReveal.hidden = false;
  big.classList.add("hidden");
  big.hidden = true;
  big.textContent = "";
  btnNext.classList.add("hidden");
  btnNext.hidden = true;
  revealedForDeal = false;

  btnReveal.onclick = () => {
    big.textContent = String(p.number);
    big.classList.remove("hidden");
    big.hidden = false;
    btnReveal.classList.add("hidden");
    btnReveal.hidden = true;
    btnNext.classList.remove("hidden");
    btnNext.hidden = false;
    revealedForDeal = true;
  };

  btnNext.onclick = () => {
    if (!revealedForDeal) return;
    dealIndex++;
    if (dealIndex >= players.length) {
      clueIndex = 0;
      showClueStep();
      return;
    }
    showDealStep();
  };
}

function showClueStep() {
  showScreen("clues");
  const p = players[clueIndex];
  document.getElementById("clue-player-name").textContent = p.name;
  document.getElementById("theme-reminder").textContent = themeText;
  const input = /** @type {HTMLInputElement} */ (
    document.getElementById("clue-input")
  );
  input.value = "";
  input.focus();
}

function submitClue() {
  const input = /** @type {HTMLInputElement} */ (
    document.getElementById("clue-input")
  );
  const text = input.value.trim();
  if (!text) {
    input.focus();
    return;
  }
  players[clueIndex].clue = text.slice(0, 160);
  clueIndex++;
  if (clueIndex >= players.length) {
    showArrange();
    return;
  }
  showClueStep();
}

/** @type {{ id: string; clue: string }}[] */
let arrangeOrder = [];

function showArrange() {
  showScreen("arrange");
  document.getElementById("arrange-theme").textContent = themeText;
  arrangeOrder = players.map((p) => ({ id: p.id, clue: p.clue }));
  shuffleInPlace(arrangeOrder);
  renderSortList();
}

function renderSortList() {
  const ul = /** @type {HTMLUListElement} */ (
    document.getElementById("sort-list")
  );
  ul.innerHTML = "";
  arrangeOrder.forEach((item, idx) => {
    const li = document.createElement("li");
    li.className = "sort-item";
    li.draggable = true;
    li.dataset.id = item.id;

    const rank = document.createElement("span");
    rank.className = "sort-rank";
    rank.textContent = String(idx + 1);

    const body = document.createElement("div");
    body.className = "sort-body";
    body.textContent = item.clue;

    const actions = document.createElement("div");
    actions.className = "sort-actions";
    const up = document.createElement("button");
    up.type = "button";
    up.className = "btn ghost small";
    up.textContent = "↑";
    up.setAttribute("aria-label", "Move up");
    up.disabled = idx === 0;
    const down = document.createElement("button");
    down.type = "button";
    down.className = "btn ghost small";
    down.textContent = "↓";
    down.setAttribute("aria-label", "Move down");
    down.disabled = idx === arrangeOrder.length - 1;

    up.onclick = () => moveItem(idx, -1);
    down.onclick = () => moveItem(idx, 1);

    actions.appendChild(up);
    actions.appendChild(down);

    li.appendChild(rank);
    li.appendChild(body);
    li.appendChild(actions);

    li.addEventListener("dragstart", (e) => {
      li.classList.add("dragging");
      e.dataTransfer?.setData("text/plain", item.id);
      e.dataTransfer?.setDragImage(li, 0, 0);
    });
    li.addEventListener("dragend", () => {
      li.classList.remove("dragging");
    });
    li.addEventListener("dragenter", (e) => {
      e.preventDefault();
    });
    li.addEventListener("dragover", (e) => {
      e.preventDefault();
    });
    li.addEventListener("drop", (e) => {
      e.preventDefault();
      const fromId = e.dataTransfer?.getData("text/plain");
      if (!fromId || fromId === item.id) return;
      const fromIdx = arrangeOrder.findIndex((x) => x.id === fromId);
      const toIdx = arrangeOrder.findIndex((x) => x.id === item.id);
      if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return;
      const [removed] = arrangeOrder.splice(fromIdx, 1);
      arrangeOrder.splice(toIdx, 0, removed);
      renderSortList();
    });

    ul.appendChild(li);
  });
}

function moveItem(index, delta) {
  const j = index + delta;
  if (j < 0 || j >= arrangeOrder.length) return;
  const t = arrangeOrder[index];
  arrangeOrder[index] = arrangeOrder[j];
  arrangeOrder[j] = t;
  renderSortList();
}

function checkOrder() {
  const guessedIds = arrangeOrder.map((x) => x.id);
  const byNum = [...players].sort((a, b) => a.number - b.number);
  const correctIds = byNum.map((p) => p.id);
  let perfect = true;
  for (let i = 0; i < correctIds.length; i++) {
    if (guessedIds[i] !== correctIds[i]) {
      perfect = false;
      break;
    }
  }

  showScreen("result");
  const title = document.getElementById("result-title");
  const summary = document.getElementById("result-summary");
  const compare = document.getElementById("result-compare");

  if (perfect) {
    title.textContent = "You lined up the values!";
    summary.textContent =
      "Your order matches how strongly everyone felt—from the gentlest end of the scale to the strongest. Nice teamwork.";
  } else {
    title.textContent = "Not quite there";
    summary.textContent =
      "Compare below. The true order runs from the lowest number (mildest feeling) to the highest (strongest).";
  }

  compare.innerHTML = "";

  const addRow = (label, ids, highlight) => {
    const wrap = document.createElement("div");
    wrap.className = "compare-row" + (highlight ? " ok" : "");
    const lab = document.createElement("div");
    lab.className = "compare-label";
    lab.textContent = label;
    const lines = ids.map((id) => {
      const pl = players.find((p) => p.id === id);
      return pl ? `${pl.number} — ${pl.clue}` : "";
    });
    const body = document.createElement("div");
    body.textContent = lines.join(" → ");
    wrap.appendChild(lab);
    wrap.appendChild(body);
    compare.appendChild(wrap);
  };

  addRow("Your order", guessedIds, perfect);

  const correctLine = document.createElement("div");
  correctLine.className = "compare-row ok";
  const lab2 = document.createElement("div");
  lab2.className = "compare-label";
  lab2.textContent = "Correct order (mildest → strongest)";
  const body2 = document.createElement("div");
  body2.textContent = byNum
    .map((pl) => `${pl.number} — ${pl.clue}`)
    .join(" → ");
  correctLine.appendChild(lab2);
  correctLine.appendChild(body2);
  compare.appendChild(correctLine);

  if (!perfect) {
    const hint = document.createElement("div");
    hint.className = "compare-row bad";
    const lab3 = document.createElement("div");
    lab3.className = "compare-label";
    lab3.textContent = "Tip";
    const body3 = document.createElement("div");
    body3.textContent =
      "Talk through what each line meant to you—people often weigh the same question differently.";
    hint.appendChild(lab3);
    hint.appendChild(body3);
    compare.appendChild(hint);
  }
}

function wire() {
  document.getElementById("btn-new-game").onclick = () => {
    showScreen("setup");
  };
  document.getElementById("btn-back-home").onclick = () => {
    showScreen("home");
  };
  document.getElementById("btn-start-deal").onclick = () => {
    themeText = getThemeFromForm();
    players = collectPlayers();
    showScreen("deal");
    startDeal();
  };
  document.getElementById("btn-submit-clue").onclick = submitClue;
  document.getElementById("clue-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") submitClue();
  });
  document.getElementById("btn-check-order").onclick = checkOrder;
  document.getElementById("btn-play-again").onclick = () => {
    showScreen("setup");
  };
}

initSetup();
wire();
showScreen("home");
