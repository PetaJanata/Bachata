// ================================
// GLOBAL VARIABLES
// ================================
let videos = []; // will hold all video metadata from CSV
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
// DOM CONTENT LOADED
// Load CSV and initialize gallery
// ================================
window.addEventListener("DOMContentLoaded", () => {
  fetch("videos.csv") // path to your CSV in repository
    .then(res => res.text())
    .then(csvText => {
      const results = Papa.parse(csvText, { header: true, skipEmptyLines: true });

      // Build videos array from CSV
      videos = results.data.map(row => ({
        src480: row.src_480 || null,
        hd: row.src_1080 || null,
        alt: row.src_alt || null
      }));

      // Shuffle and load gallery
      const shuffledVideos = shuffleArray([...videos]);
      loadGallery(shuffledVideos);
      lazyLoadVideos();
    })
    .catch(err => console.error("Error loading CSV:", err));
});

// ================================
// LOAD GALLERY
// Dynamically creates video cards for 480p previews
// ================================
function loadGallery(videoList) {
  gallery.innerHTML = "";

  videoList.forEach((v) => {
    if (!v.src480) return; // skip if no 480p preview

    const card = document.createElement("div");
    card.classList.add("video-card");

    const video = document.createElement("video");
    video.dataset.src = v.src480; // lazy load
    video.muted = true;
    video.loop = true;
    video.playsInline = true;

    // Open overlay with CSV info
    video.addEventListener("click", () => openOverlay(v));

    card.appendChild(video);
    gallery.appendChild(card);
  });
}

// ================================
// LAZY LOAD 480P VIDEOS
// IntersectionObserver + fallback
// ================================
function lazyLoadVideos() {
  const videoElements = document.querySelectorAll("video[data-src]");

  const loadVideo = (video) => {
    if (!video.dataset.src) return;
    video.src = video.dataset.src;
    video.removeAttribute("data-src");
    video.play().catch(() => {});
  };

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

  // Fallback in case IntersectionObserver misses
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
}

// ================================
// OPEN OVERLAY
// Handles HD / alt / dual view / proper muting
// ================================
function openOverlay(videoObj) {
  const { src480, hd, alt } = videoObj;

  const overlay = document.createElement("div");
  overlay.classList.add("video-overlay");

  const videoContainer = document.createElement("div");
  videoContainer.style.display = "flex";
  videoContainer.style.gap = "20px";
  overlay.appendChild(videoContainer);

  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";

  // Helper: create video wrapper
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

  // Main video: HD if exists, otherwise 480p
  const main = createVideoWrapper(hd || src480, false);
  videoContainer.appendChild(main.wrapper);

  let altWrapper, mainButton, altButton, backBtn;

  if (alt) {
    // Alt video exists
    altWrapper = createVideoWrapper(alt, true);
    altWrapper.wrapper.style.display = "none";
    videoContainer.appendChild(altWrapper.wrapper);

    // Button on main video
    mainButton = document.createElement("button");
    mainButton.textContent = "Ukaž video z jiného úhlu";
    mainButton.style.marginTop = "10px";
    main.wrapper.appendChild(mainButton);

    // --- Dual / toggle view functions ---
    const showDualView = () => {
      main.wrapper.style.display = "flex";
      altWrapper.wrapper.style.display = "flex";

      main.video.muted = true;
      altWrapper.video.muted = false;
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
      main.wrapper.style.display = "flex";
      altWrapper.wrapper.style.display = "none";

      main.video.muted = false;
      altWrapper.video.muted = true;

      mainButton.textContent = "Ukaž video z jiného úhlu";
      if (altButton) { altButton.remove(); altButton = null; }

      mainButton.onclick = showDualView;
    };

    const showAltOnly = () => {
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

    // Initial click
    mainButton.onclick = showDualView;
  }

  // Click outside overlay closes it
  overlay.addEventListener("click", e => {
    if (e.target === overlay) {
      overlay.remove();
      document.body.style.overflow = "";
    }
  });
}
