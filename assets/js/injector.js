// inject all link rel

console.log("Running injector...")
function injectHead(text) { document.head.insertAdjacentHTML("afterbegin", text); }

injectHead('<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Manrope">');
injectHead('<link rel="stylesheet" href="https://directprogrammer1.github.io/mint-rd/assets/css/style.css">');

document.title = `Mint | ${document.title}`;

async function loadOverlay() {
    // load the overlay from overlay.html
    try {
        const res = await fetch("https://directprogrammer1.github.io/mint-rd/overlay.html", { cache: "no-store" });
        
        if (!res.ok) {
            console.error("Failed to load overlay:", res.status, res.statusText);
            return;
        }

        const html = await res.text();
        
        document.body.insertAdjacentHTML("beforeend", html);
    } catch (e) {
        console.error("Network error", e);
        return;
    }
}

async function runScript(src) {
    try {
        const res = await fetch(src, { cache: "no-store" }); // No more caching.
        const script = await res.text();

        console.log("Running script with src", src);

        eval(script);
    } catch (e) {
        console.error("Failed to run script", e);
    }
}

loadOverlay();

// load overlay BEFORE tab.js

runScript("https://directprogrammer1.github.io/mint-rd/assets/js/overlay.js");
runScript("https://directprogrammer1.github.io/mint-rd/assets/js/tab.js");
// overlay should be hidden when not in fullscreen, otherwise can be shown with tab key/button