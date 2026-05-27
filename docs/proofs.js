/**
 * Proof System: Define, manage, and execute mathematical transformation proofs
 * Proofs enable drag-drop behaviors that would otherwise trigger errors
 */

class Proof {
    constructor(id, name, description, conditions, actions) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.conditions = conditions;  // Function(draggedTermId, dropTargetId, equation) => boolean
        this.actions = actions;        // Function(draggedTermId, dropTargetId, equation) => void
        this.enabled = true;
    }

    canApply(draggedTermId, dropTargetId, equation) {
        if (!this.enabled) return false;
        try {
            return this.conditions(draggedTermId, dropTargetId, equation);
        } catch (e) {
            console.warn(`Proof "${this.name}" condition check failed:`, e);
            return false;
        }
    }

    apply(draggedTermId, dropTargetId, equation) {
        try {
            this.actions(draggedTermId, dropTargetId, equation);
            return { success: true, message: `Applied proof: ${this.name}` };
        } catch (e) {
            return { success: false, message: `Failed to apply proof: ${e.message}` };
        }
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            enabled: this.enabled
        };
    }
}

class ProofLibrary {
    constructor() {
        this.proofs = [];
        this.proofMap = new Map();
        console.log('ProofLibrary: Initializing default proofs...');
        this.initializeDefaultProofs();
        console.log('ProofLibrary: Loading from storage...');
        this.loadFromStorage();
        console.log('ProofLibrary: Initialized with', this.proofs.length, 'proofs');
        this.proofs.forEach(p => console.log(`  - ${p.id}: ${p.name} (enabled: ${p.enabled})`));
    }

    initializeDefaultProofs() {
        // Default: Move term across equation by subtracting from both sides
        this.addProof(new Proof(
            'move_term_subtract',
            'Move Term (Subtract)',
            'Move a term from one side to another by subtracting it from both sides',
            (draggedTermId, dropTargetId, equation) => {
                const draggedNode = NODE_REGISTRY.get(draggedTermId);
                const dropNode = NODE_REGISTRY.get(parseInt(dropTargetId.split(':')[0]));

                if (!draggedNode || !dropNode) return false;

                const dragPath = draggedNode.getPathToRoot();
                const dropPath = dropNode.getPathToRoot();

                const dragEquation = dragPath.find(n => n.type === 'equation');
                const dropEquation = dropPath.find(n => n.type === 'equation');

                if (dragEquation !== dropEquation) return false;

                const dragSideIndex = dragPath.find(n => n.parent && n.parent.type === 'equation');
                const dropSideIndex = dropPath.find(n => n.parent && n.parent.type === 'equation');

                return dragSideIndex && dropSideIndex && 
                       dragSideIndex.parentChildIndex !== dropSideIndex.parentChildIndex &&
                       draggedNode.type === 'valueElement';
            },
            (draggedTermId, dropTargetId, equation) => {
                // Steps:
                // 1) Create negation and add to both sides (equation.addBothSides)
                // 2) On original side: combine the original term with the newly added negation so it cancels
                // 3) On target side: take the newly added negation and either move it to the drop location or combine it with the drop term

                const draggedNode = NODE_REGISTRY.get(draggedTermId);
                if (!draggedNode) throw new Error('Dragged node not found');

                // Determine side indices (0 = left, 1 = right)
                const dragPath = draggedNode.getPathToRoot();
                const dragSideNode = dragPath.find(n => n.parent && n.parent.type === 'equation');
                if (!dragSideNode) throw new Error('Cannot determine drag side');
                const dragSideIndex = dragSideNode.parentChildIndex;

                // Parse dropTargetId to determine drop side and position
                const dropParts = String(dropTargetId).split(':');
                const dropParentId = parseInt(dropParts[0]);
                const dropNode = NODE_REGISTRY.get(dropParentId);
                const dropPath = dropNode.getPathToRoot();
                const dropSideNode = dropPath.find(n => n.parent && n.parent.type === 'equation');
                if (!dropSideNode) throw new Error('Cannot determine drop side');
                const dropSideIndex = dropSideNode.parentChildIndex;

                // Create negated value and add to both sides (appended to each side)
                const negated = draggedNode.negate();
                equation.addBothSides(negated.numericValue, negated.var_unit);

                // Refresh references to side groups (they may have been converted to addGroup)
                const sourceGroup = equation.terms[dragSideIndex];
                const targetGroup = equation.terms[dropSideIndex];

                // Newly added negated terms should be at the end of each side's terms array
                const newSourceTerm = sourceGroup.terms[sourceGroup.terms.length - 1].value;
                const newTargetTerm = targetGroup.terms[targetGroup.terms.length - 1].value;

                // Combine the original dragged term with the newly added negation on the source side
                try {
                    sourceGroup.combineTerms(draggedTermId, newSourceTerm.id);
                } catch (e) {
                    console.warn('Failed to combine on source side:', e);
                }

                // Place or combine the negated term on the target side at the requested drop location
                // If dropParts contains an index (format parentId:index) it's a dropZone; otherwise treat as term id
                if (dropParts.length === 2) {
                    const desiredIndex = parseInt(dropParts[1]);
                    try {
                        targetGroup.moveTerm(newTargetTerm.id, desiredIndex);
                    } catch (e) {
                        console.warn('Failed to move negated term to desired index on target side:', e);
                    }
                } else {
                    // dropParts length 1 => target is a term id; combine into that term
                    const dropTermId = parseInt(dropParts[0]);
                    try {
                        targetGroup.combineTerms(newTargetTerm.id, dropTermId);
                    } catch (e) {
                        console.warn('Failed to combine negated term into target term:', e);
                    }
                }
            }
        ));
    }

