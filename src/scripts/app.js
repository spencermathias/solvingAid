// Import touch events (if using modules)
//import './touchEvents.js';

//const { useSyncExternalStore } = require("react");

document.addEventListener('DOMContentLoaded', () => {
    // Ensure tokenizeInput is accessible globally
    const inputField = document.getElementById('inputEquation');
    const tokenizeButton = document.getElementById('tokenizeButton');
    const leftSide = document.getElementById('leftSide');
    const rightSide = document.getElementById('rightSide');
    const operationInput = document.getElementById('operationInput');
    let leftStack = [];
    let rightStack = [];

    tokenizeButton.addEventListener('click', () => {
        const input = inputField.value;
        input.split('=').forEach((part, index) => {
            const tokens = tokenizeInput(part);
            stack = createTokenStack(tokens);
            if (index === 0) {
                displayTokens(stack, leftSide);
            } else {
                displayTokens(stack, rightSide);
            }
        });
    });

    inputField.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            tokenizeButton.click(); // Simulate a click on the tokenize button
        }
    });
    

    function displayTokens(stack, sideElement) {
        sideElement.innerHTML = ''; // Clear the current content
        stack.forEach(element => {
            sideElement.innerHTML = element.toString()
            //sideElement.appendChild(element); // Append each token or operator element
        });
    }


    function addToBothSides(tokenStack) {
        const leftSide = document.getElementById('leftSide');
        const rightSide = document.getElementById('rightSide');
        if(leftSide.dataset.full != true && tokenStack.length > 0) {
            leftSide.innerHTML = ''; // Clear the current content
            leftSide.dataset.full = true;
        }
        rightSide.innerHTML = ''; // Clear the current content

        tokenStack.forEach(tokenElement => {
            leftSide.appendChild(tokenElement.cloneNode(true)); // Add to left side
            rightSide.appendChild(tokenElement.cloneNode(true)); // Add to right side
        });
    }

    function handleDragOver(e, sideElement, color) {
        e.preventDefault();
        sideElement.style.backgroundColor = color; // Change color when dragged over
    }

    // Function to handle dragleave
    function handleDragLeave(sideElement) {
        sideElement.style.backgroundColor = ''; // Reset color when drag leaves
    }

    // Function to handle drop
    function handleDrop(e, sideElement) {
        e.preventDefault();
        const token = e.dataTransfer.getData('text/plain');
        const adjustedToken = token.startsWith('-') ? token.slice(1) : `-${token}`;
        const value = new Value(adjustedToken);
        sideElement.appendChild(value.createElement());
    }

    // Add event listeners for leftSide
    leftSide.addEventListener('dragover', (e) => handleDragOver(e, leftSide, 'lightblue'));
    leftSide.addEventListener('dragleave', () => handleDragLeave(leftSide));
    leftSide.addEventListener('drop', (e) => handleDrop(e, leftSide));

    // Add event listeners for rightSide
    rightSide.addEventListener('dragover', (e) => handleDragOver(e, rightSide, 'lightblue'));
    rightSide.addEventListener('dragleave', () => handleDragLeave(rightSide));
    rightSide.addEventListener('drop', (e) => handleDrop(e, rightSide));

    function performOperation(leftTokens, rightTokens, operation) {
        const leftValue = eval(leftTokens.join(' '));
        const rightValue = eval(rightTokens.join(' '));
        switch (operation) {
            case '+':
                return leftValue + rightValue;
            case '-':
                return leftValue - rightValue;
            case '*':
                return leftValue * rightValue;
            case '/':
                return leftValue / rightValue;
            default:
                return 'Invalid operation';
        }
    }

    const operationButtons = document.querySelectorAll('.operations button');
    operationButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tokens = tokenizeInput(operationInput.value);
            const addTokenStack = createTokenStack(tokens, 'neither');
            if (button.id === 'addButton') {
                addToBothSides(addTokenStack, [leftSide, rightSide]);
            }
            console.log(`${button.innerText} button clicked`);
        });
    });
});

