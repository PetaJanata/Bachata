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

      // Overlay setup
      const overlay = document.createElement("div");
      overlay.classList.add("video-overlay");

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
        video.playsInline = true;
        video.classList.add("overlay-video");
        wrapper.appendChild(video);

        const button = document.createElement("button");
        button.style.marginTop = "10px";
        wrapper.appendChild(button);

        return { wrapper, video, button };
      }

      // Create the main video
      const main = createVideoWrapper(hdSrc);
      main.button.textContent = "Ukaž video z jiného úhlu";
      videoContainer.appendChild(main.wrapper);

      // Check if alt video exists first
      fetch(altSrc, { method: "HEAD" }).then((altResp) => {
        const altAvailable = altResp.ok;

        if (!altAvailable) {
          main.button.style.display = "none"; // no alt video → hide button
          return;
        }

        // Create alt video but don't show it yet
        const alt = createVideoWrapper(altSrc);
        alt.wrapper.style.display = "none"; // hidden initially
        videoContainer.appendChild(alt.wrapper);

        // --- MAIN BUTTON HANDLER ---
        main.button.addEventListener("click", () => {
          // Switch to dual video view
          alt.wrapper.style.display = "flex";
          main.button.style.display = "none"; // hide "show alt" button

          // Update alt buttons
          alt.button.textContent = "chci jen tohle";
          main.button.textContent = "chci jen tohle";
          main.button.style.display = "block"; // re-show under main
          alt.button.style.display = "block";

          // --- MAIN "chci jen tohle" ---
          main.button.onclick = () => {
            // Show only main
            alt.wrapper.style.display = "none";
            main.button.textContent = "Ukaž video z jiného úhlu";
            main.button.onclick = null;
            // Restore "show alt" click
            main.button.addEventListener("click", showAltHandler, { once: true });
          };

          // --- ALT "chci jen tohle" ---
          alt.button.onclick = () => {
            // Show only alt
            main.wrapper.style.display = "none";
            alt.button.style.display = "none";
            // Re-show "Ukaž video..." button under alt
            const backBtn = document.createElement("button");
            backBtn.textContent = "Ukaž video z jiného úhlu";
            backBtn.style.marginTop = "10px";
            backBtn.addEventListener("click", () => {
              // restore both
              main.wrapper.style.display = "flex";
              alt.wrapper.style.display = "flex";
              alt.button.style.display = "block";
              backBtn.remove();
              main.button.textContent = "chci jen tohle";
              main.button.onclick = mainOnlyHandler;
            });
            alt.wrapper.appendChild(backBtn);
          };

          // Save handler references to restore later
          const showAltHandler = main.button.onclick;
          const mainOnlyHandler = main.button.onclick;
        });
      });

      // Close overlay on click outside videos
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
