import { debounce } from "./utils.js";
import { icons } from "./icons.js";

// ================================
// PHOTO LIST
// ================================
// Edit this list to match your actual files in /images. Keep it under ~20-25
// for the desktop justified layout to stay snappy (it measures every photo's
// real aspect ratio on load).
const PHOTOS = [
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
  "images/photo11.jpg",
  "images/photo12.jpg",
  "images/photo13.jpg",
  "images/photo14.jpg",
  "images/photo15.jpg",
  "images/photo16.jpg",
];

const MOBILE_QUERY = window.matchMedia("(max-width: 768px)");
const TARGET_ROW_HEIGHT = 280; // desktop justified-row target height, px
const ROW_GAP = 6;             // desktop gap between photos, px

let container = null;
let ratios = []; // { src, ratio } — natural aspect ratio (width / height), measured once

// ================================
// MEASURE ASPECT RATIOS (once)
// ================================
function measureRatio(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const ratio = img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 1.5;
      resolve({ src, ratio });
    };
    img.onerror = () => resolve({ src, ratio: 1.5 }); // fallback ratio so layout doesn't break
    img.src = src;
  });
}

// ================================
// MOBILE: INSTAGRAM-STYLE GRID
// ================================
function renderGridMode() {
  container.className = "photo-gallery grid-mode";
  container.innerHTML = "";

  PHOTOS.forEach((src, i) => {
    const tile = document.createElement("div");
    tile.className = "photo-tile";

    const img = document.createElement("img");
    img.src = src;
    img.alt = "";
    img.loading = i < 9 ? "eager" : "lazy"; // first screenful loads immediately, rest lazy
    img.decoding = "async";
    tile.appendChild(img);

    tile.addEventListener("click", () => openLightbox(i));
    container.appendChild(tile);
  });
}

// ================================
// DESKTOP: JUSTIFIED GALLERY
// ================================
function layoutJustifiedRows(containerWidth) {
  const rows = [];
  let row = [];
  let rowRatioSum = 0;

  ratios.forEach((item) => {
    row.push(item);
    rowRatioSum += item.ratio;

    const widthAtTargetHeight = rowRatioSum * TARGET_ROW_HEIGHT + (row.length - 1) * ROW_GAP;
    if (widthAtTargetHeight >= containerWidth) {
      const totalGap = (row.length - 1) * ROW_GAP;
      const height = (containerWidth - totalGap) / rowRatioSum;
      rows.push({ items: row, height });
      row = [];
      rowRatioSum = 0;
    }
  });

  // Leftover photos that didn't fill a full row — cap at target height so
  // they don't get stretched huge.
  if (row.length) {
    const totalGap = (row.length - 1) * ROW_GAP;
    const height = Math.min(TARGET_ROW_HEIGHT, (containerWidth - totalGap) / rowRatioSum);
    rows.push({ items: row, height });
  }

  return rows;
}

function renderJustifiedMode() {
  container.className = "photo-gallery justified-mode";
  container.innerHTML = "";

  const rows = layoutJustifiedRows(container.clientWidth);

  rows.forEach((row) => {
    const rowEl = document.createElement("div");
    rowEl.className = "justified-row";
    rowEl.style.height = `${row.height}px`;

    row.items.forEach((item) => {
      const idx = ratios.indexOf(item);
      const img = document.createElement("img");
      img.src = item.src;
      img.alt = "";
      img.loading = "eager";
      img.decoding = "async";
      img.style.width = `${item.ratio * row.height}px`;
      img.addEventListener("click", () => openLightbox(idx));
      rowEl.appendChild(img);
    });

    container.appendChild(rowEl);
  });
}

// ================================
// RENDER DISPATCH
// ================================
function render() {
  if (!container) return;
  if (MOBILE_QUERY.matches) {
    renderGridMode();
  } else {
    renderJustifiedMode();
  }
}

// ================================
// LIGHTBOX
// ================================
let lightboxIndex = 0;
let lightboxEl = null;

function openLightbox(index) {
  lightboxIndex = index;

  lightboxEl = document.createElement("div");
  lightboxEl.className = "photo-lightbox";

  const img = document.createElement("img");
  img.className = "photo-lightbox-img";
  lightboxEl.appendChild(img);

  const closeBtn = document.createElement("button");
  closeBtn.className = "photo-lightbox-btn photo-lightbox-close";
  closeBtn.innerHTML = icons.close;
  closeBtn.setAttribute("aria-label", "Zavřít");
  closeBtn.addEventListener("click", closeLightbox);

  const prevBtn = document.createElement("button");
  prevBtn.className = "photo-lightbox-btn photo-lightbox-prev";
  prevBtn.innerHTML = icons.chevronLeft;
  prevBtn.setAttribute("aria-label", "Předchozí");
  prevBtn.addEventListener("click", (e) => { e.stopPropagation(); showLightboxPhoto(lightboxIndex - 1); });

  const nextBtn = document.createElement("button");
  nextBtn.className = "photo-lightbox-btn photo-lightbox-next";
  nextBtn.innerHTML = icons.chevronRight;
  nextBtn.setAttribute("aria-label", "Další");
  nextBtn.addEventListener("click", (e) => { e.stopPropagation(); showLightboxPhoto(lightboxIndex + 1); });

  lightboxEl.appendChild(closeBtn);
  lightboxEl.appendChild(prevBtn);
  lightboxEl.appendChild(nextBtn);

  lightboxEl.addEventListener("click", (e) => {
    if (e.target === lightboxEl) closeLightbox();
  });

  document.addEventListener("keydown", handleLightboxKeydown);

  document.body.appendChild(lightboxEl);
  document.body.style.overflow = "hidden";

  showLightboxPhoto(index);
}

function showLightboxPhoto(index) {
  const total = PHOTOS.length;
  lightboxIndex = (index + total) % total;
  const img = lightboxEl.querySelector(".photo-lightbox-img");
  img.src = PHOTOS[lightboxIndex];
}

function handleLightboxKeydown(e) {
  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowLeft") showLightboxPhoto(lightboxIndex - 1);
  if (e.key === "ArrowRight") showLightboxPhoto(lightboxIndex + 1);
}

function closeLightbox() {
  if (!lightboxEl) return;
  document.removeEventListener("keydown", handleLightboxKeydown);
  lightboxEl.remove();
  lightboxEl = null;
  document.body.style.overflow = "";
}

// ================================
// INIT
// ================================
export async function initPhotoGallery() {
  const heroSection = document.querySelector(".hero");
  if (!heroSection) return;

  container = document.createElement("div");
  container.className = "photo-gallery";
  heroSection.insertBefore(container, heroSection.querySelector(".hero-buttons"));

  // Measure every photo's real aspect ratio once, up front — needed for the
  // desktop justified layout. Mobile grid mode doesn't need this, but we
  // measure regardless since the visitor can resize across the breakpoint.
  ratios = await Promise.all(PHOTOS.map(measureRatio));

  render();

  const rerender = debounce(render, 150);
  window.addEventListener("resize", rerender);
  MOBILE_QUERY.addEventListener("change", render);
}

export function scrollToGallery() {
  const hero = document.querySelector(".hero");
  if (!hero) return;
  const heroBottom = hero.getBoundingClientRect().bottom + window.scrollY;
  window.scrollTo({ top: heroBottom, behavior: "smooth" });
}
