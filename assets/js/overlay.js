// if fullscreen the style attribute will be shown, check every time with a mutationObserver

window.isOverlayShown = false;

function checkFullscreen() {
    const isFullscreen = document.querySelectorAll('[class*="full-screen"]');
    return isFullscreen.length > 0;
}

function injectHead(text) { document.head.insertAdjacentHTML("afterbegin", text); }

function setFavicon() {
    document.querySelectorAll('link[rel~="icon"]').forEach(el => el.remove());
    injectHead('<link rel="icon" type="image/x-icon" href="https://directprogrammer1.github.io/mint-rd/assets/mint-logo.ico">');
}

if (window.overlayMutationObserver) {
    window.overlayMutationObserver.disconnect();
}

window.overlayMutationObserver = new MutationObserver(() => {
    window.overlayMutationObserver.disconnect(); // overlay can be shown which would cause a crash

    const overlay = document.querySelector(".overlay");
    if (!overlay) {
        window.overlayMutationObserver.observe(document.body, { attributes: true, subtree: true });
        return;
    }

    const isFullscreen = checkFullscreen();

    if (!isFullscreen) window.isOverlayShown = false;

    overlay.classList.toggle("show", window.isOverlayShown);

    setFavicon();
    window.overlayMutationObserver.observe(document.body, { attributes: true, subtree: true });
});

if (window.overlayKeydownHandler) {
    document.removeEventListener("keydown", window.overlayKeydownHandler);
}

window.overlayKeydownHandler = (e) => {
    console.log("Keydown event:", e.key);
    const overlay = document.querySelector(".overlay");

    if (e.key !== "Tab") return;
    if (!overlay) {
        console.warn("Overlay element not loaded yet.");
        return;
    }

    if (checkFullscreen()) {
        console.log("Fullscreen detected, toggling overlay.");
        window.isOverlayShown = !window.isOverlayShown;
        overlay.classList.toggle("show", window.isOverlayShown);
    } else {
        console.log("Not in fullscreen, showing warning.");
        document.getElementById("warning").textContent = "Please enter fullscreen to show the overlay.";
        document.getElementById("warning").style.opacity = "1";
        document.getElementById("warning").style.transform = "translateY(0px)";

        setTimeout(() => {
            document.getElementById("warning").style.opacity = "0";
            document.getElementById("warning").style.transform = "translateY(10px)";
        }, 2000);
    }
    e.preventDefault();
};

document.addEventListener("keydown", window.overlayKeydownHandler);

window.overlayMutationObserver.observe(document.body, { attributes: true, subtree: true });

// closing function for now