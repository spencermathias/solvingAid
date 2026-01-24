const Equation = require("../equation");

describe("Equation.moveTerm", () => {
    const testEquation = new Equation([[[5,"apples"], [10,"apples"]], [[-15, "dollars"], [20, "apples"]]]);

    test("should move 10apples from left to right", () => {
        // Perform the move operation
        testEquation.moveTerm("left 1", "right 2");

        // Verify the equation
        expect(testEquation.toString()).toBe("5apples = - 15dollars + 20apples - 10apples");

    });

    test("should move -15dollars between 20apples and -10apples", () => {
        // Perform the move operation
        testEquation.moveTerm("right 0", "right 2");
        // Verify the equation
        expect(testEquation.toString()).toBe("5apples = 20apples - 15dollars - 10apples");
    });

    test("should move 20apples to after -10apples", () => {
        // Perform the move operation
        testEquation.moveTerm("right 0", "right 3");
        // Verify the equation
        expect(testEquation.toString()).toBe("5apples = - 15dollars - 10apples + 20apples");
    });

    test("should move 20apples between -15dollars and -10apples", () => {
        // Perform the move operation
        testEquation.moveTerm("right 2", "right 1");
        // Verify the equation
        expect(testEquation.toString()).toBe("5apples = - 15dollars + 20apples - 10apples");
    });

    test("should move -15dollars from right to left", () => {
        // Perform the move operation
        testEquation.moveTerm("right 0", "left 0");
        
        // Verify the equation
        expect(testEquation.toString()).toBe("15dollars + 5apples = 20apples - 10apples");
        
    });
    
    test("should handle invalid move gracefully", () => {
        // Save the current state
        const previousState = testEquation.toString();
        try {
            // Attempt to move a non-existent term
            testEquation.moveTerm("left 5", "right 0");
        } catch (e) {
            // Expected to throw an error
        }
        // Verify the equation remains unchanged
        expect(testEquation.toString()).toBe(previousState);
    });

    test("should handle moving term on top of itself gracefully", () => {
        // Save the current state
        const previousState = testEquation.toString();
        // Attempt to move a term on top of itself
        testEquation.moveTerm("left 1", "left 1");
        // Verify the equation remains unchanged
        expect(testEquation.toString()).toBe(previousState);
    });

});