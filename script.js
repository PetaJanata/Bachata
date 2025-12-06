// ================================
// HERO CAROUSEL
// ================================

let carouselImages = [
    "images/photo1.jpg",
    "images/photo2.jpg",
    "images/photo3.jpg",
    "images/photo4.jpg",
    "images/photo5.jpg",
    "images/photo6.jpg",
    "images/photo7.jpg",
    "images/photo8.jpg",
    "images/photo9.jpg",
    "images/photo10.jpg"
];

function shuffleImages(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

carouselImages = shuffleImages(carouselImages);

const heroSection = document.querySelector(".hero");
const carouselContainer = document.createElement("div");
carouselContainer.classList.add("hero-carousel");

if (heroSection) {
    const heroButtons = heroSection.nextElementSibling;
    if (heroButtons) {
        heroSection.insertBefore(carouselContainer, heroButtons);
    } else {
        heroSection.appendChild(carouselContainer);
    }
}

let currentIndex = 0;

function getVisibleIndexes(centerIndex) {
    const total = carouselImages.length;
    let indexes = [];
    for (let i = -2; i <= 2; i++) {
        let idx = (centerIndex + i + total) % total;
        indexes.push(idx);
    }
    return indexes;
}

function renderCarousel() {
    if (!carouselContainer) return;
    carouselContainer.innerHTML = "";
    const indexes = getVisibleIndexes(currentIndex);

    indexes.forEach((imgIdx, position) => {
        const img = document.createElement("img");
        img.src = carouselImages[imgIdx];
        img.classList.add("carousel-img");

        if (position === 2) img.classList.add("main-img");
        else if (position === 1 || position === 3) img.classList.add("first-layer");
        else img.classList.add("second-layer");

        if (position === 1 || position === 3) {
            img.addEventListener("click", () => {
                currentIndex = position < 2
                    ? (currentIndex - 1 + carouselImages.length) % carouselImages.length
                    : (currentIndex + 1) % carouselImages.length;
                renderCarousel();
            });
        }

        carouselContainer.appendChild(img);
    });
}

window.addEventListener("resize", renderCarousel);

// ================================
// GLOBAL VARIABLES & FILTER STATE
// ================================

let videos = [];
let activeFilter = null;
const gallery = document.getElementById("video-gallery");

let activeFilters = {
    Figury_Buttons: [],
    Video: [],
    Datum: [],
    Figury_Moves: []
};

const MOVE_BUTTON_MAP = {
    'úvod': { color: '#e74c3c' },
    'sensual': { color: '#3498db' },
    'diagonál': { color: '#2ecc71' },
    'SP': { color: '#f1c40f' }
};
const MONTHS_CZ = ["Leden", "Únor", "Březen", "Duben", "Květen", "Červen", "Červenec", "Srpen", "Září", "Říjen", "Listopad", "Prosinec"];

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// ================================
// APPLY FILTERS
// ================================

function applyFilters(shouldScroll = false) {
    if (!videos.length) return;

    const filterKeys = Object.keys(activeFilters).filter(key => activeFilters[key].length > 0);

    const filteredVideos = videos.filter(video => {
        return filterKeys.every(filterKey => {
            const selectedValues = activeFilters[filterKey];
            if (!selectedValues.length) return true;

            if (filterKey === 'Figury_Buttons' || filterKey === 'Figury_Moves') {
                const videoMoves = video.Figury ? video.Figury.split(',').map(m => m.trim()) : [];
                return selectedValues.some(selectedMove => videoMoves.includes(selectedMove));

            } else if (filterKey === 'Video') {
                return video.Button ? selectedValues.includes(video.Button) : false;

            } else if (filterKey === 'Datum') {
                const videoDateKey = video.Rok && video.Měsíc_CZ ? `${video.Rok}-${video.Měsíc_CZ}` : null;
                return videoDateKey ? selectedValues.includes(videoDateKey) : false;
            }

            return true;
        });
    });

    loadGallery(shuffleArray(filteredVideos));
    lazyLoadVideos();

    if (shouldScroll) {
        document.getElementById("video-gallery")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}

// ================================
// GENERATE FILTER BAR
// ================================

function generateFilterBar(videos) {
    const filterTreeContainer = document.getElementById('filter-options-tree');
    if (!filterTreeContainer) return;

    const uniqueFilters = {
        Video: new Set(),
        Datum: new Map(),
        Figury_Moves: new Set()
    };
    const uniqueFiguryButtons = new Set();
    const allFiguryMoves = ['Lamfáza', 'Yo Yo', 'Pinza', 'Cambré', 'Culito', 'úvod', 'sensual', 'diagonál', 'SP'];

    videos.forEach(v => {
        if (v.Button) uniqueFilters.Video.add(v.Button);

        if (v.Datum) {
            const dateParts = v.Datum.split('.');
            if (dateParts.length === 3) {
                const year = dateParts[2];
                const monthIndex = parseInt(dateParts[1], 10) - 1;
                const monthCZ = MONTHS_CZ[monthIndex];
                if (!uniqueFilters.Datum.has(year)) uniqueFilters.Datum.set(year, new Set());
                uniqueFilters.Datum.get(year).add(monthCZ);
                v.Rok = year;
                v.Měsíc_CZ = monthCZ;
            }
        }

        if (v.Figury) {
            v.Figury.split(',').map(m => m.trim()).forEach(move => {
                if (MOVE_BUTTON_MAP.hasOwnProperty(move)) uniqueFiguryButtons.add(move);
                else if (allFiguryMoves.includes(move)) uniqueFilters.Figury_Moves.add(move);
            });
        }
    });

    // --- Figury Buttons ---
    const figuryBtnContainer = document.getElementById('figury-buttons');
    if (figuryBtnContainer) {
        const h3 = figuryBtnContainer.querySelector('h3');
        if (h3) h3.remove();

        ['úvod', 'sensual', 'diagonál', 'SP'].forEach(move => {
            const btn = document.createElement('button');
            btn.textContent = `#${move}`;
            btn.classList.add('move-button');
            btn.dataset.move = move;
            const color = MOVE_BUTTON_MAP[move].color;
            btn.dataset.activeColor = color;

            btn.addEventListener('click', () => {
                const isActive = btn.classList.toggle('active');
                btn.style.backgroundColor = isActive ? color : '';
                btn.style.color = isActive ? 'white' : '';

                if (isActive) activeFilters.Figury_Buttons.push(move);
                else activeFilters.Figury_Buttons = activeFilters.Figury_Buttons.filter(m => m !== move);

                applyFilters(true);
            });

            figuryBtnContainer.appendChild(btn);
        });
    }

    // --- Checkbox Filters ---
    const checkboxFilters = [
        { key: 'Video', title: 'Video', values: Array.from(uniqueFilters.Video).sort() },
        { key: 'Figury_Moves', title: 'Figury (Technika)', values: Array.from(uniqueFilters.Figury_Moves).sort() }
    ];

    checkboxFilters.forEach(filter => {
        const group = filterTreeContainer.querySelector(`[data-filter-key="${filter.key}"]`);
        if (!group) return;

        const content = group.querySelector('.collapsible-content');
        content.innerHTML = '';

        filter.values.forEach(value => {
            const option = createCheckboxOption(filter.key, value, value);
            content.appendChild(option);
        });
    });

    // --- Datum Filter ---
    const datumGroup = document.createElement('div');
    datumGroup.classList.add('filter-group', 'collapsible-group');
    datumGroup.dataset.filterKey = 'Datum';

    const datumHeader = document.createElement('h3');
    datumHeader.classList.add('collapsible-header');
    datumHeader.innerHTML = 'Datum <span class="arrow">▼</span>';
    datumGroup.appendChild(datumHeader);

    const datumContent = document.createElement('div');
    datumContent.classList.add('collapsible-content');

    const sortedYears = Array.from(uniqueFilters.Datum.keys()).sort().reverse();
    sortedYears.forEach(year => {
        const yearGroup = document.createElement('div');
        yearGroup.classList.add('filter-sub-group');

        const yearHeader = document.createElement('h4');
        yearHeader.classList.add('collapsible-header');
        yearHeader.textContent = year;
        yearGroup.appendChild(yearHeader);

        const monthContent = document.createElement('div');
        monthContent.classList.add('collapsible-content', 'open');

        const months = Array.from(uniqueFilters.Datum.get(year)).sort((a, b) => MONTHS_CZ.indexOf(a) - MONTHS_CZ.indexOf(b));
        months.forEach(month => {
            const filterValue = `${year}-${month}`;
            const option = createCheckboxOption('Datum', filterValue, month, 1);
            monthContent.appendChild(option);
        });

        yearGroup.appendChild(monthContent);
        datumContent.appendChild(yearGroup);

        yearHeader.addEventListener('click', () => toggleCollapsible(monthContent, yearHeader.parentNode));
    });

    datumGroup.appendChild(datumContent);
    filterTreeContainer.appendChild(datumGroup);

    document.querySelectorAll('.filter-group.collapsible-group .collapsible-header').forEach(header => {
        if(header.parentNode.dataset.filterKey !== 'Datum') {
             header.addEventListener('click', () => toggleCollapsible(header.nextElementSibling, header.parentNode));
        }
    });

    document.querySelectorAll('.filter-group.collapsible-group .collapsible-content').forEach(content => {
        if(content.parentNode.dataset.filterKey !== 'Datum') {
             content.style.maxHeight = null;
             content.classList.remove('open');
        }
    });
}

function createCheckboxOption(filterKey, value, label, indent = 0) {
    const div = document.createElement('div');
    div.classList.add('filter-option');
    div.style.paddingLeft = `${indent * 15}px`;

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = `filter-${filterKey}-${value.replace(/\s/g, '_')}`;
    input.value = value;

    const lbl = document.createElement('label');
    lbl.setAttribute('for', input.id);
    lbl.textContent = label;

    input.addEventListener('change', (e) => {
        if (e.target.checked) activeFilters[filterKey].push(value);
        else activeFilters[filterKey] = activeFilters[filterKey].filter(v => v !== value);

        applyFilters(true);
    });

    div.appendChild(input);
    div.appendChild(lbl);
    return div;
}

function toggleCollapsible(content, parent) {
    if (content.style.maxHeight && content.style.maxHeight !== '0px') {
        content.style.maxHeight = null;
        content.classList.remove('open');
        parent.classList.remove('active');
    } else {
        content.style.maxHeight = content.scrollHeight + "px";
        content.classList.add('open');
        parent.classList.add('active');
    }
}

// ================================
// LAZY LOAD VIDEOS
// ================================

let lazyObserver = null;
let pauseObserver = null;
let visibilityCheckAttached = false;

function lazyLoadVideos() {
    const videoElements = document.querySelectorAll("video[data-src]");

    const loadVideo = video => {
        if (!video.dataset.src) return;
        video.src = video.dataset.src;
        video.removeAttribute("data-src");
        if (video.getBoundingClientRect().top < window.innerHeight && video.getBoundingClientRect().bottom > 0) {
             video.play().catch(() => {});
        }
    };

    if (!lazyObserver) {
        lazyObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    loadVideo(entry.target);
                    lazyObserver.unobserve(entry.target);
                }
            });
        }, { rootMargin: "400px 0px", threshold: 0.1 });
    }

    videoElements.forEach(video => lazyObserver.observe(video));

    if (!visibilityCheckAttached) {
        const checkVisible = () => {
            document.querySelectorAll("video[data-src]").forEach(video => {
                const rect = video.getBoundingClientRect();
                if (rect.top < window.innerHeight + 300 && rect.bottom > -300) loadVideo(video);
            });
        };
        window.addEventListener("scroll", checkVisible, { passive: true });
        window.addEventListener("resize", checkVisible);
        visibilityCheckAttached = true;
    }

    if (!pauseObserver) {
        pauseObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                const video = entry.target;
                if (!entry.isIntersecting) video.pause();
                else if (video.paused && !video.dataset.src) video.play().catch(() => {});
            });
        }, { threshold: 0.25 });
    }

    document.querySelectorAll("video").forEach(video => {
        if(pauseObserver) pauseObserver.observe(video);
    });
}

