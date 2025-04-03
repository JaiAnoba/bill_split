const express = require('express');
const cors = require('cors');
const fs = require('fs');
const os = require('os');
const path = require('path');
const app = express();

app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Enable JSON parsing for POST requests

// Handle POST request to /tempo/auth
app.post('/tempo/auth', (req, res) => {
  const userId = req.body.userId;
  const authToken = req.headers.authorization.split(' ')[1];

  // Replace '|' with '%7C' in userId
  const formattedUserId = userId.replace(/\|/g, '%7C');

  // Write credentials to a file in the home directory
  const homeDir = os.homedir();
  const credentialsDir = path.join(homeDir, '.tempo');
  const credentialsPath = path.join(credentialsDir, 'credentials.txt');

  // Ensure the .tempo directory exists
  if (!fs.existsSync(credentialsDir)) {
    fs.mkdirSync(credentialsDir);
  }

  // Write credentials to a file
  const credentials = { userId: formattedUserId, authToken };
  fs.writeFileSync(credentialsPath, JSON.stringify(credentials));

  res.send('Credentials received');
});

// Start the server
const PORT = 2994;
app.listen(PORT, () => {});
