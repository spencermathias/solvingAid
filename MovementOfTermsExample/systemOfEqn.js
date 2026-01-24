//const Equation = require("../equation");

//const { act } = require("react");

class SystemOfEquations {
    constructor() {
        this.equationLogs = [];
        this.activeEquation = 0;
    }
    createEquation(input) {
        const equation = [];
        let stack = [];
        if(typeof input === 'string') {
            throw new Error("String input not yet supported for SystemOfEquations");
            input.split('=').forEach((part, index) => {
                const tokens = tokenizeInput(part);
                stack = createTokenStack(tokens);
            });
            equation.push(stack);
        } else if (input instanceof Equation) {
            input.equationNumber = this.equationLogs.length;
            this.equationLogs.push({equation: input, history: []});
            this.activeEquation = this.equationLogs.length - 1;
        }
    }

    cloneActiveEquation() {
        const activeEq = this.getActiveEquation();
        this.createEquation(new Equation(JSON.parse(activeEq.getSavedEquation(true))));
        if(activeEq.fromEquationNumber !== undefined){
            this.equationLogs[this.equationLogs.length - 1].fromEquationNumber = activeEq.fromEquationNumber;
        }else{
            this.equationLogs[this.equationLogs.length - 1].fromEquationNumber = activeEq.equationNumber;
        }
        //set active to the original equation for further operations
        this.activeEquation = activeEq.equationNumber;
        return this.equationLogs.length - 1;
    }

    switchActiveEquation(equationNumber) {
        if(equationNumber < 0 || equationNumber >= this.equationLogs.length){
            throw new Error("Invalid equation number");
        }
        this.activeEquation = equationNumber;
    }

    elimination_Additive(fromIndex) {
        const equation = new Equation(JSON.parse(this.equationLogs[fromIndex.split(' ')[termSplitIndex.Equation]].equation.getSavedEquation(true)));
        activeEq = this.getActiveEquation();
        units = activeEq.getUnits();
    }

    //getters
    getActiveEquation() {
        return this.equationLogs[this.activeEquation].equation;
    }

    getActiveEquationHistory() {
        return this.equationLogs[this.activeEquation].history;
    }

}

