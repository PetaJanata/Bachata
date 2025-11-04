// ✅ Only 480p videos in the gallery
const videos = [
  { src: "videos/1_480.mp4" },
  { src: "videos/2_480.mp4" },
  { src: "videos/3_480.mp4" },
  { src: "videos/4_480.mp4" },
  { src: "videos/5_480.mp4" },
  { src: "videos/6_480.mp4" },
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

// === LOAD GALLERY ===
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

// === RANDOMIZE ORDER ===
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// === LAZY LOAD VIDEOS ===
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
const overlayContent = document.querySelector(".overlay-content");
const overlayButtonsContainer = document.getElementById("overlay-buttons");
let mainVideo = null;
let altVideo = null;
let mainVideoSrc = "";
let isDualView = false;

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

    document.querySelectorAll("#video-gallery video").forEach(v => v.pause());

    // ✅ Setup main video
    overlayContent.innerHTML = "";
    overlayButtonsContainer.innerHTML = "";

    mainVideo = document.createElement("video");
    mainVideo.src = videoSrc1080;
    mainVideo.controls = true;
    mainVideo.loop = true;
    mainVideo.playsInline = true;
    mainVideo.autoplay = true;

    overlayContent.appendChild(mainVideo);
    overlay.classList.add("active");
    document.body.style.overflow = "hidden";

    // ✅ Add original switch button under main video
    addSwitchButton(mainVideo);

    altVideo = null;
    isDualView = false;

  } catch (err) {
    console.warn("Error checking 1080p file:", err);
  }
}

// === CLOSE HD PLAYER ===
function closeHDPlayer() {
  overlay.classList.add("closing");
  if (mainVideo) mainVideo.pause();
  if (altVideo) altVideo.pause();

  const handleTransitionEnd = () => {
    overlay.classList.remove("active", "closing");
    document.body.style.overflow = "";
    overlayContent.innerHTML = "";
    overlayButtonsContainer.innerHTML = "";

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
function addSwitchButton(video) {
  const switchBtn = document.createElement("button");
  switchBtn.textContent = "Ukaž video z jiného úhlu";
  switchBtn.classList.add("btn-primary");
  switchBtn.style.display = "block";
  switchBtn.style.margin = "10px auto";

  switchBtn.addEventListener("click", async () => {
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
      altVideo.loop = true;
      altVideo.playsInline = true;
      altVideo.autoplay = true;

      // Apply dual view layout
      overlayContent.innerHTML = "";
      const mainWrapper = document.createElement("div");
      const altWrapper = document.createElement("div");

      mainWrapper.classList.add("video-wrapper");
      altWrapper.classList.add("video-wrapper");

      mainWrapper.appendChild(mainVideo);
      altWrapper.appendChild(altVideo);

      overlayContent.appendChild(mainWrapper);
      overlayContent.appendChild(altWrapper);

      // Add buttons under each video
      overlayButtonsContainer.innerHTML = "";
      addSingleViewButton(mainVideo, mainWrapper);
      addSingleViewButton(altVideo, altWrapper);

      isDualView = true;

    } catch (err) {
      console.warn("Error loading alternate video:", err);
    }
  });

  overlayButtonsContainer.appendChild(switchBtn);
}

function addSingleViewButton(video, wrapper) {
  const btn = document.createElement("button");
  btn.textContent = "Ukaž jenom tohle";
  btn.classList.add("btn-primary");
  btn.style.display = "block";
  btn.style.margin = "10px auto";

  btn.addEventListener("click", () => {
    overlayContent.innerHTML = "";
    overlayContent.appendChild(video);
    overlayButtonsContainer.innerHTML = "";
    addSwitchButton(video); // Keep original switch button
    isDualView = false;
  });

  wrapper.appendChild(btn);
}
