/**
 * Proof Editor UI: Allow users to create, edit, and manage proofs
 */

class ProofEditor {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.proofList = null;
        this.panelOpen = false;
        this.render();
        this.attachEventListeners();
        this.attachToggleButton();
    }

    render() {
        this.container.innerHTML = `
            <div class="proof-panel">
                <div class="proof-header">
                    <h2>Proofs</h2>
                    <button class="btn-close-proof" title="Close panel">✕</button>
                </div>
                <div class="proof-list"></div>
                <div class="proof-actions-footer">
                    <button class="btn-new-proof" title="Create a new proof">+ New Proof</button>
                </div>
                <div class="proof-editor" style="display:none;"></div>
            </div>
        `;
        this.proofList = this.container.querySelector('.proof-list');
        this.updateProofList();
    }

    updateProofList() {
        this.proofList.innerHTML = '';
        if (proofLibrary.proofs.length === 0) {
            this.proofList.innerHTML = '<p class="proof-empty">No proofs available</p>';
            return;
        }
        proofLibrary.proofs.forEach(proof => {
            const item = document.createElement('div');
            item.className = 'proof-item';
            item.innerHTML = `
                <div class="proof-item-header">
                    <input type="checkbox" class="proof-toggle" data-id="${proof.id}" ${proof.enabled ? 'checked' : ''}>
                    <span class="proof-name">${proof.name}</span>
                </div>
                <div class="proof-description">${proof.description}</div>
                <div class="proof-actions">
                    <button class="btn-edit" data-id="${proof.id}">Edit</button>
                    <button class="btn-delete" data-id="${proof.id}">Delete</button>
                </div>
            `;
            this.proofList.appendChild(item);
        });
    }

    attachToggleButton() {
        const toggleBtn = document.getElementById('toggleProofPanel');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.togglePanel());
        }
    }

    togglePanel() {
        this.panelOpen = !this.panelOpen;
        if (this.panelOpen) {
            this.container.classList.add('open');
        } else {
            this.container.classList.remove('open');
        }
    }

    attachEventListeners() {
        this.container.querySelector('.btn-close-proof').addEventListener('click', () => this.togglePanel());
        this.container.querySelector('.btn-new-proof').addEventListener('click', () => this.showNewProofForm());
        
        this.proofList.addEventListener('change', (e) => {
            if (e.target.classList.contains('proof-toggle')) {
                const proofId = e.target.dataset.id;
                proofLibrary.toggleProof(proofId);
            }
        });

        this.proofList.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-delete')) {
                const proofId = e.target.dataset.id;
                if (confirm('Delete this proof?')) {
                    proofLibrary.removeProof(proofId);
                    this.updateProofList();
                }
            }
            if (e.target.classList.contains('btn-edit')) {
                const proofId = e.target.dataset.id;
                alert('Proof editing UI coming soon');
            }
        });
    }

    showNewProofForm() {
        const name = prompt('Proof name:');
        if (!name) return;
        const description = prompt('Proof description:');
        if (description === null) return;
        
        alert('Advanced proof editor coming soon. For now, proofs are code-defined.');
    }
}