// ================================
// HERO CAROUSEL
// ================================
let carouselImages = [
  "images/photo1.jpg","images/photo2.jpg","images/photo3.jpg","images/photo4.jpg","images/photo5.jpg",
  "images/photo6.jpg","images/photo7.jpg","images/photo8.jpg","images/photo9.jpg","images/photo10.jpg"
];

function shuffleImages(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
carouselImages = shuffleImages(carouselImages);

const heroSection = document.querySelector(".hero");
const carouselContainer = document.createElement("div");
carouselContainer.classList.add("hero-carousel");
heroSection.insertBefore(carouselContainer, heroSection.querySelector(".hero-buttons"));

let currentIndex = 0;
function getVisibleIndexes(centerIndex) {
  const total = carouselImages.length;
  let indexes = [];
  for (let i = -2; i <= 2; i++) {
    indexes.push((centerIndex + i + total) % total);
  }
  return indexes;
}

function renderCarousel() {
  carouselContainer.innerHTML = "";
  const indexes = getVisibleIndexes(currentIndex);
  indexes.forEach((imgIdx, position) => {
    const img = document.createElement("img");
    img.src = carouselImages[imgIdx];
    img.classList.add("carousel-img");
    if (position === 2) img.classList.add("main-img");
    else if (position === 1 || position === 3) img.classList.add("first-layer");
    else img.classList.add("second-layer");
    if (position === 1 || position === 3) {
      img.addEventListener("click", () => {
        currentIndex = position < 2
          ? (currentIndex - 1 + carouselImages.length) % carouselImages.length
          : (currentIndex + 1) % carouselImages.length;
        renderCarousel();
      });
    }
    carouselContainer.appendChild(img);
  });
}
renderCarousel();
window.addEventListener("resize", renderCarousel);

// ================================
// GLOBAL VARIABLES
// ================================
let videos = [];
let activeFilter = null;
const gallery = document.getElementById("video-gallery");

// ================================
// FILTER PANEL VARIABLES
// ================================
const filterContainer = document.getElementById("filter-container");
const collapseBtn = document.getElementById("filter-collapse");
const figuryFiltersDiv = document.getElementById("figury-filters");
const videoSubDiv = document.getElementById("video-subcategories");
const datumSubDiv = document.getElementById("datum-subcategories");

let figurySelected = new Set();
let videoSelected = new Set();
let datumSelected = new Set();

// ================================
// APPLY FILTER FUNCTION
// ================================
function applyFilter(filterValue = null, shouldScroll = false) {
  activeFilter = filterValue;
  document.querySelectorAll(".filter-btn").forEach(btn => btn.classList.remove("active"));
  if (!filterValue) document.getElementById("btn-all")?.classList.add("active");
  else if (filterValue === "Peťák a Renča") document.getElementById("btn-renča")?.classList.add("active");
  else if (filterValue === "Peťa a Peťa") document.getElementById("btn-peta")?.classList.add("active");

  let filtered = [...videos];

  if (figurySelected.size) filtered = filtered.filter(v => figurySelected.has(v.Figury));
  if (videoSelected.size) filtered = filtered.filter(v => videoSelected.has(v.Button));
  if (datumSelected.size) filtered = filtered.filter(v => datumSelected.has(v.Datum));

  filtered = shuffleArray(filtered);
  loadGallery(filtered);
  lazyLoadVideos();
  updateGalleryColumns();

  if (shouldScroll) {
    document.getElementById("video-gallery")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

// ================================
// RESPONSIVE COLUMNS
// ================================
function updateGalleryColumns() {
  const galleryDiv = document.querySelector(".video-block");
  if (!galleryDiv) return;
  let columns = 6;
  const screenWidth = window.innerWidth;
  const sidebarVisible = !filterContainer.classList.contains("collapsed");

  if (sidebarVisible) columns = 5;
  if (screenWidth <= 1600) columns = sidebarVisible ? 4 : 5;
  if (screenWidth <= 1300) columns = sidebarVisible ? 3 : 4;
  if (screenWidth <= 1000) columns = sidebarVisible ? 2 : 3;
  if (screenWidth <= 700)  columns = 1;

  galleryDiv.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
}

window.addEventListener("resize", updateGalleryColumns);

// ================================
// COLLAPSE SIDEBAR
// ================================
collapseBtn.addEventListener("click", () => {
  filterContainer.classList.toggle("collapsed");
  updateGalleryColumns();
});

// ================================
// CSV LOAD + INIT
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
        Button: row["Button"] || null,
        znam: row["znám?"] || null,
        Figury: row["Figury"] || null,
        Datum: row["Datum"] || null
      }));

      initFilters();
      applyFilter(null,false);

      document.getElementById("btn-renča")?.addEventListener("click", () => {
        const isTogglingOff = activeFilter === "Peťák a Renča";
        applyFilter(isTogglingOff ? null : "Peťák a Renča", true);
      });
      document.getElementById("btn-peta")?.addEventListener("click", () => {
        const isTogglingOff = activeFilter === "Peťa a Peťa";
        applyFilter(isTogglingOff ? null : "Peťa a Peťa", true);
      });
      document.getElementById("btn-all")?.addEventListener("click", () => {
        filterContainer.classList.remove("collapsed");
        applyFilter(null,true);
      });
    })
    .catch(err => console.error("CSV load error:", err));
});

