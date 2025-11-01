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

let currentFilter = "all";

// === Function to build placeholder grid ===
function buildPlaceholders(filter = "all") {
  gallery.innerHTML = "";

  const filtered =
    filter === "all" ? videos : videos.filter((v) => v.label === filter);

  filtered.forEach((v) => {
    const card = document.createElement("div");
    card.classList.add("video-card", "hidden");
    card.dataset.src = v.src;
    card.dataset.label = v.label;
    card.innerHTML = `
      <div class="video-placeholder">Loading...</div>
      <label>${v.label.charAt(0).toUpperCase() + v.label.slice(1)}</label>
    `;
    gallery.appendChild(card);
  });

  observeLazyLoad(); // start watching for scroll visibility
}

// === Lazy load videos when visible ===
function observeLazyLoad() {
  const cards = document.querySelectorAll(".video-card");

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const card = entry.target;
          const src = card.dataset.src;

          // Replace placeholder with video
          card.innerHTML = `
            <video src="${src}" autoplay muted loop playsinline></video>
            <label>${card.dataset.label.charAt(0).toUpperCase() + card.dataset.label.slice(1)}</label>
          `;
          card.classList.remove("hidden");
          obs.unobserve(card); // stop observing once loaded
        }
      });
    },
    {
      threshold: 0.2, // load when 20% visible
      rootMargin: "100px", // preload just before entering
    }
  );

  cards.forEach((card) => observer.observe(card));
}

// === Buttons logic ===
buttons.forEach((btn) => {
  btn.addEventListener("click", () => {
    currentFilter = btn.dataset.filter;
    buildPlaceholders(currentFilter);

    // Smooth scroll to videos
    window.scrollTo({
      top: gallery.offsetTop,
      behavior: "smooth",
    });
  });
});

// === Auto-build once user scrolls down past hero ===
let built = false;
window.addEventListener("scroll", () => {
  const heroBottom = document.querySelector(".hero").getBoundingClientRect()
    .bottom;
  if (!built && heroBottom < window.innerHeight * 0.8) {
    buildPlaceholders("all");
    built = true;
  }
});
