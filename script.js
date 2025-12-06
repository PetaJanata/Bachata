// ================================
// HERO CAROUSEL (Existing Code)
// ================================

// Hard-coded images (replace with your actual image paths)
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

// Shuffle function for carousel
function shuffleImages(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Shuffle images initially (Keep this outside DOMContentLoaded for initial array creation)
carouselImages = shuffleImages(carouselImages);

// Create carousel container (Keep this outside DOMContentLoaded if elements exist immediately)
const heroSection = document.querySelector(".hero");
const carouselContainer = document.createElement("div");
carouselContainer.classList.add("hero-carousel");

// Check if heroSection is null before inserting
if (heroSection) {
    const heroButtons = heroSection.nextElementSibling; // Assuming hero-buttons is right after .hero
    if (heroButtons) {
        heroSection.insertBefore(carouselContainer, heroButtons);
    } else {
        heroSection.appendChild(carouselContainer);
    }
}


// Carousel state
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

        // Set classes for position (main, first, second)
        if (position === 2) img.classList.add("main-img");
        else if (position === 1 || position === 3) img.classList.add("first-layer");
        else img.classList.add("second-layer");

        // Clickable side images
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

// Initial render is now moved into DOMContentLoaded

// Make carousel responsive on resize
window.addEventListener("resize", renderCarousel);


// ================================
// GLOBAL VARIABLES & NEW FILTER STATE
// ================================
let videos = []; // holds all video metadata from CSV
let activeFilter = null; // old single filter state (for hero buttons)
const gallery = document.getElementById("video-gallery");

// NEW: Object to hold all currently selected filters
let activeFilters = {
    Figury_Buttons: [], // úvod, sensual, diagonál, SP
    Video: [],          // Peťák a Renča, Stolárna, etc.
    Datum: [],          // 2024-Leden, 2023-Prosinec, etc. (Rok + Měsíc)
    Figury_Moves: []    // Lamfáza, Yo Yo, Pinza, etc.
};

// NEW: Mapping for move buttons (for color and lookup)
const MOVE_BUTTON_MAP = {
    'úvod': { color: '#e74c3c' },     // Red
    'sensual': { color: '#3498db' },  // Blue
    'diagonál': { color: '#2ecc71' }, // Green
    'SP': { color: '#f1c40f' }        // Yellow
};
const MONTHS_CZ = ["Leden", "Únor", "Březen", "Duben", "Květen", "Červen", "Červenec", "Srpen", "Září", "Říjen", "Listopad", "Prosinec"];


// ================================
// SHUFFLE FUNCTION (Fisher–Yates)
// ================================
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// ================================
// MULTI-SELECT AND FILTERING LOGIC (The Core)
// ================================
function applyFilters(shouldScroll = false) {
    if (!videos.length) {
        // If videos haven't loaded, don't proceed with filtering
        console.warn("Attempted to apply filters before video data was loaded.");
        return;
    }
    
    // Get all filter categories that have at least one active selection
    const filterKeys = Object.keys(activeFilters).filter(key => activeFilters[key].length > 0);

    const filteredVideos = videos.filter(video => {
        // A video must pass the filter condition for *every* active filter category (AND logic)
        return filterKeys.every(filterKey => {
            const selectedValues = activeFilters[filterKey];

            if (selectedValues.length === 0) {
                return true; // No filter selected in this category, so it passes
            }
            
            // --- LOGIC FOR DIFFERENT FILTER CATEGORIES ---

            if (filterKey === 'Figury_Buttons' || filterKey === 'Figury_Moves') {
                // These filters target the 'Figury' column in the CSV (which is comma-separated)
                
                // Get the moves from the video's 'Figury' column, split by comma, and trim whitespace
                const videoMoves = video.Figury ? video.Figury.split(',').map(m => m.trim()) : [];
                
                // If *any* selected move is found in the video's list, it passes the category (OR logic within the category)
                return selectedValues.some(selectedMove => videoMoves.includes(selectedMove));
            
            } else if (filterKey === 'Video') {
                // This targets the 'Button' column (Type of video)
                
                // If *any* selected video type matches the video's 'Button' column, it passes (OR logic)
                return selectedValues.includes(video.Button);
            
            } else if (filterKey === 'Datum') {
                // This targets the 'Datum' column (Year-Month format)
                
                // If *any* selected date (e.g., "2024-Leden") matches the video's combined year/month, it passes (OR logic)
                const videoDateKey = `${video.Rok}-${video.Měsíc_CZ}`;
                return selectedValues.includes(videoDateKey);
            }
            
            return true; // Should not happen
        });
    });

    const shuffledVideos = shuffleArray(filteredVideos);
    loadGallery(shuffledVideos);
    lazyLoadVideos();

    // Scroll if a filter was just clicked
    if (shouldScroll) {
        document.getElementById("video-gallery")?.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
}


// ================================
// DYNAMIC FILTER BAR GENERATION
// ================================

function generateFilterBar(videos) {
    const filterTreeContainer = document.getElementById('filter-options-tree');
    if (!filterTreeContainer) return;
    
    // Collect all unique filter values from the data
    const uniqueFilters = {
        Video: new Set(),
        Datum: new Map(), // Year -> Set of Months
        Figury_Moves: new Set()
    };
    
    // Also collect data for the top buttons
    const uniqueFiguryButtons = new Set();
    const allFiguryMoves = ['Lamfáza', 'Yo Yo', 'Pinza', 'Cambré', 'Culito', 'úvod', 'sensual', 'diagonál', 'SP'];
    
    videos.forEach(v => {
        // Collect Video Types
        if (v.Button) {
            uniqueFilters.Video.add(v.Button);
        }
        
        // Collect Datum (Year/Month) - only if not 'Internet'
        if (v.Datum && v.Button !== 'Internet') {
            const dateParts = v.Datum.split('.'); // Assuming format DD.MM.YYYY
            if (dateParts.length === 3) {
                const year = dateParts[2];
                const monthIndex = parseInt(dateParts[1], 10) - 1;
                const monthCZ = MONTHS_CZ[monthIndex];
                
                if (!uniqueFilters.Datum.has(year)) {
                    uniqueFilters.Datum.set(year, new Set());
                }
                uniqueFilters.Datum.get(year).add(monthCZ);
                
                // Add new properties to video object for easier filtering
                v.Rok = year;
                v.Měsíc_CZ = monthCZ;
            }
        }
        
        // Collect Figury (Moves)
        if (v.Figury) {
            v.Figury.split(',').map(m => m.trim()).forEach(move => {
                if (MOVE_BUTTON_MAP.hasOwnProperty(move)) {
                    uniqueFiguryButtons.add(move); // For top buttons
                } else if (allFiguryMoves.includes(move)) {
                    uniqueFilters.Figury_Moves.add(move); // For checkbox list
                }
            });
        }
    });
    
    // --- 1. Generate Move Buttons (#Figury) ---
    const figuryBtnContainer = document.getElementById('figury-buttons');
    if (figuryBtnContainer) {
        // Remove existing <h3> to add the buttons directly under the container
        const h3 = figuryBtnContainer.querySelector('h3');
        if (h3) h3.remove(); 
        
        const moves = ['úvod', 'sensual', 'diagonál', 'SP'];
        
        moves.forEach(move => {
            const btn = document.createElement('button');
            btn.textContent = `#${move}`;
            btn.classList.add('move-button');
            
            // Set data attribute for filtering
            btn.dataset.move = move;
            
            // Set the active background color
            const color = MOVE_BUTTON_MAP[move].color;
            btn.dataset.activeColor = color; 
            
            // Event listener for button
            btn.addEventListener('click', () => {
                const isActive = btn.classList.toggle('active');
                
                // Update styling
                btn.style.backgroundColor = isActive ? color : '';
                btn.style.color = isActive ? 'white' : '';
                
                // Update filter state
                if (isActive) {
                    activeFilters.Figury_Buttons.push(move);
                } else {
                    activeFilters.Figury_Buttons = activeFilters.Figury_Buttons.filter(m => m !== move);
                }
                applyFilters(true);
            });
            figuryBtnContainer.appendChild(btn);
        });
    }

    // --- 2. Generate Checkbox Filters (Video, Datum, Figury) ---

    // Define the checkbox filter structure
    const checkboxFilters = [
        { key: 'Video', title: 'Video', values: Array.from(uniqueFilters.Video).sort() },
        { key: 'Figury_Moves', title: 'Figury (Technika)', values: Array.from(uniqueFilters.Figury_Moves).sort() },
        // Datum is handled separately due to nested structure (Rok -> Měsíc)
    ];

    checkboxFilters.forEach(filter => {
        const group = filterTreeContainer.querySelector(`[data-filter-key="${filter.key}"]`);
        if (!group) return;

        const content = group.querySelector('.collapsible-content');
        content.innerHTML = ''; // Clear existing content

        filter.values.forEach(value => {
            const option = createCheckboxOption(filter.key, value, value);
            content.appendChild(option);
        });
    });

    // --- 3. Generate Datum Filter (Nested: Rok -> Měsíc) ---
    const datumGroup = document.createElement('div');
    datumGroup.classList.add('filter-group', 'collapsible-group');
    datumGroup.dataset.filterKey = 'Datum';
    
    // Create the header
    const datumHeader = document.createElement('h3');
    datumHeader.classList.add('collapsible-header');
    datumHeader.innerHTML = 'Datum <span class="arrow">▼</span>';
    datumGroup.appendChild(datumHeader);

    // Create the content container
    const datumContent = document.createElement('div');
    datumContent.classList.add('collapsible-content');
    
    // Sort years descending
    const sortedYears = Array.from(uniqueFilters.Datum.keys()).sort().reverse();
    
    sortedYears.forEach(year => {
        // Create Year Group
        const yearGroup = document.createElement('div');
        yearGroup.classList.add('filter-sub-group');

        // Create Year Header (e.g., 2024)
        const yearHeader = document.createElement('h4');
        yearHeader.classList.add('collapsible-header');
        yearHeader.textContent = year;
        yearGroup.appendChild(yearHeader);

        // Create Month Content container
        const monthContent = document.createElement('div');
        monthContent.classList.add('collapsible-content', 'open'); // Start months open
        
        // Sort months based on the CZ month array order
        const months = Array.from(uniqueFilters.Datum.get(year)).sort((a, b) => {
             return MONTHS_CZ.indexOf(a) - MONTHS_CZ.indexOf(b);
        });

        months.forEach(month => {
            const filterValue = `${year}-${month}`;
            const option = createCheckboxOption('Datum', filterValue, month, 1);
            monthContent.appendChild(option);
        });

        yearGroup.appendChild(monthContent);
        datumContent.appendChild(yearGroup);

        // Add toggle to Year Header (Rok)
        yearHeader.addEventListener('click', () => toggleCollapsible(monthContent, yearHeader.parentNode));
    });
    
    datumGroup.appendChild(datumContent);
    filterTreeContainer.appendChild(datumGroup);
    
    // Add event listeners for top-level collapsible headers
    document.querySelectorAll('.filter-group.collapsible-group .collapsible-header').forEach(header => {
        // The header's *parent* is the group, and the content is the *next sibling*
        if(header.parentNode.dataset.filterKey !== 'Datum') {
             header.addEventListener('click', () => toggleCollapsible(header.nextElementSibling, header.parentNode));
        }
    });

    // Initialize all top-level collapsible content closed (except the nested ones)
    document.querySelectorAll('.filter-group.collapsible-group .collapsible-content').forEach(content => {
        if(content.parentNode.dataset.filterKey !== 'Datum') {
             // For safety, force it closed initially
             content.style.maxHeight = null;
             content.classList.remove('open');
        }
    });
}

// Helper to create a single checkbox option
function createCheckboxOption(filterKey, value, label, indent = 0) {
    const div = document.createElement('div');
    div.classList.add('filter-option');
    div.style.paddingLeft = `${indent * 15}px`; // Add indentation for sub-categories

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = `filter-${filterKey}-${value.replace(/\s/g, '_')}`;
    input.value = value;
    
    const lbl = document.createElement('label');
    lbl.setAttribute('for', input.id);
    lbl.textContent = label;
    
    input.addEventListener('change', (e) => {
        if (e.target.checked) {
            activeFilters[filterKey].push(value);
        } else {
            activeFilters[filterKey] = activeFilters[filterKey].filter(v => v !== value);
        }
        applyFilters(true);
    });

    div.appendChild(input);
    div.appendChild(lbl);
    return div;
}

// Helper to toggle collapsible sections
function toggleCollapsible(content, parent) {
    if (content.style.maxHeight && content.style.maxHeight !== '0px') {
        content.style.maxHeight = null;
        content.classList.remove('open');
        parent.classList.remove('active');
    } else {
        // Set a calculated height for a smooth transition
        content.style.maxHeight = content.scrollHeight + "px";
        content.classList.add('open');
        parent.classList.add('active');
    }
}


// ================================
// LAZY LOAD + AUTO-PAUSE VIDEOS (Existing Code)
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
        // Only try to play if video is in view for the first time
        if (video.getBoundingClientRect().top < window.innerHeight && video.getBoundingClientRect().bottom > 0) {
             video.play().catch(() => {});
        }
    };

    // Lazy Observer
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

    // Re-observe all current videos
    videoElements.forEach(video => lazyObserver.observe(video));

    // Extra visibility check (Fallback/Initial Load)
    if (!visibilityCheckAttached) {
        const checkVisible = () => {
            document.querySelectorAll("video[data-src]").forEach(video => {
                const rect = video.getBoundingClientRect();
                if (rect.top < window.innerHeight + 300 && rect.bottom > -300) {
                    loadVideo(video);
                }
            });
        };
        window.addEventListener("scroll", checkVisible, { passive: true });
        window.addEventListener("resize", checkVisible);
        // Do not run checkVisible() here; let applyFilters handle initial load after CSV
        visibilityCheckAttached = true;
    }

    // Pause Observer
    if (!pauseObserver) {
        pauseObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                const video = entry.target;
                if (!entry.isIntersecting) video.pause();
                // Play if entering view and is not a lazy-loaded placeholder
                else if (video.paused && !video.dataset.src) video.play().catch(() => {});
            });
        }, { threshold: 0.25 });
    }

    // Unobserve old videos and observe new ones after gallery reload
    document.querySelectorAll("video").forEach(video => {
        if(pauseObserver) pauseObserver.observe(video);
    });
}

