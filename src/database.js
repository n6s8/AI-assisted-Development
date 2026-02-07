// Database configuration and initialization
// This module sets up SQLite database connection and creates orders table
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../database/orders.db');

// Create and configure database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Initialize database schema
const initializeDatabase = () => {
  return new Promise((resolve, reject) => {
    db.run(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_name TEXT NOT NULL,
        product TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('pending', 'processing', 'completed', 'cancelled')),
        order_date TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        reject(err);
      } else {
        console.log('Orders table initialized');
        resolve();
      }
    });
  });
};

module.exports = {
  db,
  initializeDatabase
};