class Value {
    constructor(value) {
        this.value = value;
        this.isNegative = false;
        this.type = 'Value';
    }

    createElement() {
        const valueElement = document.createElement('div');
        valueElement.className = 'token';
        valueElement.innerText = this.value;
        valueElement.draggable = true;
        valueElement.style.display = 'inline-block';
        valueElement.style.border = '1px solid black';
        valueElement.style.padding = '5px';
        valueElement.style.margin = '2px';
        valueElement.style.textAlign = 'center';

        valueElement.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', this.value);
        });

        valueElement.addEventListener('dragend', () => {
            valueElement.style.opacity = '';
        });

        return valueElement;
    }

    negate() {
        this.isNegative = !this.isNegative; // Toggle the negative flag
    }

    toString() {
        return this.isNegative ? `(-${this.value})` : `${this.value}`;
    }
}

class AdditiveGroup {
    constructor(values = [], signs = []) {
        this.values = []; // Array to hold the values or MultiplicativeGroup instances
        this.signs = [];
        this.type = 'AdditiveGroup';
        //check inputs for values that are not instances of Value or MultiplicativeGroup
        values.forEach(value => {
            if (!(value instanceof Value || 
                value instanceof MultiplicativeGroup || 
                value instanceof AdditiveGroup || 
                value instanceof DivisionGroup))
            {
                throw new Error('AdditiveGroup can only hold instances of Value, MultiplicativeGroup, or AdditiveGroup');
            }
        });
        //check length of values
        if (values.length === 0) {
            throw new Error('Values array cannot be empty');
        }

        
        //check signs for valid input
        signs.forEach(sign => {
            if (sign !== '+' && sign !== '-') {
                throw new Error('Signs can only be "+" or "-"');
            }
        });
        // Add values to the group
        //check length of signs to match values
        if (signs.length === 0) {
            signs = Array(values.length - 1).fill('+'); // Default to '+' for all but the last value
        }else if (signs.length === values.length-1 ) {
            signs.unshift('+'); // Add a '+' sign for the last value if not provided
        }else if (signs.length !== values.length) {
            throw new Error('Signs array length must match values array length');
        }
        // pass values and sign to the add method
        values.forEach((value, index) => {
            this.add(value, signs[index]);
        });
    }

    // Add a value or group to the additive group
    add(valueOrGroup, sign = '+') {
        if (valueOrGroup instanceof Value || 
            valueOrGroup instanceof MultiplicativeGroup ||
            valueOrGroup instanceof DivisionGroup
        ) {
            this.values.push(valueOrGroup);
            this.signs.push(sign);
        } else if (valueOrGroup instanceof AdditiveGroup) {
            this.values = this.values.concat(valueOrGroup.values);
            this.signs = this.signs.concat(valueOrGroup.signs);
        } else {
            throw new Error('Only instances of Value, MultiplicativeGroup, or AdditiveGroup can be added');
        }
    }

    // Remove a value or group from the additive group
    removeValue(index) {
        if (index >= 0 && index < this.values.length) {
            let [val] = this.values.splice(index, 1);
            let [removedSign] =this.signs.splice(index, 1); // Remove the corresponding sign
            // val.isNegative = (val.isNegative ^ this.signs.splice(index, 1) == '-') ? true : false; // Toggle the negative sign based on the sign
            // if(this.values.length === 1 && this.signs[0] === '+') {
            //     let tempValue = this.values[0]
            //     if(tempValue instanceof MultiplicativeGroup) {
            //         Object.setPrototypeOf(this, MultiplicativeGroup.prototype); // Convert to MultiplicativeGroup if only one value left
            //         this.groups = tempValue.groups;
            //     }else if(tempValue instanceof DivisionGroup) {
            //         Object.setPrototypeOf(this, DivisionGroup.prototype); // Convert to DivisionGroup if only one value left
            //         this.numerator = tempValue.numerator;
            //         this.denominator = tempValue.denominator;
            //     }else {
            //         Object.setPrototypeOf(this, Value.prototype); // Convert to Value if only one value left
            //         this.value = tempValue.value;
            //         this.isNegative = tempValue.isNegative; 
            //     }
            // }
            return {value:val,sign:removedSign}; // Return the removed value
        }else {
            throw new Error('Index out of bounds for removeValue'); 
        }
    }

