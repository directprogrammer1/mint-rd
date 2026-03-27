// inject all link rel

console.log("Running injector...")
function injectHead(text) { document.head.insertAdjacentHTML("afterbegin", text); }

injectHead('<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Manrope">');
injectHead('<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/directprogrammer1/mint-rd@main/assets/css/style.css">');

function loadOverlay() {
    // load the overlay from overlay.html
}