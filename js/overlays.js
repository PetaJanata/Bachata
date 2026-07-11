import { extractYouTubeID } from "./utils.js";

// ================================
// OPEN OVERLAY (local HD video, with optional alt angle)
// ================================
export function openOverlay(videoObj) {
  const { hd, alt } = videoObj;
  if (!hd) return;

  const overlay = document.createElement("div");
  overlay.classList.add("video-overlay");

  const videoContainer = document.createElement("div");
  videoContainer.style.display = "flex";
  videoContainer.style.gap = "20px";
  overlay.appendChild(videoContainer);

  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";

  function createVideoWrapper(src, muted = true) {
    const wrapper = document.createElement("div");
    wrapper.style.display = "flex";
    wrapper.style.flexDirection = "column";
    wrapper.style.alignItems = "center";

    const video = document.createElement("video");
    video.src = src;
    video.controls = true;
    video.autoplay = true;
    video.loop = true;
    video.playsInline = true;
    video.muted = muted;
    video.classList.add("overlay-video");

    wrapper.appendChild(video);
    return { wrapper, video };
  }

  const main = createVideoWrapper(hd, false);
  videoContainer.appendChild(main.wrapper);

  if (alt) {
    const altWrapper = createVideoWrapper(alt, true);
    altWrapper.wrapper.style.display = "none";
    videoContainer.appendChild(altWrapper.wrapper);

    const mainButton = document.createElement("button");
    mainButton.textContent = "Ukaž video z jiného úhlu";
    mainButton.style.marginTop = "10px";
    main.wrapper.appendChild(mainButton);

    let altButton = null;
    let backBtn = null;

    const showDualView = () => {
      overlay.classList.add("dual-view");
      main.wrapper.style.display = "flex";
      altWrapper.wrapper.style.display = "flex";

      main.video.muted = true;
      altWrapper.video.muted = false;

      main.video.play().catch(() => {});
      altWrapper.video.play().catch(() => {});

      mainButton.textContent = "pohled 1";
      altButton?.remove();

      altButton = document.createElement("button");
      altButton.textContent = "pohled 2";
      altButton.style.marginTop = "10px";
      altWrapper.wrapper.appendChild(altButton);

      mainButton.onclick = showMainOnly;
      altButton.onclick = showAltOnly;
    };

    const showMainOnly = () => {
      overlay.classList.remove("dual-view");
      main.wrapper.style.display = "flex";
      altWrapper.wrapper.style.display = "none";

      main.video.muted = false;
      altWrapper.video.muted = true;

      mainButton.textContent = "Ukaž video z jiného úhlu";
      altButton?.remove();
      altButton = null;

      mainButton.onclick = showDualView;
    };

    const showAltOnly = () => {
      overlay.classList.remove("dual-view");
      main.wrapper.style.display = "none";
      altWrapper.wrapper.style.display = "flex";

      main.video.muted = true;
      altWrapper.video.muted = false;

      altWrapper.video.play().catch(() => {});

      altButton?.remove();

      backBtn = document.createElement("button");
      backBtn.textContent = "Ukaž video z jiného úhlu";
      backBtn.style.marginTop = "10px";
      backBtn.addEventListener("click", () => {
        backBtn.remove();
        backBtn = null;
        showDualView();
      });
      altWrapper.wrapper.appendChild(backBtn);
    };

    mainButton.onclick = showDualView;
  }

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      overlay.remove();
      document.body.style.overflow = "";
    }
  });
}

// ================================
// YOUTUBE OVERLAY (with optional start/end segment loop)
// ================================
function buildYouTubeEmbed(url, start, end) {
  const videoId = extractYouTubeID(url);
  if (!videoId) return "";

  const params = ["autoplay=1", "controls=1", "enablejsapi=1", "playsinline=1", "rel=0"];
  if (Number.isFinite(start)) params.push(`start=${start}`);
  if (Number.isFinite(end)) params.push(`end=${end}`);

  return `https://www.youtube.com/embed/${videoId}?${params.join("&")}`;
}

