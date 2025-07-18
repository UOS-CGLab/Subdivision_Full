const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Serve static files from the current directory
app.use(express.static(path.join(__dirname)));
// app.use(express.json({ limit: '5gb' }));
// app.use(express.urlencoded({ limit: '1gb', extended: true }));

// Default route to serve an index.html file if it exists in the current directory
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
