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
  { src: "videos/figure1.mp4" },
  { src: "videos/figure1.mp4" },
];

const gallery = document.getElementById("video-gallery");

window.addEventListener("DOMContentLoaded", () => {
  loadVideos();
});

function loadVideos() {
  gallery.innerHTML = ""; // clear existing

  videos.forEach(v => {
    const card = document.createElement("div");
    card.classList.add("video-card");

    // use data-src instead of src for lazy loading
    card.innerHTML = `
      <video data-src="${v.src}" muted loop playsinline></video>
    `;

    gallery.appendChild(card);
  });

  // initialize lazy loading
  lazyLoadVideos();
}

function lazyLoadVideos() {
  const videoElements = document.querySelectorAll("video[data-src]");
  
  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const video = entry.target;
        video.src = video.dataset.src;
        video.autoplay = true; // start playing once loaded
        video.removeAttribute("data-src");
        observer.unobserve(video);
      }
    });
  }, {
    rootMargin: "200px 0px", // start loading a bit before it’s visible
    threshold: 0.25
  });

  videoElements.forEach(video => observer.observe(video));
}