// ================================
// LOAD GALLERY (Existing Code, slightly cleaned up)
// ================================
function loadGallery(videoList) {
    if (!gallery) return;
    gallery.innerHTML = "";

    // Clear observers before adding new videos
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

        if (v.znam === "znám") {
            video.classList.add("know-green");
        } else if (v.znam === "potřebuju zlepšit") {
            video.classList.add("know-yellow");
        } else if (v.znam === "neznám") {
            video.classList.add("know-red");
        }

        const speedIcon = document.createElement("div");
        speedIcon.classList.add("speed-icon");
        speedIcon.textContent = "1×";
        card.appendChild(speedIcon);

        card.addEventListener("mouseenter", () => {
            speedIcon.style.display = "block";
        });
        card.addEventListener("mouseleave", () => {
            speedIcon.style.display = "none";
        });

        attachSpeedScroll(video, speedIcon, true);

        video.style.cursor = "default";
        card.appendChild(video);

        if (v.hd) {
            const fullscreenIcon = document.createElement("div");
            fullscreenIcon.classList.add("fullscreen-icon");
            fullscreenIcon.innerHTML = "⤢";
            card.appendChild(fullscreenIcon);

            card.addEventListener("mouseenter", () => {
                fullscreenIcon.style.display = "block";
            });
            card.addEventListener("mouseleave", () => {
                fullscreenIcon.style.display = "none";
            });

            fullscreenIcon.addEventListener("click", () => openOverlay(v));
        }

        gallery.appendChild(card);
    });
}

