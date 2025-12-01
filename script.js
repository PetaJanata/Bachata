// ================================
// GLOBAL VARIABLES
// ================================
let videos = [];
let activeFilter = null;
const gallery = document.getElementById("video-gallery");

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
// HERO VISIBILITY CHECK
// ================================
function isHeroFullyVisible() {
  const hero = document.querySelector(".hero");
  if (!hero) return false;
  const rect = hero.getBoundingClientRect();
  return rect.top >= 0 && rect.bottom <= window.innerHeight;
}

// ================================
// APPLY FILTER
// ================================
function applyFilter(filterValue) {
  if (activeFilter === filterValue && !isHeroFullyVisible()) return;

  const filteredVideos = !filterValue ? [...videos] : videos.filter(v => v.button === filterValue);
  const shuffledVideos = shuffleArray(filteredVideos);

  updateGallery(shuffledVideos);

  if (filterValue && isHeroFullyVisible()) {
    gallery.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  activeFilter = filterValue;
  updateFilterButtons();
}

function updateFilterButtons() {
  document.querySelectorAll(".filter-btn").forEach(btn => btn.classList.remove("active"));
  if (activeFilter === "Peťák a Renča") document.getElementById("btn-renča")?.classList.add("active");
  else if (activeFilter === "Peťa a Peťa") document.getElementById("btn-peta")?.classList.add("active");
}

// ================================
// UPDATE GALLERY INTELLIGENTLY
// ================================
function updateGallery(newVideoList) {
  if (!gallery) return;

  const currentCards = Array.from(gallery.children);
  const currentSrcs = currentCards.map(card => card.querySelector("video")?.dataset.src);

  // Remove wrong videos
  const toRemove = currentCards.filter(card => !newVideoList.some(v => v.src480 === card.querySelector("video")?.dataset.src));
  toRemove.forEach(card => gallery.removeChild(card));

  // Add missing videos
  const missingVideos = newVideoList.filter(v => !currentSrcs.includes(v.src480));
  missingVideos.forEach(v => addVideoCard(v));

  lazyLoadVideos();
}

// ================================
// ADD SINGLE VIDEO CARD
// ================================
function addVideoCard(v) {
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

  // Speed icon
  const speedIcon = document.createElement("div");
  speedIcon.classList.add("speed-icon");
  speedIcon.textContent = "1×";
  card.appendChild(speedIcon);
  attachSpeedScroll(video, speedIcon, true);

  // Fullscreen icon
  if (v.hd) {
    const fullscreenIcon = document.createElement("div");
    fullscreenIcon.classList.add("fullscreen-icon");
    fullscreenIcon.innerHTML = "⤢";
    card.appendChild(fullscreenIcon);
    fullscreenIcon.addEventListener("click", () => openOverlay(v));
  }

  gallery.appendChild(card);
}

// ================================
// LAZY LOAD VIDEOS
// ================================
let lazyObserver = null;
let pauseObserver = null;
let visibilityCheckAttached = false;

function lazyLoadVideos() {
  const videoElements = document.querySelectorAll("video[data-src]");
  const loadVideo = video => {
    if (!video.dataset.src) return;
    video.src = video.dataset.src;
    video.removeAttribute("data-src");
    video.play().catch(() => {});
  };

  if (!lazyObserver) {
    lazyObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          loadVideo(entry.target);
          lazyObserver.unobserve(entry.target);
        }
      });
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
// VIDEO SPEED CONTROL
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

  const wheelHandler = e => {
    e.preventDefault();
    if (e.deltaY < 0) index = Math.min(index + 1, speeds.length - 1);
    else index = Math.max(index - 1, 0);
    video.playbackRate = speeds[index];
    showLabel();
  };

  if (iconOnly) label.addEventListener("wheel", wheelHandler);
  else video.addEventListener("wheel", wheelHandler);
}

// ================================
// HERO BUTTON AUTO-HIDE
// ================================
const heroBar = document.querySelector(".hero-buttons");
let hideTimeout = null;

function isHeroOutOfView() {
  const hero = document.querySelector(".hero");
  const rect = hero.getBoundingClientRect();
  return rect.bottom <= 0; 
}

function showHeroBar() { heroBar.classList.remove("hidden-hero"); }
function hideHeroBar() { heroBar.classList.add("hidden-hero"); }

function onPageScroll(e) {
  if (e.target instanceof HTMLVideoElement) return;

  if (!isHeroOutOfView()) {
    showHeroBar();
    clearTimeout(hideTimeout);
    return;
  }

  showHeroBar();
  clearTimeout(hideTimeout);
  hideTimeout = setTimeout(() => hideHeroBar(), 2000);
}

window.addEventListener("wheel", onPageScroll, { passive: true });
window.addEventListener("scroll", onPageScroll, { passive: true });

// ================================
// INIT
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
