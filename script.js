// Only 480p videos in the gallery
const videos = [
  { src: "videos/3_480.mp4" },
  { src: "videos/6_480.mp4" },
  { src: "videos/9_480.mp4" },
];

// Shuffle function (Fisher–Yates algorithm)
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

const gallery = document.getElementById("video-gallery");

window.addEventListener("DOMContentLoaded", () => {
  const shuffledVideos = shuffleArray([...videos]);
  loadGallery(shuffledVideos);
  lazyLoadVideos();
});

// Load 480p videos dynamically
function loadGallery(videoList) {
  gallery.innerHTML = "";
  videoList.forEach((v) => {
    const card = document.createElement("div");
    card.classList.add("video-card");

    const video = document.createElement("video");
    video.dataset.src = v.src;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;

    // Open HD overlay on click
    video.addEventListener("click", () => openOverlay(v.src));

    card.appendChild(video);
    gallery.appendChild(card);
  });
}

// Lazy load 480p videos
function lazyLoadVideos() {
  const videoElements = document.querySelectorAll("video[data-src]");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        if (entry.isIntersecting) {
          video.src = video.dataset.src;
          video.removeAttribute("data-src");
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    },
    { rootMargin: "200px 0px", threshold: 0.25 }
  );

  videoElements.forEach((video) => observer.observe(video));
}

// HD overlay with alternate-angle video and buttons
function openOverlay(src480) {
  const hdSrc = src480.replace("_480", "_1080");
  const altSrc = hdSrc.replace(".mp4", "_alt.mp4");

  // Check if HD version exists
  fetch(hdSrc, { method: "HEAD" })
    .then((response) => {
      if (!response.ok) return; // HD not available → do nothing

      // Overlay container
      const overlay = document.createElement("div");
      overlay.classList.add("video-overlay");

      // Container for both videos
      const videoContainer = document.createElement("div");
      videoContainer.style.display = "flex";
      videoContainer.style.gap = "20px";
      overlay.appendChild(videoContainer);

      document.body.appendChild(overlay);
      document.body.style.overflow = "hidden";

      // Helper to create a video + wrapper
      function createVideoWrapper(videoSrc) {
        const wrapper = document.createElement("div");
        wrapper.style.display = "flex";
        wrapper.style.flexDirection = "column";
        wrapper.style.alignItems = "center";

        const video = document.createElement("video");
        video.src = videoSrc;
        video.controls = true;
        video.autoplay = true;
        video.loop = true;
        video.playsInline = true;
        video.classList.add("overlay-video");
        wrapper.appendChild(video);

        return { wrapper, video };
      }

      // Create main HD video
      const main = createVideoWrapper(hdSrc);
      videoContainer.appendChild(main.wrapper);

      // Check if alt video exists
      fetch(altSrc, { method: "HEAD" })
        .then((altResp) => {
          const altAvailable = altResp.ok;
          if (!altAvailable) return;

          // Create main control button
          const mainButton = document.createElement("button");
          mainButton.textContent = "pohled 2";
          mainButton.style.marginTop = "10px";
          main.wrapper.appendChild(mainButton);

          // Prepare alt video (hidden initially)
          const alt = createVideoWrapper(altSrc);
          alt.wrapper.style.display = "none";
          alt.video.muted = true; // ✅ keep muted until shown
          videoContainer.appendChild(alt.wrapper);

          let altButton = null;
          let backBtn = null;

          // Show dual view
          const showDualView = () => {
            alt.wrapper.style.display = "flex";
            alt.video.muted = true;
            mainButton.textContent = "pohled 1";

            // Create alt button if missing
            if (!altButton) {
              altButton = document.createElement("button");
              altButton.textContent = "pohled 2";
              altButton.style.marginTop = "10px";
              alt.wrapper.appendChild(altButton);
            }

            mainButton.onclick = showAltOnly;
            altButton.onclick = showMainOnly;
          };

          // Show only main video
          const showMainOnly = () => {
            alt.wrapper.style.display = "none";
            alt.video.pause();
            alt.video.muted = true;
            main.wrapper.style.display = "flex";
            mainButton.textContent = "pohled 2";
            mainButton.onclick = showDualView;

            if (altButton) {
              altButton.remove();
              altButton = null;
            }
            if (backBtn) {
              backBtn.remove();
              backBtn = null;
            }
          };

          // Show only alt video
          const showAltOnly = () => {
            main.wrapper.style.display = "none";
            alt.wrapper.style.display = "flex";
            alt.video.muted = false; // ✅ unmute alt video
            alt.video.play();

            if (altButton) altButton.remove();

            backBtn = document.createElement("button");
            backBtn.textContent = "pohled 1";
            backBtn.style.marginTop = "10px";
            backBtn.addEventListener("click", () => {
              main.wrapper.style.display = "flex";
              alt.wrapper.style.display = "flex";
              alt.video.muted = true;
              backBtn.remove();
              backBtn = null;
              showDualView();
            });
            alt.wrapper.appendChild(backBtn);
          };

          // Start with main video only
          mainButton.onclick = showDualView;
        });

      // Click outside overlay closes it
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
          overlay.remove();
          document.body.style.overflow = "";
        }
      });
    })
    .catch((err) => {
      console.log("HD video not available:", hdSrc);
    });
}
