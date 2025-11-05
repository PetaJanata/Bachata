// Only 480p videos in the gallery
const videos = [
  { src: "videos/3_480.mp4" },
  { src: "videos/6_480.mp4" },
  { src: "videos/9_480.mp4" },

];

// Shuffle function (Fisher-Yates algorithm) - RANDOMIZED VIDEO LOADING
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

const gallery = document.getElementById("video-gallery");

window.addEventListener("DOMContentLoaded", () => {
  const shuffledVideos = shuffleArray([...videos]); // shuffle copy of the array
  loadGallery(shuffledVideos);
  lazyLoadVideos();
});

// Load 480p videos dynamically
function loadGallery(videoList) {
  gallery.innerHTML = "";
  videoList.forEach(v => {
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
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const video = entry.target;
      if (entry.isIntersecting) {
        video.src = video.dataset.src;
        video.removeAttribute("data-src");
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }, { rootMargin: "200px 0px", threshold: 0.25 });

  videoElements.forEach(video => observer.observe(video));
}



// HD overlay with alt video and buttons properly placed
function openOverlay(src480) {
  const hdSrc = src480.replace("_480", "_1080");
  const altSrc = hdSrc.replace(".mp4", "_alt.mp4");

  // Check if HD version exists
  fetch(hdSrc, { method: "HEAD" })
    .then((response) => {
      if (!response.ok) return; // HD not available → do nothing

      // Overlay
      const overlay = document.createElement("div");
      overlay.classList.add("video-overlay");

      // Container for videos
      const videoContainer = document.createElement("div");
      videoContainer.style.display = "flex";
      videoContainer.style.gap = "20px";
      overlay.appendChild(videoContainer);

      document.body.appendChild(overlay);
      document.body.style.overflow = "hidden";

      // Helper to create a video + button wrapper
      function createVideoWrapper(videoSrc) {
        const wrapper = document.createElement("div");
        wrapper.style.display = "flex";
        wrapper.style.flexDirection = "column";
        wrapper.style.alignItems = "center";

        const video = document.createElement("video");
        video.src = videoSrc;
        video.controls = true;
        video.autoplay = true;
        video.loop = true; // ✅ videos loop by default
        video.playsInline = true;
        video.classList.add("overlay-video");
        wrapper.appendChild(video);

        return { wrapper, video };
      }

      // Create main HD video
      const main = createVideoWrapper(hdSrc);
      videoContainer.appendChild(main.wrapper);

      // Check if alt video exists BEFORE adding any button
      fetch(altSrc, { method: "HEAD" })
        .then((altResp) => {
          const altAvailable = altResp.ok;
          if (!altAvailable) return; // ✅ No alt = no button, no flicker

          // Create "Ukaž video z jiného úhlu" button only if alt exists
          const mainButton = document.createElement("button");
          mainButton.textContent = "Ukaž video z jiného úhlu";
          mainButton.style.marginTop = "10px";
          main.wrapper.appendChild(mainButton);

          // Prepare alt video (hidden initially)
          const alt = createVideoWrapper(altSrc);
          alt.wrapper.style.display = "none";
          videoContainer.appendChild(alt.wrapper);

          // Define handlers for showing/hiding videos
          const showAlt = () => {
            alt.wrapper.style.display = "flex";
            mainButton.textContent = "chci jen tohle";
            const altButton = document.createElement("button");
            altButton.textContent = "chci jen tohle";
            altButton.style.marginTop = "10px";
            alt.wrapper.appendChild(altButton);

            mainButton.onclick = showMainOnly;
            altButton.onclick = showAltOnly;
          };

          const showMainOnly = () => {
            alt.wrapper.style.display = "none";
            mainButton.textContent = "Ukaž video z jiného úhlu";
            mainButton.onclick = showAlt;
          };

          const showAltOnly = () => {
            main.wrapper.style.display = "none";

            // Create restore button under alt video
            const backBtn = document.createElement("button");
            backBtn.textContent = "Ukaž video z jiného úhlu";
            backBtn.style.marginTop = "10px";
            backBtn.addEventListener("click", () => {
              main.wrapper.style.display = "flex";
              alt.wrapper.style.display = "flex";
              backBtn.remove();
              mainButton.textContent = "chci jen tohle";
              mainButton.onclick = showMainOnly;
            });
            alt.wrapper.appendChild(backBtn);
          };

          // Initialize with single HD video and button
          mainButton.onclick = showAlt;
        });

      // Close overlay when clicking outside videos
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

