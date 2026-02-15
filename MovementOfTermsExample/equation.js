let NEXT_NODE_ID = 1;
const NODE_REGISTRY = new Map();

function generateNodeId(node) {
  const id = NEXT_NODE_ID++;
  NODE_REGISTRY.set(id, node);
  return id;
}

class ASTNode {
  constructor(parent = null, parentChildIndex = null) {
    this.id = generateNodeId(this);
    this.parent = parent;
    this.parentChildIndex = parentChildIndex;
  }

  setParent(node) {
    this.parent = node;
  }

  getPathToRoot() {
    const path = [];
    let cur = this;
    while (cur) {
      path.push(cur);
      cur = cur.parent;
    }
    return path;
  }
}

class valueElement  extends ASTNode {
    constructor(numericValue = 1, var_unit = '_numeric', parent = null, parentChildIndex = null) {
        if (typeof numericValue !== 'number') {
            alert('' + numericValue + ' must be a number');
            throw new Error('numericValue must be a number');
        }
        if (typeof var_unit !== 'string' || !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(var_unit) && !(var_unit === '_numeric')) {
            alert('' + var_unit + ' must be a valid variable name');
            throw new Error('var_unit must be a valid variable name');
        }
        super(parent, parentChildIndex);
        this.numericValue = numericValue;
        this.var_unit = var_unit;
        this.type = 'valueElement';

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
    toDraggable(){
        return this.toString();
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
class coefficientElement extends ASTNode {
    constructor(numericValue = 1, parent = null, parentChildIndex = null) {
        if (typeof numericValue !== 'number') {
            alert('' + numericValue + ' must be a number');
            throw new Error('numericValue must be a number');
        }
        super(parent, parentChildIndex);
        this.numericValue = numericValue;
        this.var_unit = '_numeric';
        this.type = 'coefficient';
    }

    divide(divisor) {
        if(divisor === 0) {
            alert('Cannot divide by zero');
            throw new Error('Cannot divide by zero');
        }
        this.numericValue = this.numericValue / divisor;
        return this;
    }
    
    toString() {
        return `${this.numericValue}`;
    }

    toDraggable() {
        return `<span class="coefficient" draggable="true" data-term="${this.id}">${this.numericValue}</span>`;
    }

    toJSON() {
        return [this.numericValue];
    }
}

class addGroup extends ASTNode {
    constructor(terms = [], parent = null, parentChildIndex = null) {
        super(parent, parentChildIndex);
        this.terms = [];
        this.terms.push({sign:"+", value: new coefficientElement(terms.coefficient, this, 0)});
        this.terms.push(... terms.terms.map(term => {
            if (term.type == 'valueElement') {
                return {sign:term.sign, value: new valueElement(term.numericValue, term.var_unit, this)};
            }else{
                return {sign:term.sign, value: new addGroup(term, this)};
            }
        }));
        this.type = 'addGroup';
        this.reNumberChildren();
        this.parent = parent;
        this.parentChildIndex = parentChildIndex;
        //this.coefficient = 1;
    }

    InsertAtIndex(term, index = this.terms.length) {
        this.terms.splice(index, 0, term);
        term.value.parent = this;
        this.reNumberChildren();
        return this.toString();
    }

    //drag and drop operations
    moveTerm(fromIndex, toBeforeIndex) {;
        const fromSide = NODE_REGISTRY.get(fromIndex).parent.id;

        if(fromSide !== this.id){
            if(this.parent.type === 'equation'){
                alert('Cannot move terms between sides of the equation, add or subtract from both sides instead');
                throw new Error('Cannot move terms between sides of the equation, add or subtract from both sides instead');
            //     // Moving between sides
            //     if(this.parent.movePossible('add', toBeforeIndex)){
            //         const term = this.terms[fromSide].splice(NODE_REGISTRY.get(fromIndex).parentChildIndex, 1)[0];
            //         this.parent.moveTerm(term, toBeforeIndex);
            //     }
            } else{
                alert('Cannot move terms, please distribute first');
                throw new Error('Cannot move terms, please distribute first');
            }
        }else{
            // Remove term from the original side
            const termIndex = NODE_REGISTRY.get(fromIndex).parentChildIndex;
            const term = this.terms.splice(termIndex, 1)[0];
            
            let insertIndex = toBeforeIndex;
            
            if(termIndex < insertIndex){ 
                // Adjust index if removing from earlier in the array
                insertIndex -= 1;
            }
            // Moving within the same side;
            this.terms.splice(insertIndex, 0, term);
        
            this.reNumberChildren();
            // Ensure consistent spacing around terms
            return this.toString();
        }
    }

    combineTerms(fromIndex, toIndex) {
        const fromSide = NODE_REGISTRY.get(fromIndex).parent.id;

        if(fromSide !== this.id){
            if(this.parent.type === 'equation'){
                alert('Cannot move terms between sides of the equation, add or subtract from both sides instead');
                throw new Error('Cannot move terms between sides of the equation, add or subtract from both sides instead');
            //     // Moving between sides
            // {
            //     this.terms[toSide][insertIndex] = this.terms[toSide][insertIndex].subtract(term);
            // }
            } else{
                alert('Cannot move terms, please distribute first');
                throw new Error('Cannot move terms, please distribute first');
            }
        }else{
            if(fromIndex === toIndex ){
                // No operation needed if combining the same term
                throw new Error('Cannot combine term on top of itself');
            }

            // Remove term from the original side
            const termIndex = NODE_REGISTRY.get(fromIndex).parentChildIndex;
            let insertIndex = NODE_REGISTRY.get(toIndex).parentChildIndex;
            let savedEquation = this.toJSON(); // save current state in case of error
            try {
                const term = this.terms.splice(termIndex, 1).pop();
                
                if(termIndex < insertIndex){ 
                    // Adjust index if removing from earlier in the array
                    insertIndex -= 1;
                }
                term.value.numericValue *= (term.sign === this.terms[insertIndex].sign ? 1 : -1);
                this.terms[insertIndex].value = this.terms[insertIndex].value.add(term.value);
                
                if(this.terms[insertIndex].value.numericValue === 0) {
                    // Remove term if it sums to zero
                    this.terms.splice(insertIndex, 1);
                }else{
                    // Update parent reference
                    this.terms[insertIndex].value.parent = this;
                    this.terms[insertIndex].value.parentChildIndex = insertIndex;
                }
                this.reNumberChildren();
                if(this.terms.length === 2){ // TODO change to 1 when the coefficient is removed from addGroup
                    // If only one term remains, update its parent to be the current node's parent
                    this.terms[1].value.parent = this.parent;
                    this.terms[1].value.parentChildIndex = this.parentChildIndex;
                    // remove this node from parent
                    if(this.parent.type === 'addGroup'){
                        this.parent.terms[this.parentChildIndex] = this.terms[1];// TODO change to 0 when the coefficient is removed from addGroup
                    }else{
                        this.parent.terms[this.parentChildIndex] = this.terms[1].value;// TODO change to 0 when the coefficient is removed from addGroup
                    }
                    // remove this node from registry
                    //NODE_REGISTRY.delete(this.id);
                }
                return this.toString();
            } catch (error) {
                alert('Error combining terms: ' + error.message);
                this.terms = savedEquation; // revert to saved state
                return this.toString();
            }
        }
    }

    reNumberChildren() {
        this.terms.forEach((term, idx) => {
            term.value.parentChildIndex = idx;
        });
    }

    distribute(value) {
        this.terms = this.terms.map((term, index) => {
            if(term.value.type === 'coefficient'){
                // skip auto distribute divisor to add group terms
                return {sign: term.sign, value: new coefficientElement(1, this, index)};
            } else{
                if(this.parent.type !== 'equation'){
                    const termValue = term.value.multiply(value);
                    termValue.parent = this.parent;
                    this.parent.InsertAtIndex({sign: term.sign, value: termValue}, this.parentChildIndex + index);
                    return {sign: term.sign, value: new valueElement(0, term.value.var_unit)};
                }else{
                    const termValue = term.value.divide(value);
                    termValue.parent = this;
                    return {sign: term.sign, value: termValue};
                }
            }
        });
        if(this.parent.type !== 'equation'){
            this.parent.terms.splice(this.parentChildIndex, 1); // remove the addGroup node after distribution
            this.parent.reNumberChildren();
        }
        return this.toString();
    }

    divide(divisor) {
        if(this.parent.type === 'equation'){
            this.distribute(divisor, 'divide');
            return this;
        } else{
            this.terms[0].value.divide(divisor);
            return this;
        }
    }
    
    multiply(factor) {
        this.terms = this.terms.map(term => {
            return {sign: term.sign, value: term.value.multiply(factor)};
        });
        return this.toString();
    }

    toString() {
        let outString = '';
        if (this.terms.length === 0) {
            return '0';
        }
        this.terms.forEach((term, index) => {
            if(index === 0){    
                if( term.value.numericValue !== 1){
                    outString += term.value.toString() + '*(';
                }
            }else{
                let appendTerm = term.value.toString();
                if (index > 1 ) {
                    outString += ' '+ term.sign + ' ';
                } else if (term.sign == "-") {
                    outString += ''+term.sign + ' ';
                }
                outString += appendTerm;
            }
        });
        if(this.terms[0].value.numericValue !== 1){
            outString += ')';
        }
        return outString;
    }
    
    toDraggable() {
        let outString = '';
        if (this.terms.length === 0) {
            outString += `0`;
        }
        
        this.terms.forEach((term, index) => {
            if(index === 0){
                if(this.terms[0].value.numericValue !== 1){
                    outString += `<span class="coefficient" draggable="true" data-term="${term.value.id}">${term.value.numericValue}</span>*(`;
                }
            }else{
                let appendTerm = term.value.toDraggable();
                outString += `<span class="dropZone" draggable="false" data-term="${this.id}:${index}"> . </span>`;
                if (index > 1 && term.sign == "+") {
                    outString += '+ ';
                } else if (term.sign == "-") {
                    outString += '- ';
                }
                outString += `<span class="term" draggable="true" data-term="${term.value.id}">${appendTerm}</span>`;
            }
        });
        outString += `<span class="dropZone" draggable="false" data-term="${this.id}:${this.terms.length}"> . </span>`;
        if(this.terms[0].value.numericValue !== 1){
            outString += ')';
        }
        return outString;
    }

    toJSON() {
        return this.terms.map(term => {
            return {sign: term.sign, value: term.value.toJSON()};
        });
    }

}

class Equation extends ASTNode {
    constructor(terms) {
        super();

        // read in the array of sides composed of their arrays of terms and make them into valueElements
        this.terms = [];
        this.terms.push(new addGroup(terms[0], this, 0));
        this.terms.push(new addGroup(terms[1], this, 1));
        if(terms.length < 3){
            this.equality = 0; // default to equality
        } else{
            this.equality = terms[2];
        }
        this.type = 'equation';
        this.equationNumber = equationNumber++;
    }

    reNumberChildren() {
        this.terms.forEach((side, sideIdx) => {
            side.parentChildIndex = sideIdx;
        });
    }

    //button operations
    flipEquation() {
        const sides = this.terms;
        this.terms = [sides[1], sides[0]];
        this.reNumberChildren();
        this.equality *= -1;
        return this.toString();
    }

    divideEquation(divisor) {
        if(this.terms[0].type === 'valueElement' ){
            const index0 = this.terms[0].id;
            this.terms[0] = this.terms[0].divide(divisor);
            //NODE_REGISTRY.delete(index0);
        }else{
            this.terms[0].divide(divisor);
        }

        if(this.terms[1].type === 'valueElement' ){
            const index1 = this.terms[1].id;
            this.terms[1] = this.terms[1].divide(divisor);
            //NODE_REGISTRY.delete(index1);
        }else{
            this.terms[1].divide(divisor);
        }

        this.equality *= divisor/Math.abs(divisor);
        return this.toString();
    }

    addBothSides(termInputValue,termInputUnit) {
        if(this.terms[0].type === 'valueElement' ){
            const termLeft ={type:"valueElement", sign:"+", numericValue:termInputValue, var_unit:termInputUnit};
            const newAddGroup = new addGroup({type:"addGroup", sign:"+", coefficient:1, terms:[
                {type:"valueElement", sign:"+", numericValue:this.terms[0].numericValue, var_unit:this.terms[0].var_unit}, termLeft]}, this, 0);
            this.terms[0] = newAddGroup;
        }else{
            const termLeft = {sign:'+', value: new valueElement(termInputValue,termInputUnit)};
            this.terms[0].InsertAtIndex(termLeft);
        }
        const termRight = {type:"valueElement", sign:"+", numericValue:termInputValue, var_unit:termInputUnit};
        if(this.terms[1].type === 'valueElement' ){
            const newAddGroup = new addGroup({type:"addGroup", sign:"+", coefficient:1, terms:[this.terms[1], termRight]}, this, 1);
            this.terms[1] = newAddGroup;
        }else{
            const termRight = {sign:'+', value: new valueElement(termInputValue,termInputUnit)};
            this.terms[1].InsertAtIndex(termRight);
        }
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
        outString += this.terms[0].toString();
        outString += this.equalityToString();
        outString += this.terms[1].toString();
        return outString;
    }

    toDraggable() {
        let outString = '';
        if(this.terms[0].length === 0){
            outString += `<span class="dropZone" draggable="false" data-term="${this.terms[0].id}:0"> . </span>0`;
        }else if(this.terms[0].type === 'valueElement'){
            outString += `<span class="dropZone" draggable="false" data-term="${this.terms[0].id}:0"> . </span>`
            outString += `<span class="term" draggable="false" data-term="${this.terms[0].id}">${this.terms[0].toString()}</span>`;
            outString += `<span class="dropZone" draggable="false" data-term="${this.terms[0].id}:1"> . </span>`
        }else{
            outString += this.terms[0].toDraggable();
        }
        outString += this.equalityToString();
        if(this.terms[1].length === 0){
            outString += `<span class="dropZone" draggable="false" data-term="${this.terms[1].id}:0"> . </span>0`;
        }else if(this.terms[1].type === 'valueElement'){
            outString += `<span class="dropZone" draggable="false" data-term="${this.terms[1].id}:0"> . </span>`
            outString += `<span class="term" draggable="false" data-term="${this.terms[1].id}">${this.terms[1].toString()}</span>`;
            outString += `<span class="dropZone" draggable="false" data-term="${this.terms[1].id}:1"> . </span>`
        }else{
            outString += this.terms[1].toDraggable();
        }
        return outString;
    }

    getSavedEquation(forJson=false) {
        if(forJson) {
            return JSON.stringify([this.terms[0].map(term => term.toJSON()), this.terms[1].map(term => term.toJSON()), this.equality]);
        }
        return [[...this.terms[0]], [...this.terms[1]], this.equality];
    }

    isSameEquation(fromIndex) {
        const equationNum = NODE_REGISTRY.get(fromIndex).parent.getPathToRoot().find(node => node.type === 'equation').equationNumber;
        return equationNum === this.equationNumber;
    }

}

// Export Equation class for use in script.js
if (typeof module !== "undefined") {
    module.exports = Equation;
}