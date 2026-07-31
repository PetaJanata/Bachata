import { state } from "./state.js";
import { applyFilters } from "./filters.js";
import { buildMenu, renderActiveFilters, applyZnamFilter } from "./menu.js";
import { initCarousel } from "./carousel.js";
import { initGridSelector } from "./gallery.js";
import { initUI } from "./ui.js";

// Carousel + top-panel UI can initialize as soon as the DOM is parsed —
// modules are deferred by default, so this runs after parsing regardless
// of where the <script type="module"> tag sits.
initCarousel();
initGridSelector();
initUI();

document.addEventListener("DOMContentLoaded", () => {
  fetch("videos.csv")
    .then((res) => res.text())
    .then((csvText) => {
      const results = Papa.parse(csvText, { header: true, skipEmptyLines: true });

      state.videos = results.data
        .map((row) => ({
          src480: row["480p"] || null,
          hd: row["1080p"] || null,
          alt: row["Alt"] || null,
          t1: row["T1"]?.trim() || null,
          t2: row["T2"]?.trim() || null,
          znam: row["znám?"]?.trim() || null,
          videoId: row["VideoID"] ? Number(row["VideoID"]) : null,
          youtube: row["YouTubeURL"]?.trim() || null,
          startSec: row["StartSec"] ? Number(row["StartSec"]) : null,
          endSec: row["EndSec"] ? Number(row["EndSec"]) : null,
          facebook: row["FacebookURL"]?.trim() || null,
          instagram: row["InstagramURL"]?.trim() || null,
          figury: row["Figury"] ? row["Figury"].split(",").map((s) => s.trim()).filter(Boolean) : [],
          datum: row["Datum"]?.trim() || null,
        }))
        .filter((v) => v.t1 && v.t2)
        // "Trénink Peťa/Hanka/Barča" removed from the site entirely — they no
        // longer show up in the menu, gallery, or any filter.
        .filter((v) => !["Trénink Peťa", "Trénink Hanka", "Trénink Barča"].includes(v.t2));

      document.querySelectorAll("[data-znam]").forEach((btn) => {
        btn.addEventListener("click", () => applyZnamFilter(btn.dataset.znam));
      });

      // Initial load — shuffle once
      applyFilters(true);
      buildMenu(state.videos);
      renderActiveFilters();
    })
    .catch((err) => {
      console.error("Error loading CSV:", err);
      const gallery = document.getElementById("video-gallery");
      if (gallery) {
        gallery.innerHTML = '<p class="gallery-empty-state">Nepodařilo se načíst videa. Zkuste stránku obnovit.</p>';
      }
    });
});
