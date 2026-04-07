class MintClient {
    constructor() {
        this.vm = null;
        this.player = {
            multipliers: {
                moveSpeed: 1,
                jump: 1,
                gravity: 1,
                speed: 1, // not to be confused with moveSpeed, speed changes the runtime speed directly.
                defaultSpeed: 1,
            }
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

    getVariable(name, target = 0) { // Target 0 is the stage
        if (!this.requireVM()) return null;

        const vars = target.variables;

        for (const variable of Object.values(vars)) {
            if (variable.name === wantedName) {
                return variable;
            }
        }
        console.warn(`Variable with name ${name} not found.`);
        return null;
    }

    setVar(name, value, target = 0) { // Target 0 is the stage
        if (!this.requireVM()) return;

        const target = this.vm.runtime.targets[target];
        if (!target) {
            console.warn(`Target with id ${target} not found.`);
            return;
        }

        let variable = this.getVariable(name, target);

        if (variable) {
            variable.value = value;
            console.log(`Variable ${variable.name} set to: ${value}`);
        } else {
            console.warn(`Variable with name ${name} not found on target ${target.id}.`);
        }
    }

    setUsername(username) {
        if (!this.requireVM()) return;
        this.vm.runtime.ioDevices.userData._username = username; // set in the vm directly.
        console.log(`Username set to: ${this.username}`);
    }

    getUsername() {
        if (!this.requireVM()) return null;
        return this.vm.runtime.ioDevices.userData._username; // get directly from VM for more accuracy.
    }
}

// global
window.MintClient = MintClient;