const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all origins (allows direct file:/// access or custom local ports)
app.use(cors());
app.use(express.json());

// Serve static frontend files (HTML, CSS, JS, assets)
app.use(express.static(__dirname));

// Health / Connection status check
app.get('/api/status', async (req, res) => {
  try {
    const [rows] = await db.pool.query('SELECT 1 + 1 AS ok');
    res.json({
      status: 'ok',
      connected: true,
      database: db.dbConfig.database,
      host: db.dbConfig.host,
      user: db.dbConfig.user
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      connected: false,
      error: err.message
    });
  }
});

// Get full state from MySQL
app.get('/api/state', async (req, res) => {
  try {
    const state = await db.getFullState();
    res.json({ success: true, state });
  } catch (err) {
    console.error('Error fetching state from MySQL:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Register new patient
app.post('/api/patients', async (req, res) => {
  try {
    const { name, age, phone } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const patient = await db.addPatient({ name, age: Number(age) || null, phone });
    res.json({ success: true, patient });
  } catch (err) {
    console.error('Error adding patient:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Book appointment
app.post('/api/appointments', async (req, res) => {
  try {
    const { patient, doctor, date, time, reason, status } = req.body;
    if (!patient || !doctor || !date || !time) {
      return res.status(400).json({ error: 'patient, doctor, date, and time are required' });
    }
    const appt = await db.addAppointment({ patient, doctor, date, time, reason, status });
    res.json({ success: true, appointment: appt });
  } catch (err) {
    console.error('Error booking appointment:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update appointment (e.g. Cancelled, Completed)
app.patch('/api/appointments/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.updateAppointment(id, req.body);
    res.json({ success: true, id, updated: req.body });
  } catch (err) {
    console.error('Error updating appointment:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Add queue walk-in token
app.post('/api/queue', async (req, res) => {
  try {
    const { doctor, name, token, status, date } = req.body;
    if (!doctor || !name || !token) {
      return res.status(400).json({ error: 'doctor, name, and token are required' });
    }
    const tokenRecord = await db.addQueueToken({ doctor, name, token, status, date });
    res.json({ success: true, queueToken: tokenRecord });
  } catch (err) {
    console.error('Error adding queue token:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update queue token status (In Progress, Completed, Skipped)
app.patch('/api/queue/:token', async (req, res) => {
  try {
    const token = req.params.token;
    await db.updateQueueToken(token, req.body);
    res.json({ success: true, token, updated: req.body });
  } catch (err) {
    console.error('Error updating queue token:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update doctor (availability, daily slots)
app.patch('/api/doctors/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.updateDoctor(id, req.body);
    res.json({ success: true, id, updated: req.body });
  } catch (err) {
    console.error('Error updating doctor:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Save settings
app.post('/api/settings', async (req, res) => {
  try {
    await db.saveSettings(req.body);
    res.json({ success: true, settings: req.body });
  } catch (err) {
    console.error('Error saving settings:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Reset database to demo data
app.post('/api/reset', async (req, res) => {
  try {
    await db.seedDatabase();
    const state = await db.getFullState();
    res.json({ success: true, message: 'Database reset to demo state', state });
  } catch (err) {
    console.error('Error resetting database:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Start server
async function start() {
  try {
    console.log('Connecting to MySQL database "caresyncjava"...');
    await db.initDatabase();
    console.log('✓ Database connection and schema verified.');

    app.listen(PORT, () => {
      console.log(`\n======================================================`);
      console.log(`  CareSync Server running at: http://localhost:${PORT}`);
      console.log(`  Database connected: caresyncjava (root@localhost)`);
      console.log(`  Open http://localhost:${PORT}/index.html in your browser`);
      console.log(`======================================================\n`);
    });
  } catch (err) {
    console.error('Failed to initialize database or start server:', err);
    process.exit(1);
  }
}

start();