    // Rearrange values (commutative property: a + b = b + a)
    rearrange(a, b) {
        const [movedValue] = this.values.splice(a, 1);
        const [movedSign] = this.signs.splice(a, 1);
        this.values.splice(b, 0, movedValue);
        this.signs.splice(b, 0, movedSign);
    }

    //add parentheses around a group of values
    group(startValue, endValue = null) {
        let groupLength;
        if (endValue === null) {
            groupLength = 2;
        } else {
            groupLength = endValue - startValue + 1;
        }
        const groupValues = this.values.splice(startValue, groupLength);
        const groupSigns = this.signs.splice(startValue, groupLength);
        //form new AdditiveGroup with the values and signs
        const addGroup = new AdditiveGroup(groupValues, groupSigns);
        const newGroup = new MultiplicativeGroup([addGroup]); // Create a new MultiplicativeGroup with the AdditiveGroup
        this.values.splice(startValue, 0, newGroup); // add the new group at the specified index
        this.signs.splice(startValue, 0, '+'); // Add a '+' sign for the new group
    }

    strikeOut(index1, index2) {
        //check if index1 and index2 are valid
        if (index1 < 0 || index1 >= this.values.length || 
            index2 < 0 || index2 >= this.values.length   )
        {
            throw new Error('Invalid indices for strikeOut');
        }
        else
        {
            //check that index1 and index2 reference the same values
            //check that the types are the same
            if(typeof(this.values[index1]) === typeof(this.values[index2])&&
                this.signs[index1] != this.signs[index2])
            {
                if(JSON.stringify(this.values[index1]) === JSON.stringify(this.values[index2]))
                {
                    // If both values are the same, remove them
                    this.removeValue(index1);
                    if(index2 > index1) // Adjust index2 if index1 was removed
                    {
                        index2--; // Decrement index2 to account for the removed value
                    }
                    this.removeValue(index2);
                }
                else 
                {
                    throw new Error('Values at the specified indices do not match');
                }
            }
            else
            {
                throw new Error('Values at the specified indices are not of the same type or signs do not match');
            }
        }

    }

    //evaluate indices list
    evaluateIndices(indexes) {
        // Check if indexes is an array and are all elements are valid indices
        if (Array.isArray(indexes) && indexes.every(index => index >= 0 && index < this.values.length)) {
            // Check if all elements in indexes are values
            if (indexes.every(index => this.values[index].type === 'Value')) 
            {
                // If all elements are values, return the sum of the values at those indices
                const sum = indexes
                    .sort((a, b) => b - a) // Sort indices to ensure largest index is processed first
                    .map(index => this.removeValue(index))
                    .reduce((sum, value,i) => {
                        if (value.isNegative) {
                            return sum - parseFloat(value.value);
                        }else {
                            return sum + parseFloat(value.value);
                        }
                    }, 0);
                if(sum != 0) {
                    this.add(new Value(sum)); // Add the sum as a new value
                }
            }
            //else if (indexes.every(index => this.values[index] instanceof MultiplicativeGroup)) {
            //else if (indexes.every(this.values[index] instanceof DivisionGroup)) {
            else{
                throw new Error('All elements in indexes must be instances of the same type (Value, MultiplicativeGroup, or DivisionGroup)');
            }
        } else {
            throw new Error('Indexes must be an array of valid indices');
        }
    }

    // Get the string representation of the group
    toString() {
        return this.values
            .map((value, index) => {
                const prefix = this.signs[index] === '-' ? ' - ' : (index === 0 ? '' : ' + ');        
                return `${prefix}${value instanceof MultiplicativeGroup ? `(${value.toString()})` : value.toString()}`;
            })
            .join('');
    }
}

