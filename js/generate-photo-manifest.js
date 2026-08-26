#!/usr/bin/env node
/**
 * Scans images/ for photos, measures each one's real pixel dimensions
 * locally, and writes images/manifest.json.
 *
 * The website fetches that JSON file at runtime instead of downloading
 * every photo just to measure it — this is what makes the desktop
 * justified-gallery layout fast, and it also means you never have to
 * manually type out a photo list — whatever's in images/ (minus the
 * exclusions below) becomes the gallery automatically.
 *
 * Run this whenever you add, remove, or replace a photo in images/,
 * then commit the updated manifest.json:
 *
 *   node scripts/generate-photo-manifest.js
 */
const fs = require("fs");
const path = require("path");
const { imageSize } = require("image-size");

const IMAGES_DIR = path.join(__dirname, "..", "images");
const OUTPUT_FILE = path.join(IMAGES_DIR, "manifest.json");
const EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

// Files in images/ that are NOT gallery photos — edit this list if you add
// more non-gallery images (icons, backgrounds, thumbnails, etc.).
const EXCLUDE = new Set([
  "instagram-placeholder.jpg",
  "facebook-placeholder.jpg",
  "background.jpg",
  "favicon.ico",
]);

if (!fs.existsSync(IMAGES_DIR)) {
  console.error(`Folder not found: ${IMAGES_DIR}`);
  process.exit(1);
}

const files = fs
  .readdirSync(IMAGES_DIR)
  .filter((f) => EXTENSIONS.has(path.extname(f).toLowerCase()))
  .filter((f) => !EXCLUDE.has(f))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

if (files.length === 0) {
  console.error(`No photos found in ${IMAGES_DIR} (after exclusions).`);
  process.exit(1);
}

const manifest = [];
for (const file of files) {
  const buffer = fs.readFileSync(path.join(IMAGES_DIR, file));
  try {
    const { width, height } = imageSize(buffer);
    manifest.push({ src: `images/${file}`, width, height });
  } catch (err) {
    console.warn(`Skipping "${file}" — couldn't read dimensions (${err.message})`);
  }
}

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2) + "\n");
console.log(`Wrote ${manifest.length} photo(s) to ${path.relative(process.cwd(), OUTPUT_FILE)}`);
if (files.length !== manifest.length) {
  console.log(`(${files.length - manifest.length} file(s) skipped due to read errors — see warnings above)`);
}

