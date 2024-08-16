const express = require('express');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

const { createDatabase } = require('./database');
const { getDatabaseStats } = require('./stats');

const createDbLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1, // limit each IP to 1 request per windowMs
});

const administrationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 request per windowMs
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
    const { dbName, username, password, directConnectionUrl, pooledConnectionUrl } =
      await createDatabase();

    verifiedSessions.delete(sessionId);

    return res.json({
      dbName,
      username,
      password,
      directConnectionUrl,
      pooledConnectionUrl,
      resetTime: '00:00 UTC',
    });
  } catch (error) {
    console.error('Database creation failed:', error);
    return res.status(500).json({ error: 'Failed to create database' });
  }
});

app.get('/database-stats', administrationLimiter, async (_req, res) => {
  try {
    const stats = await getDatabaseStats();
    res.json(stats);
  } catch (error) {
    console.error('Failed to get database stats:', error);
    res.status(500).json({ error: 'Failed to get database stats' });
  }
});

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