// ================================
// LOAD GALLERY
// ================================

function loadGallery(videoList) {
    if (!gallery) return;
    gallery.innerHTML = "";

    if (lazyObserver) lazyObserver.disconnect();
    if (pauseObserver) pauseObserver.disconnect();

    videoList.forEach(v => {
        if (!v.src480) return;

        const card = document.createElement("div");
        card.classList.add("video-card");
        card.style.position = "relative";

        const video = document.createElement("video");
        video.dataset.src = v.src480;
        video.muted = true;
        video.loop = true;
        video.playsInline = true;

        if (v.znam === "znám") video.classList.add("know-green");
        else if (v.znam === "potřebuju zlepšit") video.classList.add("know-yellow");
        else if (v.znam === "neznám") video.classList.add("know-red");

        const speedIcon = document.createElement("div");
        speedIcon.classList.add("speed-icon");
        speedIcon.textContent = "1×";
        card.appendChild(speedIcon);

        card.addEventListener("mouseenter", () => speedIcon.style.display = "block");
        card.addEventListener("mouseleave", () => speedIcon.style.display = "none");

        attachSpeedScroll(video, speedIcon, true);

        video.style.cursor = "default";
        card.appendChild(video);

        if (v.hd) {
            const fullscreenIcon = document.createElement("div");
            fullscreenIcon.classList.add("fullscreen-icon");
            fullscreenIcon.innerHTML = "⤢";
            card.appendChild(fullscreenIcon);

            card.addEventListener("mouseenter", () => fullscreenIcon.style.display = "block");
            card.addEventListener("mouseleave", () => fullscreenIcon.style.display = "none");

            fullscreenIcon.addEventListener("click", () => openOverlay(v));
        }

        gallery.appendChild(card);
    });
}

