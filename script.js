// ✅ Only 480p videos in the gallery
const videos = [
    { src: "videos/6_480.mp4" },
];

const gallery = document.getElementById("video-gallery");

window.addEventListener("DOMContentLoaded", () => {
    const randomizedVideos = shuffleArray([...videos]);
    loadVideos(randomizedVideos);
});

// === LOAD GALLERY ===
function loadVideos(videoList) {
    gallery.innerHTML = "";
    videoList.forEach(v => {
        const card = document.createElement("div");
        card.classList.add("video-card");

        const video = document.createElement("video");
        video.setAttribute("data-src", v.src);
        video.muted = true;
        video.loop = true;
        video.playsInline = true;

        // 💡 Open 1080p overlay when clicked
        video.addEventListener("click", () => openHDPlayer(v.src));

        card.appendChild(video);
        gallery.appendChild(card);
    });

    lazyLoadVideos();
}

// === RANDOMIZE ORDER ===
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// === LAZY LOAD VIDEOS ===
function lazyLoadVideos() {
    const videoElements = document.querySelectorAll("video[data-src], video[src]");
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target;
            if (entry.isIntersecting) {
                if (video.dataset.src) {
                    video.src = video.dataset.src;
                    video.removeAttribute("data-src");
                }
                video.play().catch(() => {});
            } else {
                video.pause();
            }
        });
    }, { rootMargin: "200px 0px", threshold: 0.25 });

    videoElements.forEach(video => observer.observe(video));
}

// === OVERLAY LOGIC ===
const overlay = document.getElementById("video-overlay");
const overlayContent = document.querySelector(".overlay-content");
let mainVideo = null;
let altVideo = null;
let mainVideoSrc = "";
let isDualView = false;

// === OPEN HD PLAYER ===
async function openHDPlayer(videoSrc480) {
    const videoSrc1080 = videoSrc480.replace("_480", "_1080");
    mainVideoSrc = videoSrc1080;

    try {
        const response = await fetch(videoSrc1080, { method: "HEAD" });
        if (!response.ok) return;

        document.querySelectorAll("#video-gallery video").forEach(v => v.pause());

        overlayContent.innerHTML = "";
        overlay.classList.add("active");
        document.body.style.overflow = "hidden";

        mainVideo = document.createElement("video");
        mainVideo.src = videoSrc1080;
        mainVideo.controls = true;
        mainVideo.loop = true;
        mainVideo.playsInline = true;
        mainVideo.autoplay = true;

        addSwitchButton(mainVideo);

    } catch (err) {
        console.warn("Error checking 1080p file:", err);
    }
}

// === CLOSE HD PLAYER ===
function closeHDPlayer() {
    overlay.classList.add("closing");
    if (mainVideo) mainVideo.pause();
    if (altVideo) altVideo.pause();

    const handleTransitionEnd = () => {
        overlay.classList.remove("active", "closing");
        document.body.style.overflow = "";
        overlayContent.innerHTML = "";
        overlayContent.classList.remove("dual");

        document.querySelectorAll("#video-gallery video").forEach(v => {
            const rect = v.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) v.play().catch(() => {});
        });

        overlay.removeEventListener("transitionend", handleTransitionEnd);
    };
    overlay.addEventListener("transitionend", handleTransitionEnd);
}

// Close overlay when clicking outside
overlay.addEventListener("click", (e) => { if (e.target === overlay) closeHDPlayer(); });

// === SWITCH BUTTON + DUAL VIEW ===
function addSwitchButton(video) {
    const section = document.createElement("div");
    section.classList.add("video-section");
    section.appendChild(video);

    const switchBtn = document.createElement("button");
    switchBtn.textContent = "Ukaž video z jiného úhlu";
    switchBtn.classList.add("btn-primary");

    const buttonWrapper = document.createElement("div");
    buttonWrapper.classList.add("overlay-buttons");
    buttonWrapper.appendChild(switchBtn);

    section.appendChild(buttonWrapper);
    overlayContent.innerHTML = "";
    overlayContent.appendChild(section);

    switchBtn.addEventListener("click", async () => {
        if (isDualView) return;

        const altSrc = mainVideoSrc.replace(".mp4", "_alt.mp4");
        try {
            const response = await fetch(altSrc, { method: "HEAD" });
            if (!response.ok) return;

            altVideo = document.createElement("video");
            altVideo.src = altSrc;
            altVideo.controls = true;
            altVideo.loop = true;
            altVideo.playsInline = true;
            altVideo.autoplay = true;

            // Wrap alt video + button
            const altSection = document.createElement("div");
            altSection.classList.add("video-section");
            altSection.appendChild(altVideo);

            const altBtn = document.createElement("button");
            altBtn.textContent = "Ukaž jenom tohle";
            altBtn.classList.add("btn-primary");
            const altButtonWrapper = document.createElement("div");
            altButtonWrapper.classList.add("overlay-buttons");
            altButtonWrapper.appendChild(altBtn);
            altSection.appendChild(altButtonWrapper);

            overlayContent.innerHTML = "";
            overlayContent.classList.add("dual");
            overlayContent.appendChild(section);
            overlayContent.appendChild(altSection);

            isDualView = true;

        } catch (err) {
            console.warn("Error loading alternate video:", err);
        }
    });
}
