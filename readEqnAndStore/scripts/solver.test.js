import assert from 'assert';

describe('Basic Test', () => {
    it('should pass', () => {
        assert.strictEqual(1 + 1, 2);
        console.log('Test executed');
    });
});
console.log('Starting tests for solver.js');
const solver = await import('./solver.js');
const { valueElement, equation } = solver;

describe('valueElement Class', () => {
    console.log('Tests for invalid var_unit passed');
    it('should create an instance with valid numericValue and var_unit', () => {
        const instance = new solver.valueElement(10, 'unit');
        assert.strictEqual(instance.numericValue, 10);
        assert.strictEqual(instance.var_unit, 'unit');
    });

    it('should allow negative numericValue', () => {
        const instance = new valueElement(-5, 'unit');
        assert.strictEqual(instance.numericValue, -5);
        assert.strictEqual(instance.var_unit, 'unit');
    });

    it('should throw an error if numericValue is not a number', () => {
        assert.throws(() => new valueElement('10', 'unit'), /numericValue must be a number/);
    });

    it('should throw an error if var_unit is not a valid variable name', () => {
        assert.throws(() => new valueElement(10, '123unit'), /var_unit must be a valid variable name/);
        assert.throws(() => new valueElement(10, ''), /var_unit must be a valid variable name/);
        assert.throws(() => new valueElement(10, 'unit-name'), /var_unit must be a valid variable name/);
    });

    it('should throw an error if var_unit is not a string', () => {
        assert.throws(() => new valueElement(10, 123), /var_unit must be a valid variable name/);
    });
    it('should allow var_unit that is empty string', () => {
        const instance = new valueElement(10);
        assert.strictEqual(instance.numericValue, 10);
        assert.strictEqual(instance.var_unit, '_numeric');
    });
});

describe('Addition of valueElement instances', () => {
    it('should add two valueElements with the same var_unit', () => {
        const ve1 = new valueElement(10, 'unit');
        const ve2 = new valueElement(5, 'unit');
        const result = ve1.add(ve2);
        assert.strictEqual(result.numericValue, 15);
        assert.strictEqual(result.var_unit, 'unit');
    });

    it('should throw an error when adding valueElements with different var_units', () => {
        const ve1 = new valueElement(10, 'unit1');
        const ve2 = new valueElement(5, 'unit2');
        assert.throws(() => ve1.add(ve2), /Cannot add valueElements with different var_units/);
    });
});

describe('Subtraction of valueElement instances', () => {
    it('should subtract two valueElements with the same var_unit', () => {
        const ve1 = new valueElement(10, 'unit');
        const ve2 = new valueElement(5, 'unit');
        const result = ve1.subtract(ve2);
        assert.strictEqual(result.numericValue, 5);
        assert.strictEqual(result.var_unit, 'unit');
    });

    it('should throw an error when subtracting valueElements with different var_units', () => {
        const ve1 = new valueElement(10, 'unit1');
        const ve2 = new valueElement(5, 'unit2');
        assert.throws(() => ve1.subtract(ve2), /Cannot subtract valueElements with different var_units/);
    });

    it('should allow the result to have a negative numericValue', () => {
        const ve1 = new valueElement(5, 'unit');
        const ve2 = new valueElement(10, 'unit');
        const result = ve1.subtract(ve2);
        assert.strictEqual(result.numericValue, -5);
        assert.strictEqual(result.var_unit, 'unit');
    });
});

describe('equation Class', () => {
    it('should create an instance with valid leftSide and rightSide arrays', () => {
        const leftSide = [new valueElement(10, 'unit'), new valueElement(5, 'unit')];
        const rightSide = [new valueElement(15, 'unit')];
        const instance = new equation(leftSide, rightSide);
        assert.deepStrictEqual(instance.leftSide, leftSide);
        assert.deepStrictEqual(instance.rightSide, rightSide);
    });

    it('should throw an error if leftSide is not an array', () => {
        const rightSide = [new valueElement(15, 'unit')];
        assert.throws(() => new equation('notArray', rightSide), /Both leftSide and rightSide must be arrays/);
    });

    it('should throw an error if rightSide is not an array', () => {
        const leftSide = [new valueElement(10, 'unit')];
        assert.throws(() => new equation(leftSide, 'notArray'), /Both leftSide and rightSide must be arrays/);
    });

    it('should throw an error if leftSide contains non-valueElement items', () => {
        const leftSide = [new valueElement(10, 'unit'), 5];
        const rightSide = [new valueElement(15, 'unit')];
        assert.throws(() => new equation(leftSide, rightSide), /Both leftSide and rightSide must contain only valueElements/);
    });

    it('should throw an error if rightSide contains non-valueElement items', () => {
        const leftSide = [new valueElement(10, 'unit')];
        const rightSide = [new valueElement(15, 'unit'), 'notValueElement'];
        assert.throws(() => new equation(leftSide, rightSide), /Both leftSide and rightSide must contain only valueElements/);
    });

    it('should allow empty arrays for leftSide and rightSide', () => {
        const instance = new equation([], []);
        assert.deepStrictEqual(instance.leftSide, []);
        assert.deepStrictEqual(instance.rightSide, []);
    });
});

describe('moveTerm Method', () => {
    let eq, ve1, ve2, ve3, ve4;
    beforeEach(() => {
        ve1 = new valueElement(10, 'unit');
        ve2 = new valueElement(5, 'unit');  
        ve3 = new valueElement(15, 'unit');
        ve4 = new valueElement(20, 'unit');
        eq = new equation([ve1, ve2], [ve3, ve4]);
        console.log('Equation for testing moveTerm:', eq.toString());
    });

    it('should move a term from rightSide to leftSide before a specified term', () => {
        const eq2 = eq.moveTerm(ve3, ve2);
        assert.deepStrictEqual(eq2.toString(), `${ve1.numericValue}${ve1.var_unit} + ${-ve3.numericValue}${ve3.var_unit} + ${ve2.numericValue}${ve2.var_unit} = ${ve4.numericValue}${ve4.var_unit}`);
    });
    
    it('should move a term from leftSide to rightSide before a specified term', () => {
        const eq2 = eq.moveTerm(ve1, ve3);
        assert.deepStrictEqual(eq2.toString(), `${ve2.numericValue}${ve2.var_unit} = ${-ve1.numericValue}${ve1.var_unit} + ${ve3.numericValue}${ve3.var_unit} + ${ve4.numericValue}${ve4.var_unit}`);
    });    
});
