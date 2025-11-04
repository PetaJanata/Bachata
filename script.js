const videos = [

  { src: "videos/1_480.mp4" },
  { src: "videos/2_480.mp4" },
  { src: "videos/3_480.mp4" },
  { src: "videos/4_480.mp4" },
  { src: "videos/5_480.mp4" },
  { src: "videos/6_480.mp4" },
  { src: "videos/7_480.mp4" },
  { src: "videos/8_480.mp4" },
  { src: "videos/9_480.mp4" },
  { src: "videos/10_480.mp4" },
  { src: "videos/15_480.mp4" },
 

    
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
