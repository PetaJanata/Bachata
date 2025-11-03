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
  const randomizedVideos = shuffleArray([...videos]); // shuffle BEFORE load
  loadVideos(randomizedVideos);
});

function loadVideos(videoList) {
  gallery.innerHTML = ""; // clear any previous videos

  videoList.forEach(v => {
    const card = document.createElement("div");
    card.classList.add("video-card");

    // Lazy loading: use data-src instead of src
    const video = document.createElement("video");
    video.setAttribute("data-src", v.src);
    video.muted = true;
    video.loop = true;
    video.playsInline = true;

    card.appendChild(video);
    gallery.appendChild(card);
  });

  lazyLoadVideos();
}

function shuffleArray(array) {
  // Fisher-Yates shuffle (unbiased)
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  console.log("Shuffled order:", array.map(v => v.src)); // see console
  return array;
}

function lazyLoadVideos() {
  const videoElements = document.querySelectorAll("video[data-src]");

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const video = entry.target;
        video.src = video.dataset.src;
        video.autoplay = true;
        video.removeAttribute("data-src");
        observer.unobserve(video);
      }
    });
  }, {
    rootMargin: "200px 0px",
    threshold: 0.25
  });

  videoElements.forEach(video => observer.observe(video));
}
