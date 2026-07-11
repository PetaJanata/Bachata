import { state } from "./state.js";
import { videoKey, debounce, extractYouTubeID } from "./utils.js";
import { icons } from "./icons.js";
import { FEATURES } from "./config.js";
import { openOverlay, openYouTubeOverlay, openInstagramOverlay, openFacebookOverlay } from "./overlays.js";

const gallery = document.getElementById("video-gallery");

// ================================
// LAZY LOAD + AUTO-PAUSE VIDEOS
// ================================
let lazyObserver = null;
let pauseObserver = null;

export function lazyLoadVideos() {
  const videoElements = document.querySelectorAll("video[data-src]");

  const loadVideo = (video) => {
    if (!video.dataset.src) return;
    video.src = video.dataset.src;
    video.removeAttribute("data-src");
    video.play().catch(() => {});
  };

  // A single IntersectionObserver with generous rootMargin covers both
  // "load just before it scrolls into view" and "load on layout changes" —
  // no separate scroll-listener polling is needed alongside it.
  if (!lazyObserver) {
    lazyObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadVideo(entry.target);
            lazyObserver.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "400px 0px", threshold: 0.1 }
    );
  }
  videoElements.forEach((video) => lazyObserver.observe(video));

  if (!pauseObserver) {
    pauseObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          if (!entry.isIntersecting) {
            video.pause();
          } else if (video.paused && !video.dataset.src && !video.dataset.userPaused) {
            video.play().catch(() => {});
          }
        });
      },
      { threshold: 0.25 }
    );
  }
  document.querySelectorAll("video").forEach((video) => pauseObserver.observe(video));
}

// ================================
// SPEED SCROLL (scroll over a video/icon to change playback rate)
// ================================
function attachSpeedScroll(video, label, iconOnly = false) {
  const speeds = [0.5, 0.75, 1, 1.25, 1.5];
  let index = speeds.indexOf(1);

  const showLabel = () => {
    if (speeds[index] === 1) {
      label.style.display = iconOnly ? "block" : "none";
      label.textContent = "1×";
    } else {
      label.textContent = speeds[index] + "×";
      label.style.display = "block";
    }
  };

  const wheelHandler = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.deltaY < 0) index = Math.min(index + 1, speeds.length - 1);
    else index = Math.max(index - 1, 0);

    video.playbackRate = speeds[index];
    showLabel();
  };

  if (iconOnly) {
    label.addEventListener("wheel", wheelHandler, { passive: false });
  } else {
    video.addEventListener("wheel", wheelHandler);
  }

  if (!iconOnly) {
    video.addEventListener("mouseleave", () => {
      if (speeds[index] === 1) label.style.display = "none";
    });
  }
}

// ================================
// HIDE TOGGLE (mark a video as "done revising" and collapse it)
// ================================
function createHideToggle(card, video) {
  const toggle = document.createElement("div");
  toggle.classList.add("hide-toggle");
  toggle.setAttribute("role", "button");
  toggle.setAttribute("aria-label", "Skrýt video");

  const placeholder = document.createElement("div");
  placeholder.classList.add("video-placeholder");
  placeholder.style.display = "none";

  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    card.dataset.hidden = "true";

    video.style.display = "none";
    placeholder.style.display = "flex";

    const speedIcon = card.querySelector(".speed-icon");
    const fullscreenIcon = card.querySelector(".fullscreen-icon");
    if (speedIcon) speedIcon.style.display = "none";
    if (fullscreenIcon) fullscreenIcon.style.display = "none";
    toggle.style.display = "none";
  });

  placeholder.addEventListener("click", () => {
    delete card.dataset.hidden;

    video.style.display = "block";
    placeholder.style.display = "none";

    const speedIcon = card.querySelector(".speed-icon");
    const fullscreenIcon = card.querySelector(".fullscreen-icon");

    if (card.matches(":hover")) {
      if (speedIcon) speedIcon.style.display = "block";
      if (fullscreenIcon) fullscreenIcon.style.display = "block";
      toggle.style.display = "block";
    } else {
      toggle.style.display = "none";
    }
  });

  card.appendChild(toggle);
  card.appendChild(placeholder);
}

