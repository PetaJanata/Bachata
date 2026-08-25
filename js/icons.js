// ================================
// ICON SET
// ================================
// Small outline-style SVG icons (stroke = currentColor) used in place of
// emoji glyphs, so the top panel renders identically across every OS/browser
// and can be sized/colored purely with CSS.

const wrap = (paths, viewBox = "0 0 24 24") => `
<svg viewBox="${viewBox}" fill="none" stroke="currentColor" stroke-width="2"
     stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
  ${paths}
</svg>`;

export const icons = {
  menu: wrap(`<line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/>`),

  image: wrap(`<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>`),

  grid: wrap(`<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>`),

  refresh: wrap(`<path d="M21 12a9 9 0 1 1-2.64-6.36"/><polyline points="21 3 21 9 15 9"/>`),

  maximize: wrap(`<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M16 3h3a2 2 0 0 1 2 2v3"/><path d="M8 21H5a2 2 0 0 1-2-2v-3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>`),

  close: wrap(`<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>`),

  chevronLeft: wrap(`<polyline points="15 18 9 12 15 6"/>`),
  chevronRight: wrap(`<polyline points="9 18 15 12 9 6"/>`),

  play: wrap(`<polygon points="6 3 20 12 6 21 6 3"/>`),

  pause: wrap(`<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>`),
};
