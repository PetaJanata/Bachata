import { state } from "./state.js";
import { applyFilters } from "./filters.js";

// ================================
// SOFT ACCESS GATE
// ================================
// NOTE: this site is hosted as static files (GitHub Pages) with no backend,
// so there is no way to truly restrict access to a category — anything sent
// to the browser can be read in devtools. This is intentionally a *soft*
// deterrent (keeps it out of casual browsing / accidental clicks) rather
// than real security. Don't rely on it to protect anything sensitive.
const passwordProtected = {
  "Trénink Peťa": "petaapeta",
  "Trénink Hanka": "petaahanka",
  "Trénink Barča": "petaabarca",
};

export function isPasswordProtected(t2) {
  return passwordProtected[t2];
}

function checkPassword(t2) {
  return prompt("Zadejte heslo:") === passwordProtected[t2];
}

// ================================
// ACTIVE FILTER TAGS (sticky summary at top of sidebar)
// ================================
export function renderActiveFilters() {
  const container = document.getElementById("active-filters");
  if (!container) return;
  container.innerHTML = "";

  const tags = [];

  state.activeLekce.forEach((t2) =>
    tags.push({
      label: t2,
      remove: () => {
        state.activeLekce.delete(t2);
        if (t2 === "Peťák a Renča") {
          state.activeDatum = new Set();
          state.datumActiveYear = null;
        }
        updateNewestButtonVisibility();
        applyFilters();
      },
    })
  );
  state.activeDatum.forEach((d) =>
    tags.push({ label: d, remove: () => { state.activeDatum.delete(d); applyFilters(); } })
  );
  state.activeFigury.forEach((f) =>
    tags.push({ label: f, remove: () => { state.activeFigury.delete(f); applyFilters(); } })
  );
  if (state.activeZnam) {
    tags.push({
      label: state.activeZnam,
      remove: () => { state.activeZnam = null; updateZnamUI(); applyFilters(); },
    });
  }

  if (tags.length === 0) {
    container.style.display = "none";
    return;
  }

  container.style.display = "flex";
  tags.forEach((tag) => {
    const el = document.createElement("span");
    el.className = "active-filter-tag";
    el.textContent = tag.label + " ×";
    el.addEventListener("click", () => {
      tag.remove();
      renderActiveFilters();
      buildMenu(state.videos);
    });
    container.appendChild(el);
  });
}

// ================================
// MENU BUILDER
// ================================
export function buildMenu(videos) {
  const menu = document.getElementById("dynamic-menu");
  menu.innerHTML = "";

  // --- Lekce section ---
  const tree = {};
  videos.forEach((v) => {
    if (!v.t1 || !v.t2) return;
    if (!tree[v.t1]) tree[v.t1] = new Set();
    tree[v.t1].add(v.t2);
  });

  const lekceTitle = document.createElement("div");
  lekceTitle.className = "menu-section-title";
  lekceTitle.textContent = "Lekce";
  menu.appendChild(lekceTitle);

  Object.entries(tree).forEach(([t1, t2set]) => {
    const group = document.createElement("div");
    group.className = "menu-group open";

    const main = document.createElement("button");
    main.className = "menu-main";
    main.textContent = t1;
    main.addEventListener("click", () => group.classList.toggle("open"));

    const sub = document.createElement("div");
    sub.className = "menu-sub";

    t2set.forEach((t2) => {
      const btn = document.createElement("button");
      btn.textContent = t2;
      btn.dataset.t1 = t1;
      btn.dataset.t2 = t2;
      if (state.activeLekce.has(t2)) btn.classList.add("active");
      btn.addEventListener("click", () => {
        applyPrimaryFilter(t1, t2);
        renderActiveFilters();
        buildMenu(videos);
      });
      sub.appendChild(btn);

      if (t2 === "Peťák a Renča" && state.activeLekce.has("Peťák a Renča")) {
        appendDatumSection(sub, videos);
      }
    });

    group.appendChild(main);
    group.appendChild(sub);
    menu.appendChild(group);
  });

  // --- Figury section ---
  const allFigury = [...new Set(videos.flatMap((v) => v.figury || []))].sort();

  if (allFigury.length > 0) {
    const divider = document.createElement("div");
    divider.className = "menu-divider";
    menu.appendChild(divider);

    const figuryTitle = document.createElement("div");
    figuryTitle.className = "menu-section-title";
    figuryTitle.textContent = "Figury";
    menu.appendChild(figuryTitle);

    const figuryWrap = document.createElement("div");
    figuryWrap.className = "figury-chips";

    allFigury.forEach((f) => {
      const chip = document.createElement("button");
      chip.className = "figury-chip" + (state.activeFigury.has(f) ? " active" : "");
      chip.textContent = f;
      chip.addEventListener("click", () => {
        if (state.activeFigury.has(f)) state.activeFigury.delete(f);
        else state.activeFigury.add(f);
        applyFilters();
        renderActiveFilters();
        buildMenu(videos);
      });
      figuryWrap.appendChild(chip);
    });

    menu.appendChild(figuryWrap);
  }
}

