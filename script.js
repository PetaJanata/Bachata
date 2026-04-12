let activeLekce = new Set();    // multi-select set of t2 values
let activeZnam = null;
let activeFigury = new Set();   // multi-select
let activeDatum = new Set();    // multi-select
let sortNewest = false;
let datumActiveYear = null;     // which year is shown in the datum grid




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

}



// Initial render
renderCarousel();
window.addEventListener("resize", renderCarousel);

// ================================ 
// GLOBAL VARIABLES
// ================================
let videos = []; // holds all video metadata from CSV

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
// MENU BUILDER
// ================================

// ================================
// ACTIVE FILTER TAGS (sticky summary at top of sidebar)
// ================================
function renderActiveFilters() {
  const container = document.getElementById("active-filters");
  if (!container) return;
  container.innerHTML = "";

  const tags = [];

  activeLekce.forEach(t2 => tags.push({
    label: t2,
    remove: () => {
      activeLekce.delete(t2);
      if (t2 === "Peťák a Renča") { activeDatum = new Set(); datumActiveYear = null; }
      updateNewestButtonVisibility();
      applyFilters();
    }
  }));
  activeDatum.forEach(d => tags.push({ label: d, remove: () => { activeDatum.delete(d); applyFilters(); } }));
  activeFigury.forEach(f => tags.push({ label: f, remove: () => { activeFigury.delete(f); applyFilters(); } }));
  if (activeZnam) tags.push({ label: activeZnam, remove: () => { activeZnam = null; updateZnamUI(); applyFilters(); } });

  if (tags.length === 0) {
    container.style.display = "none";
    return;
  }

  container.style.display = "flex";
  tags.forEach(tag => {
    const el = document.createElement("span");
    el.className = "active-filter-tag";
    el.textContent = tag.label + " ×";
    el.addEventListener("click", () => { tag.remove(); renderActiveFilters(); buildMenu(videos); });
    container.appendChild(el);
  });
}

// ================================
// MENU BUILDER
// ================================
function buildMenu(videos) {
  const menu = document.getElementById("dynamic-menu");
  menu.innerHTML = "";

  // --- Lekce section ---
  const tree = {};
  videos.forEach(v => {
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

    t2set.forEach(t2 => {
      const btn = document.createElement("button");
      btn.textContent = t2;
      btn.dataset.t1 = t1;
      btn.dataset.t2 = t2;
      if (activeLekce.has(t2)) btn.classList.add("active");
      btn.addEventListener("click", () => {
        applyPrimaryFilter(t1, t2);
        renderActiveFilters();
        buildMenu(videos);
      });
      sub.appendChild(btn);

      // Datum sub-section — year toggle + month grid, only for Peťák a Renča
      if (t2 === "Peťák a Renča" && activeLekce.has("Peťák a Renča")) {
        const monthOrder = ["Leden","Únor","Březen","Duben","Květen","Červen","Červenec","Srpen","Září","Říjen","Listopad","Prosinec"];
        const monthShort  = ["Led","Úno","Bře","Dub","Kvě","Čvn","Čvc","Srp","Zář","Říj","Lis","Pro"];

        // Build set of all year-month combos that have data
        const dataDates = new Set(
          videos
            .filter(v => v.t2 === "Peťák a Renča" && v.datum)
            .map(v => v.datum)
        );

        // Extract unique years, newest first
        const years = [...new Set(
          [...dataDates].map(d => d.split("-")[0])
        )].sort((a, b) => Number(b) - Number(a));

        if (years.length === 0) return;

        // Use persistent JS variable so year survives menu rebuilds
        // Only initialise to latest year if not set yet or if year no longer exists
        if (!datumActiveYear || !years.includes(datumActiveYear)) {
          datumActiveYear = years[0];
        }

        const datumWrap = document.createElement("div");
        datumWrap.className = "datum-section";

        // Title
        const datumTitle = document.createElement("div");
        datumTitle.className = "datum-section-title";
        datumTitle.textContent = "Datum";
        datumWrap.appendChild(datumTitle);

        // Year toggle buttons
        const yearRow = document.createElement("div");
        yearRow.className = "datum-year-row";
        years.forEach(yr => {
          const btn = document.createElement("button");
          btn.className = "datum-year-btn" + (yr === datumActiveYear ? " active" : "");
          btn.textContent = yr;
          btn.addEventListener("click", (e) => {
            e.stopPropagation();
            datumActiveYear = yr;
            renderMonthGrid(datumWrap, yr, dataDates, monthOrder, monthShort);
            yearRow.querySelectorAll(".datum-year-btn").forEach(b => {
              b.classList.toggle("active", b.textContent === yr);
            });
          });
          yearRow.appendChild(btn);
        });
        datumWrap.appendChild(yearRow);

        // Month grid container
        const gridWrap = document.createElement("div");
        gridWrap.className = "datum-month-grid-wrap";
        datumWrap.appendChild(gridWrap);

        // Helper: render month grid for a given year
        function renderMonthGrid(wrap, yr, dataDates, monthOrder, monthShort) {
          const gridWrap = wrap.querySelector(".datum-month-grid-wrap");
          gridWrap.innerHTML = "";
          const grid = document.createElement("div");
          grid.className = "datum-month-grid";
          monthOrder.forEach((month, i) => {
            const key = yr + "-" + month;
            const hasData = dataDates.has(key);
            const isActive = activeDatum.has(key);
            const cell = document.createElement("button");
            cell.className = "datum-month-btn" +
              (hasData ? " has-data" : " no-data") +
              (isActive ? " active" : "");
            cell.textContent = monthShort[i];
            cell.disabled = !hasData;
            if (hasData) {
              cell.addEventListener("click", (e) => {
                e.stopPropagation();
                if (activeDatum.has(key)) activeDatum.delete(key);
                else activeDatum.add(key);
                applyFilters();
                renderActiveFilters();
                buildMenu(videos);
              });
            }
            grid.appendChild(cell);
          });
          gridWrap.appendChild(grid);
        }

        renderMonthGrid(datumWrap, datumActiveYear, dataDates, monthOrder, monthShort);
        sub.appendChild(datumWrap);
      }
    });

    group.appendChild(main);
    group.appendChild(sub);
    menu.appendChild(group);
  });

  // --- Figury section ---
  const allFigury = [...new Set(
    videos.flatMap(v => v.figury || [])
  )].sort();

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

    allFigury.forEach(f => {
      const chip = document.createElement("button");
      chip.className = "figury-chip" + (activeFigury.has(f) ? " active" : "");
      chip.textContent = f;
      chip.addEventListener("click", () => {
        if (activeFigury.has(f)) activeFigury.delete(f);
        else activeFigury.add(f);
        applyFilters();
        renderActiveFilters();
        buildMenu(videos);
      });
      figuryWrap.appendChild(chip);
    });

    menu.appendChild(figuryWrap);
  }
}



