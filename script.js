const videos = [
  { src: "videos/figure1.mp4" },
  { src: "videos/1.mp4" },
  { src: "videos/2.mp4" },
  { src: "videos/3.mp4" },
  { src: "videos/4.mp4" },
  { src: "videos/5.mp4" },
  { src: "videos/6.mp4" },
  { src: "videos/7.mp4" },
  { src: "videos/8.mp4" },
  { src: "videos/9.mp4" },
  { src: "videos/10.mp4" },
  { src: "videos/11.mp4" },
  { src: "videos/12.mp4" },
  { src: "videos/13.mp4" },
  { src: "videos/14.mp4" },
  { src: "videos/15.mp4" },
  { src: "videos/16.mp4" },
  { src: "videos/17.mp4" },
  { src: "videos/18.mp4" },
  { src: "videos/19.mp4" },
  { src: "videos/20.mp4" },
  { src: "videos/21.mp4" },
  { src: "videos/22.mp4" },
  { src: "videos/23.mp4" },
  { src: "videos/24.mp4" },
  { src: "videos/25.mp4" },
  { src: "videos/26.mp4" },
  { src: "videos/27.mp4" },
  { src: "videos/28.mp4" },
  { src: "videos/29.mp4" },
  { src: "videos/30.mp4" },

    
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
