const express = require('express');
const path = require('path');

const app = express();
const PORT = 8081;

// Serve static files from the MovementOfTermsExample directory
const staticPath = path.join(__dirname, 'MovementOfTermsExample');
app.use(express.static(staticPath));

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});