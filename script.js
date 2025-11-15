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
  if (filterValue === "Peťák a Renča") document.getElementById("btn-renča").classList.add("active");
  else if (filterValue === "Peťa a Peťa") document.getElementById("btn-peta").classList.add("active");

  // Filter videos based on CSV column
  const filteredVideos = !filterValue
    ? [...videos]
    : videos.filter(v => v.button === filterValue);

  const shuffledVideos = shuffleArray(filteredVideos);
  loadGallery(shuffledVideos);
  lazyLoadVideos();

  // === SCROLL TO VIDEO GALLERY ===
  if (filterValue) {
    document.getElementById("video-gallery").scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
}


// ================================
// DOM CONTENT LOADED
// ================================
// Load CSV and initialize gallery
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
        button: row["Button"] || null
      }));

      console.log("Videos loaded from CSV:", videos);

      applyFilter(null);

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

// ================================
// LOAD GALLERY
// ================================
function loadGallery(videoList) {
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
// LAZY LOAD + AUTO-PAUSE VIDEOS
// ================================
function lazyLoadVideos() {
  const videoElements = document.querySelectorAll("video[data-src]");

  const loadVideo = video => {
    if (!video.dataset.src) return;
    video.src = video.dataset.src;
    video.removeAttribute("data-src");
    video.play().catch(() => {});
  };

  // ---------- Lazy loader ----------
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        const video = entry.target;
        if (entry.isIntersecting) {
          loadVideo(video);
          observer.unobserve(video);
        }
      });
    },
    { rootMargin: "400px 0px", threshold: 0.1 }
  );

  videoElements.forEach(video => observer.observe(video));

  // ---------- Extra visibility check ----------
  const checkVisible = () => {
    videoElements.forEach(video => {
      if (video.dataset.src) {
        const rect = video.getBoundingClientRect();
        if (rect.top < window.innerHeight + 300 && rect.bottom > -300) {
          loadVideo(video);
        }
      }
    });
  };

  window.addEventListener("scroll", checkVisible, { passive: true });
  window.addEventListener("resize", checkVisible);

  // =======================
  // PAUSE WHEN NOT VISIBLE
  // =======================
  const pauseObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        const video = entry.target;

        if (!entry.isIntersecting) {
          if (!video.paused) video.pause();
        } else {
          if (video.paused) video.play().catch(() => {});
        }
      });
    },
    { threshold: 0.25 }
  );

  document.querySelectorAll("video").forEach(video => pauseObserver.observe(video));
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

      if (!main.video.muted) {
        main.video.muted = true;
        altWrapper.video.muted = false;
      } else if (!altWrapper.video.muted) {
        main.video.muted = false;
        altWrapper.video.muted = true;
      }

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
      if (altButton) { altButton.remove(); altButton = null; }

      mainButton.onclick = showDualView;
    };

    const showAltOnly = () => {
      overlay.classList.remove("dual-view");
      main.wrapper.style.display = "none";
      altWrapper.wrapper.style.display = "flex";

      main.video.muted = true;
      altWrapper.video.muted = false;

      altWrapper.video.play().catch(() => {});

      if (altButton) altButton.remove();

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
