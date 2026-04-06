// inject all link rel

console.log("Running injector...")
function injectHead(text) { document.head.insertAdjacentHTML("afterbegin", text); }

injectHead('<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Manrope">');
injectHead('<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/directprogrammer1/mint-rd/assets/css/style.css">');

document.title = `Mint | ${document.title}`;

function loadOverlay() {
    // load the overlay from overlay.html
}