// ================================
// INIT FILTERS
// ================================
function initFilters() {
  const figurySet = new Set(videos.map(v => v.Figury).filter(Boolean));
  figurySet.forEach(f => {
    const btn = document.createElement("button");
    btn.textContent = f;
    btn.classList.add("inactive");
    btn.style.backgroundColor = getFiguryColor(f);
    btn.addEventListener("click", () => {
      if (figurySelected.has(f)) { figurySelected.delete(f); btn.classList.remove("active"); btn.classList.add("inactive"); }
      else { figurySelected.add(f); btn.classList.add("active"); btn.classList.remove("inactive"); }
      applyFilter();
    });
    figuryFiltersDiv.appendChild(btn);
  });

  const videoSet = new Set(videos.map(v => v.Button).filter(Boolean));
  videoSet.forEach(v => {
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) videoSelected.add(v);
      else videoSelected.delete(v);
      applyFilter();
    });
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(v));
    videoSubDiv.appendChild(label);
  });

  const datumSet = new Set(videos.map(v => v.Datum).filter(Boolean));
  datumSet.forEach(d => {
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) datumSelected.add(d);
      else datumSelected.delete(d);
      applyFilter();
    });
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(d));
    datumSubDiv.appendChild(label);
  });
}

function getFiguryColor(f) {
  switch(f.toLowerCase()) {
    case "úvod": return "#e74c3c";
    case "sensual": return "#2ecc71";
    case "diagonál": return "#f1c40f";
    case "sp": return "#3498db";
    default: return "#95a5a6";
  }
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
// LOAD GALLERY
// ================================
function loadGallery(videoList) {
  if (!gallery) return;
  gallery.innerHTML = "";

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

    const speedIcon = document.createElement("div");
    speedIcon.classList.add("speed-icon");
    speedIcon.textContent = "1×";
    card.appendChild(speedIcon);

    card.addEventListener("mouseenter", () => { speedIcon.style.display = "block"; });
    card.addEventListener("mouseleave", () => { speedIcon.style.display = "none"; });

    attachSpeedScroll(video, speedIcon, true);
    video.style.cursor = "default";
    card.appendChild(video);

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
// OPEN OVERLAY
// ================================
function openOverlay(videoObj) {
  // Keep existing overlay code (same as your original)
}

// ================================
// SPEED SCROLL FUNCTION
// ================================
function attachSpeedScroll(video, label, iconOnly = false) {
  const speeds = [0.5,0.75,1,1.25,1.5];
  let index = speeds.indexOf(1);

  const showLabel = () => {
    if (speeds[index] === 1) { label.style.display = iconOnly ? "block" : "none"; label.textContent = "1×"; }
    else { label.textContent = speeds[index] + "×"; label.style.display = "block"; }
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

  if (!iconOnly) video.addEventListener("mouseleave", () => { if (speeds[index]===1) label.style.display="none"; });
}

// ================================
// FILTER SIDEBAR COLLAPSE
// ================================
collapseBtn.addEventListener("click", () => {
  filterContainer.classList.toggle("collapsed");
});

// ================================
// LOAD CSV + INIT
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
        Button: row["Button"] || null,
        znam: row["znám?"] || null,
        Figury: row["Figury"] || null,
        Datum: row["Datum"] || null
      }));

      // Initialize filters from CSV
      initFilters();

      applyFilter(null,false);

      // Hero buttons events
      document.getElementById("btn-renča")?.addEventListener("click", () => {
        const isTogglingOff = activeFilter === "Peťák a Renča";
        applyFilter(isTogglingOff ? null : "Peťák a Renča", true);
      });
      document.getElementById("btn-peta")?.addEventListener("click", () => {
        const isTogglingOff = activeFilter === "Peťa a Peťa";
        applyFilter(isTogglingOff ? null : "Peťa a Peťa", true);
      });
      document.getElementById("btn-all")?.addEventListener("click", () => {
        filterContainer.classList.remove("hidden");
        applyFilter(null,true);
      });
    })
    .catch(err => console.error("CSV load error:", err));
});

// ================================
// INIT FILTERS
// ================================
function initFilters() {
  // Figury buttons
  const figurySet = new Set(videos.map(v => v.Figury).filter(Boolean));
  figurySet.forEach(f => {
    const btn = document.createElement("button");
    btn.textContent = f;
    btn.classList.add("inactive");
    btn.style.backgroundColor = getFiguryColor(f);
    btn.addEventListener("click", () => {
      if (figurySelected.has(f)) { figurySelected.delete(f); btn.classList.remove("active"); btn.classList.add("inactive"); }
      else { figurySelected.add(f); btn.classList.add("active"); btn.classList.remove("inactive"); }
      applyFilter();
    });
    figuryFiltersDiv.appendChild(btn);
  });

  // Video subcategories
  const videoSet = new Set(videos.map(v => v.Button).filter(Boolean));
  videoSet.forEach(v => {
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) videoSelected.add(v);
      else videoSelected.delete(v);
      applyFilter();
    });
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(v));
    videoSubDiv.appendChild(label);
  });

  // Datum subcategories
  const datumSet = new Set(videos.map(v => v.Datum).filter(Boolean));
  datumSet.forEach(d => {
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) datumSelected.add(d);
      else datumSelected.delete(d);
      applyFilter();
    });
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(d));
    datumSubDiv.appendChild(label);
  });
}

function getFiguryColor(f) {
  switch(f.toLowerCase()) {
    case "úvod": return "#e74c3c";
    case "sensual": return "#2ecc71";
    case "diagonál": return "#f1c40f";
    case "sp": return "#3498db";
    default: return "#95a5a6";
  }
}
