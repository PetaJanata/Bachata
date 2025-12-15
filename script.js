// ================================
// HERO CAROUSEL
// ================================

// Hard-coded images (replace with your actual image paths)
let carouselImages = [
  "images/photo1.jpg",
  "images/photo2.jpg",
  "images/photo3.jpg",
  "images/photo4.jpg",
  "images/photo5.jpg",
  "images/photo6.jpg",
  "images/photo7.jpg",
  "images/photo8.jpg",
  "images/photo9.jpg",
  "images/photo10.jpg"
];

// Shuffle function for carousel
function shuffleImages(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Shuffle images initially
carouselImages = shuffleImages(carouselImages);

// Create carousel container
const heroSection = document.querySelector(".hero");
const carouselContainer = document.createElement("div");
carouselContainer.classList.add("hero-carousel");

heroSection.insertBefore(carouselContainer, heroSection.querySelector(".hero-buttons"));

// Carousel state
let currentIndex = 0;
const visibleCount = 5; // main + 2 layers on each side

function getVisibleIndexes(centerIndex) {
  const total = carouselImages.length;
  let indexes = [];
  for (let i = -2; i <= 2; i++) {
    let idx = (centerIndex + i + total) % total;
    indexes.push(idx);
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

    // Set classes for position (main, first, second)
    if (position === 2) img.classList.add("main-img");
    else if (position === 1 || position === 3) img.classList.add("first-layer");
    else img.classList.add("second-layer");

    // Clickable side images
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

// Initial render
renderCarousel();

// Make carousel responsive on resize
window.addEventListener("resize", renderCarousel);



// ================================ 
// GLOBAL VARIABLES
// ================================
let videos = []; // holds all video metadata from CSV
let activeFilter = null; // current active filter
const gallery = document.getElementById("video-gallery");

// ================================
// SHUFFLE FUNCTION (Fisher–Yates)
// ================================
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// ================================
// FILTER FUNCTION (NOW WITH shouldScroll)
// ================================
function applyFilter(filterValue, shouldScroll = false) {
  activeFilter = filterValue;

  // Update button active styles
  document.querySelectorAll(".filter-btn").forEach(btn => btn.classList.remove("active"));

  // Highlight the correct button
  switch(filterValue) {
    case "Peťák a Renča": document.getElementById("btn-renča")?.classList.add("active"); break;
    case "Peťa a Peťa": document.getElementById("btn-peta")?.classList.add("active"); break;
    case "red": document.getElementById("btn-red")?.classList.add("active"); break;
    case "yellow": document.getElementById("btn-yellow")?.classList.add("active"); break;
    case "green": document.getElementById("btn-green")?.classList.add("active"); break;
    case "YouTube": document.getElementById("btn-youtube")?.classList.add("active"); break;
    case "Trénink s Peťou": document.getElementById("btn-trenink")?.classList.add("active"); break;
    default: document.getElementById("btn-all")?.classList.add("active");
  }

  let filteredVideos;

if (filterValue === "red") filteredVideos = videos.filter(v => v.znam?.trim() === "neznám");
else if (filterValue === "yellow") filteredVideos = videos.filter(v => v.znam?.trim() === "potřebuju zlepšit");
else if (filterValue === "green") filteredVideos = videos.filter(v => v.znam?.trim() === "znám");
  else if (filterValue === "YouTube")  filteredVideos = videos.filter(v => v.youtube);
  else if (!filterValue) filteredVideos = [...videos];
  else filteredVideos = videos.filter(v => v.button === filterValue);

//debug
  console.log("Filter:", filterValue, "matching videos:", filteredVideos.length);
  // Shuffle
  const shuffledVideos = shuffleArray(filteredVideos);

  loadGallery(shuffledVideos);
  lazyLoadVideos();

  if (shouldScroll) {
    document.getElementById("video-gallery")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
}


// ================================
// LAZY LOAD + AUTO-PAUSE VIDEOS
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

  // Lazy Observer
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

  // Extra visibility check
  if (!visibilityCheckAttached) {
    const checkVisible = () => {
      document.querySelectorAll("video[data-src]").forEach(video => {
        const rect = video.getBoundingClientRect();
        if (rect.top < window.innerHeight + 300 && rect.bottom > -300) {
          loadVideo(video);
        }
      });
    };
    window.addEventListener("scroll", checkVisible, { passive: true });
    window.addEventListener("resize", checkVisible);
    visibilityCheckAttached = true;
  }

  // Pause Observer
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

 // Extract YT video ID
function extractYouTubeID(url) {
  try {
    const u = new URL(url);

    // 1. youtu.be/<id>
    if (u.hostname === "youtu.be") {
      return u.pathname.slice(1);
    }

    // 2. /watch?v=<id>
    if (u.searchParams.get("v")) {
      return u.searchParams.get("v");
    }

    // 3. /embed/<id>
    if (u.pathname.includes("/embed/")) {
      return u.pathname.split("/embed/")[1];
    }

    // 4. /shorts/<id>
    if (u.pathname.includes("/shorts/")) {
      return u.pathname.split("/shorts/")[1];
    }

  } catch (e) {}

  return null;
}


// ================================
// LOAD GALLERY
// ================================
function loadGallery(videoList) {
  if (!gallery) return;
  gallery.innerHTML = "";

  videoList.forEach(v => {
    
// ─────────────────────────────
// INSTAGRAM ITEM
// ─────────────────────────────
if (v.instagram) {
  const card = document.createElement("div");
  card.classList.add("video-card");
  card.style.position = "relative";

  const thumb = document.createElement("img");
  thumb.src = "images/instagram-placeholder.jpg"; // static fallback
  thumb.classList.add("video-thumb");
  thumb.style.cursor = "pointer";

  const badge = document.createElement("div");
  badge.classList.add("speed-icon");
  badge.textContent = "IG";
  card.appendChild(badge);

  thumb.addEventListener("click", () => openInstagramOverlay(v.instagram));

  card.appendChild(thumb);
  gallery.appendChild(card);
  return;
}


    
    // ─────────────────────────────
// YOUTUBE ITEM
// ─────────────────────────────
if (v.youtube) {
  const card = document.createElement("div");
  card.classList.add("video-card");
  card.style.position = "relative";
 
  const ytID = extractYouTubeID(v.youtube);


  // Thumbnail
  const thumb = document.createElement("img");
 thumb.src = `https://i.ytimg.com/vi/${ytID}/hqdefault.jpg`;
  thumb.classList.add("video-thumb");
  thumb.style.width = "100%";
  thumb.style.display = "block";
  thumb.style.cursor = "pointer";

  // YouTube Badge
  const badge = document.createElement("div");
  badge.classList.add("speed-icon");
  badge.textContent = "YT";
  badge.style.display = "block";
  card.appendChild(badge);

  // On click → open YouTube modal
  thumb.addEventListener("click", () => openYouTubeOverlay(v.youtube));

  card.appendChild(thumb);
  gallery.appendChild(card);
  return; // STOP → do not render as local mp4
}

   // do not drop YouTube videos!
if (!v.src480 && !v.youtube) return;

    const card = document.createElement("div");
    card.classList.add("video-card");
    card.style.position = "relative";

    const video = document.createElement("video");
    video.dataset.src = v.src480;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;

    if (v.znam === "znám") {
      video.classList.add("know-green");
    } else if (v.znam === "potřebuju zlepšit") {
      video.classList.add("know-yellow");
    } else if (v.znam === "neznám") {
      video.classList.add("know-red");
    }

    const speedIcon = document.createElement("div");
    speedIcon.classList.add("speed-icon");
    speedIcon.textContent = "1×";
    card.appendChild(speedIcon);

    card.addEventListener("mouseenter", () => {
      speedIcon.style.display = "block";
    });
    card.addEventListener("mouseleave", () => {
      speedIcon.style.display = "none";
    });

    attachSpeedScroll(video, speedIcon, true);

    video.style.cursor = "default";
    card.appendChild(video);

    // ONLY for Peťák a Renča local videos
if (v.button === "Peťák a Renča") {
  createHideToggle(card, video, v.znam);
}


    if (v.hd) {
      const fullscreenIcon = document.createElement("div");
      fullscreenIcon.classList.add("fullscreen-icon");
      fullscreenIcon.innerHTML = "⤢";
      card.appendChild(fullscreenIcon);

      card.addEventListener("mouseenter", () => {
        fullscreenIcon.style.display = "block";
      });
      card.addEventListener("mouseleave", () => {
        fullscreenIcon.style.display = "none";
      });

      fullscreenIcon.addEventListener("click", () => openOverlay(v));
    }

    gallery.appendChild(card);
  });
}

// ================================
// OPEN OVERLAY
// ================================
function openOverlay(videoObj) {
  const { hd, alt } = videoObj;
  if (!hd) return;

  const overlay = document.createElement("div");
  overlay.classList.add("video-overlay");

  const videoContainer = document.createElement("div");
  videoContainer.style.display = "flex";
  videoContainer.style.gap = "20px";
  overlay.appendChild(videoContainer);

  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";

  function createVideoWrapper(src, muted = true) {
    const wrapper = document.createElement("div");
    wrapper.style.display = "flex";
    wrapper.style.flexDirection = "column";
    wrapper.style.alignItems = "center";

    const video = document.createElement("video");
    video.src = src;
    video.controls = true;
    video.autoplay = true;
    video.loop = true;
    video.playsInline = true;
    video.muted = muted;
    video.classList.add("overlay-video");

    wrapper.appendChild(video);
    return { wrapper, video };
  }

  const main = createVideoWrapper(hd, false);
  videoContainer.appendChild(main.wrapper);

  let altWrapper, mainButton, altButton, backBtn;

  if (alt) {
    altWrapper = createVideoWrapper(alt, true);
    altWrapper.wrapper.style.display = "none";
    videoContainer.appendChild(altWrapper.wrapper);

    mainButton = document.createElement("button");
    mainButton.textContent = "Ukaž video z jiného úhlu";
    mainButton.style.marginTop = "10px";
    main.wrapper.appendChild(mainButton);

    const showDualView = () => {
      overlay.classList.add("dual-view");
      main.wrapper.style.display = "flex";
      altWrapper.wrapper.style.display = "flex";

      main.video.muted = true;
      altWrapper.video.muted = false;

      main.video.play().catch(() => {});
      altWrapper.video.play().catch(() => {});

      mainButton.textContent = "pohled 1";
      if (altButton) altButton.remove();

      altButton = document.createElement("button");
      altButton.textContent = "pohled 2";
      altButton.style.marginTop = "10px";
      altWrapper.wrapper.appendChild(altButton);

      mainButton.onclick = showMainOnly;
      altButton.onclick = showAltOnly;
    };

    const showMainOnly = () => {
      overlay.classList.remove("dual-view");
      main.wrapper.style.display = "flex";
      altWrapper.wrapper.style.display = "none";

      main.video.muted = false;
      altWrapper.video.muted = true;

      mainButton.textContent = "Ukaž video z jiného úhlu";
      altButton?.remove();
      altButton = null;

      mainButton.onclick = showDualView;
    };

    const showAltOnly = () => {
      overlay.classList.remove("dual-view");
      main.wrapper.style.display = "none";
      altWrapper.wrapper.style.display = "flex";

      main.video.muted = true;
      altWrapper.video.muted = false;

      altWrapper.video.play().catch(() => {});

      altButton?.remove();

      backBtn = document.createElement("button");
      backBtn.textContent = "Ukaž video z jiného úhlu";
      backBtn.style.marginTop = "10px";
      backBtn.addEventListener("click", () => {
        backBtn.remove();
        backBtn = null;
        showDualView();
      });
      altWrapper.wrapper.appendChild(backBtn);
    };

    mainButton.onclick = showDualView;
  }

  overlay.addEventListener("click", e => {
    if (e.target === overlay) {
      overlay.remove();
      document.body.style.overflow = "";
    }
  });
}

function openYouTubeOverlay(url) {
  const overlay = document.createElement("div");
  overlay.classList.add("video-overlay");

  const ytID = extractYouTubeID(url);

  // Video container similar to HD player for local videos
  const videoContainer = document.createElement("div");
  videoContainer.classList.add("video-container");
  overlay.appendChild(videoContainer);

  // YouTube iframe
  const iframe = document.createElement("iframe");
  iframe.src = `https://www.youtube.com/embed/${ytID}?autoplay=1&mute=1&loop=1&playlist=${ytID}&controls=1&modestbranding=1&playsinline=1&rel=0`;
  iframe.allow = "autoplay; encrypted-media";
  iframe.allowFullscreen = true;
  iframe.classList.add("yt-hd-iframe");

  videoContainer.appendChild(iframe);

  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";

  // Close overlay on click outside video
  overlay.addEventListener("click", e => {
    if (e.target === overlay) {
      overlay.remove();
      document.body.style.overflow = "";
    }
  });
}

function openInstagramOverlay(url) {
  const overlay = document.createElement("div");
  overlay.classList.add("video-overlay");

  const container = document.createElement("div");
  container.classList.add("video-container");

  const iframe = document.createElement("iframe");
  iframe.src = url.replace(/\/?$/, "/") + "embed/";
  iframe.allow = "autoplay; encrypted-media";
  iframe.allowFullscreen = true;
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  iframe.style.border = "0";

  container.appendChild(iframe);
  overlay.appendChild(container);

  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";

  overlay.addEventListener("click", e => {
    if (e.target === overlay) {
      overlay.remove();
      document.body.style.overflow = "";
    }
  });
}




// ================================
// DOM CONTENT LOADED — INIT
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
        znam: row["znám?"] || null,
        youtube: row["YouTubeURL"]?.trim() || null,
        instagram: row["InstagramURL"]?.trim() || null
      }));

      console.log("Videos loaded from CSV:", videos);

      // ⛔ NO SCROLL ON PAGE LOAD
      applyFilter(null, false);

      const btnRenCa = document.getElementById("btn-renča");
      const btnPeta = document.getElementById("btn-peta");
      const btnAll = document.getElementById("btn-all");

      if (btnRenCa)
        btnRenCa.addEventListener("click", () => {
          const isTogglingOff = activeFilter === "Peťák a Renča";
          applyFilter(isTogglingOff ? null : "Peťák a Renča", true);
        });

      if (btnPeta)
        btnPeta.addEventListener("click", () => {
          const isTogglingOff = activeFilter === "Peťa a Peťa";
          applyFilter(isTogglingOff ? null : "Peťa a Peťa", true);
        });

      if (btnAll)
        btnAll.addEventListener("click", () => {
          applyFilter(null, true);
        });

      const btnRed = document.getElementById("btn-red");
      const btnYellow = document.getElementById("btn-yellow");
      const btnGreen = document.getElementById("btn-green");

      if (btnRed)
        btnRed.addEventListener("click", () => {
          const isTogglingOff = activeFilter === "red";
          applyFilter(isTogglingOff ? null : "red", true);
        });

      if (btnYellow)
        btnYellow.addEventListener("click", () => {
          const isTogglingOff = activeFilter === "yellow";
          applyFilter(isTogglingOff ? null : "yellow", true);
        });

      if (btnGreen)
        btnGreen.addEventListener("click", () => {
          const isTogglingOff = activeFilter === "green";
          applyFilter(isTogglingOff ? null : "green", true);
        });

       const btnTrenink = document.getElementById("btn-trenink");

if (btnTrenink) {
  btnTrenink.addEventListener("click", () => {
    const isTogglingOff = activeFilter === "Trénink s Peťou";
    applyFilter(isTogglingOff ? null : "Trénink s Peťou", true);
  });
}
  const btnYouTube = document.getElementById("btn-youtube");

if (btnYouTube) {
  btnYouTube.addEventListener("click", () => {
    const isTogglingOff = activeFilter === "YouTube";
    applyFilter(isTogglingOff ? null : "YouTube", true);
  });
}

    }) // closes fetch().then(...)
    .catch(err => console.error("Error loading CSV:", err));
}); // closes DOMContentLoaded


