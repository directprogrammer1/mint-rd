class MintClient {
    constructor() {
        this.vm = null;
        this.player = {
            multipliers: {
                moveSpeed: 1,
                jump: 1,
                gravity: 1,
                speed: 1,
                defaultSpeed: this.getVariable("Speed")?.value || 50,
            },

            setSpeed: this.setSpeed.bind(this),
            setUsername: this.setUsername.bind(this),
            getUsername: this.getUsername.bind(this),
            setVar: this.setVar.bind(this),
            getVariable: this.getVariable.bind(this)
        };
    }

    init(vm) {
        this.vm = vm;
        console.log("VM assigned");
    }

    requireVM() {
        if (!this.vm) {
            console.warn("A scratch/turbowarp VM is required for this operation. Call client.init(vm) first.");
            return false;
        }
        return true;
    }

    getTarget(targetIndex = 0) {
        if (!this.requireVM()) return null;
        return this.vm.runtime.targets[targetIndex] || null;
    }

    getVariable(name, targetIndex = 0) {
        if (!this.requireVM()) return null;

        const targetObj = typeof targetIndex === "number"
            ? this.getTarget(targetIndex)
            : targetIndex;

        if (!targetObj) {
            console.warn(`Target ${targetIndex} not found.`);
            return null;
        }

        const vars = targetObj.variables || {};

        for (const variable of Object.values(vars)) {
            if (variable.name === name) {
                return variable;
            }
        }

        console.warn(`Variable with name ${name} not found.`);
        return null;
    }

    setVar(name, value, targetIndex = 0) {
        if (!this.requireVM()) return;

        const targetObj = this.getTarget(targetIndex);
        if (!targetObj) {
            console.warn(`Target ${targetIndex} not found.`);
            return;
        }

        const variable = this.getVariable(name, targetObj);

        if (variable) {
            variable.value = value;
            console.log(`Variable ${variable.name} set to: ${value}`);
        } else {
            console.warn(`Variable with name ${name} not found on target ${targetIndex}.`);
        }
    }

    setUsername(username) {
        if (!this.requireVM()) return;
        this.vm.runtime.ioDevices.userData._username = username;
        console.log(`Username set to: ${username}`);
    }

    getUsername() {
        if (!this.requireVM()) return null;
        return this.vm.runtime.ioDevices.userData._username;
    }

    setSpeed(multiplier) {
        if (!this.requireVM()) return;

        this.player.multipliers.defaultSpeed =
            Number(this.player.multipliers.defaultSpeed) ||
            Number(this.getVariable("Speed")?.value) ||
            50;

        this.player.multipliers.speed = multiplier;
        this.setVar("Speed", this.player.multipliers.defaultSpeed * multiplier);

        console.log(`Speed multiplier set to: ${multiplier}`);
    }
}

// global
window.MintClient = MintClient;