let ytPlayer = null;
let ytLoopInterval = null;

// Required global callback for the YouTube IFrame API
window.onYouTubeIframeAPIReady = function onYouTubeIframeAPIReady() {
  // API ready — players are created on demand in initSegmentLoop
};

function monitorLoop(start, end) {
  clearInterval(ytLoopInterval);
  ytLoopInterval = setInterval(() => {
    if (!ytPlayer || typeof ytPlayer.getCurrentTime !== "function") return;
    if (ytPlayer.getCurrentTime() >= end) {
      ytPlayer.seekTo(start, true);
    }
  }, 200);
}

function initSegmentLoop(iframe, start, end) {
  ytPlayer = new YT.Player(iframe, {
    events: {
      onReady: (e) => {
        if (start !== "") e.target.seekTo(start, true);
      },
      onStateChange: (e) => {
        if (e.data === YT.PlayerState.PLAYING && end !== "") {
          monitorLoop(start, end);
        }
      },
    },
  });
}

export function openYouTubeOverlay(videoObj) {
  const { youtube, startSec, endSec } = videoObj;

  const overlay = document.createElement("div");
  overlay.classList.add("video-overlay");

  const videoContainer = document.createElement("div");
  videoContainer.classList.add("video-container");
  overlay.appendChild(videoContainer);

  const iframe = document.createElement("iframe");
  iframe.src = buildYouTubeEmbed(youtube, startSec, endSec);
  iframe.allow = "autoplay; encrypted-media";
  iframe.allowFullscreen = true;
  iframe.classList.add("yt-hd-iframe");

  videoContainer.appendChild(iframe);

  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";

  if (Number.isFinite(startSec) && Number.isFinite(endSec) && endSec > startSec) {
    initSegmentLoop(iframe, startSec, endSec);
  }

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      overlay.remove();
      document.body.style.overflow = "";

      if (ytLoopInterval) {
        clearInterval(ytLoopInterval);
        ytLoopInterval = null;
      }
      ytPlayer = null;
    }
  });
}

// ================================
// INSTAGRAM OVERLAY
// ================================
export function openInstagramOverlay(url) {
  const overlay = document.createElement("div");
  overlay.classList.add("video-overlay");

  const container = document.createElement("div");
  container.classList.add("video-container");

  const iframe = document.createElement("iframe");
  iframe.src = url.replace(/\/?$/, "/") + "embed/";
  iframe.allow = "autoplay; encrypted-media";
  iframe.allowFullscreen = true;
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  iframe.style.border = "0";

  container.appendChild(iframe);
  overlay.appendChild(container);

  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      overlay.remove();
      document.body.style.overflow = "";
    }
  });
}

// ================================
// FACEBOOK OVERLAY
// ================================
export function openFacebookOverlay(url) {
  const overlay = document.createElement("div");
  overlay.classList.add("video-overlay");

  const backdrop = document.createElement("div");
  backdrop.classList.add("video-backdrop");

  const wrapper = document.createElement("div");
  wrapper.classList.add("fb-video-wrapper");

  const iframe = document.createElement("iframe");
  iframe.src =
    "https://www.facebook.com/plugins/video.php?href=" +
    encodeURIComponent(url) +
    "&show_text=false&autoplay=true";

  iframe.allow = "autoplay; encrypted-media";
  iframe.allowFullscreen = true;
  iframe.classList.add("fb-iframe");

  wrapper.addEventListener("click", (e) => e.stopPropagation());

  wrapper.appendChild(iframe);
  overlay.appendChild(backdrop);
  overlay.appendChild(wrapper);
  document.body.appendChild(overlay);

  document.body.style.overflow = "hidden";

  backdrop.addEventListener("click", () => {
    overlay.remove();
    document.body.style.overflow = "";
  });
}
