class valueElement {
    constructor(numericValue = 1, var_unit = '_numeric') {
        if (typeof numericValue !== 'number') {
            alert('' + numericValue + ' must be a number');
            throw new Error('numericValue must be a number');
        }
        if (typeof var_unit !== 'string' || !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(var_unit) && !(var_unit === '_numeric')) {
            alert('' + var_unit + ' must be a valid variable name');
            throw new Error('var_unit must be a valid variable name');
        }
        this.numericValue = numericValue;
        this.var_unit = var_unit;
        //this.parent = {type: undefined, equationNumber: undefined, side: undefined, index: undefined, parent: undefined};
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
    multiply(other) {
        if(other.var_unit !== '_numeric') {
            throw new Error('Cannot divide by a valueElement with a var_unit');
        }
        return new valueElement(this.numericValue * other.numericValue, this.var_unit);
    }
    divide(other) {
        if(other instanceof valueElement && other.var_unit !== '_numeric') {
            if(other.numericValue === 0) {
                alert('Cannot divide by zero');
                throw new Error('Cannot divide by zero');
            }
            if(other.var_unit !== '_numeric') {
                alert('Cannot divide by a valueElement with a var_unit');
                throw new Error('Cannot divide by a valueElement with a var_unit');
            }
            return new valueElement(this.numericValue / other.numericValue, this.var_unit);
        }else if(typeof other === 'number') {
            if(other === 0) {
                alert('Cannot divide by zero');
                throw new Error('Cannot divide by zero');
            }
            return new valueElement(this.numericValue / other, this.var_unit);
        }
    }
    negate() {
        return new valueElement(-this.numericValue, this.var_unit);
    }
    toString() {
        if (this.var_unit === '_numeric') {
            return `${this.numericValue}`;
        }
        if (this.numericValue === 1) {
            return `${this.var_unit}`;
        }
        return `${this.numericValue}${this.var_unit}`;
    }
    toAbsString() {
        if (this.var_unit === '_numeric') {
            return `${Math.abs(this.numericValue)}`;
        }
        if (Math.abs(this.numericValue) === 1) {
            return `${this.var_unit}`;
        }
        return `${Math.abs(this.numericValue)}${this.var_unit}`;
    }
    toJSON() {
        return [this.numericValue, this.var_unit];
    }
}
var equationNumber = 0;
termSplitEnum = {
    value: 2,
    side: 1,
    equation: 0
};

class Equation {
    constructor(terms) {
        // read in the array of sides composed of their arrays of terms and make them into valueElements
        this.terms = [];
        this.terms.push(terms[0].map(
            term => new valueElement(term[0], term[1])
        ));
        this.terms.push(terms[1].map(
            term => new valueElement(term[0], term[1])
        ));
        if(terms.length < 3){
            this.equality = 0; // default to equality
        } else{
            this.equality = terms[2];
        }
        this.equationNumber = equationNumber++;
    }

    //drag and drop operations
    moveTerm(fromIndex, toBeforeIndex) {;
        const fromSide = fromIndex.split(' ')[termSplitEnum.side] === 'left' ? 0 : 1;
        const toSide = toBeforeIndex.split(' ')[termSplitEnum.side] === 'left' ? 0 : 1;

        // Remove term from the original side
        const termIndex = parseInt(fromIndex.split(' ')[termSplitEnum.value]);
        const term = this.terms[fromSide].splice(termIndex, 1)[0];

        
        // Add term to the other side with the opposite sign
        if(fromSide !== toSide) {
            const flippedTerm = term.negate();
            const insertIndex = parseInt(toBeforeIndex.split(' ')[termSplitEnum.value]);
            this.terms[toSide].splice(insertIndex, 0, flippedTerm);
        }else{
            let insertIndex = parseInt(toBeforeIndex.split(' ')[termSplitEnum.value]);
            if(termIndex < insertIndex){ 
                // Adjust index if removing from earlier in the array
                insertIndex -= 1;
            }
            // Moving within the same side;
            this.terms[toSide].splice(insertIndex, 0, term);
        }

        // Ensure consistent spacing around terms
        //this.equation = `${this.terms[0].join(' ')} = ${this.terms[1].join(' ')}`.replace(/\s+/g, ' ').trim();
        return this.toString();
    }

    combineTerms(fromIndex, toIndex) {
        if(fromIndex === toIndex ){
            // No operation needed if combining the same term
            throw new Error('Cannot combine term on top of itself');
        }
        if(fromIndex.split(' ')[termSplitEnum.equation] !== toIndex.split(' ')[termSplitEnum.equation]){
            alert('Cannot combine terms from different equations');
            throw new Error('Cannot combine terms from different equations');
        }
        //determine sides
        const fromSide = fromIndex.split(' ')[termSplitEnum.side] === 'left' ? 0 : 1;
        const toSide = toIndex.split(' ')[termSplitEnum.side] === 'left' ? 0 : 1;

        // Remove term from the original side
        const termIndex = parseInt(fromIndex.split(' ')[termSplitEnum.value]);
        let insertIndex = parseInt(toIndex.split(' ')[termSplitEnum.value]);
        let savedEquation = this.getSavedEquation(); // save current state in case of error
        try {
            const term = this.terms[fromSide].splice(termIndex, 1).pop();

            // Add term to the other side with the same sign
            if(fromSide === toSide) {
                if(termIndex < insertIndex){ 
                    // Adjust index if removing from earlier in the array
                    insertIndex -= 1;
                }
                this.terms[toSide][insertIndex] = this.terms[toSide][insertIndex].add(term);
            }else{
                this.terms[toSide][insertIndex] = this.terms[toSide][insertIndex].subtract(term);
            }
            if(this.terms[toSide][insertIndex].numericValue === 0) {
                // Remove term if it sums to zero
                this.terms[toSide].splice(insertIndex, 1);
            }
            return this.toString();
        } catch (error) {
            alert('Error combining terms: ' + error.message);
            this.terms = savedEquation; // revert to saved state
            return this.toString();
        }
    }

