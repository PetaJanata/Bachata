#!/usr/bin/env python3
"""
Scans images/ for photos, measures each one's real pixel dimensions
locally, and writes images/manifest.json.

The website fetches that JSON file at runtime instead of downloading
every photo just to measure it — this is what makes the desktop
justified-gallery layout fast, and it also means you never have to
manually type out a photo list — whatever's in images/ (minus the
exclusions below) becomes the gallery automatically.

Uses only Python's standard library — no pip install needed.
Supports JPEG and PNG. (WEBP is skipped with a warning — let me know
if you need that added.)

Run this whenever you add, remove, or replace a photo in images/,
then commit the updated manifest.json:

    python3 scripts/generate_photo_manifest.py
"""
import json
import os
import struct
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
IMAGES_DIR = os.path.join(SCRIPT_DIR, "..", "images")
OUTPUT_FILE = os.path.join(IMAGES_DIR, "manifest.json")
EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

# Files in images/ that are NOT gallery photos — edit this list if you add
# more non-gallery images (icons, backgrounds, thumbnails, etc.).
EXCLUDE = {
    "instagram-placeholder.jpg",
    "facebook-placeholder.jpg",
    "background.jpg",
    "favicon.ico",
}


def get_png_size(data):
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        return None
    width, height = struct.unpack(">II", data[16:24])
    return width, height


def get_jpeg_size(data):
    if data[:2] != b"\xff\xd8":
        return None

    i = 2
    length = len(data)
    # Marker codes with no length field / no payload to skip over
    standalone = {0xD8, 0xD9, 0x01} | set(range(0xD0, 0xD8))
    # Start-Of-Frame markers that carry width/height (excludes DHT 0xC4, JPG 0xC8, DAC 0xCC)
    sof_markers = {0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7, 0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF}

    while i + 1 < length:
        if data[i] != 0xFF:
            i += 1
            continue
        marker = data[i + 1]

        if marker in standalone:
            i += 2
            continue

        if i + 4 > length:
            break
        seg_len = struct.unpack(">H", data[i + 2:i + 4])[0]

        if marker in sof_markers:
            if i + 9 > length:
                break
            img_height, img_width = struct.unpack(">HH", data[i + 5:i + 9])
            return img_width, img_height

        i += 2 + seg_len

    return None


def get_image_size(path):
    with open(path, "rb") as f:
        data = f.read()

    ext = os.path.splitext(path)[1].lower()
    if ext == ".png":
        return get_png_size(data)
    if ext in (".jpg", ".jpeg"):
        return get_jpeg_size(data)
    return None  # webp not supported yet


def main():
    if not os.path.isdir(IMAGES_DIR):
        print(f"Folder not found: {IMAGES_DIR}", file=sys.stderr)
        sys.exit(1)

    files = sorted(
        f for f in os.listdir(IMAGES_DIR)
        if os.path.splitext(f)[1].lower() in EXTENSIONS and f not in EXCLUDE
    )

    if not files:
        print(f"No photos found in {IMAGES_DIR} (after exclusions).", file=sys.stderr)
        sys.exit(1)

    manifest = []
    skipped = []
    for file in files:
        size = get_image_size(os.path.join(IMAGES_DIR, file))
        if size is None:
            skipped.append(file)
            continue
        width, height = size
        manifest.append({"src": f"images/{file}", "width": width, "height": height})

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"Wrote {len(manifest)} photo(s) to {os.path.relpath(OUTPUT_FILE)}")
    if skipped:
        print(f"Skipped {len(skipped)} file(s) (unsupported format, likely .webp): {', '.join(skipped)}")


if __name__ == "__main__":
    main()