class MultiplicativeGroup {
    constructor(toInclude = []) {
        this.groups = []; // Array to hold values or AdditiveGroup instances
        this.type = 'MultiplicativeGroup';
        // Check inputs for values that are not instances of Value, AdditiveGroup, DivisionGroup or MultiplicativeGroup
        toInclude.forEach(group => {
            if (group instanceof Value ||
                group instanceof AdditiveGroup ||
                group instanceof MultiplicativeGroup ||
                group instanceof DivisionGroup)
            {
                this.add(group); // Add the group to the multiplicative group
            } else {
                throw new Error('MultiplicativeGroup can only hold instances of Value, AdditiveGroup, MultiplicativeGroup, or DivisionGroup');
            }
        });
    }

    // Add a group or value to the multiplicative group
    add(valueOrGroup) {
        if (valueOrGroup instanceof Value || valueOrGroup instanceof AdditiveGroup || valueOrGroup instanceof DivisionGroup) {
            this.groups.push(valueOrGroup);
        } else if (valueOrGroup instanceof MultiplicativeGroup) {
            this.groups = this.groups.concat(valueOrGroup.groups);
        } else {
            throw new Error('Only instances of Value, AdditiveGroup, or MultiplicativeGroup can be added');
        }
    }

    // Remove a group or value from the multiplicative group
    removeGroup(group) {
        const index = this.groups.indexOf(group);
        if (index !== -1) {
            val = this.groups.splice(index, 1);
            if (val.length === 1 && val[0] instanceof Value) {
                Object.setPrototypeOf(this, Value.prototype); // Convert to Value if only one value left
                this.value = val[0].value;
                this.isNegative = val[0].isNegative; 
            } else if (val.length === 1 && val[0] instanceof DivisionGroup) {
                Object.setPrototypeOf(this, DivisionGroup.prototype); // Convert to DivisionGroup if only one value left
                this.numerator = val[0].numerator;
                this.denominator = val[0].denominator;
            }
            else if (val.length === 1 && val[0] instanceof AdditiveGroup) {
                Object.setPrototypeOf(this, AdditiveGroup.prototype); // Convert to AdditiveGroup if only one value left
                this.values = val[0].values;
                this.signs = val[0].signs;
            }
            return val; // Return the removed group
        }
    }

    // Rearrange groups (associative property: a * b * c = c * a * b)
    rearrange(a, b) {
        const [movedGroup] = this.groups.splice(a, 1);
        this.groups.splice(b, 0, movedGroup);
    }

    // Get the string representation of the group
    toString() {
        return this.groups
            .map(group => {
                return (group instanceof AdditiveGroup || group instanceof DivisionGroup) ? `(${group.toString()})` : group.toString();
            })
            .join(' * ');
    }
}


class DivisionGroup {
    constructor(numerator, denominator) {
        const validTypes = [Value, AdditiveGroup, MultiplicativeGroup, DivisionGroup];
        if (
            [numerator, denominator].every(
            (item) => validTypes.some(type => item instanceof type)
            )
        ) {
            this.numerator = numerator;
            this.denominator = denominator;
        } else {
            throw new Error('Numerator and denominator must be Value, AdditiveGroup, MultiplicativeGroup, or DivisionGroup');
        }
    }

    toString() {
        const numStr = this.numerator instanceof Value ? this.numerator.toString() : `(${this.numerator.toString()})`;
        const denomStr = this.denominator instanceof Value ? this.denominator.toString() : `(${this.denominator.toString()})`;
        return `${numStr} / ${denomStr}`;
    }
}



class Equation {
    constructor(LHS,RHS) {
        if (
            LHS && 
            !(LHS instanceof Value || LHS instanceof AdditiveGroup || LHS instanceof MultiplicativeGroup || LHS instanceof DivisionGroup) &&
            RHS &&
            !(RHS instanceof Value || RHS instanceof AdditiveGroup || RHS instanceof MultiplicativeGroup || RHS instanceof DivisionGroup)
        ) {
            throw new Error('Equation can only hold an instance of Value, AdditiveGroup, MultiplicativeGroup or DivisionGroup');
        }
        this.leftSide = LHS; // The main group or value on the Left side of the equation
        this.rightSide = RHS; // The main group or value on the right side of the equation
    }

