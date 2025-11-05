const videos = [
  { src: "videos/6_480.mp4" },
];

const gallery = document.getElementById("video-gallery");

window.addEventListener("DOMContentLoaded", () => {
  const randomizedVideos = shuffleArray([...videos]);
  loadVideos(randomizedVideos);
});

// Load video gallery
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

    video.addEventListener("click", () => openOverlay(v.src));

    card.appendChild(video);
    gallery.appendChild(card);
  });

  lazyLoadVideos();
}

// Lazy load videos
function lazyLoadVideos() {
  const videoElements = document.querySelectorAll("video[data-src], video[src]");
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const video = entry.target;
      if (entry.isIntersecting) {
        if (video.dataset.src) {
          video.src = video.dataset.src;
          video.removeAttribute("data-src");
        }
        video.play().catch(() => {});
      } else video.pause();
    });
  }, { rootMargin: "200px 0px", threshold: 0.25 });

  videoElements.forEach(video => observer.observe(video));
}

// Shuffle array
function shuffleArray(array) {
  for (let i=array.length-1; i>0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Open overlay dynamically
async function openOverlay(video480) {
  const video1080 = video480.replace("_480", "_1080");

  // Create overlay section
  const overlay = document.createElement("section");
  overlay.classList.add("video-overlay-section");

  // Close overlay when clicking outside
  overlay.addEventListener("click", e => {
    if (e.target === overlay) {
      overlay.remove();
      document.body.style.overflow = "";
    }
  });

  const overlayContent = document.createElement("div");
  overlayContent.classList.add("video-overlay-content");
  overlay.appendChild(overlayContent);

  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";

  // Create first video wrapper
  createVideoWrapper(overlayContent, video1080);
}

// Create video wrapper with video + button
async function createVideoWrapper(container, videoSrc) {
  const wrapper = document.createElement("div");
  wrapper.classList.add("video-wrapper");

  // Video div
  const videoDiv = document.createElement("div");
  videoDiv.classList.add("video-div");
  const video = document.createElement("video");
  video.src = videoSrc;
  video.controls = true;
  video.autoplay = true;
  video.playsInline = true;
  videoDiv.appendChild(video);

  // Button div
  const buttonDiv = document.createElement("div");
  buttonDiv.classList.add("button-div");
  const btn = document.createElement("button");
  btn.textContent = "Ukaž video z jiného úhlu";
  buttonDiv.appendChild(btn);

  wrapper.appendChild(videoDiv);
  wrapper.appendChild(buttonDiv);
  container.appendChild(wrapper);

  // Alternate video functionality
  btn.addEventListener("click", async () => {
    const altSrc = videoSrc.replace(".mp4", "_alt.mp4");
    try {
      const response = await fetch(altSrc, { method: "HEAD" });
      if (!response.ok) return console.warn("No alternate angle:", altSrc);

      createVideoWrapper(container, altSrc);
    } catch (err) {
      console.warn(err);
    }
  });
}
