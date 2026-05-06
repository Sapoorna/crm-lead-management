require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { initDatabase, User, Lead, Note } = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS - allow all origins for deployment
app.use(cors());
app.use(express.json());

// health check endpoints
app.get('/', (req, res) => {
  res.json({ message: 'CRM Backend is running!', status: 'ok' });
});

app.get('/api/health', (req, res) => {
  res.json({ message: 'API is working!', timestamp: new Date() });
});


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

// auth endpoint

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = jwt.sign(
    { id: user._id, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    token,
    user: { id: user._id, email: user.email, name: user.name }
  });
});

// lead endpoints

app.get('/api/leads', authenticateToken, async (req, res) => {
  const { status, source, salesperson, search } = req.query;
  let filter = {};
  
  if (status && status !== '') filter.status = status;
  if (source && source !== '') filter.source = source;
  if (salesperson && salesperson !== '') filter.salesperson = salesperson;
  
  if (search && search !== '') {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { company: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }
  
  const leads = await Lead.find(filter).sort({ updated_date: -1 });
  res.json(leads);
});

app.get('/api/leads/:id', authenticateToken, async (req, res) => {
  const lead = await Lead.findById(req.params.id);
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

  const lead = await Lead.create({
    name,
    company,
    email,
    phone,
    source,
    salesperson,
    status,
    deal_value: deal_value || 0,
    created_date: new Date(),
    updated_date: new Date()
  });

  res.status(201).json(lead);
});

app.put('/api/leads/:id', authenticateToken, async (req, res) => {
  const { name, company, email, phone, source, salesperson, status, deal_value } = req.body;

  const updatedLead = await Lead.findByIdAndUpdate(
    req.params.id,
    {
      name,
      company,
      email,
      phone,
      source,
      salesperson,
      status,
      deal_value: deal_value || 0,
      updated_date: new Date()
    },
    { new: true }
  );

  if (!updatedLead) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  res.json(updatedLead);
});

app.delete('/api/leads/:id', authenticateToken, async (req, res) => {
  const lead = await Lead.findByIdAndDelete(req.params.id);
  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' });
  }
  
  // Delete associated notes
  await Note.deleteMany({ lead_id: req.params.id });
  
  res.status(204).send();
});

// notes endpoints

app.get('/api/leads/:leadId/notes', authenticateToken, async (req, res) => {
  const notes = await Note.find({ lead_id: req.params.leadId }).sort({ created_date: -1 });
  res.json(notes);
});

app.post('/api/leads/:leadId/notes', authenticateToken, async (req, res) => {
  const { content } = req.body;

  const note = await Note.create({
    lead_id: req.params.leadId,
    content,
    created_by: req.user.name,
    created_date: new Date()
  });

  res.status(201).json(note);
});

app.delete('/api/notes/:id', authenticateToken, async (req, res) => {
  await Note.findByIdAndDelete(req.params.id);
  res.status(204).send();
});

// dashboard stats endpoint

app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  const totalLeads = await Lead.countDocuments();
  const newLeads = await Lead.countDocuments({ status: 'New' });
  const qualifiedLeads = await Lead.countDocuments({ status: 'Qualified' });
  const wonLeads = await Lead.countDocuments({ status: 'Won' });
  const lostLeads = await Lead.countDocuments({ status: 'Lost' });
  
  const totalDealValueResult = await Lead.aggregate([
    { $group: { _id: null, total: { $sum: '$deal_value' } } }
  ]);
  const totalDealValue = totalDealValueResult[0]?.total || 0;
  
  const wonDealValueResult = await Lead.aggregate([
    { $match: { status: 'Won' } },
    { $group: { _id: null, total: { $sum: '$deal_value' } } }
  ]);
  const wonDealValue = wonDealValueResult[0]?.total || 0;

  res.json({
    totalLeads,
    newLeads,
    qualifiedLeads,
    wonLeads,
    lostLeads,
    totalDealValue,
    wonDealValue
  });
});

app.get('/api/filter-options', authenticateToken, async (req, res) => {
  const statuses = await Lead.distinct('status');
  const sources = await Lead.distinct('source');
  const salespeople = await Lead.distinct('salesperson');
  
  res.json({
    statuses: statuses.filter(s => s),
    sources: sources.filter(s => s),
    salespeople: salespeople.filter(s => s)
  });
});

// Start server
async function startServer() {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();