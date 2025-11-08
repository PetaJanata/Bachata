// ================================
// GLOBAL VARIABLES
// ================================
let videos = []; // Will hold all video metadata loaded from CSV

// ================================
// SHUFFLE FUNCTION
// Fisher-Yates algorithm to randomize videos
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
// Main entry point: fetch CSV and initialize gallery
// ================================
window.addEventListener("DOMContentLoaded", () => {
  // ------------------------
  // 1. FETCH CSV FILE
  // ------------------------
  // Can be a relative path ("videos.csv") or raw GitHub URL
  fetch("videos.csv")
    .then(res => res.text())
    .then(csvText => {
      // ------------------------
      // 2. PARSE CSV USING PAPAPARSE
      // ------------------------
      // header: true → use first row as keys
      // skipEmptyLines: true → ignore empty rows
      const results = Papa.parse(csvText, { header: true, skipEmptyLines: true });

      // ------------------------
      // 3. BUILD VIDEOS ARRAY
      // Each object contains:
      // id: VideoID
      // src: 480p video URL
      // hd: 1080p video URL (optional)
      // alt: alternate angle video URL (optional)
      // type: "local" (all GitHub-hosted videos)
      // ------------------------
      videos = results.data.map(row => ({
        id: row.VideoID,
        src: row["480p"],
        hd: row["1080p"] || null,
        alt: row["Alt"] || null,
        type: "local"
      }));

      // ------------------------
      // 4. SHUFFLE AND LOAD GALLERY
      // ------------------------
      const shuffledVideos = shuffleArray([...videos]);
      loadGallery(shuffledVideos);

      // ------------------------
      // 5. LAZY LOAD 480P VIDEOS
      // ------------------------
      lazyLoadVideos();
    })
    .catch(err => console.error("Error loading CSV:", err));
});

// ================================
// LOAD GALLERY
// Dynamically creates video cards for each 480p video
// ================================
function loadGallery(videoList) {
  const gallery = document.getElementById("video-gallery");
  gallery.innerHTML = ""; // clear previous content

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
// LAZY LOAD 480P VIDEOS
// Uses IntersectionObserver and fallback for older browsers
// ================================
function lazyLoadVideos() {
  const videoElements = document.querySelectorAll("video[data-src]");

  const loadVideo = (video) => {
    if (!video.dataset.src) return;
    video.src = video.dataset.src;
    video.removeAttribute("data-src");
    video.play().catch(() => {}); // ignore autoplay errors
  };

  // IntersectionObserver for efficient lazy loading
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        const video = entry.target;
        if (entry.isIntersecting) {
          loadVideo(video);
          observer.unobserve(video); // no longer need to observe
        }
      });
    },
    { rootMargin: "400px 0px", threshold: 0.1 }
  );

  videoElements.forEach(video => observer.observe(video));

  // Fallback in case IntersectionObserver misses videos
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
// Displays HD video and optional alternate angle
// ================================
function openOverlay(videoObj) {
  // ------------------------
  // Create overlay container
  // ------------------------
  const overlay = document.createElement("div");
  overlay.classList.add("video-overlay");
  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden"; // prevent background scrolling

  const videoContainer = document.createElement("div");
  videoContainer.style.display = "flex";
  videoContainer.style.gap = "20px";
  overlay.appendChild(videoContainer);

  // ------------------------
  // Main video: HD if exists, else 480p
  // ------------------------
  const main = createVideoWrapper(videoObj.hd || videoObj.src, false);
  videoContainer.appendChild(main.wrapper);

  // ------------------------
  // Optional alternate angle
  // ------------------------
  if (videoObj.alt) {
    const alt = createVideoWrapper(videoObj.alt, true);
    alt.wrapper.style.display = "none";
    videoContainer.appendChild(alt.wrapper);

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

  // ------------------------
  // Click outside overlay closes it
  // ------------------------
  overlay.addEventListener("click", e => {
    if (e.target === overlay) {
      overlay.remove();
      document.body.style.overflow = "";
    }
  });
}

// ================================
// CREATE VIDEO WRAPPER
// Helper function to create a video element with controls
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
