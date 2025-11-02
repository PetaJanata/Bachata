// Define your videos here
const videos = [
  { src: "videos/figure1.mp4" },
   { src: "videos/figure1.mp4" },
   { src: "videos/figure1.mp4" },
   { src: "videos/figure1.mp4" },
   { src: "videos/figure1.mp4" },
   { src: "videos/figure1.mp4" },
   { src: "videos/figure1.mp4" },
   { src: "videos/figure1.mp4" },
   { src: "videos/figure1.mp4" },
   { src: "videos/figure1.mp4" },
   { src: "videos/figure1.mp4" },
   { src: "videos/figure1.mp4" },
   { src: "videos/figure1.mp4" },
   { src: "videos/figure1.mp4" },
];

const gallery = document.getElementById("video-gallery");

// Load all videos automatically when user scrolls halfway down
let videosLoaded = false;
window.addEventListener("scroll", () => {
  if (!videosLoaded && window.scrollY > window.innerHeight / 2) {
    loadVideos();
    videosLoaded = true;
  }
});

function loadVideos() {
  gallery.innerHTML = ""; // clear existing
  videos.forEach(v => {
    const card = document.createElement("div");
    card.classList.add("video-card");
    card.innerHTML = `
      <video src="${v.src}" autoplay muted loop playsinline></video>
    `;
    gallery.appendChild(card);
  });
}
