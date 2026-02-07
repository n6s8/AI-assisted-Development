// Main server file - Express setup and route definitions
// GitHub Copilot helps generate server configuration and middleware setup
require('dotenv').config();
const express = require('express');
const { initializeDatabase } = require('./database');
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  deleteOrder
} = require('./controllers');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
// POST /orders - Create a new order
app.post('/orders', createOrder);

// GET /orders - Get all orders with pagination and filtering
app.get('/orders', getOrders);

// GET /orders/:id - Get a single order by ID
app.get('/orders/:id', getOrderById);

// PUT /orders/:id - Update an order
app.put('/orders/:id', updateOrder);

// DELETE /orders/:id - Delete an order
app.delete('/orders/:id', deleteOrder);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// Initialize database and start server
const startServer = async () => {
  try {
    await initializeDatabase();
    
    const server = app.listen(PORT, () => {
      console.log(`\n🚀 Orders API Server running on port ${PORT}`);
      console.log(`📝 Health check: http://localhost:${PORT}/health`);
      console.log(`📦 Orders endpoint: http://localhost:${PORT}/orders\n`);
    });

    return server;
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start server if running directly
if (require.main === module) {
  startServer();
}

module.exports = app;
