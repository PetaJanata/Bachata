// Only 480p videos in the gallery
const videos = [
  { src: "videos/3_480.mp4" },
  { src: "videos/6_480.mp4" },
  { src: "videos/9_480.mp4" },
];

// Shuffle function (Fisher-Yates algorithm)
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

// HD overlay with alternate-angle video and proper muting
function openOverlay(src480) {
  const hdSrc = src480.replace("_480", "_1080");
  const altSrc = hdSrc.replace(".mp4", "_alt.mp4");

  // Check if HD version exists
  fetch(hdSrc, { method: "HEAD" })
    .then((response) => {
      if (!response.ok) return;

      // Overlay container
      const overlay = document.createElement("div");
      overlay.classList.add("video-overlay");

      const videoContainer = document.createElement("div");
      videoContainer.style.display = "flex";
      videoContainer.style.gap = "20px";
      overlay.appendChild(videoContainer);

      document.body.appendChild(overlay);
      document.body.style.overflow = "hidden";

      // Helper to create video wrapper
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

      // Main HD video
      const main = createVideoWrapper(hdSrc);
      main.video.muted = false; // main has audio
      videoContainer.appendChild(main.wrapper);

      // Check for alt video
      fetch(altSrc, { method: "HEAD" })
        .then((altResp) => {
          const altAvailable = altResp.ok;
          if (!altAvailable) return;

          // Initial "Ukaž video..." button
          const mainButton = document.createElement("button");
          mainButton.textContent = "Ukaž video z jiného úhlu";
          mainButton.style.marginTop = "10px";
          main.wrapper.appendChild(mainButton);

          const alt = createVideoWrapper(altSrc);
          alt.wrapper.style.display = "none";
          alt.video.muted = true; // alt is muted initially
          videoContainer.appendChild(alt.wrapper);

          let altButton = null;
          let backBtn = null;

          // Show both views
          const showDualView = () => {
            alt.wrapper.style.display = "flex";
            mainButton.textContent = "pohled 1";

            // Create pohled 2 button under alt video
            if (!altButton) {
              altButton = document.createElement("button");
              altButton.textContent = "pohled 2";
              altButton.style.marginTop = "10px";
              alt.wrapper.appendChild(altButton);
            }

            // Ensure only main has sound by default in dual view
            main.video.muted = false;
            alt.video.muted = true;

            // Button handlers
            mainButton.onclick = () => {
              main.video.muted = false;
              alt.video.muted = true;
            };
            altButton.onclick = () => {
              main.video.muted = true;
              alt.video.muted = false;
            };
          };

          // Back to main only
          const showMainOnly = () => {
            alt.wrapper.style.display = "none";
            mainButton.textContent = "Ukaž video z jiného úhlu";
            mainButton.onclick = showDualView;

            main.video.muted = false;
            alt.video.muted = true;

            if (altButton) {
              altButton.remove();
              altButton = null;
            }
          };

          // Alt-only mode
          const showAltOnly = () => {
            main.wrapper.style.display = "none";
            alt.wrapper.style.display = "flex";
            main.video.muted = true;
            alt.video.muted = false;

            if (altButton) altButton.remove();

            // Back button to restore dual view
            backBtn = document.createElement("button");
            backBtn.textContent = "Ukaž video z jiného úhlu";
            backBtn.style.marginTop = "10px";
            backBtn.addEventListener("click", () => {
              main.wrapper.style.display = "flex";
              showDualView();
              backBtn.remove();
              backBtn = null;
            });
            alt.wrapper.appendChild(backBtn);
          };

          // Initial setup
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
    .catch((err) => console.log("HD video not available:", hdSrc));
}
