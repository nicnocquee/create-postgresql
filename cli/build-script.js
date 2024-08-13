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
  .replace('{{API_URL}}', process.env.API_URL || 'http://localhost:3000')
  .replace('{{FRONTEND_URL}}', process.env.FRONTEND_URL || 'http://localhost')
  .replace('{{POLL_INTERVAL}}', process.env.POLL_INTERVAL || '2000')
  .replace('{{MAX_POLL_ATTEMPTS}}', process.env.MAX_POLL_ATTEMPTS || '30');

// Write the modified content to the new file
fs.writeFileSync(newFilePath, modifiedContent, 'utf8');
