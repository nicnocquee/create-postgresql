const fs = require('fs');
const path = require('path');

// Load environment variables
// eslint-disable-next-line import/no-extraneous-dependencies
require('dotenv').config();

// Original file to process
const originalFilePath = path.join(__dirname, 'index.js');
const fileContent = fs.readFileSync(originalFilePath, 'utf8');

// Define the path for the new file
const newFilePath = path.join(__dirname, 'index.prod.js');

// Replace placeholders with environment variable values
const modifiedContent = fileContent
  .replace('{{CLI_API_URL}}', process.env.CLI_API_URL || 'http://localhost:3000')
  .replace('{{CLI_FRONTEND_URL}}', process.env.CLI_FRONTEND_URL || 'http://localhost')
  .replace('{{CLI_POLL_INTERVAL}}', process.env.CLI_POLL_INTERVAL || '2000')
  .replace('{{CLI_MAX_POLL_ATTEMPTS}}', process.env.CLI_MAX_POLL_ATTEMPTS || '30');

// Write the modified content to the new file
fs.writeFileSync(newFilePath, modifiedContent, 'utf8');
