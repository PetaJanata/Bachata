// Only 480p videos in the gallery
const videos = [
  { src: "videos/6_480.mp4" },
  { src: "videos/7_480.mp4" },

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

// HD overlay
function openOverlay(src480) {
  const hdSrc = src480.replace("_480", "_1080");
  const altSrc = hdSrc.replace(".mp4", "_alt.mp4"); // e.g., 6_1080_alt.mp4

  // Check if HD version exists
  fetch(hdSrc, { method: 'HEAD' })
    .then(response => {
      if (!response.ok) return; // HD not available → do nothing

      const overlay = document.createElement("div");
      overlay.classList.add("video-overlay");

      // container for videos
      const videoContainer = document.createElement("div");
      videoContainer.style.display = "flex";
      videoContainer.style.gap = "20px";
      overlay.appendChild(videoContainer);

      // create main HD video
      const mainVideo = document.createElement("video");
      mainVideo.src = hdSrc;
      mainVideo.controls = true;
      mainVideo.autoplay = true;
      mainVideo.playsInline = true;
      mainVideo.classList.add("overlay-video");
      videoContainer.appendChild(mainVideo);

      // create "show alternative angle" button
      const showAltButton = document.createElement("button");
      showAltButton.textContent = "Ukaž video z jiného úhlu";
      showAltButton.style.display = "block";
      showAltButton.style.marginTop = "10px";

      // append buttons container
      const buttonsContainer = document.createElement("div");
      buttonsContainer.style.display = "flex";
      buttonsContainer.style.gap = "10px";
      buttonsContainer.style.marginTop = "10px";
      overlay.appendChild(buttonsContainer);
      buttonsContainer.appendChild(showAltButton);

      // overlay click outside videos closes overlay
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
          overlay.remove();
          document.body.style.overflow = "";
        }
      });

      document.body.appendChild(overlay);
      document.body.style.overflow = "hidden";

      // Check if alt video exists
      fetch(altSrc, { method: 'HEAD' })
        .then(altResp => {
          if (!altResp.ok) {
            showAltButton.style.display = "none"; // hide button if alt not available
          }
        });

      // Event: show alternative angle video
      showAltButton.addEventListener("click", () => {
        // create alt video next to main video
        const altVideo = document.createElement("video");
        altVideo.src = altSrc;
        altVideo.controls = true;
        altVideo.autoplay = true;
        altVideo.playsInline = true;
        altVideo.classList.add("overlay-video");
        videoContainer.appendChild(altVideo);

        // hide showAltButton
        showAltButton.style.display = "none";

        // create "show only this" buttons for each video
        buttonsContainer.innerHTML = ""; // clear previous buttons

        const onlyMainBtn = document.createElement("button");
        onlyMainBtn.textContent = "chci jen tohle"; // for main video
        const onlyAltBtn = document.createElement("button");
        onlyAltBtn.textContent = "chci jen tohle"; // for alt video

        buttonsContainer.appendChild(onlyMainBtn);
        buttonsContainer.appendChild(onlyAltBtn);

        // click handlers
        onlyMainBtn.addEventListener("click", () => {
          // show only main video
          altVideo.remove();
          buttonsContainer.innerHTML = "";
          buttonsContainer.appendChild(showAltButton);
          showAltButton.style.display = "block";
        });

        onlyAltBtn.addEventListener("click", () => {
          // show only alt video
          mainVideo.remove();
          buttonsContainer.innerHTML = "";
          buttonsContainer.appendChild(showAltButton);
          showAltButton.style.display = "block";

          // swap mainVideo reference
          mainVideo.src = altVideo.src;
          videoContainer.appendChild(mainVideo); // put mainVideo back
        });
      });
    })
    .catch(err => {
      console.log("HD video not available:", hdSrc);
    });
}
