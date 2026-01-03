let heroLocked = false;
let heroBottomY = 0;
let isReturningToHero = false;


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
const visibleCount = 3; // main + 2 layers on each side

function getVisibleIndexes(centerIndex) {
  const total = carouselImages.length;
  const isMobile = window.innerWidth <= 768;
  let indexes = [];

  if (isMobile) {
    indexes.push(centerIndex); // only main image on mobile
  } else {
    for (let i = -1; i <= 1; i++) {
      let idx = (centerIndex + i + total) % total;
      indexes.push(idx);
    }
  }

  return indexes;
}

function renderCarousel() {
  carouselContainer.innerHTML = "";

  const indexes = getVisibleIndexes(currentIndex);
  const isMobile = window.innerWidth <= 768;

  // create mobile arrows (always visible on mobile)
  if (isMobile) {
    const leftArrow = document.createElement("div");
    leftArrow.classList.add("mobile-arrow", "left-arrow");
    leftArrow.innerHTML = "&#8592;";

    const rightArrow = document.createElement("div");
    rightArrow.classList.add("mobile-arrow", "right-arrow");
    rightArrow.innerHTML = "&#8594;";

    carouselContainer.appendChild(leftArrow);
    carouselContainer.appendChild(rightArrow);

    leftArrow.addEventListener("click", () => {
      currentIndex = (currentIndex - 1 + carouselImages.length) % carouselImages.length;
      renderCarousel();
    });

    rightArrow.addEventListener("click", () => {
      currentIndex = (currentIndex + 1) % carouselImages.length;
      renderCarousel();
    });
  }

  indexes.forEach((imgIdx, position) => {
    const img = document.createElement("img");
    img.src = carouselImages[imgIdx];
    img.classList.add("carousel-img");

    if (position === 1 && !isMobile) img.classList.add("main-img");
    else if (!isMobile && position === 0) img.classList.add("first-layer", "left");
    else if (!isMobile && position === 2) img.classList.add("first-layer", "right");

    if (position === 0 && isMobile || position === 1 && isMobile) {
      img.classList.add("main-img"); // main image on mobile
    }

    // Clickable side images only for desktop
    if (!isMobile && (position === 0 || position === 2)) {
      img.addEventListener("click", () => {
        currentIndex = position < 1
          ? (currentIndex - 1 + carouselImages.length) % carouselImages.length
          : (currentIndex + 1) % carouselImages.length;
        renderCarousel();
      });
    }

    carouselContainer.appendChild(img);
  });
}


function scrollToGallery() {
  const hero = document.querySelector(".hero");
  const heroBottom = hero.getBoundingClientRect().bottom + window.scrollY;

  window.scrollTo({
    top: heroBottom,
    behavior: "smooth"
  });

  lockHero();
}



// Initial render
renderCarousel();
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
    case "Stolárna": document.getElementById("btn-stolarna")?.classList.add("active");
  break;

    default: document.getElementById("btn-all")?.classList.add("active");
  }

  let filteredVideos;

if (filterValue === "red") filteredVideos = videos.filter(v => v.znam?.trim() === "neznám");
else if (filterValue === "yellow") filteredVideos = videos.filter(v => v.znam?.trim() === "potřebuju zlepšit");
else if (filterValue === "green") filteredVideos = videos.filter(v => v.znam?.trim() === "znám");
  else if (!filterValue) {
  filteredVideos = [...videos];
}
else {
  // default: filter strictly by Button column
  filteredVideos = videos.filter(v => v.button === filterValue);
}


//debug
  console.log("Filter:", filterValue, "matching videos:", filteredVideos.length);
  // Shuffle
  const shuffledVideos = shuffleArray(filteredVideos);

  loadGallery(shuffledVideos);
  lazyLoadVideos();
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


