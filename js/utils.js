// ================================
// SHARED UTILITIES
// ================================

// Fisher–Yates shuffle
export function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Debounce — collapses rapid-fire events (resize, scroll) into one call
export function debounce(fn, wait = 150) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

// Extract a YouTube video ID from any common URL shape
export function extractYouTubeID(url) {
  try {
    const u = new URL(url);

    if (u.hostname === "youtu.be") {
      return u.pathname.slice(1);
    }
    if (u.searchParams.get("v")) {
      return u.searchParams.get("v");
    }
    if (u.pathname.includes("/embed/")) {
      return u.pathname.split("/embed/")[1];
    }
    if (u.pathname.includes("/shorts/")) {
      return u.pathname.split("/shorts/")[1];
    }
  } catch (e) {
    /* ignore malformed URL */
  }
  return null;
}

// Returns a stable, unique key for a video object (used to match DOM cards to data)
export function videoKey(v) {
  return v.src480 || v.youtube || v.facebook || v.instagram || null;
}
