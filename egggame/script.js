document.addEventListener('DOMContentLoaded', () => {
    const eggs = document.querySelectorAll('.egg');
    const dyeVats = document.querySelectorAll('.vat');
    const turntables = document.querySelectorAll('.turntable');

    eggs.forEach(egg => {
        egg.addEventListener('dragstart', dragStart);
    });

    dyeVats.forEach(vat => {
        vat.addEventListener('dragover', dragOver);
        vat.addEventListener('drop', drop);
    });

    turntables.forEach(table => {
        table.addEventListener('dragover', dragOver);
        table.addEventListener('drop', drop);
    });

    // Add a container for returned eggs
    const returnedEggsContainer = document.createElement('div');
    returnedEggsContainer.classList.add('returned-eggs-container');
    document.body.prepend(returnedEggsContainer);

    // Add a drop zone at the top of the page
    const topDropZone = document.createElement('div');
    topDropZone.classList.add('top-drop-zone');
    document.body.prepend(topDropZone);

    topDropZone.addEventListener('dragover', dragOver);
    topDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        const draggedId = e.dataTransfer.getData('text/plain');
        const draggedElement = document.getElementById(draggedId);
        if (!draggedElement) return;

        // Reset the egg's position and rotation
        draggedElement.style.transform = '';
        draggedElement.style.top = '';
        draggedElement.style.left = '';
        draggedElement.dataset.rotation = 0;

        // Move the egg to the returned eggs container
        returnedEggsContainer.appendChild(draggedElement);
    });

    function dragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.id);
        e.dataTransfer.setData('source-type', 'egg');
        // Store the original egg to be moved later
        e.dataTransfer.setData('egg-id', e.target.dataset.id);
    }

    function dragOver(e) {
        e.preventDefault(); // Allow drop
    }


    function drop(e) {
        e.preventDefault();
        // Use the id stored in dataTransfer to find the dragged egg
        const draggedId = e.dataTransfer.getData('text/plain');
        const draggedElement = document.getElementById(draggedId);
        if (!draggedElement) return;

        if (e.target.classList.contains('vat')) {
            // Dye the egg, but only on the half specified by the parent dye-box label
            const vat = e.target;
            const vatColor = window.getComputedStyle(vat).backgroundColor;

            // Find the containing dye-box and read its label (Top/Bottom/Left/Right)
            const box = vat.closest('.dye-box');
            let side = 'top';
            if (box) {
                const label = box.querySelector('.label');
                if (label) {
                    // Use the first word of the label to determine side (e.g. "Top Side")
                    side = label.textContent.trim().split(/\s+/)[0].toLowerCase();
                }
            }

            
            applyHalfColors(draggedElement,side,vatColor);
        } else if (e.target.classList.contains('turntable')) {
            // Place the egg on the turntable and rotate it
            const turntable = e.target;
            const angle = turntable.classList.contains('degrees-45') ? 45 : 30;
            const currentRotation = parseFloat(draggedElement.dataset.rotation) || 0;
            const newRotation = currentRotation + angle;

            // // Remove egg from its previous container
            // if (draggedElement.parentElement) {
            //     draggedElement.parentElement.removeChild(draggedElement);
            // }

            // Append egg to turntable and position it
            // turntable.appendChild(draggedElement);
            // draggedElement.classList.add('placed-egg');
            draggedElement.style.transform = `rotate(${newRotation}deg)`;
            draggedElement.dataset.rotation = newRotation;

            // Adjust position for visual centering on turntable
            // draggedElement.style.top = '50%';
            // draggedElement.style.left = '50%';
            // draggedElement.style.transform += ' translate(-50%, -50%)';
        }
    }

    function applyHalfColors(egg, side, dyeColor) {

        // Determine the base angle for the side
        let baseAngle = 0;
        if (side === 'top') baseAngle = 180;
        if (side === 'bottom') baseAngle = 0;
        if (side === 'left') baseAngle = 90;
        if (side === 'right') baseAngle = 270;

        // Retrieve or initialize the gradients array
        var gradients = JSON.parse(egg.dataset.gradients || '[]');
        
        const currentRotation = parseFloat(egg.dataset.rotation) || 0;

            // Check if a gradient for this side already exists
            //const existingGradient = gradients.find(g => g.baseAngle === baseAngle);
            // if (existingGradient &&) {
            //     // Update the existing gradient's color
            //     existingGradient.color = vatColor;
            // } else {
            // Append a new gradient
        var setAngle = (baseAngle - currentRotation + 360) % 360;
        gradients.push({ baseAngle:setAngle, color:dyeColor });
            // }

            
        // Store the updated gradients array
        egg.dataset.gradients = JSON.stringify(gradients);
        
            const gradientStyles = gradients.map(({ baseAngle, color }) => {
            //const adjustedAngle = (baseAngle - currentRotation) % 360;
            return `linear-gradient(${baseAngle}deg, ${color} 0% 49%, transparent 51% 100%)`;
        });
        
        // Always include a white base so uncolored areas remain white
        gradientStyles.push('linear-gradient(white, white)');
        
        egg.style.backgroundImage = gradientStyles.join(', ');
        // Clear any direct backgroundColor to avoid conflicts
        egg.style.backgroundColor = '';
    }

    // Add unique IDs and a rotation data attribute to eggs for tracking
    eggs.forEach((egg, index) => {
        egg.dataset.id = `egg-${index}`;
        egg.id = `egg-${index}`;
        egg.dataset.rotation = 0;
    });
});
