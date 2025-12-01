// ================================
// GLOBAL VARIABLES
// ================================
let videos = [];
let activeFilter = null;
const gallery = document.getElementById("video-gallery");

const revisionState = {
  hiddenVideos: new Set(),
  counts: { green: 0, yellow: 0, red: 0 }
};

let revisionBar = null;
let greenSpan, yellowSpan, redSpan;

// ================================
// INIT REVISION BAR
// ================================
function initRevisionBar() {
  if (revisionBar) return;

  revisionBar = document.createElement("div");
  revisionBar.classList.add("revision-bar");
  revisionBar.innerHTML = `
    <span class="green">0/0</span>
    <span class="yellow">0/0</span>
    <span class="red">0/0</span>
  `;
  document.body.appendChild(revisionBar);

  [greenSpan, yellowSpan, redSpan] = revisionBar.querySelectorAll("span");
  revisionBar.style.display = "none";
}

function updateRevisionBar() {
  const total = {
    green: document.querySelectorAll(".know-green").length,
    yellow: document.querySelectorAll(".know-yellow").length,
    red: document.querySelectorAll(".know-red").length
  };

  greenSpan.textContent = `${revisionState.counts.green}/${total.green}`;
  yellowSpan.textContent = `${revisionState.counts.yellow}/${total.yellow}`;
  redSpan.textContent = `${revisionState.counts.red}/${total.red}`;
}

// ================================
// SHUFFLE FUNCTION
// ================================
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// ================================
// FILTER FUNCTION
// ================================
function applyFilter(filterValue) {
  activeFilter = filterValue;

  document.querySelectorAll(".filter-btn").forEach(btn => btn.classList.remove("active"));
  if (filterValue === "Peťák a Renča") document.getElementById("btn-renča")?.classList.add("active");
  else if (filterValue === "Peťa a Peťa") document.getElementById("btn-peta")?.classList.add("active");

  const filteredVideos = !filterValue ? [...videos] : videos.filter(v => v.button === filterValue);
  loadGallery(shuffleArray(filteredVideos));
  lazyLoadVideos();

  if (filterValue) gallery?.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ================================
// LAZY LOAD + AUTO-PAUSE VIDEOS
// ================================
let lazyObserver = null;
let pauseObserver = null;
let visibilityCheckAttached = false;

function lazyLoadVideos() {
  const videoElements = document.querySelectorAll("video[data-src]");
  const loadVideo = video => { if (!video.dataset.src) return; video.src = video.dataset.src; video.removeAttribute("data-src"); video.play().catch(() => {}); };

  if (!lazyObserver) {
    lazyObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) { loadVideo(entry.target); lazyObserver.unobserve(entry.target); } });
    }, { rootMargin: "400px 0px", threshold: 0.1 });
  }
  videoElements.forEach(video => lazyObserver.observe(video));

  if (!visibilityCheckAttached) {
    const checkVisible = () => {
      document.querySelectorAll("video[data-src]").forEach(video => {
        const rect = video.getBoundingClientRect();
        if (rect.top < window.innerHeight + 300 && rect.bottom > -300) loadVideo(video);
      });
    };
    window.addEventListener("scroll", checkVisible, { passive: true });
    window.addEventListener("resize", checkVisible);
    visibilityCheckAttached = true;
  }

  if (!pauseObserver) {
    pauseObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const video = entry.target;
        if (!entry.isIntersecting) video.pause();
        else if (video.paused && !video.dataset.src) video.play().catch(() => {});
      });
    }, { threshold: 0.25 });
  }
  document.querySelectorAll("video").forEach(video => pauseObserver.observe(video));
}

// ================================
// LOAD GALLERY
// ================================
function loadGallery(videoList) {
  if (!gallery) return;

  gallery.innerHTML = "";
  initRevisionBar();

  videoList.forEach(v => {
    if (!v.src480) return;

    const card = document.createElement("div");
    card.classList.add("video-card");
    card.style.position = "relative";

    const video = document.createElement("video");
    video.dataset.src = v.src480;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;

    if (v.znam === "znám") video.classList.add("know-green");
    else if (v.znam === "potřebuju zlepšit") video.classList.add("know-yellow");
    else if (v.znam === "neznám") video.classList.add("know-red");

    card.appendChild(video);

    // SPEED ICON
    const speedIcon = document.createElement("div");
    speedIcon.classList.add("speed-icon");
    speedIcon.textContent = "1×";
    card.appendChild(speedIcon);

    card.addEventListener("mouseenter", () => { speedIcon.style.display = "block"; });
    card.addEventListener("mouseleave", () => { speedIcon.style.display = "none"; });

    attachSpeedScroll(video, speedIcon, true);
    createRevisionCircle(card, video);

    // FULLSCREEN ICON
    if (v.hd) {
      const fullscreenIcon = document.createElement("div");
      fullscreenIcon.classList.add("fullscreen-icon");
      fullscreenIcon.innerHTML = "⤢";
      card.appendChild(fullscreenIcon);
      card.addEventListener("mouseenter", () => { fullscreenIcon.style.display = "block"; });
      card.addEventListener("mouseleave", () => { fullscreenIcon.style.display = "none"; });
      fullscreenIcon.addEventListener("click", () => openOverlay(v));
    }

    gallery.appendChild(card);
  });
}

