// ================================
// SHARED APPLICATION STATE
// ================================
// A single mutable object so every module can read/update the same
// filter + data state without juggling module-to-module reassignment.

export const state = {
  // filters
  activeLekce: new Set(),   // multi-select set of t2 values
  activeZnam: null,
  activeFigury: new Set(),  // multi-select
  activeDatum: new Set(),   // multi-select
  sortNewest: false,
  datumActiveYear: null,    // which year is shown in the datum grid

  // data
  videos: [],          // all video metadata from CSV
  renderedVideos: [],  // full shuffled list currently in the DOM

  // per-breakpoint manual column override for the grid selector
  gridOverride: { mobile: null, desktop: null },
};

export function resetFilters() {
  state.activeLekce = new Set();
  state.activeZnam = null;
  state.activeFigury = new Set();
  state.activeDatum = new Set();
  state.datumActiveYear = null;
  state.sortNewest = false;
}