    // Add a value or group to the equation
    add(valueOrGroup) {
        if (valueOrGroup instanceof Value || valueOrGroup instanceof MultiplicativeGroup || valueOrGroup instanceof AdditiveGroup || valueOrGroup instanceof DivisionGroup) {
            // add value or group to both sides of the equation
            // add to left side
            if (this.leftSide instanceof AdditiveGroup) {
                this.leftSide.add(valueOrGroup); // Add to the existing additive group
            } else {
                // If the current group is not an additive group, create a new one
                this.leftSide = new AdditiveGroup([this.leftSide, valueOrGroup]);
            }
            // add to right side
            if (this.rightSide instanceof AdditiveGroup) {
                this.rightSide.add(valueOrGroup); // Add to the existing additive group
            }else {
                // If the current group is not an additive group, create a new one
                this.rightSide = new AdditiveGroup([this.rightSide, valueOrGroup]);
            }
        } else {
            throw new Error('Only instances of Value or MultiplicativeGroup can be added');
        }
    }

    // Subtract a value or group from the equation
    subtract(valueOrGroup) {
        if (valueOrGroup instanceof Value || valueOrGroup instanceof AdditiveGroup || valueOrGroup instanceof MultiplicativeGroup || valueOrGroup instanceof DivisionGroup) {
            if(this.leftSide instanceof AdditiveGroup) {
                this.leftSide.add(valueOrGroup, '-'); // Add to the existing additive group with a negative sign
            } else {
                // If the current group is not an additive group, create a new one
                this.leftSide = new AdditiveGroup([this.leftSide,valueOrGroup], ['-']);
            }
            if(this.rightSide instanceof AdditiveGroup) {
                this.rightSide.add(valueOrGroup, '-'); // Add to the existing additive group with a negative sign
            }
            else {
                // If the current group is not an additive group, create a new one
                this.rightSide = new AdditiveGroup([this.rightSide,valueOrGroup], ['-']);
            }
        } else {
            throw new Error('Only instances of Value, AdditiveGroup, MultiplicativeGroup or DivisionGroup can be subtracted');
        }
    }

    // Multiply the equation by a value or group
    multiply(valueOrGroup) {
        if (valueOrGroup instanceof Value || valueOrGroup instanceof AdditiveGroup || valueOrGroup instanceof MultiplicativeGroup || valueOrGroup instanceof DivisionGroup) {
            if (this.leftSide instanceof MultiplicativeGroup) {
                this.leftSide.add(valueOrGroup); // Add to the existing multiplicative group
            } else {
                // If the current group is not a multiplicative group, create a new one
                this.leftSide = new MultiplicativeGroup([this.leftSide, valueOrGroup]);
            }
            if (this.rightSide instanceof MultiplicativeGroup) {
                this.rightSide.add(valueOrGroup); // Add to the existing multiplicative group
            } else {
                // If the current group is not a multiplicative group, create a new one
                this.rightSide = new MultiplicativeGroup([this.rightSide, valueOrGroup]);
            }
        } else {
            throw new Error('Only instances of Value or AdditiveGroup can be multiplied');
        }
    }

    // Divide the equation by a value or group
    divide(valueOrGroup) {
        if (valueOrGroup instanceof Value || valueOrGroup instanceof AdditiveGroup || valueOrGroup instanceof MultiplicativeGroup || valueOrGroup instanceof DivisionGroup) {
            if (this.leftSide instanceof DivisionGroup) {
                if(this.leftSide.denominator instanceof MultiplicativeGroup){
                    this.leftSide.denominator.add(valueOrGroup); // Add to the existing denominator group    
                }else {
                    this.leftSide.denominator = new MultiplicativeGroup([this.leftSide.denominator, valueOrGroup]); // Create a new denominator group
                }
            } else {
                // If the current group is not a division group, create a new one
                this.leftSide = new DivisionGroup(this.leftSide, valueOrGroup);
            }
            if (this.rightSide instanceof DivisionGroup) {
                if(this.rightSide.denominator instanceof MultiplicativeGroup){
                    this.rightSide.denominator.add(valueOrGroup); // Add to the existing denominator group
                }else {
                    this.rightSide.denominator = new MultiplicativeGroup([this.rightSide.denominator, valueOrGroup]); // Create a new denominator group
                }
            } else {
                // If the current group is not a division group, create a new one
                this.rightSide = new DivisionGroup(this.rightSide, valueOrGroup);
            }
        } else {
            throw new Error('Only instances of Value, AdditiveGroup, MultiplicativeGroup or DivisionGroup can be divided');
        }
    }

