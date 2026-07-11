// ================================
// FEATURE FLAGS
// ================================
// Toggle experimental / optional features on or off without deleting code.
// Flip a value here and reload — no other file needs to change.

export const FEATURES = {
  // Fullscreen HD overlay (the maximize icon on video cards, plus the
  // "pohled 1" / "pohled 2" dual-angle view inside it). All the code for
  // this stays in overlays.js and gallery.js — this flag just controls
  // whether the entry point (the fullscreen icon) is rendered at all.
  hdFullscreen: false,
};