// ================================
// MENU BUILDER END
// ================================
const passwordProtected = {
  "Trénink Peťa": "petaapeta",
  "Trénink Hanka": "petaahanka",
  "Trénink Barča": "petaabarca"
};

function isPasswordProtected(t2) {
  return passwordProtected[t2];
}

function checkPassword(t2) {
  return prompt("Zadejte heslo:") === passwordProtected[t2];
}

function applyPrimaryFilter(t1, t2) {
  if (isPasswordProtected(t2) && !checkPassword(t2)) return;

  // Toggle this lekce in/out of activeLekce
  if (activeLekce.has(t2)) {
    activeLekce.delete(t2);
    if (t2 === "Peťák a Renča") { activeDatum = new Set(); datumActiveYear = null; }
  } else {
    activeLekce.add(t2);
  }

  updateNewestButtonVisibility();
  updateZnamUI();
  applyFilters();
}


function applyZnamFilter(value) {
  // toggle behavior
  activeZnam = activeZnam === value ? null : value;
  updateZnamUI();
  applyFilters();
}

function applyFilters(forceRebuild = false) {
  // On forceRebuild (refresh): clear all filters first
  if (forceRebuild) {
    activeLekce = new Set();
    activeZnam = null;
    activeFigury = new Set();
    activeDatum = new Set();
    datumActiveYear = null;
    sortNewest = false;
    updateZnamUI();
    updateNewestButtonVisibility();
    renderActiveFilters();
  }

  let result = [...videos];

  // Always hide password-protected categories unless selected
  result = result.filter(v =>
    !isPasswordProtected(v.t2) || activeLekce.has(v.t2)
  );

  // Lekce filter (OR — video must be in at least one selected lekce)
  if (activeLekce.size > 0) {
    result = result.filter(v => activeLekce.has(v.t2));
  }

  // Datum filter (OR — any selected month matches)
  if (activeDatum.size > 0) {
    result = result.filter(v => v.datum && activeDatum.has(v.datum));
  }

  // Figury filter (OR — video must contain at least one selected figure)
  if (activeFigury.size > 0) {
    result = result.filter(v =>
      Array.isArray(v.figury) && v.figury.some(f => activeFigury.has(f))
    );
  }

  // Znam filter
  if (activeZnam) {
    result = result.filter(v => v.znam && v.znam === activeZnam);
  }

  // 🔥 NEWEST SORT — sort by videoId desc within whatever is filtered
  if (sortNewest) {
    result = result
      .filter(v => Number.isFinite(v.videoId))
      .sort((a, b) => b.videoId - a.videoId);
    loadGallery(result, true);
  } else if (forceRebuild) {
    result = shuffleArray([...videos].filter(v => !isPasswordProtected(v.t2)));
    loadGallery(result, true);
  } else {
    loadGallery(result, false);
  }

  lazyLoadVideos();
}

