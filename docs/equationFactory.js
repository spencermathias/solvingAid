function isNumberToken(token) {
  return /^-?\d+(\.\d+)?$/.test(token);
}

function isVariableToken(token) {
  return /^-?[a-zA-Z]+$/.test(token);
}

function createValueElementFromToken(token) {
  if (isNumberToken(token)) {
    return new valueElement(Number(token), '_numeric');
  }

  const match = token.match(/^(-?\d+(\.\d+)?)([a-zA-Z]+)$/);
  if (match) {
    const numericValue = Number(match[1]);
    const varUnit = match[3];
    return new valueElement(numericValue, varUnit);
  }

  if (isVariableToken(token)) {
    const sign = token.startsWith('-') ? -1 : 1;
    const unit = token.startsWith('-') ? token.slice(1) : token;
    return new valueElement(sign, unit);
  }

  throw new Error('Invalid token: ' + token);
}

function tokenizeEquationSide(input) {
  const cleaned = input.replace(/\s+/g, '');
  const parts = cleaned.split(/([+\-*/()])/).filter(Boolean);

  const tokens = [];
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part === '-' && (i === 0 || parts[i - 1] === '(' || ['+', '-', '*', '/'].includes(parts[i - 1]))) {
      const next = parts[i + 1];
      if (next && /^[a-zA-Z]+$/.test(next)) {
        tokens.push('-1', '*');
        continue;
      }
      if (next && /^\d+(\.\d+)?$/.test(next)) {
        tokens.push('-' + next);
        i++;
        continue;
      }
    }

    const match = part.match(/^(\d*\.?\d+)([a-zA-Z]+)$/);
    if (match) {
      tokens.push(match[1], match[2]);
      continue;
    }

    tokens.push(part);
  }

  const normalized = [];
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    normalized.push(token);

    const next = tokens[i + 1];
    if (!next) continue;

    const isTokenValue = /^[\w.]+$/.test(token) && token !== '(' && token !== ')' && !['+', '-', '*', '/'].includes(token);
    const isNextValue = /^[\w.]+$/.test(next) && next !== '(' && next !== ')' && !['+', '-', '*', '/'].includes(next);

    if (
      (isTokenValue && isNextValue) ||
      (token === ')' && (isNextValue || next === '(')) ||
      (isTokenValue && next === '(')
    ) {
      normalized.push('*');
    }
  }

  return normalized;
}

function simplifyMultiplyGroup(factors) {
  if (factors.length !== 2) {
    return new multiplyGroup(factors);
  }

  const [a, b] = factors;
  
  // Check pattern: numeric * variable
  if (a instanceof valueElement && b instanceof valueElement) {
    if (a.var_unit === '_numeric' && b.var_unit !== '_numeric') {
      return new valueElement(a.numericValue * b.numericValue, b.var_unit);
    }
    if (b.var_unit === '_numeric' && a.var_unit !== '_numeric') {
      return new valueElement(a.numericValue * b.numericValue, a.var_unit);
    }
  }

  return new multiplyGroup(factors);
}

function flattenAddition(a, b, isSubtraction = false) {
  const terms = [];
  const signs = [];

  // Collect terms from 'a'
  if (a instanceof addGroup) {
    a.terms.forEach(term => {
      terms.push(term.value);
      signs.push(term.sign);
    });
  } else {
    terms.push(a);
    signs.push('+');
  }

  // Collect terms from 'b', flipping signs if subtracting
  if (b instanceof addGroup) {
    b.terms.forEach(term => {
      terms.push(term.value);
      if (isSubtraction) {
        signs.push(term.sign === '+' ? '-' : '+');
      } else {
        signs.push(term.sign);
      }
    });
  } else {
    terms.push(b);
    signs.push(isSubtraction ? '-' : '+');
  }

  return new addGroup(terms, signs);
}

function createExpressionNode(tokens) {
  const precedence = { '+': 1, '-': 1, '*': 2 };
  const operatorStack = [];
  const outputQueue = [];

  tokens.forEach(token => {
    if (/^[\w.]+$/.test(token) && !['+', '-', '*', '/', '(', ')'].includes(token)) {
      outputQueue.push(createValueElementFromToken(token));
      return;
    }

    if (token === '(') {
      operatorStack.push(token);
      return;
    }

    if (token === ')') {
      while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== '(') {
        outputQueue.push(operatorStack.pop());
      }
      operatorStack.pop();
      return;
    }

    if (['+', '-', '*', '/'].includes(token)) {
      while (
        operatorStack.length > 0 &&
        operatorStack[operatorStack.length - 1] !== '(' &&
        precedence[operatorStack[operatorStack.length - 1]] >= precedence[token]
      ) {
        outputQueue.push(operatorStack.pop());
      }
      operatorStack.push(token);
      return;
    }

    throw new Error('Unsupported token: ' + token);
  });

  while (operatorStack.length) {
    outputQueue.push(operatorStack.pop());
  }

  const valueStack = [];
  outputQueue.forEach(item => {
    if (typeof item !== 'string') {
      valueStack.push(item);
      return;
    }

    const b = valueStack.pop();
    const a = valueStack.pop();
    if (!a || !b) {
      throw new Error('Malformed expression');
    }

    if (item === '+') {
      valueStack.push(flattenAddition(a, b, false));
      return;
    }
    if (item === '-') {
      valueStack.push(flattenAddition(a, b, true));
      return;
    }
    if (item === '*') {
      valueStack.push(simplifyMultiplyGroup([a, b]));
      return;
    }
    if (item === '/') {
      if (b instanceof valueElement && b.var_unit === '_numeric') {
        if (b.numericValue === 0) throw new Error('Division by zero');
        if (a instanceof valueElement) {
          valueStack.push(a.divide(b.numericValue));
          return;
        }
      }
      throw new Error('Unsupported division expression');
    }

    throw new Error('Unsupported operator: ' + item);
  });

  if (valueStack.length !== 1) {
    throw new Error('Could not build expression tree');
  }

  return valueStack[0];
}

function parseEquationString(input) {
  if (typeof input !== 'string' || input.trim() === '') {
    throw new Error('Input must be a non-empty equation string');
  }

  const parts = input.split('=');
  if (parts.length !== 2) {
    throw new Error('Equation must contain exactly one "=" sign');
  }

  const leftTokens = tokenizeEquationSide(parts[0]);
  const rightTokens = tokenizeEquationSide(parts[1]);

  const leftNode = createExpressionNode(leftTokens);
  const rightNode = createExpressionNode(rightTokens);

  return new Equation([leftNode, rightNode]);
}

window.parseEquationString = parseEquationString;