// ================================
// PROGRESS BAR
// ================================
function createProgressBar(video) {
  const wrap = document.createElement("div");
  wrap.className = "progress-bar-wrap";
  wrap.style.opacity = "0";
  wrap.style.pointerEvents = "none";

  const playBtn = document.createElement("button");
  playBtn.className = "progress-play-btn";
  playBtn.setAttribute("aria-label", "Přehrát / pozastavit");
  playBtn.innerHTML = icons.pause;
  wrap.appendChild(playBtn);

  const track = document.createElement("div");
  track.className = "progress-track";

  const fill = document.createElement("div");
  fill.className = "progress-fill";
  track.appendChild(fill);

  wrap.appendChild(track);

  video.addEventListener("timeupdate", () => {
    if (!video.duration) return;
    fill.style.width = (video.currentTime / video.duration) * 100 + "%";
    playBtn.innerHTML = video.paused ? icons.play : icons.pause;
  });

  video.addEventListener("play", () => { playBtn.innerHTML = icons.pause; });
  video.addEventListener("pause", () => { playBtn.innerHTML = icons.play; });

  playBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (video.paused) {
      video.play().catch(() => {});
      video.dataset.userPaused = "";
    } else {
      video.pause();
      video.dataset.userPaused = "1";
    }
  });

  track.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!video.duration) return;
    const rect = track.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    video.currentTime = ratio * video.duration;
    if (!video.dataset.userPaused) video.play().catch(() => {});
  });

  let dragging = false;
  track.addEventListener("mousedown", (e) => { e.stopPropagation(); dragging = true; });
  document.addEventListener("mousemove", (e) => {
    if (!dragging || !video.duration) return;
    const rect = track.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    video.currentTime = ratio * video.duration;
    fill.style.width = ratio * 100 + "%";
  });
  document.addEventListener("mouseup", () => { dragging = false; });

  return wrap;
}

// ================================
// VIDEO CARD
// ================================
export function createVideoCard(v) {
  const card = document.createElement("div");
  card.classList.add("video-card");

  const key = videoKey(v);
  if (key) card.dataset.videoKey = key;

  // ──────────────── Instagram ────────────────
  if (v.instagram) {
    const thumb = document.createElement("img");
    thumb.src = "images/instagram-placeholder.jpg";
    thumb.classList.add("video-thumb");
    thumb.style.cursor = "pointer";
    const speedIcon = document.createElement("div");
    speedIcon.classList.add("speed-icon");
    speedIcon.textContent = "IG";
    card.appendChild(speedIcon);
    thumb.addEventListener("click", () => openInstagramOverlay(v.instagram));
    card.appendChild(thumb);
    return card;
  }

  // ──────────────── YouTube ────────────────
  if (v.youtube) {
    const ytID = extractYouTubeID(v.youtube);
    const thumb = document.createElement("img");
    thumb.src = `https://i.ytimg.com/vi/${ytID}/hqdefault.jpg`;
    thumb.classList.add("video-thumb");
    thumb.style.cursor = "pointer";
    const speedIcon = document.createElement("div");
    speedIcon.classList.add("speed-icon");
    speedIcon.textContent = "YT";
    card.appendChild(speedIcon);
    thumb.addEventListener("click", () => openYouTubeOverlay(v));
    card.appendChild(thumb);
    return card;
  }

  // ──────────────── Facebook ────────────────
  if (v.facebook) {
    const thumb = document.createElement("img");
    thumb.src = "images/facebook-placeholder.jpg";
    thumb.classList.add("video-thumb");
    thumb.style.cursor = "pointer";
    const icon = document.createElement("div");
    icon.classList.add("speed-icon");
    icon.textContent = "FB";
    card.appendChild(icon);
    thumb.addEventListener("click", () => openFacebookOverlay(v.facebook));
    card.appendChild(thumb);
    return card;
  }

  // ──────────────── Local Video ────────────────
  if (!v.src480) return null;

  const video = document.createElement("video");
  video.dataset.src = v.src480;
  video.muted = true;
  video.loop = true;
  video.playsInline = true;

  if (v.znam === "znám") video.classList.add("know-green");
  else if (v.znam === "potřebuju zlepšit") video.classList.add("know-yellow");
  else if (v.znam === "neznám") video.classList.add("know-red");

  card.appendChild(video);

  const speedIcon = document.createElement("div");
  speedIcon.classList.add("speed-icon");
  speedIcon.textContent = "1×";
  card.appendChild(speedIcon);

  let fullscreenIcon = null;
  if (FEATURES.hdFullscreen && v.hd) {
    fullscreenIcon = document.createElement("button");
    fullscreenIcon.classList.add("fullscreen-icon");
    fullscreenIcon.setAttribute("aria-label", "Zobrazit na celou obrazovku");
    fullscreenIcon.innerHTML = icons.maximize;
    card.appendChild(fullscreenIcon);
    fullscreenIcon.addEventListener("click", () => openOverlay(v));
  }

  card.addEventListener("mouseenter", () => {
    if (card.dataset.hidden || video.style.display === "none") return;
    speedIcon.style.display = "block";
    if (fullscreenIcon) fullscreenIcon.style.display = "block";
    const hideToggle = card.querySelector(".hide-toggle");
    if (hideToggle) hideToggle.style.display = "block";
  });

  card.addEventListener("mouseleave", () => {
    speedIcon.style.display = "none";
    if (fullscreenIcon) fullscreenIcon.style.display = "none";
    const hideToggle = card.querySelector(".hide-toggle");
    if (hideToggle) hideToggle.style.display = "none";
  });

  attachSpeedScroll(video, speedIcon, true);
  createHideToggle(card, video);

  const bar = createProgressBar(video);
  card.appendChild(bar);

  card.addEventListener("mouseenter", () => {
    if (!card.dataset.hidden && video.style.display !== "none") {
      bar.style.opacity = "1";
      bar.style.pointerEvents = "auto";
    }
  });
  card.addEventListener("mouseleave", () => {
    bar.style.opacity = "0";
    bar.style.pointerEvents = "none";
  });

  return card;
}

