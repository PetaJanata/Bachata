// Define your videos here
const videos = [
  { src: "videos/figure1.mp4", label: "figures" },
  { src: "videos/figure1.mp4", label: "figures" },
  { src: "videos/figure1.mp4", label: "choreo" },
  { src: "videos/figure1.mp4", label: "choreo" },
  { src: "videos/figure1.mp4", label: "choreo" },
  { src: "videos/figure1.mp4", label: "practice" },
  { src: "videos/figure1.mp4", label: "practice" },
  { src: "videos/figure1.mp4", label: "practice" },
  { src: "videos/figure1.mp4", label: "practice" },
];

const gallery = document.getElementById("video-gallery");
const buttons = document.querySelectorAll(".filter-btn");

// Load all videos initially when you scroll down
let videosLoaded = false;
window.addEventListener("scroll", () => {
  if (!videosLoaded && window.scrollY > window.innerHeight / 2) {
    loadVideos("all");
    videosLoaded = true;
  }
});

// Handle filter buttons
buttons.forEach(btn => {
  btn.addEventListener("click", () => {
    const filter = btn.dataset.filter;
    loadVideos(filter);
  });
});

function loadVideos(filter) {
  gallery.innerHTML = ""; // clear existing
  const filtered = filter === "all" ? videos : videos.filter(v => v.label === filter);

  filtered.forEach(v => {
    const card = document.createElement("div");
    card.classList.add("video-card");
    card.innerHTML = `
      <video src="${v.src}" autoplay muted loop></video>
      <label>${v.label.charAt(0).toUpperCase() + v.label.slice(1)}</label>
    `;
    gallery.appendChild(card);
  });
}
