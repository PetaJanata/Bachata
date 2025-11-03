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
  { src: "videos/31.mp4" },
  { src: "videos/32.mp4" },
  { src: "videos/33.mp4" },
  { src: "videos/34.mp4" },
  { src: "videos/35.mp4" },
  { src: "videos/36.mp4" },
  { src: "videos/37.mp4" },
  { src: "videos/38.mp4" },
  { src: "videos/39.mp4" },
  { src: "videos/40.mp4" },
  { src: "videos/41.mp4" },
  { src: "videos/42.mp4" },
  { src: "videos/43.mp4" },
  { src: "videos/44.mp4" },
  { src: "videos/45.mp4" },
  { src: "videos/46.mp4" },
  { src: "videos/47.mp4" },
  { src: "videos/48.mp4" },
  { src: "videos/49.mp4" },
  { src: "videos/50.mp4" },
  { src: "videos/51.mp4" },
  { src: "videos/52.mp4" },
  { src: "videos/53.mp4" },
  { src: "videos/54.mp4" },
  { src: "videos/55.mp4" },
  { src: "videos/56.mp4" },
  { src: "videos/57.mp4" }, 
  { src: "videos/58.mp4" },
  { src: "videos/59.mp4" }, 
  { src: "videos/60.mp4" },
  { src: "videos/61.mp4" },
  { src: "videos/62.mp4" },
  { src: "videos/63.mp4" },
  { src: "videos/64.mp4" },
  { src: "videos/65.mp4" },
  { src: "videos/66.mp4" },
  { src: "videos/67.mp4" },
  { src: "videos/68.mp4" },
  { src: "videos/69.mp4" },
  { src: "videos/70.mp4" },
  { src: "videos/71.mp4" },
  { src: "videos/72.mp4" },
  { src: "videos/73.mp4" },
  { src: "videos/74.mp4" },
  
  { src: "videos/76.mp4" },
  { src: "videos/77.mp4" }, 
  { src: "videos/78.mp4" },
  { src: "videos/79.mp4" }, 
  { src: "videos/80.mp4" },
  { src: "videos/81.mp4" },
  { src: "videos/82.mp4" },
  { src: "videos/83.mp4" },
  { src: "videos/84.mp4" },
  
    
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
