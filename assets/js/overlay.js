// if fullscreen the style attribute will be shown, check every time with a mutationObserver

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

    overlay.classList.toggle("show", isFullscreen);

    setFavicon();
    mutationObserver.observe(document.body, { attributes: true, subtree: true });
});


mutationObserver.observe(document.body, { attributes: true, subtree: true });

// closing function for now