function loadGallery(videoList) {
  if (!gallery) return;
  gallery.innerHTML = "";

  videoList.forEach(v => {
    const card = document.createElement("div");
    card.classList.add("video-card");
    card.style.position = "relative";

    let speedIcon = null;
    let fullscreenIcon = null;

    // ──────────────── Instagram ────────────────
    if (v.instagram) {
      const thumb = document.createElement("img");
      thumb.src = "images/instagram-placeholder.jpg";
      thumb.classList.add("video-thumb");
      thumb.style.cursor = "pointer";

      speedIcon = document.createElement("div");
      speedIcon.classList.add("speed-icon");
      speedIcon.textContent = "IG";
      card.appendChild(speedIcon);

      thumb.addEventListener("click", () => openInstagramOverlay(v.instagram));

      card.appendChild(thumb);
      gallery.appendChild(card);
      return;
    }

    // ──────────────── YouTube ────────────────
    if (v.youtube) {
      const ytID = extractYouTubeID(v.youtube);

      const thumb = document.createElement("img");
      thumb.src = `https://i.ytimg.com/vi/${ytID}/hqdefault.jpg`;
      thumb.classList.add("video-thumb");
      thumb.style.cursor = "pointer";

      speedIcon = document.createElement("div");
      speedIcon.classList.add("speed-icon");
      speedIcon.textContent = "YT";
      card.appendChild(speedIcon);

     thumb.addEventListener("click", () => openYouTubeOverlay(v));


      card.appendChild(thumb);
      gallery.appendChild(card);
      return;
    }

    // ──────────────── Facebook ────────────────
if (v.facebook) {
  const thumb = document.createElement("img");
  thumb.src = "images/facebook-placeholder.jpg"; // static placeholder
  thumb.classList.add("video-thumb");
  thumb.style.cursor = "pointer";

  const icon = document.createElement("div");
  icon.classList.add("speed-icon");
  icon.textContent = "FB";
  card.appendChild(icon);

  thumb.addEventListener("click", () => openFacebookOverlay(v.facebook));

  card.appendChild(thumb);
  gallery.appendChild(card);
  return;
}


    // ──────────────── Local Video ────────────────
    if (!v.src480) return;

    const video = document.createElement("video");
    video.dataset.src = v.src480;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.style.cursor = "default";

    if (v.znam === "znám") video.classList.add("know-green");
    else if (v.znam === "potřebuju zlepšit") video.classList.add("know-yellow");
    else if (v.znam === "neznám") video.classList.add("know-red");

    card.appendChild(video);

    // Speed icon
    speedIcon = document.createElement("div");
    speedIcon.classList.add("speed-icon");
    speedIcon.textContent = "1×";
    card.appendChild(speedIcon);

    // Fullscreen icon for HD
    if (v.hd) {
      fullscreenIcon = document.createElement("div");
      fullscreenIcon.classList.add("fullscreen-icon");
      fullscreenIcon.innerHTML = "⤢";
      card.appendChild(fullscreenIcon);

      fullscreenIcon.addEventListener("click", () => openOverlay(v));
    }

    // Hover logic
card.addEventListener("mouseenter", () => {
  if (card.dataset.hidden || video.style.display === "none") return;
  if (speedIcon) speedIcon.style.display = "block";
  if (fullscreenIcon) fullscreenIcon.style.display = "block";
});
card.addEventListener("mouseleave", () => {
  if (speedIcon) speedIcon.style.display = "none";
  if (fullscreenIcon) fullscreenIcon.style.display = "none";
});


    attachSpeedScroll(video, speedIcon, true);

    // Hide toggle for Peťák a Renča & Stolárna
   if (v.button === "Peťák a Renča" || v.button === "Stolárna") {
  createHideToggle(card, video, v.znam);
}

    gallery.appendChild(card);
  });
}

function buildYouTubeEmbed(url, start, end) {
  const videoId = extractYouTubeID(url);
  if (!videoId) return "";

  let params = [
    "autoplay=1",
    "controls=1",
    "enablejsapi=1",
    "playsinline=1",
    "rel=0"
  ];

  if (Number.isFinite(start)) params.push(`start=${start}`);
  if (Number.isFinite(end)) params.push(`end=${end}`);

  return `https://www.youtube.com/embed/${videoId}?${params.join("&")}`;
}


