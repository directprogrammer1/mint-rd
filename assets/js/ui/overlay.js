// if fullscreen the style attribute will be shown, check every time with a mutationObserver

window.isOverlayShown = false;
window.isWarningShown = false;

function checkFullscreen() {
    const elementFullscreen = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
    const classFullscreen = document.querySelectorAll('[class*="full-screen"]');
    return Boolean(elementFullscreen) || classFullscreen.length > 0;
}

function injectHead(text) { document.head.insertAdjacentHTML("afterbegin", text); }

function setFavicon() {
    document.querySelectorAll('link[rel~="icon"]').forEach(el => el.remove());
    injectHead('<link rel="icon" type="image/x-icon" href="https://directprogrammer1.github.io/mint-client/assets/mint-logo.ico">');
}

if (window.overlayMutationObserver) {
    window.overlayMutationObserver.disconnect();
}

window.overlayMutationObserver = new MutationObserver(() => {
    window.overlayMutationObserver.disconnect(); // overlay can be shown which would cause a crash

    const toShow = document.querySelectorAll('div[name="show-toggle"]');
    if (!toShow) {
        window.overlayMutationObserver.observe(document.body, { attributes: true, subtree: true });
        return;
    }

    const isFullscreen = checkFullscreen();

    if (!isFullscreen) window.isOverlayShown = false;

    toShow.forEach(el => el.toggle("show", window.isOverlayShown));

    setFavicon();
    window.overlayMutationObserver.observe(document.body, { attributes: true, subtree: true });
});

if (window.overlayKeydownHandler) {
    document.removeEventListener("keydown", window.overlayKeydownHandler);
}

window.overlayKeydownHandler = (e) => {
    console.log("Keydown event:", e.key);
    const toShow = document.querySelectorAll('div[name="show-toggle"]');

    if (e.key !== "Tab") return;
    if (!toShow) {
        console.warn("Overlay & menu elements not loaded yet.");
        return;
    }

    if (checkFullscreen()) {
        console.log("Fullscreen detected, toggling overlay.");
        window.isOverlayShown = !window.isOverlayShown;
        toShow.forEach(el => el.classList.toggle("show", window.isOverlayShown));
    } else {
        if (window.isWarningShown) return; // Prevent multiple warnings
        console.log("Not in fullscreen, showing warning.");
        window.isWarningShown = true;
        window.isOverlayShown = true;
        toShow.forEach(el => el.classList.add("show"));
        const warning = document.getElementById("warning");
        warning.textContent = "Please enter fullscreen to show the overlay.";
        warning.style.opacity = "1";
        warning.style.transform = "translateY(0px)";

        setTimeout(() => {
            warning.style.opacity = "0";
            warning.style.transform = "translateY(10px)";
            if (!checkFullscreen()) {
                window.isOverlayShown = false;
                toShow.forEach(el => el.classList.remove("show"));
            }
            window.isWarningShown = false;
        }, 2000);
    }
    e.preventDefault();
};

const windows = document.querySelectorAll('[name="drag-move"]');

windows.forEach((win) => {
    const header = win.querySelector(".drag-header");
    if (!header) return;

    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    const startDrag = (clientX, clientY) => {
        const rect = win.getBoundingClientRect();

        // convert from bottom/right CSS positioning to left/top
        win.style.left = rect.left + "px";
        win.style.top = rect.top + "px";
        win.style.right = "auto";
        win.style.bottom = "auto";

        offsetX = clientX - rect.left;
        offsetY = clientY - rect.top;
        isDragging = true;
    };

    const moveDrag = (clientX, clientY) => {
        if (!isDragging) return;

        const left = clientX - offsetX;
        const top = clientY - offsetY;

        const maxLeft = window.innerWidth - win.offsetWidth;
        const maxTop = window.innerHeight - win.offsetHeight;

        win.style.left = Math.max(0, Math.min(left, maxLeft)) + "px";
        win.style.top = Math.max(0, Math.min(top, maxTop)) + "px";
    };

    const endDrag = () => {
        isDragging = false;
    };

    header.addEventListener("mousedown", (e) => {
        // don't start dragging if clicking a button/input inside the header
        if (e.target.closest("button, input, textarea, select")) return;

        e.preventDefault();
        startDrag(e.clientX, e.clientY);
    });

    document.addEventListener("mousemove", (e) => {
        moveDrag(e.clientX, e.clientY);
    });

    document.addEventListener("mouseup", endDrag);

    // touch support
    header.addEventListener("touchstart", (e) => {
        if (e.target.closest("button, input, textarea, select")) return;

        const touch = e.touches[0];
        startDrag(touch.clientX, touch.clientY);
    }, { passive: true });

    document.addEventListener("touchmove", (e) => {
        const touch = e.touches[0];
        if (!touch) return;
        moveDrag(touch.clientX, touch.clientY);
    }, { passive: true });

    document.addEventListener("touchend", endDrag);
});

document.addEventListener("keydown", window.overlayKeydownHandler);

window.overlayMutationObserver.observe(document.body, { attributes: true, subtree: true });

// closing function for now