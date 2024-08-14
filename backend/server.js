const express = require('express');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

const { createDatabase, getDatabaseSize } = require('./database');

const createDbLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
});

const app = express();

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());

const verifiedSessions = new Set();

app.get('/verify-status', (req, res) => {
  const { session } = req.query;
  if (verifiedSessions.has(session)) {
    res.json({ verified: true });
  } else {
    res.json({ verified: false });
  }
});

app.post('/verify', async (req, res) => {
  const { recaptchaToken, session } = req.body;

  const verificationURL = 'https://www.google.com/recaptcha/api/siteverify';

  try {
    const recaptchaVerification = await axios.post(verificationURL, null, {
      params: {
        secret: process.env.BACKEND_RECAPTCHA_SECRET_KEY,
        response: recaptchaToken,
      },
    });

    if (recaptchaVerification.data.success && recaptchaVerification.data.score > 0.5) {
      verifiedSessions.add(session);
      res.sendStatus(200);
    } else {
      res.status(400).json({ error: 'reCAPTCHA verification failed' });
    }
  } catch (error) {
    console.error('reCAPTCHA verification failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/create-database', createDbLimiter, async (req, res) => {
  const { sessionId } = req.body;

  if (!verifiedSessions.has(sessionId)) {
    return res.status(403).json({ error: 'Session not verified' });
  }

  try {
    const { dbName, username, password, connectionUrl } = await createDatabase();

    verifiedSessions.delete(sessionId);

    return res.json({
      dbName,
      username,
      password,
      url: connectionUrl,
      resetTime: '00:00 UTC',
    });
  } catch (error) {
    console.error('Database creation failed:', error);
    return res.status(500).json({ error: 'Failed to create database' });
  }
});

app.get('/database-size', async (req, res) => {
  const { dbName, username, password } = req.query;
  try {
    const size = await getDatabaseSize(dbName, username, password);
    res.json({ size });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get database size' });
  }
});

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.get('/health2', (req, res) => {
  res.status(200).send('OK 2');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