let ytPlayer;

function onYouTubeIframeAPIReady() {
  // API ready (required global function)
}

function initSegmentLoop(iframe, start, end) {
  ytPlayer = new YT.Player(iframe, {
    events: {
      onReady: (e) => {
        if (start !== "") {
          e.target.seekTo(start, true);
        }
      },
      onStateChange: (e) => {
        if (e.data === YT.PlayerState.PLAYING && end !== "") {
          monitorLoop(start, end);
        }
      }
    }
  });
}

let ytLoopInterval = null;

function monitorLoop(start, end) {
  clearInterval(ytLoopInterval);

  ytLoopInterval = setInterval(() => {
    if (!ytPlayer || typeof ytPlayer.getCurrentTime !== "function") return;

    const t = ytPlayer.getCurrentTime();
    if (t >= end) {
      ytPlayer.seekTo(start, true);
    }
  }, 200);
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

function openYouTubeOverlay(videoObj) {
  const { youtube, startSec, endSec } = videoObj;

  const overlay = document.createElement("div");
  overlay.classList.add("video-overlay");

  const videoContainer = document.createElement("div");
  videoContainer.classList.add("video-container");
  overlay.appendChild(videoContainer);

  const iframe = document.createElement("iframe");
  iframe.src = buildYouTubeEmbed(youtube, startSec, endSec);
  iframe.allow = "autoplay; encrypted-media";
  iframe.allowFullscreen = true;
  iframe.classList.add("yt-hd-iframe");

  videoContainer.appendChild(iframe);

  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";

  // init segment looping ONLY if needed
  if (
  Number.isFinite(startSec) &&
  Number.isFinite(endSec) &&
  endSec > startSec
) {
  initSegmentLoop(iframe, startSec, endSec);
}


  overlay.addEventListener("click", e => {
  if (e.target === overlay) {
    overlay.remove();
    document.body.style.overflow = "";

    if (ytLoopInterval) {
      clearInterval(ytLoopInterval);
      ytLoopInterval = null;
    }

    ytPlayer = null;
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

function openFacebookOverlay(url) {
  const overlay = document.createElement("div");
  overlay.classList.add("video-overlay");

  // ✅ backdrop (full screen, clickable)
  const backdrop = document.createElement("div");
  backdrop.classList.add("video-backdrop");

  // ✅ video wrapper (centered, blocks close)
  const wrapper = document.createElement("div");
  wrapper.classList.add("fb-video-wrapper");

  const iframe = document.createElement("iframe");
  iframe.src =
    "https://www.facebook.com/plugins/video.php?href=" +
    encodeURIComponent(url) +
    "&show_text=false&autoplay=true";

  iframe.allow = "autoplay; encrypted-media";
  iframe.allowFullscreen = true;
  iframe.classList.add("fb-iframe");

  // ⛔ prevent closing when clicking video area
  wrapper.addEventListener("click", e => e.stopPropagation());

  wrapper.appendChild(iframe);
  overlay.appendChild(backdrop);
  overlay.appendChild(wrapper);
  document.body.appendChild(overlay);

  document.body.style.overflow = "hidden";

  // ✅ clicking backdrop closes overlay
  backdrop.addEventListener("click", () => {
    overlay.remove();
    document.body.style.overflow = "";
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
        startSec: row["StartSec"] ? Number(row["StartSec"]) : null,
        endSec: row["EndSec"] ? Number(row["EndSec"]) : null,
        facebook: row["FacebookURL"]?.trim() || null,
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
    applyFilter(null, false); // filter only, no scroll
    scrollToGallery();       // precise scroll
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
  
   const btnStolarna = document.getElementById("btn-stolarna");

if (btnStolarna) {
  btnStolarna.addEventListener("click", () => {
    const isTogglingOff = activeFilter === "Stolárna";
    applyFilter(isTogglingOff ? null : "Stolárna", true);
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
// HERO LOCKED + RETURN BUTTON
// ================================


function updateHeroBottom() {
  const hero = document.querySelector(".hero");
  if (!hero) return;

  heroBottomY =
    hero.getBoundingClientRect().bottom + window.scrollY;
}

window.addEventListener("load", updateHeroBottom);
window.addEventListener("resize", updateHeroBottom);


function enforceHeroLock() {
  if (!heroLocked) return;

  // If scrolled above heroBottomY, snap back instantly
  if (window.scrollY < heroBottomY) {
    window.scrollTo({ top: heroBottomY, behavior: "auto" });
  }

  requestAnimationFrame(enforceHeroLock);
}

// Call this once when locking hero
function lockHero() {
  if (heroLocked || isReturningToHero) return;
  updateHeroBottom();
  heroLocked = true;
  showHeroReturnButton();
  enforceHeroLock(); // continuously enforce scroll lock
}


//mobile touch tracking
let lastTouchY = 0;
window.addEventListener("touchstart", e => {
  lastTouchY = e.touches[0].clientY;
}, { passive: true });

//observer
const heroObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) {
      lockHero();
    }
  });
}, { threshold: 0 });

heroObserver.observe(document.querySelector(".hero"));

/*helpers*/
const backToHeroBtn = document.getElementById("back-to-hero");

function showHeroReturnButton() {
  backToHeroBtn.style.display = "block";
}

function hideHeroReturnButton() {
  backToHeroBtn.style.display = "none";
}

/*return to top */
backToHeroBtn.addEventListener("click", () => {
  isReturningToHero = true;
  heroLocked = false;

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

  setTimeout(() => {
    isReturningToHero = false;
    hideHeroReturnButton();
  }, 700);
});

// ================================
// VIDEO COUNT CONFIGURATION
// ================================


function getScreenCategory() {
  return window.innerWidth <= 768 ? "mobile" : "desktop";
}

// Stores manual user overrides
let gridOverride = {
  mobile: null,
  desktop: null
};

const gridBtn = document.getElementById("grid-btn");
let expanded = false;

// Determine dynamic number of columns based on screen width
function getDynamicCols() {
  const videoBlock = document.querySelector(".video-block");
  if (!videoBlock) return window.innerWidth <= 768 ? 1 : 6;

  const minWidth = window.innerWidth <= 768 ? 250 : 180; // px per column
  const cols = Math.floor(videoBlock.clientWidth / minWidth);
  return Math.min(Math.max(cols, 1), 6); // always 1-6
}



// Returns the current column count: user override or dynamic
function getCurrentCols() {
  const category = getScreenCategory();
  return gridOverride[category] ?? getDynamicCols();
}

// Apply columns to video block
function applyGridColumns(cols, isUserOverride = false) {
  const videoBlock = document.querySelector(".video-block");
  if (!videoBlock) return;

  videoBlock.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

  if (isUserOverride) {
    const category = getScreenCategory();
    gridOverride[category] = cols;
  }
}


// Initial rendering of grid button
function renderGridCompact() {
  gridBtn.innerHTML = "";
  gridBtn.classList.remove("expanded");

  const cols = getCurrentCols();
  for (let i = 0; i < cols; i++) {
    const cell = document.createElement("div");
    cell.className = "grid-cell filled";
    gridBtn.appendChild(cell);
  }
}

// Expanded selector
function renderGridExpanded() {
  gridBtn.innerHTML = "";
  gridBtn.classList.add("expanded");

  const current = getCurrentCols();
  const max = window.innerWidth <= 768 ? 3 : 6;
  const category = getScreenCategory();

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
      gridBtn.querySelectorAll(".grid-cell").forEach(c => 
        c.classList.remove("preview", "unpreview")
      );
    });

   cell.addEventListener("click", e => {
  e.stopPropagation();
  applyGridColumns(i, true); // mark as user override
  expanded = false;
  renderGridCompact();
});


    gridBtn.appendChild(cell);
  }
}

// Toggle expanded state
gridBtn.addEventListener("click", e => {
  e.stopPropagation();
  expanded ? renderGridCompact() : renderGridExpanded();
  expanded = !expanded;
});

// Close on outside click
document.addEventListener("click", () => {
  if (expanded) {
    renderGridCompact();
    expanded = false;
  }
});

// Handle resize
window.addEventListener("resize", () => {
  const category = getScreenCategory();

  // Reset manual override for new category if none exists
  if (gridOverride[category] === null) {
    applyGridColumns(getDynamicCols());
  } else {
    // Apply existing override for this category
    applyGridColumns(gridOverride[category]);
  }

  // Ensure button is compact
  expanded = false;
  renderGridCompact();
});

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  applyGridColumns(getCurrentCols());
  renderGridCompact();
});






// ================================
// TOP PANEL HEIGHT SYNC (MOBILE MENU)
// ================================
function updateTopPanelHeight() {
  const topPanel = document.querySelector(".top-panel");
  if (!topPanel) return;

  document.documentElement.style.setProperty(
    "--top-panel-height",
    `${topPanel.offsetHeight}px`
  );
}

// keep value correct at all times
window.addEventListener("load", updateTopPanelHeight);
window.addEventListener("resize", updateTopPanelHeight);



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
    e.stopPropagation();   // ⬅️ add this
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

/* HIDDING VIDEOS FOR REVISION*/
function createHideToggle(card, video, znamValue) {
  const toggle = document.createElement("div");
  toggle.classList.add("hide-toggle");

  if (znamValue === "znám") toggle.classList.add("green");
  else if (znamValue === "potřebuju zlepšit") toggle.classList.add("yellow");
  else if (znamValue === "neznám") toggle.classList.add("red");

  const placeholder = document.createElement("div");
  placeholder.classList.add("video-placeholder");
  placeholder.style.display = "none";

  const speedIcon = card.querySelector(".speed-icon");
  const fullscreenIcon = card.querySelector(".fullscreen-icon");

  // Hide video
toggle.addEventListener("click", e => {
  e.stopPropagation();

  card.dataset.hidden = "true";   // 🔴 mark as hidden

  video.style.display = "none";
  placeholder.style.display = "flex";

  if (speedIcon) speedIcon.style.display = "none";
  if (fullscreenIcon) fullscreenIcon.style.display = "none";
  toggle.style.display = "none";
});

// Restore video
placeholder.addEventListener("click", () => {
  delete card.dataset.hidden;     // 🟢 unmark hidden

  video.style.display = "block";
  placeholder.style.display = "none";
  toggle.style.display = "block";
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

/*new layout */
document.querySelectorAll(".menu-main").forEach(mainBtn => {
  mainBtn.addEventListener("click", () => {
    const group = mainBtn.closest(".menu-group");
    group.classList.toggle("open");
  });
});

document.querySelectorAll(".menu-sub button").forEach(subBtn => {
  subBtn.addEventListener("click", () => {
    const filterValue = subBtn.dataset.filter;
    applyFilter(filterValue, false);
  });
});


const hamburgerBtn = document.getElementById("hamburger-btn");
const menuOverlay = document.querySelector(".side-menu"); // reuse existing menu
const backdrop = document.createElement("div");

backdrop.classList.add("menu-backdrop");
document.body.appendChild(backdrop);

function openMenu() {
  menuOverlay.classList.add("open");
  backdrop.classList.add("active");
  document.body.style.overflow = "hidden"; // optional: prevent page scroll
}

function closeMenu() {
  menuOverlay.classList.remove("open");
  backdrop.classList.remove("active");
  document.body.style.overflow = ""; // restore scroll
}

// hamburger click
hamburgerBtn.addEventListener("click", () => {
  if (menuOverlay.classList.contains("open")) {
    closeMenu();
  } else {
    openMenu();
  }
});

// click on backdrop to close menu
backdrop.addEventListener("click", closeMenu);