// ================================
// OPEN OVERLAY (Existing Code)
// ================================
function openOverlay(videoObj) {
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

    let altWrapper, mainButton, altButton, backBtn;

    if (alt) {
        altWrapper = createVideoWrapper(alt, true);
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

            main.video.play().catch(() => { });
            altWrapper.video.play().catch(() => { });

            mainButton.textContent = "pohled 1";
            if (altButton) altButton.remove();

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

            altWrapper.video.play().catch(() => { });

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
// DOM CONTENT LOADED — INIT (FIXED BLOCK)
// ================================
window.addEventListener("DOMContentLoaded", () => {
    
    // 1. Initial Render of Carousel (Fixes issue #1)
    renderCarousel();

    fetch('videos.csv')
        .then(res => {
            // Robust check for successful file load
            if (!res.ok) {
                console.error("Failed to load CSV file. Check file path and existence. Status:", res.status);
                // Return an empty string or throw error to prevent further execution
                return ""; 
            }
            return res.text();
        })
        .then(csvText => {
            if (!csvText) return; // Stop if CSV text is empty/failed to load

            const results = Papa.parse(csvText, { header: true, skipEmptyLines: true });

            // Map and cleanup video data
            videos = results.data.map(row => ({
                src480: row["480p"] || null,
                hd: row["1080p"] || null,
                alt: row["Alt"] || null,
                Button: row["Button"] || null, // Changed key to match CSV column
                znam: row["znám?"] || null,
                Datum: row["Datum"] || null, // New
                Figury: row["Figury"] || null // New
            }));

            console.log("Videos loaded from CSV:", videos);
            
            // --- 2. NEW FILTER BAR INIT ---
            generateFilterBar(videos);
            
            // 3. Initial filter application (Shows all videos)
            applyFilters(false);
            
            // --- 4. COLLAPSE TOGGLE INIT ---
            const filterBar = document.getElementById('filter-bar');
            const toggleBtn = document.getElementById('toggle-filter-btn');
            
            if (toggleBtn && filterBar) {
                toggleBtn.addEventListener('click', () => {
                    filterBar.classList.toggle('collapsed');
                    // Rerender carousel on collapse/expand to fix potential layout issues
                    renderCarousel(); 
                });
            }

            // --- 5. OLD HERO BUTTONS LOGIC ---
            const oldApplyFilter = (filterValue, shouldScroll = false) => {
                activeFilter = filterValue;

                document.querySelectorAll(".filter-btn").forEach(btn => btn.classList.remove("active"));
                
                // Clear all new filters before applying the old single filter
                activeFilters = { Figury_Buttons: [], Video: [], Datum: [], Figury_Moves: [] };
                
                if (filterValue === null) {
                    document.getElementById("btn-all")?.classList.add("active");
                }
                else if (filterValue === "Peťák a Renča") {
                    document.getElementById("btn-renča")?.classList.add("active");
                    activeFilters.Video.push("Peťák a Renča");
                }
                else if (filterValue === "Peťa a Peťa") {
                    document.getElementById("btn-peta")?.classList.add("active");
                    activeFilters.Video.push("Peťa a Peťa");
                }
                
                // Use the new main filter function
                applyFilters(shouldScroll);
            };

            const btnRenCa = document.getElementById("btn-renča");
            const btnPeta = document.getElementById("btn-peta");
            const btnAll = document.getElementById("btn-all");

            if (btnRenCa)
                btnRenCa.addEventListener("click", () => {
                    const isTogglingOff = activeFilter === "Peťák a Renča";
                    oldApplyFilter(isTogglingOff ? null : "Peťák a Renča", true);
                });

            if (btnPeta)
                btnPeta.addEventListener("click", () => {
                    const isTogglingOff = activeFilter === "Peťa a Peťa";
                    oldApplyFilter(isTogglingOff ? null : "Peťa a Peťa", true);
                });

            if (btnAll)
                btnAll.addEventListener("click", () => {
                    oldApplyFilter(null, true);
                });

        })
        .catch(err => console.error("Error loading CSV or parsing data:", err));
});

// ================================
// SPEED SCROLL FUNCTION (Existing Code)
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
        if (e.deltaY < 0) index = Math.min(index + 1, speeds.length - 1);
        else index = Math.max(index - 1, 0);

        video.playbackRate = speeds[index];
        showLabel();
    };

    if (iconOnly) {
        label.addEventListener("wheel", wheelHandler);
    } else {
        video.addEventListener("wheel", wheelHandler);
    }

    if (!iconOnly) {
        video.addEventListener("mouseleave", () => {
            if (speeds[index] === 1) label.style.display = "none";
        });
    }
}

// ================================
// HERO BUTTON AUTO-HIDE (Existing Code)
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

function showHeroBar() {
    if (heroBar) heroBar.classList.remove("hidden-hero");
}

function hideHeroBar() {
    if (heroBar) heroBar.classList.add("hidden-hero");
}

function onPageScroll(e) {
    if (isScrollOnVideo(e)) return;

    if (!isHeroOutOfView()) {
        showHeroBar();
        if (hideTimeout) clearTimeout(hideTimeout);
        return;
    }

    showHeroBar();

    if (hideTimeout) clearTimeout(hideTimeout);

    hideTimeout = setTimeout(() => {
        hideHeroBar();
    }, 2000);
}

window.addEventListener("wheel", onPageScroll, { passive: true });
window.addEventListener("scroll", onPageScroll, { passive: true });
