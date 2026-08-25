import { state, resetFilters } from "./state.js";
import { shuffleArray, videoKey } from "./utils.js";
import { loadGallery, lazyLoadVideos } from "./gallery.js";
import { isPasswordProtected, renderActiveFilters, updateZnamUI, updateNewestButtonVisibility } from "./menu.js";

export function applyFilters(forceRebuild = false) {
  // On forceRebuild (refresh): clear all filters first
  if (forceRebuild) {
    resetFilters();
    updateZnamUI();
    updateNewestButtonVisibility();
    renderActiveFilters();
  }

  let result = [...state.videos];

  // Always hide password-protected categories unless selected
  result = result.filter((v) => !isPasswordProtected(v.t2) || state.activeLekce.has(v.t2));

  // Lekce filter (OR — video must be in at least one selected lekce)
  if (state.activeLekce.size > 0) {
    result = result.filter((v) => state.activeLekce.has(v.t2));
  }

  // Figury filter (OR — video must contain at least one selected figure)
  if (state.activeFigury.size > 0) {
    result = result.filter((v) => Array.isArray(v.figury) && v.figury.some((f) => state.activeFigury.has(f)));
  }

  // Znam filter
  if (state.activeZnam) {
    result = result.filter((v) => v.znam && v.znam === state.activeZnam);
  }

  if (state.sortNewest) {
    result = result.filter((v) => Number.isFinite(v.videoId)).sort((a, b) => b.videoId - a.videoId);

    // The DOM must still contain every video (not just this filtered/sorted
    // subset) so that later filter changes — which only toggle visibility,
    // they don't rebuild — can still find and show/hide the rest. Rebuild
    // with the sorted matches first, followed by everything else, then
    // immediately toggle visibility down to just the matches.
    const matchedKeys = new Set(result.map(videoKey).filter(Boolean));
    const rest = shuffleArray(state.videos.filter((v) => !matchedKeys.has(videoKey(v))));
    loadGallery([...result, ...rest], true);
    loadGallery(result, false);
  } else if (forceRebuild) {
    result = shuffleArray([...state.videos].filter((v) => !isPasswordProtected(v.t2)));
    loadGallery(result, true);
  } else {
    loadGallery(result, false);
  }

  lazyLoadVideos();
}
