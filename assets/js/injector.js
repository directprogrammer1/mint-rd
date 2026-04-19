// inject all link rel

log("Running injector...", "info");
function injectHead(text) { document.head.insertAdjacentHTML("afterbegin", text); }

injectHead('<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Manrope">');
injectHead('<link rel="stylesheet" href="https://directprogrammer1.github.io/mint-rd/assets/css/style.css">');

document.title = `Mint | ${document.title}`;

async function loadOverlay() {
    // load the overlay from overlay.html
    try {
        const res = await fetch("https://directprogrammer1.github.io/mint-rd/overlay.html", { cache: "no-store" }); // allow for updating
        
        if (!res.ok) {
            log(`Failed to load overlay (error ${res.status}), error text: ${res.statusText}`, "warn");
            return;
        }

        const html = await res.text();
        
        document.body.insertAdjacentHTML("beforeend", html);
    } catch (e) {
        log(`Network error: ${e}`, "error");
        return;
    }
}

async function runScript(src) {
    try {
        const res = await fetch(src, { cache: "no-store" }); // No more caching.
        const script = await res.text();

        log(`Running script with src ${src}`, "info");

        eval(script);
    } catch (e) {
        log(`Failed to run script: ${e}`, "error");
    }
}

(async () => {
    log("Loading overlay...", "info");
    await loadOverlay();
    log("Overlay loaded, running scripts...", "info");
    
    await runScript("https://directprogrammer1.github.io/mint-rd/assets/js/log.js");
    await runScript("https://directprogrammer1.github.io/mint-rd/assets/js/client.js"); // Initialize client as second item
    await runScript("https://directprogrammer1.github.io/mint-rd/assets/js/overlay.js");
    await runScript("https://directprogrammer1.github.io/mint-rd/assets/js/tab.js");
})();
// overlay should be hidden when not in fullscreen, otherwise can be shown with tab key/button