    addProof(proof) {
        this.proofs.push(proof);
        this.proofMap.set(proof.id, proof);
    }

    removeProof(proofId) {
        const index = this.proofs.findIndex(p => p.id === proofId);
        if (index !== -1) {
            this.proofs.splice(index, 1);
            this.proofMap.delete(proofId);
        }
    }

    getApplicableProofs(draggedTermId, dropTargetId, equation) {
        console.log('getApplicableProofs called with:', {draggedTermId, dropTargetId, proofCount: this.proofs.length});
        this.proofs.forEach(proof => {
            console.log(`Checking proof "${proof.name}" (enabled: ${proof.enabled})...`);
        });
        return this.proofs.filter(proof => {
            const applicable = proof.canApply(draggedTermId, dropTargetId, equation);
            console.log(`Proof "${proof.name}": ${applicable ? 'APPLICABLE' : 'NOT applicable'}`);
            return applicable;
        });
    }

    findBestProof(draggedTermId, dropTargetId, equation) {
        const applicable = this.getApplicableProofs(draggedTermId, dropTargetId, equation);
        return applicable.length > 0 ? applicable[0] : null;
    }

    toggleProof(proofId) {
        const proof = this.proofMap.get(proofId);
        if (proof) {
            proof.enabled = !proof.enabled;
            this.saveToStorage();
        }
    }

    saveToStorage() {
        const data = this.proofs.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            enabled: p.enabled
        }));
        localStorage.setItem('proofLibrary', JSON.stringify(data));
    }

    loadFromStorage() {
        const stored = localStorage.getItem('proofLibrary');
        console.log('loadFromStorage: stored data:', stored);
        if (stored) {
            try {
                const data = JSON.parse(stored);
                data.forEach(p => {
                    const proof = this.proofMap.get(p.id);
                    if (proof) {
                        console.log(`  Updating ${p.id}: enabled = ${p.enabled}`);
                        proof.enabled = p.enabled;
                    }
                });
            } catch (e) {
                console.warn('Failed to load proofs from storage:', e);
            }
        }
    }
}

const proofLibrary = new ProofLibrary();