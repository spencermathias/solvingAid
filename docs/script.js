document.addEventListener("DOMContentLoaded", () => {
    const equationElement = document.getElementById("equation");
    const actionElement = document.getElementById("action");
    const leftSideElement = document.getElementById("leftSide");
    const equalsSignElement = document.getElementById("equalsSign");
    const rightSideElement = document.getElementById("rightSide");
    const historyElement = document.getElementById("history");
    const initialEquation = [{type:"addGroup", terms:[  {type:"valueElement", numericValue:5, var_unit:"apples"}, 
                                                        {type:"multiplyGroup", terms:[  {type:"valueElement", numericValue:2, var_unit:"_numeric"},
                                                                                        {type:"addGroup", terms:[
                                                                                                    {type:"valueElement", numericValue:10, var_unit:"apples"},
                                                                                                    {type:"valueElement", numericValue:15, var_unit:"apples"}
                                                                                                ], signs:["+", "+"]
                                                                                        }]
                                                        }], signs:["+", "+"]},
                             {type:"addGroup", terms:[{type:"valueElement", numericValue:14, var_unit:"dollars"}, 
                                                      {type:"valueElement", numericValue:20, var_unit:"apples"}
                                                     ], signs:["+", "+"]}
                            ];
    const equationList = new SystemOfEquations();
    window.testEquationList = equationList;
    equationList.createEquation(new Equation(initialEquation));
    let solver = equationList.getActiveEquation();
    
    // Initialize Proof Editor
    const proofEditor = new ProofEditor('proofPanelContainer');
    window.testProofEditor = proofEditor;
    
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

    function performFallbackEquationOperation(draggedTermId, dropTarget) {
        if (dropTarget.classList.contains("dropZone")) {
            const [targetId, targetIndex] = String(dropTarget.dataset.term).split(':');
            const targetContainer = NODE_REGISTRY.get(parseInt(targetId));
            if (!targetContainer || typeof targetContainer.moveTerm !== 'function') {
                alert('Cannot perform move operation here. Use equation operations instead.');
                throw new Error('Unsupported fallback move operation for this drop target');
            }
            targetContainer.moveTerm(draggedTermId, parseInt(targetIndex));
            return {action: 'moveTerm', args: [draggedTermId, dropTarget.dataset.term]};
        }

        if (dropTarget.classList.contains("term")) {
            const targetTermId = parseInt(dropTarget.dataset.term);
            const targetTerm = NODE_REGISTRY.get(targetTermId);
            if (!targetTerm || !targetTerm.parent || typeof targetTerm.parent.combineTerms !== 'function') {
                alert('Cannot perform combine operation here. Use equation operations instead.');
                throw new Error('Unsupported fallback combine operation for this drop target');
            }
            targetTerm.parent.combineTerms(draggedTermId, targetTermId);
            return {action: 'combineTerms', args: [draggedTermId, targetTermId]};
        }

        alert('Unsupported drag/drop target for fallback operation.');
        throw new Error('Unsupported drop target for fallback operation');
    }

    function handleDrop(event) {
        event.preventDefault();
        const dropTarget = event.target;
        
        if (!draggedTerm) return;
        
        const draggedNode = NODE_REGISTRY.get(draggedTerm);
        if (!draggedNode) return;
        
        const draggedParent = draggedNode.parent;
        const targetAddGroupId = parseInt(dropTarget.dataset.term?.split(':')[0]);
        const targetAddGroup = NODE_REGISTRY.get(targetAddGroupId);
        
        // Check if dragging within the same parent (same addGroup)
        const isSameParent = draggedParent && targetAddGroup && draggedParent.id === targetAddGroup.id;
        
        console.log('handleDrop:', {
            draggedTerm,
            draggedParent: draggedParent?.id,
            targetAddGroup: targetAddGroup?.id,
            isSameParent,
            isSameEquation: solver.isSameEquation(draggedTerm)
        });
        
        if(solver.isSameEquation(draggedTerm) && isSameParent){
            // Same equation AND same parent addGroup: direct moveTerm is safe
            if (draggedNode.type === "coefficient"){
                // ... existing coefficient logic ...
            }else{
                if (dropTarget.classList.contains("dropZone")) {
                    const fromIndex = draggedTerm;
                    const toIndexStr = dropTarget.dataset.term;
                    NODE_REGISTRY.get(parseInt(toIndexStr.split(':')[0])).moveTerm(fromIndex, parseInt(toIndexStr.split(':')[1]));
                    updateEquation("Moved Term","moveTerm",[fromIndex, toIndexStr]);
                }
                
                if (dropTarget.classList.contains("term")) {
                    const fromIndex = draggedTerm;
                    const toIndexParsed = parseInt(dropTarget.dataset.term);
                    NODE_REGISTRY.get(toIndexParsed).parent.combineTerms(fromIndex, toIndexParsed);
                    updateEquation("combined Terms","combineTerms",[fromIndex, toIndexParsed]);
                }
            }
        } else {
            // Cross-addGroup or cross-equation drag: use proof system first, then fall back to original equation operations
            if (dropTarget.classList.contains("dropZone") || dropTarget.classList.contains("term")) {
                console.log('Searching for proof with:', draggedTerm, dropTarget.dataset.term);
                const proof = proofLibrary.findBestProof(draggedTerm, dropTarget.dataset.term, solver);
                console.log('Found proof:', proof);
                if (proof) {
                    const result = proof.apply(draggedTerm, dropTarget.dataset.term, solver);
                    if (result.success) {
                        updateEquation(result.message, 'proof', [proof.id, draggedTerm, dropTarget.dataset.term]);
                        return;
                    }
                    console.warn('Proof failed, falling back to equation operations:', result.message);
                }

                const fallback = performFallbackEquationOperation(draggedTerm, dropTarget);
                updateEquation(`Fallback ${fallback.action}`, fallback.action, fallback.args);
            }
        }
    }


    //button functions
    window.createEquation = function () {
        alert('not yet implemented');
    };

    window.saveEquationState = function () {
        const clonedEqNumber = equationList.cloneActiveEquation();
        solver = equationList.getActiveEquation();
        updateEquation("Cloned Equation to eq:" + clonedEqNumber, "systemLevel", []);

        // Display the saved equation in the savedEquations section
        const savedEquationsContainer = document.getElementById("savedEquations");
        const equationBlock = document.createElement("div");
        equationBlock.className = "equationBlock";
        equationBlock.textContent = solver.toString();
        savedEquationsContainer.appendChild(equationBlock);
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