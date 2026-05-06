const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true }
});

// Lead Schema
const leadSchema = new mongoose.Schema({
  name: { type: String, required: true },
  company: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  source: { type: String, required: true },
  salesperson: { type: String, required: true },
  status: { type: String, required: true, enum: ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost'] },
  deal_value: { type: Number, required: true, default: 0 },
  created_date: { type: Date, default: Date.now },
  updated_date: { type: Date, default: Date.now }
});

// Note Schema
const noteSchema = new mongoose.Schema({
  lead_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },
  content: { type: String, required: true },
  created_by: { type: String, required: true },
  created_date: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Lead = mongoose.model('Lead', leadSchema);
const Note = mongoose.model('Note', noteSchema);

let connection = null;

async function initDatabase() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI not defined in .env file');
    }
    
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Create test user if not exists
    const testUser = await User.findOne({ email: 'admin@example.com' });
    if (!testUser) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      await User.create({
        email: 'admin@example.com',
        password: hashedPassword,
        name: 'Admin User'
      });
      console.log('Test user created: admin@example.com / password123');
    }
    
    return mongoose.connection;
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

function getDb() {
  return mongoose.connection;
}

module.exports = { initDatabase, getDb, User, Lead, Note };