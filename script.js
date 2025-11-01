// ===== FILTER BUTTONS =====
const buttons = document.querySelectorAll('.filter-btn');
const galleries = document.querySelectorAll('.video-gallery');
const hero = document.querySelector('.hero');
const videoSection = document.getElementById('videoSection');

// ===== OVERLAY =====
const overlay = document.getElementById('videoOverlay');
const overlayIframe = document.getElementById('overlayIframe');
const closeOverlay = document.getElementById('closeOverlay');

buttons.forEach(button => {
  button.addEventListener('click', () => {
    const category = button.dataset.filter;

    // Slide up hero
    hero.classList.add('slide-up');

    // Show video section
    videoSection.classList.add('active');

    // Show only selected category
    galleries.forEach(gallery => {
      gallery.style.display = (gallery.dataset.category === category) ? 'grid' : 'none';
    });

    // Smooth scroll
    setTimeout(() => {
      videoSection.scrollIntoView({ behavior: 'smooth' });
    }, 600);
  });
});

// ===== FIGURE VIDEO CLICK (OPEN 1080p YOUTUBE) =====
const figureVideos = document.querySelectorAll('.video-gallery[data-category="figures"] video');
figureVideos.forEach(video => {
  video.addEventListener('click', () => {
    const youtubeUrl = video.dataset.youtube;
    overlayIframe.src = youtubeUrl + '?autoplay=1';
    overlay.classList.add('active');
  });
});

// ===== CLOSE OVERLAY =====
closeOverlay.addEventListener('click', () => {
  overlay.classList.remove('active');
  overlayIframe.src = '';
});
