#!/usr/bin/env node

const axios = require('axios');
const open = require('open');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const { argv } = yargs(hideBin(process.argv))
  .option('api-url', {
    alias: 'a',
    type: 'string',
    description: 'Backend API URL',
    default: '{{CLI_API_URL}}',
  })
  .option('frontend-url', {
    alias: 'f',
    type: 'string',
    description: 'Frontend URL',
    default: '{{CLI_FRONTEND_URL}}',
  })
  .option('poll-interval', {
    alias: 'p',
    type: 'number',
    description: 'Polling interval in milliseconds',
    default: () => parseInt('{{CLI_POLL_INTERVAL}}', 10) || 2000,
  })
  .option('max-attempts', {
    alias: 'm',
    type: 'number',
    description: 'Maximum poll attempts',
    default: () => parseInt('{{CLI_MAX_POLL_ATTEMPTS}}', 10) || 30,
  });

const CLI_API_URL = argv.apiUrl;
const CLI_FRONTEND_URL = argv.frontendUrl;
const CLI_POLL_INTERVAL = argv.pollInterval;
const CLI_MAX_POLL_ATTEMPTS = argv.maxAttempts;

async function checkVerificationStatus(sessionId) {
  try {
    const response = await axios.get(`${CLI_API_URL}/verify-status?session=${sessionId}`);
    return response.data.verified;
  } catch (error) {
    console.error('Error checking verification status:', error.message);
    return false;
  }
}

async function waitForVerification(sessionId) {
  let attempts = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (attempts >= CLI_MAX_POLL_ATTEMPTS) {
      return false;
    }
    const isVerified = await checkVerificationStatus(sessionId);
    if (isVerified) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, CLI_POLL_INTERVAL));
    attempts += 1;
  }
}

async function main() {
  console.log('Welcome to create-postgres CLI!');

  const sessionId = Math.random().toString(36).substring(7);
  const verificationUrl = `${CLI_FRONTEND_URL}/verify?session=${sessionId}`;
  console.log(`Please open this URL in your browser to verify:\n${verificationUrl}`);
  await open(verificationUrl);

  console.log('Waiting for verification...');
  const verified = await waitForVerification(sessionId);

  if (!verified) {
    console.log('Verification timed out. Please try again.');
    return;
  }

  console.log('Verification successful! Creating database...');
  try {
    const response = await axios.post(`${CLI_API_URL}/create-database`, { sessionId });
    const { dbName, username, password, url, resetTime } = response.data;

    console.log('\nYour database has been created!');
    console.log(`Database Name: ${dbName}`);
    console.log(`Username: ${username}`);
    console.log(`Password: ${password}`);
    console.log(`URL: ${url}`);
    console.log(`\nThis database will be reset at ${resetTime}`);
  } catch (error) {
    console.error('Failed to create database:', error.response?.data || error.message);
  }
}

main().catch(console.error);
