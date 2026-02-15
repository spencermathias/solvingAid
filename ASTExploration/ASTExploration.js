let NEXT_NODE_ID = 1;
const NODE_REGISTRY = new Map();

function generateNodeId(node) {
  const id = NEXT_NODE_ID++;
  NODE_REGISTRY.set(id, node);
  return id;
}

//const node = NODE_REGISTRY.get(Number(nodeId));

class ASTNode {
  constructor() {
    this.id = generateNodeId(this);
    this.parent = null;
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

class ValueNode extends ASTNode {
  constructor(valueId) {
    super();
    this.valueId = valueId;   // index into your flat value array
  }
}

class AddNode extends ASTNode {
  constructor(children = []) {
    super();

    // children is an array of objects: { sign: +1 or -1, node: ASTNode }
    this.children = [];

    children.forEach(child => this.addChild(child.sign, child.node));
  }

  addChild(sign, node) {
    this.children.push({ sign, node });
    node.setParent(this);
  }

  removeChild(node) {
    const idx = this.children.findIndex(c => c.node === node);
    if (idx >= 0) this.children.splice(idx, 1);
  }

  insertChildAt(index, sign, node) {
    this.children.splice(index, 0, { sign, node });
    node.setParent(this);
  }
}

class MultiplyNode extends ASTNode {
  constructor(children = []) {
    super();

    this.children = [];

    children.forEach(child => this.addChild(child.node));
  }

  addChild(node) {
    this.children.push(node);
    node.setParent(this);
  }

  removeChild(node) {
    const idx = this.children.indexOf(node);
    if (idx >= 0) this.children.splice(idx, 1);
  }

  insertChildAt(index, node) {
    this.children.splice(index, 0, node);
    node.setParent(this);
  }
}

class DivNode extends ASTNode {
  constructor(numerator, denominator) {
    super();
    this.numerator = numerator;
    this.denominator = denominator;

    numerator.setParent(this);
    denominator.setParent(this);
  }
}

class GroupNode extends ASTNode {
  constructor(child) {
    super();
    this.child = child;
    child.setParent(this);
  }
}

First = new ValueNode(20);
second = new ValueNode(21);
add1 = new AddNode([{ sign: +1, node: First }, { sign: +1, node: second }]);