// Datum (date) sub-section — year toggle + month grid, only for "Peťák a Renča"
function appendDatumSection(sub, videos) {
  const monthOrder = ["Leden", "Únor", "Březen", "Duben", "Květen", "Červen", "Červenec", "Srpen", "Září", "Říjen", "Listopad", "Prosinec"];
  const monthShort = ["Led", "Úno", "Bře", "Dub", "Kvě", "Čvn", "Čvc", "Srp", "Zář", "Říj", "Lis", "Pro"];

  const dataDates = new Set(
    videos.filter((v) => v.t2 === "Peťák a Renča" && v.datum).map((v) => v.datum)
  );

  const years = [...new Set([...dataDates].map((d) => d.split("-")[0]))].sort((a, b) => Number(b) - Number(a));
  if (years.length === 0) return;

  if (!state.datumActiveYear || !years.includes(state.datumActiveYear)) {
    state.datumActiveYear = years[0];
  }

  const datumWrap = document.createElement("div");
  datumWrap.className = "datum-section";

  const datumTitle = document.createElement("div");
  datumTitle.className = "datum-section-title";
  datumTitle.textContent = "Datum";
  datumWrap.appendChild(datumTitle);

  const yearRow = document.createElement("div");
  yearRow.className = "datum-year-row";
  years.forEach((yr) => {
    const btn = document.createElement("button");
    btn.className = "datum-year-btn" + (yr === state.datumActiveYear ? " active" : "");
    btn.textContent = yr;
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      state.datumActiveYear = yr;
      renderMonthGrid(datumWrap, yr, dataDates, monthOrder, monthShort);
      yearRow.querySelectorAll(".datum-year-btn").forEach((b) => {
        b.classList.toggle("active", b.textContent === yr);
      });
    });
    yearRow.appendChild(btn);
  });
  datumWrap.appendChild(yearRow);

  const gridWrap = document.createElement("div");
  gridWrap.className = "datum-month-grid-wrap";
  datumWrap.appendChild(gridWrap);

  renderMonthGrid(datumWrap, state.datumActiveYear, dataDates, monthOrder, monthShort);
  sub.appendChild(datumWrap);
}

function renderMonthGrid(wrap, yr, dataDates, monthOrder, monthShort) {
  const gridWrap = wrap.querySelector(".datum-month-grid-wrap");
  gridWrap.innerHTML = "";
  const grid = document.createElement("div");
  grid.className = "datum-month-grid";

  monthOrder.forEach((month, i) => {
    const key = yr + "-" + month;
    const hasData = dataDates.has(key);
    const isActive = state.activeDatum.has(key);
    const cell = document.createElement("button");
    cell.className = "datum-month-btn" + (hasData ? " has-data" : " no-data") + (isActive ? " active" : "");
    cell.textContent = monthShort[i];
    cell.disabled = !hasData;
    if (hasData) {
      cell.addEventListener("click", (e) => {
        e.stopPropagation();
        if (state.activeDatum.has(key)) state.activeDatum.delete(key);
        else state.activeDatum.add(key);
        applyFilters();
        renderActiveFilters();
        buildMenu(state.videos);
      });
    }
    grid.appendChild(cell);
  });
  gridWrap.appendChild(grid);
}

// ================================
// FILTER ACTIONS
// ================================
export function applyPrimaryFilter(t1, t2) {
  if (isPasswordProtected(t2) && !checkPassword(t2)) return;

  if (state.activeLekce.has(t2)) {
    state.activeLekce.delete(t2);
    if (t2 === "Peťák a Renča") {
      state.activeDatum = new Set();
      state.datumActiveYear = null;
    }
  } else {
    state.activeLekce.add(t2);
  }

  updateNewestButtonVisibility();
  updateZnamUI();
  applyFilters();
}

export function applyZnamFilter(value) {
  state.activeZnam = state.activeZnam === value ? null : value;
  updateZnamUI();
  applyFilters();
}

export function updateZnamUI() {
  document.querySelectorAll("[data-znam]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.znam === state.activeZnam);
  });
}

export function updateNewestButtonVisibility() {
  const btn = document.getElementById("btn-newest");
  if (!btn) return;

  if (state.activeLekce.has("Peťák a Renča")) {
    btn.classList.remove("hidden");
  } else {
    btn.classList.add("hidden");
    btn.classList.remove("active");
    state.sortNewest = false;
  }
}
