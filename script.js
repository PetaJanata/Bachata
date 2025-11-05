const videos = [
  { src: "videos/6_480.mp4" },

];

const gallery = document.getElementById("video-gallery");
const overlay = document.getElementById("video-overlay");
const overlayContent = document.querySelector(".overlay-content");

window.addEventListener("DOMContentLoaded", () => {
  loadVideos(videos);
});

// LOAD VIDEO GALLERY
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

    video.addEventListener("click", () => openHDPlayer(v.src));

    card.appendChild(video);
    gallery.appendChild(card);
  });

  lazyLoadVideos();
}

// LAZY LOAD
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

// OPEN 1080p PLAYER
let mainVideo = null;
let altVideo = null;

async function openHDPlayer(videoSrc480) {
  const videoSrc1080 = videoSrc480.replace("_480", "_1080");
  overlayContent.innerHTML = "";
  overlay.classList.add("active");
  document.body.style.overflow = "hidden";

  mainVideo = document.createElement("video");
  mainVideo.src = videoSrc1080;
  mainVideo.controls = true;
  mainVideo.autoplay = true;
  mainVideo.playsInline = true;

  // BUTTON
  const switchBtn = document.createElement("button");
  switchBtn.textContent = "Ukaž video z jiného úhlu";
  switchBtn.classList.add("btn-primary");

  const btnWrapper = document.createElement("div");
  btnWrapper.classList.add("overlay-buttons");
  btnWrapper.appendChild(switchBtn);

  overlayContent.appendChild(mainVideo);
  overlayContent.appendChild(btnWrapper);

  switchBtn.addEventListener("click", () => loadAltVideo(videoSrc1080));
}

// LOAD ALTERNATE VIDEO
async function loadAltVideo(mainSrc) {
  const altSrc = mainSrc.replace(".mp4", "_alt.mp4");
  altVideo = document.createElement("video");
  altVideo.src = altSrc;
  altVideo.controls = true;
  altVideo.autoplay = true;
  altVideo.playsInline = true;

  // BUTTON
  const altBtn = document.createElement("button");
  altBtn.textContent = "Ukaž jenom tohle";
  altBtn.classList.add("btn-primary");
  const altBtnWrapper = document.createElement("div");
  altBtnWrapper.classList.add("overlay-buttons");
  altBtnWrapper.appendChild(altBtn);

  overlayContent.innerHTML = "";
  overlayContent.classList.add("dual");
  overlayContent.appendChild(mainVideo);
  overlayContent.appendChild(altVideo);
  overlayContent.appendChild(altBtnWrapper);
}

// CLOSE OVERLAY
overlay.addEventListener("click", e => {
  if (e.target === overlay) {
    overlay.classList.add("closing");
    mainVideo?.pause();
    altVideo?.pause();
    overlay.addEventListener("transitionend", () => {
      overlay.classList.remove("active", "closing", "dual");
      overlayContent.innerHTML = "";
      document.body.style.overflow = "";
    }, { once: true });
  }
});
