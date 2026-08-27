import { debounce, shuffleArray } from "./utils.js";
import { icons } from "./icons.js";

// ================================
// PHOTO LIST + DIMENSIONS
// ================================
// The photo list and every photo's real width/height come from
// images/manifest.json, generated locally by
// scripts/generate_photo_manifest.py (see that file for instructions).
// This means the website never has to download a photo just to measure
// it — it reads the pre-computed numbers instead — and you never have
// to manually maintain a photo list: whatever's in images/ becomes the
// gallery automatically when you regenerate the manifest.
const MANIFEST_URL = "images/manifest.json";

const TARGET_ROW_HEIGHT = 280; // justified-row target height, px
const ROW_GAP = 6;             // desktop gap between photos, px

let container = null;
let photos = [];  // [{ src, width, height, ratio }] — full shuffled list
let loaded = false;

// ================================
// LOAD MANIFEST (once)
// ================================
async function loadPhotos() {
  if (loaded) return photos;
  loaded = true;

  try {
    const res = await fetch(MANIFEST_URL);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const data = await res.json();
    photos = shuffleArray(
      data
        .filter((p) => p.src && p.width && p.height)
        .map((p) => ({ ...p, ratio: p.width / p.height }))
    );
  } catch (err) {
    console.error(
      `Couldn't load ${MANIFEST_URL} — generate it locally (see scripts/) and commit the result.`,
      err
    );
    photos = [];
  }

  return photos;
}

// ================================
// JUSTIFIED GALLERY (scrolls inside its own window, all screen sizes)
// ================================
function layoutJustifiedRows(containerWidth) {
  const rows = [];
  let row = [];
  let rowRatioSum = 0;

  photos.forEach((photo) => {
    row.push(photo);
    rowRatioSum += photo.ratio;

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

    row.items.forEach((photo) => {
      const idx = photos.indexOf(photo);
      const img = document.createElement("img");
      img.src = photo.src;
      img.alt = "";
      img.loading = "lazy";
      img.decoding = "async";
      img.style.width = `${photo.ratio * row.height}px`;
      img.addEventListener("click", () => openLightbox(idx));
      rowEl.appendChild(img);
    });

    container.appendChild(rowEl);
  });
}

// ================================
// RENDER
// ================================
function render() {
  if (!container) return;

  if (photos.length === 0) {
    container.className = "photo-gallery";
    container.innerHTML = "";
    return;
  }

  renderJustifiedMode();
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
  const total = photos.length;
  lightboxIndex = (index + total) % total;
  const img = lightboxEl.querySelector(".photo-lightbox-img");
  img.src = photos[lightboxIndex].src;
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
// SIZE THE GALLERY WINDOW
// ================================
// Sets an explicit pixel height instead of relying on flex-grow. Nested
// flexbox + CSS grid + aspect-ratio + overflow-y:auto is a known trouble
// spot on mobile Safari — an explicit height computed here is more
// predictable across mobile browsers.
//
// Computed as: hero's inner height (minus its own padding) minus the
// button row's own height minus the gap between them — independent of
// the gallery's current size, since measuring the button's position
// directly would be circular (it depends on the gallery's size, which
// is exactly what we're trying to determine).
function sizeGalleryWindow() {
  const heroSection = document.querySelector(".hero");
  const heroButtons = document.querySelector(".hero-buttons");
  if (!heroSection || !heroButtons || !container) return;

  const heroStyles = getComputedStyle(heroSection);
  const paddingTop = parseFloat(heroStyles.paddingTop) || 0;
  const paddingBottom = parseFloat(heroStyles.paddingBottom) || 0;
  const gap = parseFloat(heroStyles.rowGap || heroStyles.gap) || 0;

  const innerHeight = heroSection.clientHeight - paddingTop - paddingBottom;
  const buttonsHeight = heroButtons.getBoundingClientRect().height;
  const availableHeight = innerHeight - buttonsHeight - gap;

  if (availableHeight > 0) {
    container.style.height = `${availableHeight}px`;
  }
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

  sizeGalleryWindow();
  await loadPhotos(); // one small JSON fetch — no per-photo measuring
  render();

  const handleResize = debounce(() => {
    sizeGalleryWindow();
    render();
  }, 150);
  window.addEventListener("resize", handleResize);
}

export function scrollToGallery() {
  const hero = document.querySelector(".hero");
  if (!hero) return;
  const heroBottom = hero.getBoundingClientRect().bottom + window.scrollY;
  window.scrollTo({ top: heroBottom, behavior: "smooth" });
}
