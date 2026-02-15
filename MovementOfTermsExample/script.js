document.addEventListener("DOMContentLoaded", () => {
    const equationElement = document.getElementById("equation");
    const actionElement = document.getElementById("action");
    const leftSideElement = document.getElementById("leftSide");
    const equalsSignElement = document.getElementById("equalsSign");
    const rightSideElement = document.getElementById("rightSide");
    const historyElement = document.getElementById("history");
    const initialEquation = [{type:"addGroup", sign:"+", coefficient:1, terms:[{type:"valueElement", sign:"+", numericValue:5, var_unit:"apples"}, 
                                                                {type:"addGroup", sign:"+", coefficient:2, terms:[{type:"valueElement", sign:"+", numericValue:14, var_unit:"apples"},
                                                                                                   {type:"valueElement", sign:"+", numericValue:15, var_unit:"apples"}
                                                                                                  ]},
                                                                ]},
                             {type:"addGroup", sign:"+", coefficient:1, terms:[{type:"valueElement", sign:"+", numericValue:10, var_unit:"dollars"}, 
                                                                {type:"valueElement", sign:"+", numericValue:20, var_unit:"apples"}
                                                                ]}
                            ];
    const equationList = new SystemOfEquations();
    window.testEquationList = equationList;
    equationList.createEquation(new Equation(initialEquation));
    let solver = equationList.getActiveEquation();
    //let historySaveArray = equationList.getActiveEquationHistory();

    function updateEquation(type, action, args) {
        solver = equationList.getActiveEquation();
        equationElement.innerHTML = solver.toDraggable();
        addDragAndDropListeners();
        logHistory(`${type}: ${solver.toString()}`, action, args);
    }

    function logHistory(message, action, args) {
        const entry = document.createElement("div");
        entry.textContent = message;
        let historySaveArray = equationList.getActiveEquationHistory();
        historySaveArray.push({action, args});
        historyElement.appendChild(entry);
    }

    function addDragAndDropListeners() {
        const terms = document.querySelectorAll(".term");
        terms.forEach(term => {
            term.addEventListener("dragstart", handleDragStart);
        });

        equationElement.addEventListener("dragover", handleDragOver);
        equationElement.addEventListener("drop", handleDrop);
    }

    let draggedTerm = null;

    function handleDragStart(event) {
        draggedTerm = parseInt(event.target.dataset.term);//event.target.textContent.trim(); // Trim spaces from the term
        event.dataTransfer.setData("text/plain", draggedTerm);
    }

    function handleDragOver(event) {
        event.preventDefault();
    }

    function handleDrop(event) {
        event.preventDefault();
        const dropTarget = event.target;
        if(solver.isSameEquation(draggedTerm)){
            const toIndex = parseInt(dropTarget.dataset.term);
            if (NODE_REGISTRY.get(draggedTerm).type === "coefficient"){
                let fromIndex;
                let toIndexParsed;
                if(dropTarget.classList.contains("dropZone")){
                    fromIndex = NODE_REGISTRY.get(draggedTerm).parent.id;
                    toIndexParsed = parseInt(dropTarget.dataset.term.split(':')[0]);
                }else if(dropTarget.classList.contains("term")){
                    fromIndex = draggedTerm;
                    toIndexParsed = NODE_REGISTRY.get(parseInt(dropTarget.dataset.term)).parent.id;
                }
                NODE_REGISTRY.get(toIndexParsed).distribute(NODE_REGISTRY.get(draggedTerm), 'multiply');
                updateEquation("distribute","distribute",[fromIndex, parseInt(toIndexParsed)]);
            }else{
                if (dropTarget.classList.contains("dropZone")) {
                    const fromIndex = draggedTerm;
                    const toIndex = dropTarget.dataset.term;
                    NODE_REGISTRY.get(parseInt(toIndex.split(':')[0])).moveTerm(fromIndex, parseInt(toIndex.split(':')[1]));
                    updateEquation("Moved Term","moveTerm",[fromIndex, toIndex]);
                }
                
                if (dropTarget.classList.contains("term")) {
                    const fromIndex = draggedTerm;
                    const toIndexParsed = parseInt(dropTarget.dataset.term);
                    NODE_REGISTRY.get(toIndexParsed).parent.combineTerms(fromIndex, toIndexParsed);
                    updateEquation("combined Terms","combineTerms",[fromIndex, toIndexParsed]);
                }
            }
        }else{
            if (dropTarget.classList.contains("equalitySign")) {
                const termInput = parseInt(prompt("Enter the value to multiply the dragged equation by (e.g., -5):"));
                //todo add better form to allow advanced features
                if(isNaN(termInput)){
                    alert('Invalid input');
                    return;
                }
                equationList.eliminationMultiply(termInput, draggedTerm);
                solver = equationList.getActiveEquation();
                updateEquation("Multiplied Equation for Elimination","systemLevel",[termInput, draggedTerm]);
            }
        }

    };

    //button functions
    window.createEquation = function () {
        alert('not yet implemented');
    };

    window.saveEquationState = function () {
        const clonedEqNumber = equationList.cloneActiveEquation();
        solver = equationList.getActiveEquation();
        updateEquation("Cloned Equation to eq:"+clonedEqNumber,"systemLevel",[]);
    };

    window.flipEquation = function () {
        solver.flipEquation();
        updateEquation('Flipped',"flipEquation",[]);
    };

    window.divideEquation = function () {
        const divisor = parseInt(prompt("Enter the divisor:"));
        if(isNaN(divisor) || divisor === 0){
            alert('Invalid divisor');
            return;
        }
        solver.divideEquation(divisor);
        updateEquation('Divided both sides by ' + divisor,"divideEquation",[divisor]);
    };

    window.addBothSides = function () {
        const termInput = prompt("Enter the term to add to both sides (e.g., 5apples):");
        if(!termInput){
            alert('Invalid term');
            return;
        }
        const termValue = parseInt(termInput.match(/-?\d+/)[0]);
        const termUnit = termInput.match(/[a-zA-Z]+/)[0];
        solver.addBothSides(termValue, termUnit);
        updateEquation('Added ' + termInput + ' to both sides',"addBothSides",[termValue, termUnit]);
    }

    window.updateEquation = updateEquation;

    updateEquation("Initial","init",[initialEquation]);
});