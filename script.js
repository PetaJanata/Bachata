// ✅ Only 480p videos in the gallery
const videos = [
  { src: "videos/1_480.mp4" },
  { src: "videos/2_480.mp4" },
  { src: "videos/3_480.mp4" },
  { src: "videos/4_480.mp4" },
  { src: "videos/5_480.mp4" },
  { src: "videos/6_480.mp4" },
  { src: "videos/7_480.mp4" },
  { src: "videos/8_480.mp4" },
  { src: "videos/9_480.mp4" },
  { src: "videos/10_480.mp4" },
  { src: "videos/15_480.mp4" },

];

const gallery = document.getElementById("video-gallery");

window.addEventListener("DOMContentLoaded", () => {
  const randomizedVideos = shuffleArray([...videos]);
  loadVideos(randomizedVideos);
});

function loadVideos(videoList) {
  gallery.innerHTML = "";

  videoList.forEach(v => {
    const card = document.createElement("div");
    card.classList.add("video-card");

    const video = document.createElement("video");
    video.setAttribute("data-src", v.src);
    video.muted = true;
    video.loop = true;
    video.playsInline = true;

    // 💡 Open 1080p overlay when clicked
    video.addEventListener("click", () => openHDPlayer(v.src));

    card.appendChild(video);
    gallery.appendChild(card);
  });

  lazyLoadVideos();
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function lazyLoadVideos() {
  const videoElements = document.querySelectorAll("video[data-src], video[src]");

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      const video = entry.target;

      if (entry.isIntersecting) {
        if (video.dataset.src) {
          video.src = video.dataset.src;
          video.removeAttribute("data-src");
        }
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }, {
    rootMargin: "200px 0px",
    threshold: 0.25
  });

  videoElements.forEach(video => observer.observe(video));
}

// === FULLSCREEN 1080p OVERLAY PLAYER ===
const overlay = document.getElementById("video-overlay");
const overlayVideo = document.getElementById("overlay-video");

function openHDPlayer(videoSrc480) {
  const videoSrc1080 = videoSrc480.replace("_480", "_1080");

  // 🧠 Check if the 1080p version exists before loading
  fetch(videoSrc1080, { method: "HEAD" })
    .then(response => {
      if (!response.ok) {
        console.warn("No 1080p version available for:", videoSrc480);
        return; // ❌ Do nothing if 1080p not found
      }

      // ✅ Pause all 480p videos
      document.querySelectorAll("#video-gallery video").forEach(v => v.pause());

      // ✅ Setup and show overlay
      overlayVideo.src = videoSrc1080;
      overlay.classList.add("active");
      document.body.style.overflow = "hidden"; // disable scroll
      overlayVideo.play();
    })
    .catch(err => {
      console.warn("Error checking 1080p file:", err);
    });
}


function closeHDPlayer() {
  overlay.classList.add("closing");
  overlayVideo.pause();

  const handleTransitionEnd = () => {
    overlay.classList.remove("active", "closing");
    document.body.style.overflow = "";
    overlayVideo.src = "";

    document.querySelectorAll("#video-gallery video").forEach(v => {
      const rect = v.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        v.play().catch(() => {});
      }
    });

    overlay.removeEventListener("transitionend", handleTransitionEnd);
  };

  overlay.addEventListener("transitionend", handleTransitionEnd);
}

// ✅ Close when clicking outside the video
overlay.addEventListener("click", (e) => {
  if (e.target === overlay) {
    closeHDPlayer();
  }
});