// ================================
// GRID GALLERY (CSS grid, row-based)
// ================================
function buildGridLayout(videoList) {
  gallery.querySelectorAll("video").forEach((v) => { v.pause(); v.src = ""; });
  gallery.innerHTML = "";
  state.renderedVideos = [...videoList];

  if (videoList.length === 0) {
    const empty = document.createElement("p");
    empty.className = "gallery-empty-state";
    empty.textContent = "Žádná videa neodpovídají zvoleným filtrům.";
    gallery.appendChild(empty);
    return;
  }

  videoList.forEach((v) => {
    const card = createVideoCard(v);
    if (card) gallery.appendChild(card);
  });
}

function applyGridCSS(cols) {
  gallery.style.display = "grid";
  gallery.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  gallery.style.gap = "20px";
  gallery.style.padding = "2rem";
}

export function loadGallery(videoList, forceRebuild = false) {
  if (!gallery) return;

  if (forceRebuild) {
    buildGridLayout(videoList);
    applyGridCSS(getCurrentCols());
    return;
  }

  // Dynamic filter mode: show/hide existing cards in place, no repositioning.
  const wantedKeys = new Set(videoList.map(videoKey).filter(Boolean));

  gallery.querySelectorAll(".video-card").forEach((card) => {
    const key = card.dataset.videoKey;
    if (wantedKeys.has(key)) {
      card.style.display = "";
    } else {
      const vid = card.querySelector("video");
      if (vid) vid.pause();
      card.style.display = "none";
    }
  });
}

// ================================
// COLUMN COUNT SELECTOR
// ================================
function getScreenCategory() {
  return window.innerWidth <= 768 ? "mobile" : "desktop";
}

function getDynamicCols() {
  const videoBlock = document.querySelector(".video-block");
  if (!videoBlock) return window.innerWidth <= 768 ? 1 : 5;

  const minWidth = window.innerWidth <= 768 ? 250 : 180;
  const cols = Math.floor(videoBlock.clientWidth / minWidth);
  const maxCols = window.innerWidth <= 768 ? 3 : 5;
  return Math.min(Math.max(cols, 1), maxCols);
}

function getCurrentCols() {
  const category = getScreenCategory();
  return state.gridOverride[category] ?? getDynamicCols();
}

function applyGridColumns(cols, isUserOverride = false) {
  if (isUserOverride) {
    state.gridOverride[getScreenCategory()] = cols;
  }
  applyGridCSS(cols);
  renderGridCompact();
}

const gridBtn = document.getElementById("grid-btn");
let expanded = false;

function renderGridCompact() {
  if (!gridBtn) return;
  gridBtn.innerHTML = "";
  gridBtn.classList.remove("expanded");

  const current = getCurrentCols();
  const max = window.innerWidth <= 768 ? 3 : 5;

  for (let i = 1; i <= max; i++) {
    const cell = document.createElement("div");
    cell.className = "grid-cell";
    if (i <= current) cell.classList.add("filled");
    gridBtn.appendChild(cell);
  }
}

function renderGridExpanded() {
  gridBtn.innerHTML = "";
  gridBtn.classList.add("expanded");

  const current = getCurrentCols();
  const max = window.innerWidth <= 768 ? 3 : 5;

  for (let i = 1; i <= max; i++) {
    const cell = document.createElement("div");
    cell.className = "grid-cell";
    if (i <= current) cell.classList.add("filled");

    cell.addEventListener("mouseenter", () => {
      gridBtn.querySelectorAll(".grid-cell").forEach((c, idx) => {
        c.classList.remove("preview", "unpreview");
        if (i > current && idx < i) c.classList.add("preview");
        if (i < current && idx >= i) c.classList.add("unpreview");
      });
    });

    cell.addEventListener("mouseleave", () => {
      gridBtn.querySelectorAll(".grid-cell").forEach((c) => c.classList.remove("preview", "unpreview"));
    });

    cell.addEventListener("click", (e) => {
      e.stopPropagation();
      applyGridColumns(i, true);
      expanded = false;
      renderGridCompact();
    });

    gridBtn.appendChild(cell);
  }
}

export function initGridSelector() {
  if (!gridBtn) return;

  gridBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    expanded ? renderGridCompact() : renderGridExpanded();
    expanded = !expanded;
  });

  document.addEventListener("click", () => {
    if (expanded) {
      renderGridCompact();
      expanded = false;
    }
  });

  window.addEventListener(
    "resize",
    debounce(() => {
      const cols = state.gridOverride[getScreenCategory()] ?? getDynamicCols();
      applyGridCSS(cols);
      expanded = false;
      renderGridCompact();
    }, 150)
  );

  applyGridColumns(getCurrentCols());
  renderGridCompact();
}
