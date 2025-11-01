// === VIDEO LIST ===
const videos = [
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
let galleryBuilt = false;

// Build placeholders once scrolling past hero
window.addEventListener("scroll", () => {
  const heroBottom = document.querySelector(".hero").getBoundingClientRect().bottom;
  if (!galleryBuilt && heroBottom < window.innerHeight * 0.8) {
    buildPlaceholders();
    galleryBuilt = true;
  }
});

function buildPlaceholders() {
  videos.forEach(v => {
    const card = document.createElement("div");
    card.classList.add("video-card", "hidden");
    card.dataset.src = v.src;
    // Placeholder box
    card.innerHTML = `
      <div style="
        width:100%;
        height:200px;
        background-color:#111;
        border-radius:8px;">
      </div>
    `;
    gallery.appendChild(card);
  });

  observeVideos();
}

// Lazy-load and fade in as videos enter view
function observeVideos() {
  const cards = document.querySelectorAll(".video-card");

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const card = entry.target;
          const src = card.dataset.src;
          card.innerHTML = `
            <video src="${src}" autoplay muted loop playsinline></video>
          `;
          requestAnimationFrame(() => {
            card.classList.remove("hidden");
          });
          obs.unobserve(card); // stop watching once loaded
        }
      });
    },
    {
      threshold: 0.2,
      rootMargin: "100px",
    }
  );

  cards.forEach(card => observer.observe(card));
}
