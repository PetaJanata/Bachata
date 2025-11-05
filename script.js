// Only 480p videos in the gallery
const videos = [
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
  const altSrc = hdSrc.replace(".mp4", "_alt.mp4"); // e.g., 6_1080_alt.mp4

  // Check if HD version exists
  fetch(hdSrc, { method: 'HEAD' })
    .then(response => {
      if (!response.ok) return; // HD not available → do nothing

      // overlay
      const overlay = document.createElement("div");
      overlay.classList.add("video-overlay");

      // container for videos
      const videoContainer = document.createElement("div");
      videoContainer.style.display = "flex";
      videoContainer.style.gap = "20px";
      overlay.appendChild(videoContainer);

      // function to create a video + button wrapper
      function createVideoWrapper(videoSrc, buttonText, buttonHandler) {
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

        if (buttonText && buttonHandler) {
          const btn = document.createElement("button");
          btn.textContent = buttonText;
          btn.style.marginTop = "10px";
          btn.addEventListener("click", buttonHandler);
          wrapper.appendChild(btn);
        }

        return { wrapper, video };
      }

      // main video wrapper with "show alt angle" button
      const showAltButton = { visible: true }; // track visibility

      const mainWrapperData = createVideoWrapper(hdSrc, "Ukaž video z jiného úhlu", () => {
        // show alt video next to main
        altVideoData = createVideoWrapper(altSrc, "chci jen tohle", () => {
          // Show only alt video
          mainWrapperData.wrapper.remove();
          showAltButton.visible = true;
          mainWrapperData.wrapper.querySelector("button").style.display = "block"; // restore button if needed
        });
        videoContainer.appendChild(altVideoData.wrapper);

        // replace main button with "chci jen tohle"
        mainWrapperData.wrapper.querySelector("button").textContent = "chci jen tohle";
        mainWrapperData.wrapper.querySelector("button").onclick = () => {
          // Show only main video
          if (altVideoData) altVideoData.wrapper.remove();
          // Restore original button
          mainWrapperData.wrapper.querySelector("button").textContent = "Ukaž video z jiného úhlu";
          mainWrapperData.wrapper.querySelector("button").onclick = mainWrapperData.showAltHandler;
        };

        showAltButton.visible = false;
        mainWrapperData.wrapper.querySelector("button").style.display = "block";
      });

      // store handler for later restoration
      mainWrapperData.showAltHandler = mainWrapperData.wrapper.querySelector("button").onclick;

      videoContainer.appendChild(mainWrapperData.wrapper);

      // Check if alt video exists
      fetch(altSrc, { method: 'HEAD' })
        .then(altResp => {
          if (!altResp.ok) {
            // hide button if alt not available
            mainWrapperData.wrapper.querySelector("button").style.display = "none";
          }
        });

      // overlay click outside videos closes overlay
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
          overlay.remove();
          document.body.style.overflow = "";
        }
      });

      document.body.appendChild(overlay);
      document.body.style.overflow = "hidden";
    })
    .catch(err => {
      console.log("HD video not available:", hdSrc);
    });
}

      console.log("HD video not available:", hdSrc);
    });
}
