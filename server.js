const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = 3850;
const SESSIONS_FILE = path.join(__dirname, 'sessions.json');
const STATE_FILE = path.join(__dirname, 'state.json');

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch (e) {
    return { weeklyLimit: 100 };
  }
}

function saveState(data) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(data, null, 2));
}

app.use(express.json());
app.use(express.static(__dirname));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

function loadSessions() {
  try {
    return JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf8'));
  } catch (e) {
    return { sessions: [] };
  }
}

function saveSessions(data) {
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify(data, null, 2));
}

// GET all sessions (newest first)
app.get('/api/sessions', (req, res) => {
  const data = loadSessions();
  const sorted = data.sessions.sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
  res.json(sorted);
});

// POST new session
app.post('/api/sessions', (req, res) => {
  const data = loadSessions();
  const session = {
    id: crypto.randomUUID(),
    label: req.body.label || 'unnamed',
    task: req.body.task || '',
    model: req.body.model || 'unknown',
    totalTokens: req.body.totalTokens || 0,
    status: req.body.status || 'active',
    startedAt: new Date().toISOString(),
    completedAt: null
  };
  data.sessions.push(session);
  saveSessions(data);
  res.json(session);
});

// PUT update session
app.put('/api/sessions/:id', (req, res) => {
  const data = loadSessions();
  const idx = data.sessions.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  
  Object.assign(data.sessions[idx], req.body);
  if (req.body.status === 'completed' && !data.sessions[idx].completedAt) {
    data.sessions[idx].completedAt = new Date().toISOString();
  }
  
  saveSessions(data);
  res.json(data.sessions[idx]);
});

// DELETE session
app.delete('/api/sessions/:id', (req, res) => {
  const data = loadSessions();
  const idx = data.sessions.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  
  data.sessions.splice(idx, 1);
  saveSessions(data);
  res.json({ ok: true });
});

// Stats endpoint
app.get('/api/stats', (req, res) => {
  const data = loadSessions();
  const state = loadState();
  const today = new Date().toDateString();
  const todaySessions = data.sessions.filter(s => new Date(s.startedAt).toDateString() === today);
  
  res.json({
    total: data.sessions.length,
    active: data.sessions.filter(s => s.status === 'active').length,
    completed: data.sessions.filter(s => s.status === 'completed').length,
    totalTokens: data.sessions.reduce((sum, s) => sum + (s.totalTokens || 0), 0),
    todayCount: todaySessions.length,
    todayTokens: todaySessions.reduce((sum, s) => sum + (s.totalTokens || 0), 0),
    weeklyLimit: state.weeklyLimit
  });
});

// GET/PUT weekly limit
app.get('/api/weekly', (req, res) => {
  const state = loadState();
  res.json({ weeklyLimit: state.weeklyLimit });
});

app.put('/api/weekly', (req, res) => {
  const state = loadState();
  state.weeklyLimit = req.body.weeklyLimit ?? state.weeklyLimit;
  state.updatedAt = new Date().toISOString();
  saveState(state);
  res.json(state);
});

app.listen(PORT, () => {
  console.log(`Session Tracker running at http://localhost:${PORT}`);
});