    // move a value or group from one side to the other
    move(valueOrGroup, toLeftSide = true) {
        if (valueOrGroup instanceof Value || valueOrGroup instanceof AdditiveGroup || valueOrGroup instanceof MultiplicativeGroup || valueOrGroup instanceof DivisionGroup) {
            if (toLeftSide) {
                // Check if the value or group is on the right side
                if (this.rightSide instanceof AdditiveGroup && this.rightSide.values.includes(valueOrGroup)) {
                    // check to see if the valueOrGroup is an addition or subtraction on the right side
                    const removed = this.rightSide.removeValue(this.rightSide.values.indexOf(valueOrGroup));
                    if (removed.sign === '-') {
                        // If it's a subtraction, we need to add it to the left side with a positive sign
                        if(this.leftSide instanceof AdditiveGroup) {
                            this.leftSide.add(valueOrGroup); // Add to the existing additive group with a positive sign
                        }else {
                            // If the current group is not an additive group, create a new one
                            this.leftSide = new AdditiveGroup([this.leftSide, valueOrGroup], ['+']);
                        }
                    }else {
                        // If it's an addition, we need to add it to the left side with a negative sign
                        if(this.leftSide instanceof AdditiveGroup) {
                            this.leftSide.add(valueOrGroup, '-'); // Add to the existing additive group with a negative sign
                        }else {
                            // If the current group is not an additive group, create a new one
                            this.leftSide = new AdditiveGroup([this.leftSide, valueOrGroup], ['-']);
                        }
                    }
                } else if (this.rightSide instanceof MultiplicativeGroup) {
                    this.leftSide.add(valueOrGroup); // Add to the existing additive group
                    this.rightSide.removeValue(this.rightSide.values.indexOf(valueOrGroup));
                } else {
                    // If the current group is not an additive group, create a new one
                    this.leftSide = new AdditiveGroup([this.leftSide, valueOrGroup]);
                    this.rightSide.removeValue(this.rightSide.values.indexOf(valueOrGroup));
                }
            } else {
                // Move to the right side
                this.rightSide.add(valueOrGroup);
                this.leftSide.removeValue(this.leftSide.values.indexOf(valueOrGroup));
            }
        } else {
            throw new Error('Only instances of Value, AdditiveGroup, MultiplicativeGroup or DivisionGroup can be moved');
        }
    }
    // Get the string representation of the equation
    toString() {
        return this.leftSide.toString() + ' = ' + this.rightSide.toString();
    }
}




function tokenizeInput(input) {
    // Split on operators and parentheses, then further split tokens like '2x' into ['2', 'x']
    let tokens = input
        .split(/([+\-*/()])/)
        .filter(token => token.trim() !== '')
        .flatMap(token => {
            //split on whitespace
            return token
                .split(/\s+/)
                .filter(t => t.trim() !== '')
                .flatMap(term=>{
                    // Split numbers from variable names, e.g., '2x' => ['2', 'x']
                    const match = term.match(/^(\d*\.?\d+)([a-zA-Z]\w*)$/);
                    if (match){
                        return [match[1], match[2]];
                    }
                    return term;
                });
        });

    // Insert '*' between adjacent tokens that are numbers/variables (not operators or parentheses)
    const result = [];
    for (let i = 0; i < tokens.length; i++) {
        result.push(tokens[i]);
        if (
            i < tokens.length - 1 &&
            /^[\w.]+$/.test(tokens[i]) &&
            /^[\w.]+$/.test(tokens[i + 1])
        ) {
            result.push('*');
        }
    }
    return result;
}

