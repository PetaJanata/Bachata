// ================================
// Global videos array
// ================================
let videos = []; // holds all video metadata

// ================================
// Shuffle function (Fisher-Yates)
// ================================
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// ================================
// Load CSV metadata and initialize gallery
// ================================
window.addEventListener("DOMContentLoaded", () => {
  fetch("videos.csv") // path to your CSV file
    .then(res => res.text())
    .then(csvText => {
      // Parse CSV with PapaParse
      const results = Papa.parse(csvText, { header: true, skipEmptyLines: true });

      // Build videos array
      videos = results.data.map(row => ({
        id: row.VideoID,
        src: row["480p"],          // 480p version for gallery
        hd: row["1080p"] || null,  // HD version
        alt: row["Alt"] || null,   // Alternate angle
        type: "local"
      }));

      // Shuffle and load gallery
      const shuffledVideos = shuffleArray([...videos]);
      loadGallery(shuffledVideos);
      lazyLoadVideos();
    })
    .catch(err => console.error("Error loading CSV:", err));
});

// ================================
// Load gallery dynamically
// ================================
function loadGallery(videoList) {
  const gallery = document.getElementById("video-gallery");
  gallery.innerHTML = "";

  videoList.forEach(v => {
    const card = document.createElement("div");
    card.classList.add("video-card");

    const video = document.createElement("video");
    video.dataset.src = v.src; // lazy-load src
    video.muted = true;
    video.loop = true;
    video.playsInline = true;

    // Open overlay on click using preloaded metadata
    video.addEventListener("click", () => openOverlay(v));

    card.appendChild(video);
    gallery.appendChild(card);
  });
}

// ================================
// Lazy load 480p videos
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
    (entries) => {
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

  // Fallback for videos that might not be detected by IntersectionObserver
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
// Overlay for HD / Alt videos
// ================================
function openOverlay(videoObj) {
  // Create overlay
  const overlay = document.createElement("div");
  overlay.classList.add("video-overlay");
  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden"; // prevent background scroll

  // Container for videos
  const videoContainer = document.createElement("div");
  videoContainer.style.display = "flex";
  videoContainer.style.gap = "20px";
  overlay.appendChild(videoContainer);

  // Main video (HD if exists, else 480p)
  const main = createVideoWrapper(videoObj.hd || videoObj.src, false);
  videoContainer.appendChild(main.wrapper);

  // Alternate angle
  if (videoObj.alt) {
    const alt = createVideoWrapper(videoObj.alt, true);
    alt.wrapper.style.display = "none";
    videoContainer.appendChild(alt.wrapper);

    // Toggle button
    const toggleButton = document.createElement("button");
    toggleButton.textContent = "Show alternate angle";
    toggleButton.style.marginTop = "10px";
    main.wrapper.appendChild(toggleButton);

    toggleButton.onclick = () => {
      if (alt.wrapper.style.display === "none") {
        alt.wrapper.style.display = "flex";
        main.wrapper.style.display = "none";
      } else {
        alt.wrapper.style.display = "none";
        main.wrapper.style.display = "flex";
      }
    };
  }

  // Click outside overlay closes it
  overlay.addEventListener("click", e => {
    if (e.target === overlay) {
      overlay.remove();
      document.body.style.overflow = "";
    }
  });
}

// ================================
// Helper to create a video wrapper
// ================================
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