function updateZnamUI() {
  document.querySelectorAll("[data-znam]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.znam === activeZnam);
  });
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


// Returns a unique key for a video object
function videoKey(v) {
  return v.src480 || v.youtube || v.facebook || v.instagram || null;
}

// Builds a fresh card DOM node for a video object
function createVideoCard(v) {
  const card = document.createElement("div");
  card.classList.add("video-card");
  card.style.position = "relative";
  card.style.marginBottom = "20px";
  card.style.breakInside = "avoid";

  const key = videoKey(v);
  if (key) card.dataset.videoKey = key;

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
    return card;
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
  video.style.cursor = "default";

  if (v.znam === "znám") video.classList.add("know-green");
  else if (v.znam === "potřebuju zlepšit") video.classList.add("know-yellow");
  else if (v.znam === "neznám") video.classList.add("know-red");

  card.appendChild(video);

  speedIcon = document.createElement("div");
  speedIcon.classList.add("speed-icon");
  speedIcon.textContent = "1×";
  card.appendChild(speedIcon);

  if (v.hd) {
    fullscreenIcon = document.createElement("div");
    fullscreenIcon.classList.add("fullscreen-icon");
    fullscreenIcon.innerHTML = "⤢";
    card.appendChild(fullscreenIcon);
    fullscreenIcon.addEventListener("click", () => openOverlay(v));
  }

  card.addEventListener("mouseenter", () => {
    if (card.dataset.hidden || video.style.display === "none") return;
    if (speedIcon) speedIcon.style.display = "block";
    if (fullscreenIcon) fullscreenIcon.style.display = "block";
    const hideToggle = card.querySelector(".hide-toggle");
    if (hideToggle) hideToggle.style.display = "block";
  });

  card.addEventListener("mouseleave", () => {
    if (speedIcon) speedIcon.style.display = "none";
    if (fullscreenIcon) fullscreenIcon.style.display = "none";
    const hideToggle = card.querySelector(".hide-toggle");
    if (hideToggle) hideToggle.style.display = "none";
  });

  attachSpeedScroll(video, speedIcon, true);
  createHideToggle(card, video, v.znam);
  return card;
}

// ================================
// GRID GALLERY (CSS grid, row-based)
// ================================

let renderedVideos = []; // full shuffled list currently in DOM

// Full rebuild — wipe gallery and render videoList fresh
function buildGridLayout(videoList) {
  gallery.querySelectorAll("video").forEach(v => { v.pause(); v.src = ""; });
  gallery.innerHTML = "";
  renderedVideos = [...videoList];
  videoList.forEach(v => {
    const card = createVideoCard(v);
    if (card) gallery.appendChild(card);
  });
}

// Called when grid button changes column count — just update CSS
function rebuildColumns(numCols) {
  applyGridCSS(numCols);
}

function applyGridCSS(cols) {
  gallery.style.display = "grid";
  gallery.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  gallery.style.gap = "20px";
  gallery.style.padding = "2rem";
}

function loadGallery(videoList, forceRebuild = false) {
  if (!gallery) return;

  if (forceRebuild) {
    buildGridLayout(videoList);
    applyGridCSS(getCurrentCols());
    return;
  }

  // Dynamic filter mode:
  // Show cards whose key is in videoList, hide the rest.
  // No repositioning — cards stay exactly where they were placed on last full build.
  const wantedKeys = new Set(videoList.map(videoKey).filter(Boolean));

  gallery.querySelectorAll(".video-card").forEach(card => {
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
  t1: row["T1"]?.trim() || null,
  t2: row["T2"]?.trim() || null,
  znam: row["znám?"]?.trim() || null,
  videoId: row["VideoID"] ? Number(row["VideoID"]) : null,
  youtube: row["YouTubeURL"]?.trim() || null,
  startSec: row["StartSec"] ? Number(row["StartSec"]) : null,
  endSec: row["EndSec"] ? Number(row["EndSec"]) : null,
  facebook: row["FacebookURL"]?.trim() || null,
  instagram: row["InstagramURL"]?.trim() || null,
  figury: row["Figury"] ? row["Figury"].split(",").map(s => s.trim()).filter(Boolean) : [],
  datum: row["Datum"]?.trim() || null
}));
      
videos = videos.filter(v => v.t1 && v.t2);
      


document.querySelectorAll("[data-znam]").forEach(btn => {
  btn.addEventListener("click", () => {
    applyZnamFilter(btn.dataset.znam);
  });
});


      console.log("Videos loaded from CSV:", videos);

      // Initial load — shuffle once
      applyFilters(true);
      buildMenu(videos);
      renderActiveFilters();

         
    }) // closes fetch().then(...)
    .catch(err => console.error("Error loading CSV:", err));
}); // closes DOMContentLoaded


