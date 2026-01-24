equationNumber = 0;

class valueElement {
    constructor(numericValue = 1, var_unit = '_numeric') {
        if (typeof numericValue !== 'number') {
            throw new Error('numericValue must be a number');
        }
        if (typeof var_unit !== 'string' || !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(var_unit) && !(var_unit === '_numeric')) {
            throw new Error('var_unit must be a valid variable name');
        }
        this.numericValue = numericValue;
        this.var_unit = var_unit;
        this.parent = {type: undefined, equationNumber: undefined, side: undefined, index: undefined, parent: undefined};
    }
    add(other) {
        if (this.var_unit !== other.var_unit) {
            throw new Error('Cannot add valueElements with different var_units');
        }
        return new valueElement(this.numericValue + other.numericValue, this.var_unit);
    }
    subtract(other) {
        if (this.var_unit !== other.var_unit) {
            throw new Error('Cannot subtract valueElements with different var_units');
        }
        return new valueElement(this.numericValue - other.numericValue, this.var_unit);
    }
    negate() {
        return new valueElement(-this.numericValue, this.var_unit);
    }
}

class equation {
    // assume that both sides are additions of all the values in the arrays given
    // TODO: allow for side to be multiplication or addition
    constructor(leftSide, rightSide, previousEquation = null) {
        if (!Array.isArray(leftSide) || !Array.isArray(rightSide)) {
            throw new Error('Both leftSide and rightSide must be arrays');
        }
        if (!leftSide.every(item => item instanceof valueElement) || !rightSide.every(item => item instanceof valueElement)) {
            throw new Error('Both leftSide and rightSide must contain only valueElements');
        }
        const thisEquationNumber = equationNumber++;
        this.equationNumber = thisEquationNumber;
        this.previousEquation = previousEquation;
        this.rightSide = rightSide;
        this.leftSide = leftSide;
        this.leftSide.forEach((item, index) => item.parent = {type: 'equation', equationNumber: thisEquationNumber, side: 'left', index: index, parent: this});
        this.rightSide.forEach((item, index) => item.parent = {type: 'equation', equationNumber: thisEquationNumber, side: 'right', index: index, parent: this});
    }
    moveTerm(term, beforeTerm, nextEquation = null) {
        if(term.parent.equationNumber !== this.equationNumber || beforeTerm.parent.equationNumber !== this.equationNumber) {
            throw new Error('Both terms must belong to this equation');
        }
        if(term.parent.side === beforeTerm.parent.side) {
            throw new Error('Terms must be moved between sides');
        }
        if( nextEquation && 
            !(nextEquation instanceof equation) &&
            !(nextEquation.previousEquation === this)) {
                throw new Error('nextEquation must be an instance of equation and the child of this equation');
        }
        const negatedTerm = term.negate();
        if(nextEquation === null) {
            let newLeftSide, newRightSide;
            if(beforeTerm.parent.side === 'left') {
                // move term to left side before beforeTerm
                newRightSide = this.rightSide.toSpliced(term.parent.index, 1);
                newLeftSide = this.leftSide.toSpliced(beforeTerm.parent.index, 0, negatedTerm);
            } else {
                // move term to right side before beforeTerm
                newLeftSide = this.leftSide.toSpliced(term.parent.index, 1);
                newRightSide = this.rightSide.toSpliced(beforeTerm.parent.index, 0, negatedTerm);
            }
            return new equation(newLeftSide, newRightSide, this);
        } else {
            throw new Error('Moving terms is not yet implemented as a multi step action');
        }    
        
    }
    toString() {
        const leftStr = this.leftSide.map(item => `${item.numericValue}${item.var_unit}`).join(' + ');
        const rightStr = this.rightSide.map(item => `${item.numericValue}${item.var_unit}`).join(' + ');
        return `${leftStr} = ${rightStr}`;
    }

}



module.exports = { valueElement, equation };