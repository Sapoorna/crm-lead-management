require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDatabase, getDb } = require('./database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

let db;

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token.' });
    }
    req.user = user;
    next();
  });
}

// ============ AUTH ENDPOINTS ============

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name }
  });
});

// ============ LEAD ENDPOINTS ============

app.get('/api/leads', authenticateToken, async (req, res) => {
  const leads = await db.all('SELECT * FROM leads ORDER BY updated_date DESC');
  res.json(leads);
});

app.get('/api/leads/:id', authenticateToken, async (req, res) => {
  const lead = await db.get('SELECT * FROM leads WHERE id = ?', [req.params.id]);
  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' });
  }
  res.json(lead);
});

app.post('/api/leads', authenticateToken, async (req, res) => {
  const { name, company, email, phone, source, salesperson, status, deal_value } = req.body;

  if (!name || !company || !email || !source || !salesperson || !status) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const now = new Date().toISOString();
  const result = await db.run(
    `INSERT INTO leads (name, company, email, phone, source, salesperson, status, deal_value, created_date, updated_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, company, email, phone, source, salesperson, status, deal_value || 0, now, now]
  );

  const newLead = await db.get('SELECT * FROM leads WHERE id = ?', [result.lastID]);
  res.status(201).json(newLead);
});

app.put('/api/leads/:id', authenticateToken, async (req, res) => {
  const { name, company, email, phone, source, salesperson, status, deal_value } = req.body;
  const now = new Date().toISOString();

  await db.run(
    `UPDATE leads 
     SET name = ?, company = ?, email = ?, phone = ?, source = ?, salesperson = ?, status = ?, deal_value = ?, updated_date = ?
     WHERE id = ?`,
    [name, company, email, phone, source, salesperson, status, deal_value || 0, now, req.params.id]
  );

  const updatedLead = await db.get('SELECT * FROM leads WHERE id = ?', [req.params.id]);
  res.json(updatedLead);
});

app.delete('/api/leads/:id', authenticateToken, async (req, res) => {
  await db.run('DELETE FROM leads WHERE id = ?', [req.params.id]);
  res.status(204).send();
});

// ============ NOTES ENDPOINTS ============

app.get('/api/leads/:leadId/notes', authenticateToken, async (req, res) => {
  const notes = await db.all(
    'SELECT * FROM notes WHERE lead_id = ? ORDER BY created_date DESC',
    [req.params.leadId]
  );
  res.json(notes);
});

app.post('/api/leads/:leadId/notes', authenticateToken, async (req, res) => {
  const { content } = req.body;
  const now = new Date().toISOString();

  const result = await db.run(
    'INSERT INTO notes (lead_id, content, created_by, created_date) VALUES (?, ?, ?, ?)',
    [req.params.leadId, content, req.user.name, now]
  );

  const newNote = await db.get('SELECT * FROM notes WHERE id = ?', [result.lastID]);
  res.status(201).json(newNote);
});

app.delete('/api/notes/:id', authenticateToken, async (req, res) => {
  await db.run('DELETE FROM notes WHERE id = ?', [req.params.id]);
  res.status(204).send();
});

// ============ DASHBOARD STATS ============

app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  const totalLeads = await db.get('SELECT COUNT(*) as count FROM leads');
  const newLeads = await db.get("SELECT COUNT(*) as count FROM leads WHERE status = 'New'");
  const qualifiedLeads = await db.get("SELECT COUNT(*) as count FROM leads WHERE status = 'Qualified'");
  const wonLeads = await db.get("SELECT COUNT(*) as count FROM leads WHERE status = 'Won'");
  const lostLeads = await db.get("SELECT COUNT(*) as count FROM leads WHERE status = 'Lost'");
  
  const totalDealValue = await db.get('SELECT SUM(deal_value) as total FROM leads');
  const wonDealValue = await db.get("SELECT SUM(deal_value) as total FROM leads WHERE status = 'Won'");

  res.json({
    totalLeads: totalLeads.count || 0,
    newLeads: newLeads.count || 0,
    qualifiedLeads: qualifiedLeads.count || 0,
    wonLeads: wonLeads.count || 0,
    lostLeads: lostLeads.count || 0,
    totalDealValue: totalDealValue.total || 0,
    wonDealValue: wonDealValue.total || 0
  });
});

app.get('/api/filter-options', authenticateToken, async (req, res) => {
  const statuses = await db.all('SELECT DISTINCT status FROM leads');
  const sources = await db.all('SELECT DISTINCT source FROM leads');
  const salespeople = await db.all('SELECT DISTINCT salesperson FROM leads');
  
  res.json({
    statuses: statuses.map(s => s.status).filter(Boolean),
    sources: sources.map(s => s.source).filter(Boolean),
    salespeople: salespeople.map(sp => sp.salesperson).filter(Boolean)
  });
});

// Start server
async function startServer() {
  db = await initDatabase();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();