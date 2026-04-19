function log(content, type = "log") {
    function getTimestamp() {
        const d = new Date();
        const pad = (n, len = 2) => String(n).padStart(len, "0");

        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} `
             + `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.`
             + `${pad(d.getMilliseconds(), 3)}`;
    }

    let color;
    if (type === "warn") {
        color = "yellow";
    } else if (type === "error") {
        color = "red";
    } else if (type === "info") {
        color = "dodgerblue";
    } else {
        color = "gray";
    }

    const typeText = type.toUpperCase().padEnd(7, " "); // fixed width

    console.log(
        `%c[mint] %c${getTimestamp()} %c${typeText} %c${content}`,
        "color: #85d890; font-weight: bold; font-family: monospace;",
        "color: white; font-family: monospace;",
        `color: ${color}; font-family: monospace;`,
        "color: white; font-family: monospace;"
    );
}

window.log = log; // available for all