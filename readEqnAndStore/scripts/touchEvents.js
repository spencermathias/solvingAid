function handleTouchStart(e, sideElement, color) {
    e.preventDefault();
    sideElement.style.backgroundColor = color; // Change color when touched
}

function handleTouchEnd(e, sideElement) {
    e.preventDefault();
    sideElement.style.backgroundColor = ''; // Reset color when touch ends
    const touch = e.changedTouches[0];
    const token = document.elementFromPoint(touch.clientX, touch.clientY).innerText;
    const adjustedToken = token.startsWith('-') ? token.slice(1) : `-${token}`;
    sideElement.appendChild(createDraggableToken(adjustedToken));
}

document.addEventListener('touchmove', (e) => {
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);

    // Check if the touch is over the leftSide or rightSide
    if (leftSide.contains(element)) {
        leftSide.style.backgroundColor = 'lightblue'; // Simulate dragover for leftSide
        rightSide.style.backgroundColor = ''; // Reset rightSide
    } else if (rightSide.contains(element)) {
        rightSide.style.backgroundColor = 'lightgreen'; // Simulate dragover for rightSide
        leftSide.style.backgroundColor = ''; // Reset leftSide
    } else {
        // Reset both sides if touch is not over them
        leftSide.style.backgroundColor = '';
        rightSide.style.backgroundColor = '';
    }
});

document.addEventListener('touchend', () => {
    // Reset colors when touch ends
    leftSide.style.backgroundColor = '';
    rightSide.style.backgroundColor = '';
});

// Add touch event listeners for leftSide
leftSide.addEventListener('touchstart', (e) => handleTouchStart(e, leftSide, 'lightblue'));
leftSide.addEventListener('touchend', (e) => handleTouchEnd(e, leftSide));

// Add touch event listeners for rightSide
rightSide.addEventListener('touchstart', (e) => handleTouchStart(e, rightSide, 'lightgreen'));
rightSide.addEventListener('touchend', (e) => handleTouchEnd(e, rightSide));