// ================================
// REVISION CIRCLES
// ================================
function createRevisionCircle(videoCard, video) {
  const colorClass = video.classList.contains("know-green") ? "know-green" :
                     video.classList.contains("know-yellow") ? "know-yellow" :
                     video.classList.contains("know-red") ? "know-red" : null;
  if (!colorClass) return;

  const circle = document.createElement("div");
  circle.classList.add("revision-circle");
  if (colorClass === "know-green") circle.style.background = "#2ecc71";
  if (colorClass === "know-yellow") circle.style.background = "#f1c40f";
  if (colorClass === "know-red") circle.style.background = "#e74c3c";
  videoCard.appendChild(circle);

  let hiddenOverlay = null;
  const colorName = colorClassToName(colorClass);

  circle.addEventListener("click", e => {
    e.stopPropagation();
    revisionBar.style.display = "flex";

    if (revisionState.hiddenVideos.has(videoCard)) {
      hiddenOverlay?.remove();
      revisionState.hiddenVideos.delete(videoCard);
      revisionState.counts[colorName]--;
    } else {
      hiddenOverlay = document.createElement("div");
      hiddenOverlay.classList.add("video-hidden-overlay");
      videoCard.appendChild(hiddenOverlay);
      revisionState.hiddenVideos.add(videoCard);
      revisionState.counts[colorName]++;
    }

    updateRevisionBar();

    if (hiddenOverlay) {
      hiddenOverlay.addEventListener("click", () => {
        hiddenOverlay.remove();
        revisionState.hiddenVideos.delete(videoCard);
        revisionState.counts[colorName]--;
        updateRevisionBar();
      });
    }
  });
}

function colorClassToName(colorClass) {
  if (colorClass === "know-green") return "green";
  if (colorClass === "know-yellow") return "yellow";
  if (colorClass === "know-red") return "red";
  return null;
}

// ================================
// SPEED SCROLL
// ================================
function attachSpeedScroll(video, label, iconOnly = false) {
  const speeds = [0.5, 0.75, 1, 1.25, 1.5];
  let index = speeds.indexOf(1);

  const showLabel = () => {
    if (speeds[index] === 1) { label.style.display = iconOnly ? "block" : "none"; label.textContent = "1×"; }
    else { label.textContent = speeds[index]+"×"; label.style.display = "block"; }
  };

  const wheelHandler = e => {
    e.preventDefault();
    index = e.deltaY < 0 ? Math.min(index+1, speeds.length-1) : Math.max(index-1, 0);
    video.playbackRate = speeds[index];
    showLabel();
  };

  if (iconOnly) label.addEventListener("wheel", wheelHandler);
  else video.addEventListener("wheel", wheelHandler);

  if (!iconOnly) video.addEventListener("mouseleave", () => { if (speeds[index]===1) label.style.display="none"; });
}

// ================================
// DOM LOADED — INIT
// ================================
window.addEventListener("DOMContentLoaded", () => {
  fetch("videos.csv")
    .then(res => res.text())
    .then(csvText => {
      const results = Papa.parse(csvText, { header: true, skipEmptyLines: true });
      videos = results.data.map(row => ({
        src480: row["480p"] || null,
        hd: row["1080p"] || null,
        alt: row["Alt"] || null,
        button: row["Button"] || null,
        znam: row["znám?"] || null
      }));

      applyFilter(null);

      document.getElementById("btn-renča")?.addEventListener("click", () => {
        applyFilter(activeFilter === "Peťák a Renča" ? null : "Peťák a Renča");
      });
      document.getElementById("btn-peta")?.addEventListener("click", () => {
        applyFilter(activeFilter === "Peťa a Peťa" ? null : "Peťa a Peťa");
      });
    })
    .catch(err => console.error("Error loading CSV:", err));
});