const btnAll = document.getElementById("btn-all");

if (btnAll) {
  btnAll.addEventListener("click", () => {
    scrollToGallery(); // just scroll, videos stay as-is
  });
}



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
  if (!videoBlock) return window.innerWidth <= 768 ? 1 : 5; // desktop max 5 now

  const minWidth = window.innerWidth <= 768 ? 250 : 180; // px per column
  const cols = Math.floor(videoBlock.clientWidth / minWidth);

  const maxCols = window.innerWidth <= 768 ? 3 : 5; // max columns
  return Math.min(Math.max(cols, 1), maxCols); // always 1 - maxCols
}



// Returns the current column count: user override or dynamic
function getCurrentCols() {
  const category = getScreenCategory();
  return gridOverride[category] ?? getDynamicCols();
}

// Apply columns to video block
function applyGridColumns(cols, isUserOverride = false) {
  if (isUserOverride) {
    const category = getScreenCategory();
    gridOverride[category] = cols;
  }
  applyGridCSS(cols);
  renderGridCompact();
}


// Initial rendering of grid button
// Compact button shows all possible sizes but highlights selected
function renderGridCompact() {
  gridBtn.innerHTML = "";
  gridBtn.classList.remove("expanded");

  const current = getCurrentCols();
  const max = window.innerWidth <= 768 ? 3 : 5;

  for (let i = 1; i <= max; i++) {
    const cell = document.createElement("div");
    cell.className = "grid-cell";
    if (i <= current) cell.classList.add("filled"); // selected columns filled
    gridBtn.appendChild(cell);
  }
}

// Expanded selector
function renderGridExpanded() {
  gridBtn.innerHTML = "";
  gridBtn.classList.add("expanded");

  const current = getCurrentCols();
  const max = window.innerWidth <= 768 ? 3 : 5; // mobile 3, desktop 5
  const category = getScreenCategory();

  for (let i = 1; i <= max; i++) {
    const cell = document.createElement("div");
    cell.className = "grid-cell";

    if (i <= current) cell.classList.add("filled"); // selected columns filled

    // hover preview/unpreview
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

    // click sets columns
    cell.addEventListener("click", e => {
      e.stopPropagation();
      applyGridColumns(i, true);
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
  const cols = gridOverride[category] ?? getDynamicCols();
  applyGridCSS(cols);
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

 /* if (znamValue === "znám") toggle.classList.add("green");
  else if (znamValue === "potřebuju zlepšit") toggle.classList.add("yellow");
  else if (znamValue === "neznám") toggle.classList.add("red");
*/
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
  delete card.dataset.hidden; // 🟢 unmark hidden

  video.style.display = "block";
  placeholder.style.display = "none";

  const speedIcon = card.querySelector(".speed-icon");
  const fullscreenIcon = card.querySelector(".fullscreen-icon");

  // 🔥 If mouse is already over the card, show icons immediately
  if (card.matches(":hover")) {
    if (speedIcon) speedIcon.style.display = "block";
    if (fullscreenIcon) fullscreenIcon.style.display = "block";
    toggle.style.display = "block";
  } else {
    // otherwise wait for hover
    toggle.style.display = "none";
  }
});



  card.appendChild(toggle);
  card.appendChild(placeholder);
}

/*new layout */
document.querySelectorAll(".menu-main").forEach(mainBtn => {
  mainBtn.addEventListener("click", () => {
    const group = mainBtn.closest(".menu-group");
    group.classList.toggle("open");
  });
});
// 🔥 Open all submenu categories by default on load
document.querySelectorAll(".menu-group").forEach(group => {
  group.classList.add("open");
});


// END OF MENU LAYOUT 
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




function updateNewestButtonVisibility() {
  const btn = document.getElementById("btn-newest");
  if (!btn) return;

  if (activeLekce.has("Peťák a Renča")) {
    btn.classList.remove("hidden");
  } else {
    btn.classList.add("hidden");
    btn.classList.remove("active");
    sortNewest = false;
  }
}

const newestBtn = document.getElementById("btn-newest");

if (newestBtn) {
  newestBtn.addEventListener("click", () => {
    sortNewest = !sortNewest;
    newestBtn.classList.toggle("active", sortNewest);
    applyFilters(false); // show/hide in place when possible, rebuild when sortNewest
  });
}

// ================================
// REFRESH BUTTON — reshuffle and reload
// ================================
const refreshBtn = document.getElementById("refresh-btn");
if (refreshBtn) {
  refreshBtn.addEventListener("click", () => {
    applyFilters(true); // force reshuffle
  });
}
