// Seed script - Populate database with 50 sample orders
// GitHub Copilot can generate realistic test data based on comments
require('dotenv').config();
const { db, initializeDatabase } = require('./database');

// Sample data generators
const customers = [
  'John Smith', 'Emma Johnson', 'Michael Brown', 'Sarah Davis', 'David Wilson',
  'Lisa Anderson', 'James Taylor', 'Jennifer Martinez', 'Robert Garcia', 'Mary Rodriguez',
  'William Lee', 'Patricia White', 'Richard Harris', 'Linda Clark', 'Joseph Lewis',
  'Barbara Walker', 'Thomas Hall', 'Elizabeth Allen', 'Charles Young', 'Susan King'
];

const products = [
  'Laptop Pro 15"', 'Wireless Mouse', 'Mechanical Keyboard', 'USB-C Hub', '4K Monitor',
  'Ergonomic Chair', 'Standing Desk', 'Noise Cancelling Headphones', 'Webcam HD',
  'External SSD 1TB', 'Graphics Tablet', 'Desk Lamp LED', 'Cable Organizer',
  'Monitor Arm', 'Laptop Stand', 'Wireless Charger', 'Smartphone', 'Tablet 10"',
  'Smart Watch', 'Bluetooth Speaker', 'Power Bank', 'Phone Case', 'Screen Protector',
  'Memory Card 128GB', 'HDMI Cable'
];

const statuses = ['pending', 'processing', 'completed', 'cancelled'];

// Generate random date within last 6 months
const randomDate = () => {
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - 6);
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString().split('T')[0];
};

// Generate random order
const generateOrder = () => {
  const quantity = Math.floor(Math.random() * 10) + 1;
  const basePrice = Math.floor(Math.random() * 1000) + 50;
  const amount = (basePrice * quantity).toFixed(2);
  
  return {
    customer_name: customers[Math.floor(Math.random() * customers.length)],
    product: products[Math.floor(Math.random() * products.length)],
    quantity,
    amount,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    order_date: randomDate()
  };
};

// Seed database with orders
const seedDatabase = async () => {
  try {
    // Initialize database
    await initializeDatabase();

    // Clear existing orders
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM orders', (err) => {
        if (err) reject(err);
        else {
          console.log('Cleared existing orders');
          resolve();
        }
      });
    });

    // Insert 50 sample orders
    console.log('Generating 50 sample orders...');
    const orders = Array.from({ length: 50 }, generateOrder);

    const insertPromises = orders.map((order, index) => {
      return new Promise((resolve, reject) => {
        const sql = `INSERT INTO orders (customer_name, product, quantity, amount, status, order_date) 
                     VALUES (?, ?, ?, ?, ?, ?)`;
        
        db.run(
          sql,
          [order.customer_name, order.product, order.quantity, order.amount, order.status, order.order_date],
          function(err) {
            if (err) {
              reject(err);
            } else {
              console.log(`Inserted order ${index + 1}/50 - ID: ${this.lastID}`);
              resolve();
            }
          }
        );
      });
    });

    await Promise.all(insertPromises);

    console.log('\n✅ Database seeded successfully with 50 orders!');
    
    // Show summary statistics
    db.get('SELECT COUNT(*) as total FROM orders', (err, row) => {
      if (!err) {
        console.log(`📊 Total orders in database: ${row.total}`);
      }
    });

    db.all('SELECT status, COUNT(*) as count FROM orders GROUP BY status', (err, rows) => {
      if (!err) {
        console.log('\n📈 Orders by status:');
        rows.forEach(row => {
          console.log(`   ${row.status}: ${row.count}`);
        });
      }
      
      // Close database connection
      db.close((err) => {
        if (err) {
          console.error('Error closing database:', err.message);
        } else {
          console.log('\n✨ Database connection closed');
        }
      });
    });

  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run seed if executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
