import { state } from "./state.js";
import { applyFilters } from "./filters.js";
import { scrollToGallery } from "./carousel.js";
import { icons } from "./icons.js";

// ================================
// ICON INJECTION
// ================================
// Fills the icon-only top-panel buttons with real SVGs (set in JS rather than
// hard-coded in the HTML so the icon set stays in one place).
function injectIcons() {
  const map = {
    "hamburger-btn": icons.menu,
    "back-to-hero": icons.image,
    "refresh-btn": icons.refresh,
  };
  Object.entries(map).forEach(([id, svg]) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = svg;
  });
}

// ================================
// TOP PANEL HEIGHT SYNC (mobile menu positioning)
// ================================
function updateTopPanelHeight() {
  const topPanel = document.querySelector(".top-panel");
  if (!topPanel) return;
  document.documentElement.style.setProperty("--top-panel-height", `${topPanel.offsetHeight}px`);
}

// ================================
// HAMBURGER SIDE MENU
// ================================
function initHamburgerMenu() {
  const hamburgerBtn = document.getElementById("hamburger-btn");
  const menuOverlay = document.querySelector(".side-menu");
  if (!hamburgerBtn || !menuOverlay) return;

  const backdrop = document.createElement("div");
  backdrop.classList.add("menu-backdrop");
  document.body.appendChild(backdrop);

  function openMenu() {
    menuOverlay.classList.add("open");
    backdrop.classList.add("active");
    document.body.style.overflow = "hidden";
  }
  function closeMenu() {
    menuOverlay.classList.remove("open");
    backdrop.classList.remove("active");
    document.body.style.overflow = "";
  }

  hamburgerBtn.addEventListener("click", () => {
    menuOverlay.classList.contains("open") ? closeMenu() : openMenu();
  });
  backdrop.addEventListener("click", closeMenu);
}

// ================================
// BACK-TO-HERO BUTTON
// ================================
// Scrolls back up to the hero/carousel. Only shown once the visitor has
// scrolled past the hero, so it doesn't clutter the view before then.
function initBackToHero() {
  const btn = document.getElementById("back-to-hero");
  const hero = document.querySelector(".hero");
  if (!btn || !hero) return;

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  const toggleVisibility = () => {
    const heroBottom = hero.getBoundingClientRect().bottom;
    btn.classList.toggle("visible", heroBottom < 0);
  };
  window.addEventListener("scroll", toggleVisibility, { passive: true });
  toggleVisibility();
}

// ================================
// "VIDEO GALERIE" HERO BUTTON
// ================================
function initScrollToGalleryButton() {
  const btnAll = document.getElementById("btn-all");
  if (btnAll) {
    btnAll.addEventListener("click", () => scrollToGallery());
  }
}

// ================================
// REFRESH BUTTON — reshuffle and reload
// ================================
function initRefreshButton() {
  const refreshBtn = document.getElementById("refresh-btn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => applyFilters(true));
  }
}

// ================================
// "NEJNOVĚJŠÍ" (newest) SORT TOGGLE
// ================================
function initNewestButton() {
  const newestBtn = document.getElementById("btn-newest");
  if (newestBtn) {
    newestBtn.addEventListener("click", () => {
      state.sortNewest = !state.sortNewest;
      newestBtn.classList.toggle("active", state.sortNewest);
      applyFilters(false);
    });
  }
}

export function initUI() {
  injectIcons();
  updateTopPanelHeight();
  window.addEventListener("load", updateTopPanelHeight);
  window.addEventListener("resize", updateTopPanelHeight);

  initHamburgerMenu();
  initBackToHero();
  initScrollToGalleryButton();
  initRefreshButton();
  initNewestButton();
}
