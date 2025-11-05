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

  // Check if HD version exists
  fetch(hdSrc, { method: 'HEAD' })
    .then(response => {
      if (response.ok) {
        // HD exists → show overlay
        const overlay = document.createElement("div");
        overlay.classList.add("video-overlay");
        overlay.addEventListener("click", () => {
          overlay.remove();
          document.body.style.overflow = "";
        });

        const video = document.createElement("video");
        video.src = hdSrc;
        video.controls = true;
        video.autoplay = true;
        video.playsInline = true;

        overlay.appendChild(video);
        document.body.appendChild(overlay);
        document.body.style.overflow = "hidden";
      }
      // If HD doesn't exist → do nothing
    })
    .catch(err => {
      console.log("HD video not available:", hdSrc);
    });
}

