const cmdText = document.getElementById('cmd-text');
cmdText.setAttribute('contenteditable', 'plaintext-only');
cmdText.spellcheck = false;
cmdText.style.whiteSpace = 'pre-wrap';
cmdText.style.outline = 'none';

function escapeHtml(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function getTextOffset(root, node, offset) {
    let chars = 0;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
    while (walker.nextNode()) {
        const current = walker.currentNode;
        if (current === node) {
            return chars + offset;
        }
        chars += current.nodeValue.length;
    }
    return chars;
}

function getCaretOffset(element) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
        return 0;
    }
    const range = selection.getRangeAt(0);
    return getTextOffset(element, range.startContainer, range.startOffset);
}

function setCaretPosition(element, chars) {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
    let node = walker.nextNode();
    let accumulated = 0;
    while (node) {
        const nextAccumulated = accumulated + node.nodeValue.length;
        if (chars <= nextAccumulated) {
            const range = document.createRange();
            const selection = window.getSelection();
            range.setStart(node, chars - accumulated);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
            return;
        }
        accumulated = nextAccumulated;
        node = walker.nextNode();
    }
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
}

function isWhitespaceToken(token) {
    return /^\s+$/.test(token);
}

function getHighlightClass(word, tokenIndex, isWhitespace, prevToken, nextToken) {
    const symbols = ["=", "&&", "||"]
    if (isWhitespace) {
        return '';
    }
    if (tokenIndex === 0) {
        return 'terminal-command';
    }
    if (/^("[^"]*"|'[^']*')$/.test(word)) {
        return 'terminal-string';
    }
    if (symbols.includes(word)) {
        return 'terminal-symbol';
    }
    if (nextToken === "=") {
        // it's an argument
        return 'terminal-argument';
    }
    if (word[0] === "$") {
        return 'terminal-var';
    }
    return '';
}

window.getHighlightClass = window.getHighlightClass || getHighlightClass;

function resolveHighlightClass(word, tokenIndex, isWhitespace, prevToken, nextToken) {
    const resolver = window.getHighlightClass || getHighlightClass;
    return resolver(word, tokenIndex, isWhitespace, prevToken, nextToken) || '';
}

function highlightText(text) {
    const lines = text.split('\n');
    return lines
        .map((line) => {
            const parts = [];
            const tokenRegex = /"[^"]*"|'[^']*'|=|\s+|[^\s='"]+/g;
            const tokens = [];
            let match;
            while ((match = tokenRegex.exec(line)) !== null) {
                tokens.push({ text: match[0], whitespace: isWhitespaceToken(match[0]) });
            }

            let lastIndex = 0;
            let tokenIndex = 0;
            tokens.forEach((tokenObj, i) => {
                const token = tokenObj.text;
                if (match && tokenObj) {
                    // keep lastIndex advancing in sequence instead of using match.index after the first loop
                }
                const tokenStart = line.indexOf(token, lastIndex);
                if (tokenStart > lastIndex) {
                    parts.push(escapeHtml(line.slice(lastIndex, tokenStart)));
                }
                const whitespace = tokenObj.whitespace;
                const cls = resolveHighlightClass(token, tokenIndex, whitespace, tokens[i - 1]?.text || '', tokens[i + 1]?.text || '');
                const escaped = escapeHtml(token);
                if (cls) {
                    parts.push(`<span class="${escapeHtml(cls)}">${escaped}</span>`);
                } else {
                    parts.push(escaped);
                }
                if (!whitespace) {
                    tokenIndex += 1;
                }
                lastIndex = tokenStart + token.length;
            });

            if (lastIndex < line.length) {
                parts.push(escapeHtml(line.slice(lastIndex)));
            }
            return parts.join('');
        })
        .join('<br>');
}

function updateHighlight() {
    const text = cmdText.textContent.replace(/\u00A0/g, ' ');
    const caretOffset = getCaretOffset(cmdText);
    cmdText.innerHTML = highlightText(text);
    setCaretPosition(cmdText, Math.min(caretOffset, text.length));
}

cmdText.addEventListener('input', updateHighlight);
cmdText.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
    }
});

cmdText.addEventListener('paste', (event) => {
    event.preventDefault();
    const text = (event.clipboardData || window.clipboardData).getData('text');
    document.execCommand('insertText', false, text);
});

// terminal/terminal.js

const terminalContent = document.getElementById("terminal-content");
const fakeCaret = document.getElementById("fake-caret");

terminalContent.addEventListener("mousedown", (e) => {
    if (!terminalContent.contains(e.target)) {
        fakeCaret.style.display = "none";
        return;
    }

    if (e.target === terminalContent || e.target === fakeCaret || (e.target.classList && e.target.classList.contains('terminal-row'))) {
        cmdText.focus();
        const range = document.createRange();
        range.selectNodeContents(cmdText);
        range.collapse(false);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        fakeCaret.style.display = "inline-block";
        e.preventDefault();
        return;
    }
});

terminalContent.addEventListener("click", () => {
    cmdText.focus();
    fakeCaret.style.display = "inline-block";
});

cmdText.addEventListener("dragstart", (e) => {
    e.preventDefault();
});

cmdText.addEventListener("drop", (e) => {
    e.preventDefault();
});

cmdText.addEventListener("dragover", (e) => {
    e.preventDefault();
});

function writeCommandFromInput() {
    const inputRow = document.querySelector("#terminal-content .terminal-row");
    const terminalStart = document.getElementById("terminal-start");
    const cmdText = document.getElementById("cmd-text");

    if (!inputRow || !terminalStart || !cmdText) return;

    const line = document.createElement("div");
    line.className = "terminal-output-line terminal-command-line";

    const promptSpan = document.createElement("span");
    promptSpan.className = "terminal-prompt-output";
    promptSpan.textContent = terminalStart.textContent;

    const commandSpan = document.createElement("span");
    commandSpan.className = "terminal-command-output";

    // preserves the highlighted spans inside cmdText
    commandSpan.innerHTML = cmdText.innerHTML;

    line.appendChild(promptSpan);
    line.appendChild(commandSpan);

    terminalContent.insertBefore(line, inputRow);
    terminalContent.scrollTop = terminalContent.scrollHeight;
}

function handleEnterKey(e) {
    if (e.key !== "Enter") return;

    e.preventDefault();

    const command = cmdText.textContent.trim();

    if (command.length === 0) return;

    writeCommandFromInput(); // preserve coloring

    cmdText.textContent = "";
    runCommand(command);
}

cmdText.addEventListener("keydown", (e) => {
    handleEnterKey(e);
});