const cmdText = document.getElementById("cmd-text");

class MintTerminal {
    constructor() {
        this.commands = new Map(); // command name -> command info
        this.packages = new Map(); // package name -> package instance

        this.prompt = "C:\\>";
    }

    installPackage(PackageClass, options = {}) {
        // Create package instance if a class was passed
        const packageInstance = typeof PackageClass === "function"
            ? new PackageClass(this, options)
            : PackageClass;

        if (!packageInstance) {
            throw new Error("Invalid package.");
        }

        // Static packageInfo lives on constructor
        const rawInfo =
            packageInstance.packageInfo ||
            packageInstance.constructor.packageInfo;

        if (!rawInfo || typeof rawInfo !== "object") {
            throw new Error("Package must have static packageInfo.");
        }

        if (!rawInfo.name) {
            throw new Error("Package packageInfo must include a name.");
        }

        const packageInfo = {
            name: rawInfo.name,
            version: rawInfo.version || "unknown",
            type: rawInfo.type || "normal",
            category: rawInfo.category || "Other",
            description: rawInfo.description || "",
            ...rawInfo
        };

        const packageName = packageInfo.name;

        if (this.packages.has(packageName)) {
            throw new Error(`Package already installed: ${packageName}`);
        }

        // Save packageInfo onto the instance for easy access later
        packageInstance.packageInfo = packageInfo;

        // Store installed package
        this.packages.set(packageName, packageInstance);

        // Optional install hook
        if (typeof packageInstance.onInstall === "function") {
            packageInstance.onInstall(this);
        }

        // Commands can be static or instance-based
        const commandList =
            packageInstance.commands ||
            packageInstance.constructor.commands ||
            {};

        for (const [commandName, methodName] of Object.entries(commandList)) {
            this.registerCommand(commandName, packageName, methodName);
        }

        return packageInstance;
    }

    registerCommand(commandName, packageName, methodName) {
        const normalized = commandName.toLowerCase();

        if (this.commands.has(normalized)) {
            throw new Error(`Command already exists: ${commandName}`);
        }

        this.commands.set(normalized, {
            commandName,
            packageName,
            methodName
        });
    }

    executeCommand(commandSyntax) {
        commandSyntax = String(commandSyntax || "").trim();

        if (commandSyntax.length === 0) {
            return "";
        }

        const parsed = this.parseCommand(commandSyntax);

        if (!parsed.command) {
            return "";
        }

        const commandInfo = this.commands.get(parsed.command.toLowerCase());

        if (!commandInfo) {
            this.writeLines(`[red]'${parsed.command}' is not recognized as an internal or external command, operatable program, or batch file.`);
            return "";
        }

        const pkg = this.packages.get(commandInfo.packageName);

        if (!pkg) {
            this.writeLines(`[red]Package not loaded: ${commandInfo.packageName}`);
            return "";
        }

        const fn = pkg[commandInfo.methodName];

        if (typeof fn !== "function") {
            this.writeLines(`[red]Command function missing: ${commandInfo.methodName}`);
            return "";
        }

        const context = {
            terminal: this,
            package: pkg,
            input: commandSyntax,
            command: parsed.command,
            args: parsed.args,
            kwargs: parsed.kwargs
        };

        try {
            const result = fn.call(pkg, context);

            if (result !== undefined && result !== null && result !== "") {
                this.writeLines(result);
            }

            return result;
        } catch (err) {
            this.writeLines(`[red]Error: ${err.message}`);
            console.error(err);
            return "";
        }
    }

    parseCommand(input) {
        const tokens = this.tokenizeCommand(input);

        if (tokens.length === 0) {
            return {
                command: "",
                args: [],
                kwargs: {}
            };
        }

        const command = this.stripQuotes(tokens[0]);
        const args = [];
        const kwargs = {};

        for (let i = 1; i < tokens.length; i++) {
            const token = tokens[i];

            // key=value, because tokenizer splits into: key, =, value
            if (tokens[i + 1] === "=" && tokens[i + 2] !== undefined) {
                const key = this.stripQuotes(token);
                const value = this.stripQuotes(tokens[i + 2]);

                kwargs[key] = value;
                i += 2;
                continue;
            }

            if (token === "=") {
                continue;
            }

            args.push(this.stripQuotes(token));
        }

        return {
            command,
            args,
            kwargs
        };
    }

    tokenizeCommand(input) {
        const tokens = [];

        // quoted strings, equals sign, or normal words
        const regex = /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|=|[^\s='"]+/g;

        let match;

        while ((match = regex.exec(input)) !== null) {
            tokens.push(match[0]);
        }

        return tokens;
    }

    stripQuotes(value) {
        if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
        ) {
            return value.slice(1, -1);
        }

        return value;
    }

