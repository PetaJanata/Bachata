import { debounce, shuffleArray } from "./utils.js";
import { icons } from "./icons.js";

// ================================
// PHOTO LIST + DIMENSIONS
// ================================
// The photo list and every photo's real width/height come from
// images/manifest.json, generated locally by
// scripts/generate-photo-manifest.js (see that file for instructions).
// This means the website never has to download a photo just to measure
// it — it reads the pre-computed numbers instead — and you never have
// to manually maintain a photo list: whatever's in images/ becomes the
// gallery automatically when you regenerate the manifest.
const MANIFEST_URL = "images/manifest.json";

const MOBILE_QUERY = window.matchMedia("(max-width: 768px)");
const TARGET_ROW_HEIGHT = 280; // desktop justified-row target height, px
const ROW_GAP = 6;             // desktop gap between photos, px

let container = null;
let photos = [];  // [{ src, width, height, ratio }]
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
      `Couldn't load ${MANIFEST_URL} — run "node scripts/generate-photo-manifest.js" and commit the result.`,
      err
    );
    photos = [];
  }

  return photos;
}

// ================================
// MOBILE: INSTAGRAM-STYLE GRID
// ================================
function renderGridMode() {
  container.className = "photo-gallery grid-mode";
  container.innerHTML = "";

  photos.forEach((photo, i) => {
    const tile = document.createElement("div");
    tile.className = "photo-tile";

    const img = document.createElement("img");
    img.src = photo.src;
    img.alt = "";
    img.width = photo.width;
    img.height = photo.height;
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
      img.loading = "eager";
      img.decoding = "async";
      img.style.width = `${photo.ratio * row.height}px`;
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

  if (photos.length === 0) {
    container.className = "photo-gallery";
    container.innerHTML = "";
    return;
  }

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
// INIT
// ================================
export async function initPhotoGallery() {
  const heroSection = document.querySelector(".hero");
  if (!heroSection) return;

  container = document.createElement("div");
  container.className = "photo-gallery";
  heroSection.insertBefore(container, heroSection.querySelector(".hero-buttons"));

  await loadPhotos(); // one small JSON fetch — no per-photo measuring
  render();

  window.addEventListener("resize", debounce(render, 150));
  MOBILE_QUERY.addEventListener("change", render);
}

export function scrollToGallery() {
  const hero = document.querySelector(".hero");
  if (!hero) return;
  const heroBottom = hero.getBoundingClientRect().bottom + window.scrollY;
  window.scrollTo({ top: heroBottom, behavior: "smooth" });
}

