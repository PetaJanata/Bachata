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
// load gallery
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
//randomize
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
//lazy video
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
const switchButton = document.getElementById("switch-angle");
const overlayContent = document.querySelector(".overlay-content");
const overlayButtons = document.getElementById("overlay-buttons");

let altVideo = null;
let isDualView = false;
let mainVideoSrc = "";

// === OPEN HD PLAYER ===
async function openHDPlayer(videoSrc480) {
  const videoSrc1080 = videoSrc480.replace("_480", "_1080");
  mainVideoSrc = videoSrc1080;

  try {
    const response = await fetch(videoSrc1080, { method: "HEAD" });
    if (!response.ok) {
      console.warn("No 1080p version available for:", videoSrc480);
      return;
    }

    // ✅ Pause all 480p videos
    document.querySelectorAll("#video-gallery video").forEach(v => v.pause());

    // ✅ Setup overlay
    overlayVideo.src = videoSrc1080;
    overlay.classList.add("active");
    document.body.style.overflow = "hidden";
    overlayVideo.play();

    // ✅ Reset state
    switchButton.style.display = "inline-block";
    overlayContent.classList.remove("dual");
    if (altVideo) {
      altVideo.remove();
      altVideo = null;
    }
    isDualView = false;

  } catch (err) {
    console.warn("Error checking 1080p file:", err);
  }
}

// === CLOSE HD PLAYER ===
function closeHDPlayer() {
  overlay.classList.add("closing");
  overlayVideo.pause();

  const handleTransitionEnd = () => {
    overlay.classList.remove("active", "closing");
    document.body.style.overflow = "";
    overlayVideo.src = "";

    // Resume only visible 480p videos
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

// ✅ Close overlay when clicking outside
overlay.addEventListener("click", (e) => {
  if (e.target === overlay) {
    closeHDPlayer();
  }
});

// === DUAL VIEW FEATURE ===

// Handle “Ukaž video z jiného úhlu”
switchButton.addEventListener("click", async () => {
  if (isDualView) return;

  const altSrc = mainVideoSrc.replace(".mp4", "_alt.mp4");
  try {
    const response = await fetch(altSrc, { method: "HEAD" });
    if (!response.ok) {
      console.warn("No alternate angle found for:", mainVideoSrc);
      return;
    }

    // Create second video
    altVideo = document.createElement("video");
    altVideo.src = altSrc;
    altVideo.controls = true;
    altVideo.playsInline = true;
    altVideo.autoplay = true;

    // Enter dual view
    overlayContent.classList.add("dual");
    overlayContent.insertBefore(altVideo, overlayButtons);

    // Replace button with two single-view buttons
    switchButton.style.display = "none";
    addSingleViewButtons();

    isDualView = true;
  } catch (err) {
    console.warn("Error loading alternate video:", err);
  }
});

// Add “Ukaž jenom tohle” buttons
function addSingleViewButtons() {
  overlayButtons.innerHTML = "";

  const mainBtn = document.createElement("button");
  mainBtn.textContent = "Ukaž jenom tohle";
  mainBtn.classList.add("btn-primary");
  mainBtn.addEventListener("click", () => focusOnVideo(overlayVideo));

  const altBtn = document.createElement("button");
  altBtn.textContent = "Ukaž jenom tohle";
  altBtn.classList.add("btn-primary");
  altBtn.addEventListener("click", () => focusOnVideo(altVideo));

  overlayButtons.appendChild(mainBtn);
  overlayButtons.appendChild(altBtn);
}

// Focus on one video in overlay
function focusOnVideo(videoToKeep) {
  overlayContent.classList.remove("dual");
  switchButton.style.display = "inline-block";

  if (videoToKeep === altVideo) {
    overlayVideo.src = altVideo.src;
  }

  setTimeout(() => {
    if (altVideo) {
      altVideo.remove();
      altVideo = null;
    }
    isDualView = false;
  }, 400);

  overlayButtons.innerHTML = "";
}
