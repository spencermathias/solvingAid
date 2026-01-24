#import operator

# Custom operator functions
def custom_add(a, b):
    print("Custom add ", a, b)
    return ValueToken(a.value + b.value,[a,b])  # Increase the value added by 1

def custom_sub(a, b):
    print("Custom subtract function called")
    return a.value - b.value

def custom_mul(a, b):
    print("Custom multiply function called", a, b)
    return ValueToken(a.value * b.value)  # Double the result of multiplication

def custom_truediv(a, b):
    print("Custom divide function called")
    if b.value == 0:
        raise ZeroDivisionError("division by zero")
    return ValueToken(a.value / b.value)

def custom_pow(a, b):
    print("Custom power function called")
    return ValueToken(pow(a.value, b.value))

# Operator mapping
operators = {
    '+': custom_add,
    '-': custom_sub,
    '*': custom_mul,
    '/': custom_truediv,
    '**': custom_pow
}

def calculate_expression(expression):
    try:
        # Tokenize the expression and evaluate using PEMDAS
        tokens = expression.split()
        stack = []
        postfix = []

        # Operator precedence and associativity
        precedence = {'+': 1, '-': 1, '*': 2, '/': 2, '**': 3}
        right_associative = {'**'}

        # Shunting-yard algorithm to convert infix to postfix
        for token in tokens:
            if token.isdigit():
                postfix.append(ValueToken(token))
            elif token in operators:
                while (stack and stack[-1] in operators and
                       ((token not in right_associative and precedence[token] <= precedence[stack[-1]]) or
                        (token in right_associative and precedence[token] < precedence[stack[-1]]))):
                    postfix.append(stack.pop())
                stack.append(token)
            elif token == '(':
                stack.append(token)
            elif token == ')':
                while stack and stack[-1] != '(':
                    postfix.append(stack.pop())
                stack.pop()
        while stack:
            postfix.append(stack.pop())
        print("Postfix expression:", postfix)
        # Evaluate the postfix expression
        eval_stack = []
        for token in postfix:
            if isinstance(token, ValueToken):
                eval_stack.append(token)
            elif token in operators:
                b = eval_stack.pop()
                a = eval_stack.pop()
                eval_stack.append(operators[token](a, b))

        return eval_stack[0]
    except Exception as e:
        return f"Error: {e}"

class ValueToken:
    def __init__(self, value, remove_from_final=None):
        self.value = float(value)
        self.remove_from_final = remove_from_final

    def __repr__(self):
        return f"ValueToken(value={self.value}, remove_from_final={self.remove_from_final})"

    def get_value(self):
        return self.value

    def should_remove(self):
        return self.remove_from_final

if __name__ == "__main__":
    user_input = input("Enter a mathematical expression (use spaces between numbers and operators): ")
    print("Result:", calculate_expression(user_input)) 
