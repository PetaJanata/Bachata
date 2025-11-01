// Define your videos
const videos = [
  { src: "videos/figure1.mp4", label: "Figures" },
  { src: "videos/figure1.mp4", label: "Figures" },
  { src: "videos/figure1.mp4", label: "Choreo" }, 
  { src: "videos/figure1.mp4", label: "Choreo" }, 
  { src: "videos/figure1.mp4", label: "Choreo" }, 
  { src: "videos/figure1.mp4", label: "Practice" },
  { src: "videos/figure1.mp4", label: "Practice" }, 
  { src: "videos/figure1.mp4", label: "Practice" },
  { src: "videos/figure1.mp4", label: "Practice" },
  { src: "videos/figure1.mp4", label: "Practice" },
  { src: "videos/figure1.mp4", label: "Practice" }, 
  { src: "videos/figure1.mp4", label: "Practice" },
  { src: "videos/figure1.mp4", label: "Practice" },
  { src: "videos/figure1.mp4", label: "Practice" },
  { src: "videos/figure1.mp4", label: "Practice" }, 
  { src: "videos/figure1.mp4", label: "Practice" },
  { src: "videos/figure1.mp4", label: "Practice" },
  { src: "videos/figure1.mp4", label: "Practice" },
  { src: "videos/figure1.mp4", label: "Practice" }, 
  { src: "videos/figure1.mp4", label: "Practice" },
  { src: "videos/figure1.mp4", label: "Practice" },
];

const gallery = document.getElementById("video-gallery");
const buttons = document.querySelectorAll(".filter-btn");

// Flag so we only auto-load once
let hasLoaded = false;

// Fade-in load for all videos
function loadVideos(filter = "all") {
  gallery.innerHTML = "";
  const filtered = filter === "all" ? videos : videos.filter(v => v.label === filter);

  filtered.forEach(v => {
    const card = document.createElement("div");
    card.classList.add("video-card", "hidden");
    card.innerHTML = `
      <video src="${v.src}" autoplay muted loop playsinline></video>
      <label>${v.label.charAt(0).toUpperCase() + v.label.slice(1)}</label>
    `;
    gallery.appendChild(card);
    // Trigger fade-in animation
    requestAnimationFrame(() => {
      card.classList.remove("hidden");
    });
  });
}

// Scroll detection (trigger once when leaving hero)
const hero = document.querySelector(".hero");
window.addEventListener("scroll", () => {
  if (!hasLoaded && window.scrollY > hero.offsetHeight / 2) {
    loadVideos("all");
    hasLoaded = true;
  }
});

// Button filtering
buttons.forEach(btn => {
  btn.addEventListener("click", () => {
    const filter = btn.dataset.filter;
    if (!hasLoaded) {
      loadVideos("all"); // ensure videos exist before filtering
      hasLoaded = true;
    }
    loadVideos(filter);
    window.scrollTo({
      top: gallery.offsetTop,
      behavior: "smooth"
    });
  });
});