    //button operations
    flipEquation() {
        const sides = this.terms;
        this.terms = [sides[1], sides[0]];
        this.equality *= -1;
        return this.toString();
    }

    divideEquation(divisor) {
        this.sideDivide(0, divisor);
        this.sideDivide(1, divisor);
        this.equality *= divisor/Math.abs(divisor);
        return this.equation;
    }

    addBothSides(termInputValue,termInputUnit) {
        let term = new valueElement(termInputValue,termInputUnit);
        this.terms[0].push(term);
        this.terms[1].push(term);
        return this.toString();
    }

    insert0term(sideIndex, positionIndex, unit) {
        let term = new valueElement(0, unit);
        this.terms[sideIndex].splice(positionIndex, 0, term);
        return this.toString();
    }

    elimination_additive(otherEquation) {
        if(this.terms[0].length !== otherEquation.terms[0].length || this.terms[1].length !== otherEquation.terms[1].length){
            alert('Equations must have the same number of terms on each side for elimination additive');
            throw new Error('Equations must have the same number of terms on each side for elimination additive');
        }

        let savedEquation = this.getSavedEquation(); // save current state in case of error
        try {
            this.terms[0].forEach((term, index) => {
                this.terms[0][index] = term.add(otherEquation.terms[0][index]);
            });
            this.terms[1].forEach((term, index) => {
                this.terms[1][index] = term.add(otherEquation.terms[1][index]);
            });
            return this.toString();
        } catch (error) {
            alert('Error in elimination additive: ' + error.message);
            this.terms = savedEquation;
            return this.toString();
        }
    }

    systemLevel() {
        //do nothing
        // Placeholder for system level operations
        return this.toString();
    }

    // side stuff
    sideDivide(sideIndex, divisor) {
        this.terms[sideIndex] = this.terms[sideIndex].map(term => {
            return term.divide(divisor);
        });
        return this.toString();
    }

    sideToString(sideIndex) {
        let outString = '';
        if (this.terms[sideIndex].length === 0) {
            return '0';
        }
        this.terms[sideIndex].forEach((term, index) => {
            let appendTerm = term.toAbsString();
            if (index > 0 ) {
                outString += ' ';
            }
            if (index > 0 && term.numericValue >= 0) {
                outString += '+ ';
            } else if (term.numericValue < 0) {
                outString += '- ';
                appendTerm = term.toAbsString();
            }
            outString += appendTerm;
        });
        return outString;
    }
    
    sideToDraggable(sideIndex) {
        let outString = '';
        if (this.terms[sideIndex].length === 0) {
            outString += `0`;
        }
        this.terms[sideIndex].forEach((term, index) => {
            let appendTerm = term.toAbsString();
            outString += `<span class="dropZone" draggable="false" data-term="${sideIndex?'right':'left'} ${index}"> . </span>`;
            if (index > 0 && term.numericValue >= 0) {
                outString += '+ ';
            } else if (term.numericValue < 0) {
                outString += '- ';
                appendTerm = term.toAbsString();
            }
            outString += `<span class="term" draggable="true" data-term="${this.equationNumber} ${sideIndex?'right':'left'} ${index}">${appendTerm}</span>`;
        });
        outString += `<span class="dropZone" draggable="false" data-term="${sideIndex?'right':'left'} ${this.terms[sideIndex].length}"> . </span>`;
        return outString;
    }

    //equality stuff
    equalityToString() {
        if(this.equality === 0){
            return ' = ';
        } else if (this.equality === -1){
            return ' < ';
        } else if (this.equality === 1){
            return ' > ';
        } else if (this.equality === -2){
            return ' ≤ ';
        } else if (this.equality === 2){
            return ' ≥ ';
        }
    }

    //output stuff
    toString() {
        let outString = '';
        outString += this.sideToString(0);
        outString += this.equalityToString();
        outString += this.sideToString(1);
        return outString;
    }

    toDraggable() {
        let outString = '';
        outString += this.sideToDraggable(0);
        outString += this.equalityToString();
        outString += this.sideToDraggable(1);
        return outString;
    }

    getSavedEquation(forJson=false) {
        if(forJson) {
            return JSON.stringify([this.terms[0].map(term => term.toJSON()), this.terms[1].map(term => term.toJSON()), this.equality]);
        }
        return [[...this.terms[0]], [...this.terms[1]], this.equality];
    }

    isSameEquation(fromIndex) {
        const equationNum = parseInt(fromIndex.split(' ')[0]);
        return equationNum === this.equationNumber;
    }

}

// Export Equation class for use in script.js
if (typeof module !== "undefined") {
    module.exports = Equation;
}