function createTokenStack(tokens) {
    const output = [];
    const operators = [];
    const precedence = { '+': 1, '-': 1, '*': 2, '/': 2 };
    const isLeftAssociative = { '+': true, '-': true, '*': true, '/': true };

    tokens.forEach((token, index) => {
        if (/^[\w.]+$/.test(token)) {
            // If the token is a number, push it to the output
            output.push(new Value(token));
        } else if (token === '-' && (index === 0 || tokens[index - 1] === '(' || tokens[index - 1] in precedence)) {
            // Handle negative numbers (e.g., -1 or (-1)
            const nextToken = tokens[index + 1];
            if (/^\d+$/.test(nextToken)) {
                const value = new Value(nextToken);
                value.isNegative = true; // Mark the value as negative
                output.push(value);
                tokens[index + 1] = ''; // Skip the next token since it's part of the negative number
            }
        } else if (token in precedence) {
            // If the token is an operator, handle precedence and associativity
            while (
                operators.length > 0 &&
                operators[operators.length - 1] !== '(' &&
                (
                    precedence[operators[operators.length - 1]] > precedence[token] ||
                    (precedence[operators[operators.length - 1]] === precedence[token] && isLeftAssociative[token])
                )
            ) {
                output.push(operators.pop());
            }
            operators.push(token);
        } else if (token === '(') {
            // If the token is a left parenthesis, push it to the operators stack
            operators.push(token);
        } else if (token === ')') {
            // If the token is a right parenthesis, pop operators until a left parenthesis is found
            while (operators.length > 0 && operators[operators.length - 1] !== '(') {
                output.push(operators.pop());
            }
            operators.pop(); // Remove the left parenthesis
        }
    });

    // Pop any remaining operators
    while (operators.length > 0) {
        output.push(operators.pop());
    }

    // Convert the postfix expression into a token stack
    const stack = [];
    output.forEach(token => {
        if (token instanceof Value) {
            stack.push(token);
        } else if (token in precedence) {
            const b = stack.pop();
            const a = stack.pop();
            if (token === '+' || token === '-') {
                const group = new AdditiveGroup([a, b],[token]);
                stack.push(group);
            } else if (token === '*' || token === '/') {
                let group
                if (token === '*') {
                    group = new MultiplicativeGroup([a, b]);
                }else{
                    group = new DivisionGroup(a, b);
                }
                stack.push(group);
            }
        }
    });

    return stack;
}

function testCreateTokenStack() {
    const testCases = [
        { input: "1+2", expected: "1 + 2" }, // 1
        { input: "3*4", expected: "3 * 4" }, // 2
        { input: "2*3+4", expected: "(2 * 3) + 4" }, // 3
        { input: "6+3*4", expected: "6 + (3 * 4)" }, // 4
        { input: "2+3+4", expected: "2 + 3 + 4" }, // 5
        { input: "3*4*5", expected: "3 * 4 * 5" }, // 6
        { input: "1+2*(3+4)", expected: "1 + (2 * (3 + 4))" }, // 7
        { input: "4/(2-7)*5", expected: "(4 / (2 - 7)) * 5" }, // 8
        { input: "-1", expected: "(-1)" }, // 9
        { input: "2+-3", expected: "2 + (-3)" }, // 10
        { input: "-2*-3", expected: "(-2) * (-3)" }, // 11
        { input: "4/(-2)", expected: "4 / (-2)" }, // 12
        { input: "1-2", expected: "1 - 2" }, // 13
        { input: "1*(1-2)", expected: "1 * (1 - 2)" } // 14
    ];

    testCases.forEach(({ input, expected }, index) => {
        const tokens = tokenizeInput(input);
        const stack = createTokenStack(tokens, 'neither');
        const result = stack.map(token => token.toString()).join(' ');
        console.log(`Test Case ${index + 1}:`, result === expected ? "Passed" : `Failed (Expected: "${expected}", Got: "${result}")`);
    });
}

// Run the test
testCreateTokenStack();