// ================================
// OPEN OVERLAY
// ================================

function openOverlay(videoObj) {
    if (!videoObj.hd) return;

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

    const main = createVideoWrapper(videoObj.hd, false);
    videoContainer.appendChild(main.wrapper);

    let altWrapper, mainButton, altButton, backBtn;

    if (videoObj.alt) {
        altWrapper = createVideoWrapper(videoObj.alt, true);
        altWrapper.wrapper.style.display = "none";
        videoContainer.appendChild(altWrapper.wrapper);

        mainButton = document.createElement("button");
        mainButton.textContent = "Ukaž video z jiného úhlu";
        mainButton.style.marginTop = "10px";
        main.wrapper.appendChild(mainButton);

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

    overlay.addEventListener("click", e => {
        if (e.target === overlay) {
            overlay.remove();
            document.body.style.overflow = "";
        }
    });
}

// ================================
// DOM CONTENT LOADED
// ================================

window.addEventListener("DOMContentLoaded", () => {
    renderCarousel();

    fetch("videos.csv")
        .then(res => res.ok ? res.text() : "")
        .then(csvText => {
            if (!csvText) return;

            const results = Papa.parse(csvText, { header: true, skipEmptyLines: true });

            videos = results.data.map(row => ({
                src480: row["480p"] || null,
                hd: row["1080p"] || null,
                alt: row["Alt"] || null,
                Button: row["Button"] || null,
                znam: row["znám?"] || null,
                Datum: row["Datum"] || null,
                Figury: row["Figury"] || null
            }));

            console.log("Videos loaded from CSV:", videos);

            generateFilterBar(videos);
            applyFilters(false);

            const filterBar = document.getElementById('filter-bar');
            const toggleBtn = document.getElementById('toggle-filter-btn');

            if (toggleBtn && filterBar) {
                toggleBtn.addEventListener('click', () => {
                    filterBar.classList.toggle('collapsed');
                    renderCarousel();
                });
            }

            // Hero buttons old logic
            const oldApplyFilter = (filterValue, shouldScroll = false) => {
                activeFilter = filterValue;
                document.querySelectorAll(".filter-btn").forEach(btn => btn.classList.remove("active"));
                activeFilters = { Figury_Buttons: [], Video: [], Datum: [], Figury_Moves: [] };

                if (filterValue === null) document.getElementById("btn-all")?.classList.add("active");
                else if (filterValue === "Peťák a Renča") {
                    document.getElementById("btn-renča")?.classList.add("active");
                    activeFilters.Video.push("Peťák a Renča");
                }
                else if (filterValue === "Peťa a Peťa") {
                    document.getElementById("btn-peta")?.classList.add("active");
                    activeFilters.Video.push("Peťa a Peťa");
                }

                applyFilters(shouldScroll);
            };

            const btnRenCa = document.getElementById("btn-renča");
            const btnPeta = document.getElementById("btn-peta");
            const btnAll = document.getElementById("btn-all");

            if (btnRenCa) btnRenCa.addEventListener("click", () => {
                oldApplyFilter(activeFilter === "Peťák a Renča" ? null : "Peťák a Renča", true);
            });
            if (btnPeta) btnPeta.addEventListener("click", () => {
                oldApplyFilter(activeFilter === "Peťa a Peťa" ? null : "Peťa a Peťa", true);
            });
            if (btnAll) btnAll.addEventListener("click", () => oldApplyFilter(null, true));
        })
        .catch(err => console.error("Error loading CSV or parsing data:", err));
});

// ================================
// SPEED SCROLL
// ================================

function attachSpeedScroll(video, label, iconOnly = false) {
    const speeds = [0.5, 0.75, 1, 1.25, 1.5];
    let index = speeds.indexOf(1);

    const showLabel = () => {
        if (speeds[index] === 1) {
            label.style.display = iconOnly ? "block" : "none";
            label.textContent = "1×";
        } else {
            label.textContent = speeds[index] + "×";
            label.style.display = "block";
        }
    };

    const wheelHandler = e => {
        e.preventDefault();
        index = e.deltaY < 0 ? Math.min(index + 1, speeds.length - 1) : Math.max(index - 1, 0);
        video.playbackRate = speeds[index];
        showLabel();
    };

    if (iconOnly) label.addEventListener("wheel", wheelHandler);
    else video.addEventListener("wheel", wheelHandler);

    if (!iconOnly) {
        video.addEventListener("mouseleave", () => {
            if (speeds[index] === 1) label.style.display = "none";
        });
    }
}

// ================================
// HERO BUTTON AUTO-HIDE
// ================================

function isHeroOutOfView() {
    const hero = document.querySelector(".hero");
    if (!hero) return false;
    const rect = hero.getBoundingClientRect();
    return rect.bottom <= 0;
}

const heroBar = document.querySelector(".hero-buttons");
let hideTimeout = null;

function isScrollOnVideo(e) {
    const el = e.target;
    if (!(el instanceof Element)) return false;
    return el.closest("video") || el.closest(".speed-icon");
}

function showHeroBar() { if (heroBar) heroBar.classList.remove("hidden-hero"); }
function hideHeroBar() { if (heroBar) heroBar.classList.add("hidden-hero"); }

function onPageScroll(e) {
    if (isScrollOnVideo(e)) return;
    if (!isHeroOutOfView()) { showHeroBar(); if (hideTimeout) clearTimeout(hideTimeout); return; }
    showHeroBar();
    if (hideTimeout) clearTimeout(hideTimeout);
    hideTimeout = setTimeout(() => hideHeroBar(), 2000);
}

window.addEventListener("wheel", onPageScroll, { passive: true });
window.addEventListener("scroll", onPageScroll, { passive: true });
