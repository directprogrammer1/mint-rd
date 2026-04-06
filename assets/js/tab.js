const tabs = document.querySelectorAll(".glass.tab");
console.log("Tabs:", tabs);

tabs.forEach((tab) => {
    const button = tab.querySelector('[name="minimax"]');
    const body = tab.querySelector(".glass.body");

    if (!button || !body) return;

    if (!tab.classList.contains("maximized")) {
        body.style.display = "none";
    } else {
        body.style.display = "flex";
        body.style.maxHeight = "320px";
        body.style.opacity = "1";
        body.style.paddingTop = "12.5px";
        body.style.paddingBottom = "12.5px";
        body.style.marginTop = "10px";

        tab.style.width = tab.scrollWidth + "px";
    }

    button.addEventListener("click", () => {
        const isOpen = tab.classList.contains("maximized");

        if (isOpen) {
            tab.style.width = tab.offsetWidth + "px";

            body.style.maxHeight = body.scrollHeight + "px";
            body.style.display = "flex";

            requestAnimationFrame(() => {
                body.style.maxHeight = "0px";
                body.style.opacity = "0";
                body.style.paddingTop = "0px";
                body.style.paddingBottom = "0px";
                body.style.marginTop = "0px";
            });

            const onEnd = (e) => {
                if (e.propertyName !== "max-height") return;
                body.style.display = "none";
                body.removeEventListener("transitionend", onEnd);
            };

            body.addEventListener("transitionend", onEnd);
            tab.classList.remove("maximized");
        } else {
            body.style.display = "flex";
            tab.classList.add("maximized");

            requestAnimationFrame(() => {
                body.style.opacity = "1";
                body.style.paddingTop = "12.5px";
                body.style.paddingBottom = "12.5px";
                body.style.marginTop = "10px";
                body.style.maxHeight = "320px";

                requestAnimationFrame(() => {
                    tab.style.width = tab.scrollWidth + "px";
                });
            });
        }
    });
});
