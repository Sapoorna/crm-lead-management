const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
const bcrypt = require('bcryptjs');

let db;

async function initDatabase() {
  db = await open({
    filename: path.join(__dirname, 'crm.db'),
    driver: sqlite3.Database
  });

  // Create tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      company TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      source TEXT NOT NULL,
      salesperson TEXT NOT NULL,
      status TEXT NOT NULL,
      deal_value INTEGER NOT NULL,
      created_date TEXT NOT NULL,
      updated_date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_date TEXT NOT NULL,
      FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
    );
  `);

  // Create test user if not exists
  const testUser = await db.get('SELECT * FROM users WHERE email = ?', ['admin@example.com']);
  if (!testUser) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    await db.run(
      'INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
      ['admin@example.com', hashedPassword, 'Admin User']
    );
    console.log('Test user created: admin@example.com / password123');
  }

  return db;
}

function getDb() {
  return db;
}

module.exports = { initDatabase, getDb };