    parseColorSegments(text) {
        const fragments = [];
        let currentColor = "";
        let buffer = "";
        let i = 0;

        while (i < text.length) {
            if (text[i] === "\\" && i + 1 < text.length) {
                const next = text[i + 1];

                if (next === "[" || next === "]" || next === "\\") {
                    buffer += next;
                    i += 2;
                    continue;
                }

                if (next === "n") {
                    buffer += "\n";
                    i += 2;
                    continue;
                }
            }

            if (text[i] === "[") {
                const end = text.indexOf("]", i + 1);

                if (end !== -1) {
                    const colorValue = text.slice(i + 1, end);

                    if (buffer.length) {
                        fragments.push({
                            text: buffer,
                            color: currentColor
                        });

                        buffer = "";
                    }

                    currentColor = colorValue || currentColor;
                    i = end + 1;
                    continue;
                }
            }

            buffer += text[i];
            i += 1;
        }

        if (buffer.length) {
            fragments.push({
                text: buffer,
                color: currentColor
            });
        }

        return fragments;
    }

    createOutputLine(line) {
        const wrapper = document.createElement("div");
        wrapper.className = "terminal-output-line";

        this.parseColorSegments(line).forEach((fragment) => {
            const parts = fragment.text.split("\n");

            parts.forEach((part, index) => {
                if (index > 0) {
                    wrapper.appendChild(document.createElement("br"));
                }

                if (part.length) {
                    const span = document.createElement("span");
                    span.textContent = part;

                    if (fragment.color) {
                        span.style.color = fragment.color;
                    }

                    wrapper.appendChild(span);
                }
            });
        });

        return wrapper;
    }

    writeLines(lines) {
        if (!Array.isArray(lines)) {
            lines = [lines];
        }

        const inputRow = document.querySelector("#terminal-content .terminal-row");

        if (!inputRow) {
            return;
        }

        lines.forEach((line) => {
            const lineElement = this.createOutputLine(String(line));
            terminalContent.insertBefore(lineElement, inputRow);
        });

        terminalContent.scrollTop = terminalContent.scrollHeight;
        cmdText.focus();
    }
}

class CorePackage {
    static packageInfo = {
        "name": "core",
        "version": "1.0.0"
    };

    static commands = {
        help: "help",
        clear: "clear",
        cls: "clear",
        log: "log",
        packages: "packages",
        commands: "listCommands",
        version: "getVer"
    };

    constructor(terminal) {
        this.terminal = terminal;
    }

    help(ctx) {
        return [
            "[#ffff92]Available commands:",
            "\n/ ----- Core ----- /\n\n",
            "[white]help - [gray]Help command, lists default commands with explanations",
            "[white]clear / cls - [gray]Clear all content in terminal",
            "[white]log {text} - [gray]Logs text to terminal",
            "[white]packages - [gray]List all currently installed packages",
            "[white]commands - [gray]List all current available internal and external commands.",
            "[white]version {package} - [gray]Writes version of selected package"
        ];
    }

    clear(ctx) {
        const inputRow = document.querySelector("#terminal-content .terminal-row");

        document
            .querySelectorAll("#terminal-content .terminal-output-line")
            .forEach(el => el.remove());

        if (inputRow) {
            terminalContent.appendChild(inputRow);
        }

        cmdText.focus();
        return "";
    }

    log(ctx) {
        if (ctx.kwargs.text) {
            return ctx.kwargs.text;
        }

        return ctx.args.join(" ");
    }

    packages(ctx) {
        return [...ctx.terminal.packages.keys()]
            .map(name => `[yellow]${name}`);
    }

    listCommands(ctx) {
        return [...ctx.terminal.commands.keys()]
            .map(name => `[cyan]${name}`);
    }
    getVer(ctx) {
        const packageName = ctx.args[0];

        if (!packageName) {
            return "[red]Usage: version {package}";
        }

        const packageInstance = ctx.terminal.packages.get(packageName);

        if (!packageInstance) {
            return `[red]No package named ${packageName} found.`;
        }

        const info = packageInstance.packageInfo || packageInstance.constructor.packageInfo;

        if (!info) {
            return `[red]Package ${packageName} has no packageInfo.`;
        }

        return `[yellow]${info.name} [white]is version [yellow]${info.version || "unknown"}`;
    }
}

class SettingsPackage {
    static packageInfo = {
        "name": "general_settings",
        "version": "1.0.0",
    }

    static commands = {
        set: "set"
    };

    constructor(terminal) {
        this.terminal = terminal;
    }

    set(ctx) {
        const setting = ctx.args[0];

        if (setting === "clone-limit") {
            if (ctx.args.length !== 2) {
                return `[red]'set clone-limit' expected 2 args, got ${ctx.args.length} instead.`
            }
            const value = Number(ctx.args[1]);

            if (!Number.isFinite(value)) {
                return "[red]Usage: set clone-limit value=500";
            }
            if (value > 2000 && window.location.hostname === "scratch.mit.edu") {
                return "[red]Max clones 2000 on Scratch for lag reasons"
            }

            const input = document.getElementById("clonelimit");

            if (input) {
                input.value = value;
            }

            return `[white]Clone limit set to [yellow]${value}`;
        }

        return `[red]Unknown setting: ${setting}`;
    }
}

window.MintTerminal = MintTerminal;

window.terminal = new MintTerminal();

terminal.installPackage(CorePackage);
terminal.installPackage(SettingsPackage);

terminal.writeLines(
    "[cyan]Mint | License: MIT | Version: 1.0.0\n" +
    "[#ffff92]Welcome to Mint Terminal (v1.0.0). Use 'help' for information on commands.\n\n"
);

function runCommand(command) {
    return terminal.executeCommand(command);
}