// ================================
// SPEED SCROLL FUNCTION
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

  if (iconOnly) {
    label.addEventListener("wheel", wheelHandler);
  } else {
    video.addEventListener("wheel", wheelHandler);
  }

  if (!iconOnly) {
    video.addEventListener("mouseleave", () => {
      if (speeds[index] === 1) label.style.display = "none";
    });
  }
}

/* HIDDING VIDEOS FOR REVISION*/
function createHideToggle(card, video, znamValue) {
  const toggle = document.createElement("div");
  toggle.classList.add("hide-toggle");

  // Color based on znam
  if (znamValue === "znám") toggle.classList.add("green");
  else if (znamValue === "potřebuju zlepšit") toggle.classList.add("yellow");
  else if (znamValue === "neznám") toggle.classList.add("red");

  // White placeholder
  const placeholder = document.createElement("div");
  placeholder.classList.add("video-placeholder");
  placeholder.style.display = "none";

  // Click → hide video
  toggle.addEventListener("click", e => {
    e.stopPropagation();
    video.style.display = "none";
    placeholder.style.display = "block";
  });

  // Click placeholder → show video again
  placeholder.addEventListener("click", () => {
    video.style.display = "block";
    placeholder.style.display = "none";
  });

  card.appendChild(toggle);
  card.appendChild(placeholder);
}



// ================================
// HERO BUTTON AUTO-HIDE
// ================================
function isHeroOutOfView() {
  const hero = document.querySelector(".hero");
  const rect = hero.getBoundingClientRect();
  return rect.bottom <= 0;
}

const heroBar = document.querySelector(".hero-buttons");
let hideTimeout = null;

function isScrollOnVideo(e) {
  const el = e.target;
  if (!(el instanceof Element)) return false;
  return el.closest("video") || el.closest(".speed-icon");
}

function showHeroBar() {
  heroBar.classList.remove("hidden-hero");
}

function hideHeroBar() {
  heroBar.classList.add("hidden-hero");
}

function onPageScroll(e) {
  if (isScrollOnVideo(e)) return;

  if (!isHeroOutOfView()) {
    showHeroBar();
    if (hideTimeout) clearTimeout(hideTimeout);
    return;
  }

  showHeroBar();

  if (hideTimeout) clearTimeout(hideTimeout);

  hideTimeout = setTimeout(() => {
    hideHeroBar();
  }, 2000);
}

window.addEventListener("wheel", onPageScroll, { passive: true });
window.addEventListener("scroll", onPageScroll, { passive: true });
