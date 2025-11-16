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
// FILTER FUNCTION
// ================================
function applyFilter(filterValue) {
  activeFilter = filterValue;

  // Update button active styles
  document.querySelectorAll(".filter-btn").forEach(btn => btn.classList.remove("active"));
  if (filterValue === "Peťák a Renča") document.getElementById("btn-renča")?.classList.add("active");
  else if (filterValue === "Peťa a Peťa") document.getElementById("btn-peta")?.classList.add("active");

  // Filter videos
  const filteredVideos = !filterValue ? [...videos] : videos.filter(v => v.button === filterValue);
  const shuffledVideos = shuffleArray(filteredVideos);

  loadGallery(shuffledVideos);
  lazyLoadVideos();

  // Scroll to gallery when filter applied
  if (filterValue) {
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

    const video = document.createElement("video");
    video.dataset.src = v.src480;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;

    if (v.hd) {
      video.style.cursor = "pointer";
      video.addEventListener("click", () => openOverlay(v));
    } else {
      video.style.cursor = "default";
    }

    card.appendChild(video);
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

// ================================
// DOM CONTENT LOADED — INIT
// ================================
window.addEventListener("DOMContentLoaded", () => {
  // ---- Sticky buttons ----
  const wrapper = document.querySelector('.sticky-wrapper');
  if (wrapper) {
    window.addEventListener('scroll', () => {
      const rect = wrapper.getBoundingClientRect();
      if (rect.top <= 0) wrapper.classList.add('is-sticky');
      else wrapper.classList.remove('is-sticky');
    }, { passive: true });
  }

  // ---- Load CSV and init gallery ----
  fetch("videos.csv")
    .then(res => res.text())
    .then(csvText => {
      const results = Papa.parse(csvText, { header: true, skipEmptyLines: true });

      videos = results.data.map(row => ({
        src480: row["480p"] || null,
        hd: row["1080p"] || null,
        alt: row["Alt"] || null,
        button: row["Button"] || null
      }));

      console.log("Videos loaded from CSV:", videos);

      applyFilter(null);

      // Setup filter buttons
      const btnRenCa = document.getElementById("btn-renča");
      const btnPeta = document.getElementById("btn-peta");

      if (btnRenCa) btnRenCa.addEventListener("click", () => {
        applyFilter(activeFilter === "Peťák a Renča" ? null : "Peťák a Renča");
      });

      if (btnPeta) btnPeta.addEventListener("click", () => {
        applyFilter(activeFilter === "Peťa a Peťa" ? null : "Peťa a Peťa");
      });
    })
    .catch(err => console.error("Error loading CSV:", err));
});
