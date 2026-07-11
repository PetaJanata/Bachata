import { shuffleArray, debounce } from "./utils.js";

// ================================
// HERO CAROUSEL
// ================================

// Hard-coded images (replace with your actual image paths)
let carouselImages = shuffleArray([
  "images/photo1.jpg",
  "images/photo2.jpg",
  "images/photo3.jpg",
  "images/photo4.jpg",
  "images/photo5.jpg",
  "images/photo6.jpg",
  "images/photo7.jpg",
  "images/photo8.jpg",
  "images/photo9.jpg",
  "images/photo10.jpg",
]);

let currentIndex = 0;

function getVisibleIndexes(centerIndex) {
  const total = carouselImages.length;
  const isMobile = window.innerWidth <= 768;
  const indexes = [];

  if (isMobile) {
    indexes.push(centerIndex); // only main image on mobile
  } else {
    for (let i = -1; i <= 1; i++) {
      indexes.push((centerIndex + i + total) % total);
    }
  }

  return indexes;
}

export function initCarousel() {
  const heroSection = document.querySelector(".hero");
  if (!heroSection) return;

  const carouselContainer = document.createElement("div");
  carouselContainer.classList.add("hero-carousel");
  heroSection.insertBefore(carouselContainer, heroSection.querySelector(".hero-buttons"));

  function render() {
    carouselContainer.innerHTML = "";

    const indexes = getVisibleIndexes(currentIndex);
    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
      const leftArrow = document.createElement("div");
      leftArrow.classList.add("mobile-arrow", "left-arrow");
      leftArrow.innerHTML = "&#8592;";

      const rightArrow = document.createElement("div");
      rightArrow.classList.add("mobile-arrow", "right-arrow");
      rightArrow.innerHTML = "&#8594;";

      carouselContainer.appendChild(leftArrow);
      carouselContainer.appendChild(rightArrow);

      leftArrow.addEventListener("click", () => {
        currentIndex = (currentIndex - 1 + carouselImages.length) % carouselImages.length;
        render();
      });

      rightArrow.addEventListener("click", () => {
        currentIndex = (currentIndex + 1) % carouselImages.length;
        render();
      });
    }

    indexes.forEach((imgIdx, position) => {
      const img = document.createElement("img");
      img.src = carouselImages[imgIdx];
      img.classList.add("carousel-img");
      img.loading = "lazy";
      img.alt = "";

      if (position === 1 && !isMobile) img.classList.add("main-img");
      else if (!isMobile && position === 0) img.classList.add("first-layer", "left");
      else if (!isMobile && position === 2) img.classList.add("first-layer", "right");

      if ((position === 0 && isMobile) || (position === 1 && isMobile)) {
        img.classList.add("main-img");
      }

      if (!isMobile && (position === 0 || position === 2)) {
        img.addEventListener("click", () => {
          currentIndex = position < 1
            ? (currentIndex - 1 + carouselImages.length) % carouselImages.length
            : (currentIndex + 1) % carouselImages.length;
          render();
        });
      }

      carouselContainer.appendChild(img);
    });
  }

  render();
  window.addEventListener("resize", debounce(render, 150));
}

export function scrollToGallery() {
  const hero = document.querySelector(".hero");
  if (!hero) return;
  const heroBottom = hero.getBoundingClientRect().bottom + window.scrollY;
  window.scrollTo({ top: heroBottom, behavior: "smooth" });
}
