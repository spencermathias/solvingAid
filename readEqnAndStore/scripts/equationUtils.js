// Utility functions for equation processing

/**
 * Tokenizes the input string into an array of tokens.
 * @param {string} input - The input string to tokenize.
 * @returns {Array} - The array of tokens.
 */
function tokenizeInput(input) {
    let tokens = input
        .split(/([+\-*/()])/)
        .filter(token => token.trim() !== '')
        .flatMap(token => {
            return token
                .split(/\s+/)
                .filter(t => t.trim() !== '')
                .flatMap(term => {
                    const match = term.match(/^(\d*\.?\d+)([a-zA-Z]\w*)$/);
                    if (match) {
                        return [match[1], match[2]];
                    }
                    return term;
                });
        });

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

/**
 * Converts an array of tokens into a structured token stack.
 * @param {Array} tokens - The array of tokens to process.
 * @returns {Array} - The token stack.
 */
function createTokenStack(tokens) {
    const output = [];
    const operators = [];
    const precedence = { '+': 1, '-': 1, '*': 2, '/': 2 };
    const isLeftAssociative = { '+': true, '-': true, '*': true, '/': true };

    tokens.forEach((token, index) => {
        if (/^[\w.]+$/.test(token)) {
            output.push(new Value(token));
        } else if (token === '-' && (index === 0 || tokens[index - 1] === '(' || tokens[index - 1] in precedence)) {
            const nextToken = tokens[index + 1];
            if (/^\d+$/.test(nextToken)) {
                const value = new Value(nextToken);
                value.isNegative = true;
                output.push(value);
                tokens[index + 1] = '';
            }
        } else if (token in precedence) {
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
            operators.push(token);
        } else if (token === ')') {
            while (operators.length > 0 && operators[operators.length - 1] !== '(') {
                output.push(operators.pop());
            }
            operators.pop();
        }
    });

    while (operators.length > 0) {
        output.push(operators.pop());
    }

    const stack = [];
    output.forEach(token => {
        if (token instanceof Value) {
            stack.push(token);
        } else if (token in precedence) {
            const b = stack.pop();
            const a = stack.pop();
            if (token === '+' || token === '-') {
                const group = new AdditiveGroup([a, b], [token]);
                stack.push(group);
            } else if (token === '*' || token === '/') {
                let group;
                if (token === '*') {
                    group = new MultiplicativeGroup([a, b]);
                } else {
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

export { tokenizeInput, createTokenStack };