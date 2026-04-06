// if fullscreen the style attribute will be shown, check every time with a mutationObserver

window.isOverlayShown = false;

function checkFullscreen() {
    const isFullscreen = document.querySelectorAll('[class*="full-screen"]');
    return isFullscreen.length > 0;

    // wow very short function
}

function injectHead(text) { document.head.insertAdjacentHTML("afterbegin", text); }

function setFavicon() {
    document.querySelectorAll('link[rel~="icon"]').forEach(el => el.remove());
    injectHead('<link rel="icon" type="image/x-icon" href="https://directprogrammer1.github.io/mint-rd/assets/mint-logo.ico">');
}

const mutationObserver = new MutationObserver(() => {
    mutationObserver.disconnect(); // overlay can be shown which would cause a crash

    const overlay = document.querySelector(".overlay");
    const isFullscreen = checkFullscreen();

    if (!isFullscreen) window.isOverlayShown = false;

    overlay.classList.toggle("show", window.isOverlayShown);

    setFavicon();
    mutationObserver.observe(document.body, { attributes: true, subtree: true });
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
        if (checkFullscreen()) {
            window.isOverlayShown = !window.isOverlayShown;
        } else {
            document.getElementById("warning").textContent = "Please enter fullscreen to show the overlay.";
            document.getElementById("warning").style.opacity = "1";
            document.getElementById("warning").style.transform = "translateY(0px)";

            setTimeout(() => {
                document.getElementById("warning").style.opacity = "0";
                document.getElementById("warning").style.transform = "translateY(10px)";
            }, 2000);
        }
        e.preventDefault();
    }
});

mutationObserver.observe(document.body, { attributes: true, subtree: true });

// closing function for now