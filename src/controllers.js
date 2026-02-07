// Orders controller - handles all order-related business logic
// GitHub Copilot would generate these functions based on comments
const { db } = require('./database');

/**
 * Create a new order
 * Validates input and inserts into database
 */
const createOrder = (req, res) => {
  const { customer_name, product, quantity, amount, status, order_date } = req.body;

  // Validate required fields
  if (!customer_name || !product || !quantity || !amount || !status || !order_date) {
    return res.status(400).json({ 
      error: 'Missing required fields',
      required: ['customer_name', 'product', 'quantity', 'amount', 'status', 'order_date']
    });
  }

  // Validate status
  const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ 
      error: 'Invalid status',
      validStatuses
    });
  }

  // Validate quantity and amount
  if (quantity <= 0 || amount <= 0) {
    return res.status(400).json({ 
      error: 'Quantity and amount must be positive numbers'
    });
  }

  // Insert order into database
  const sql = `INSERT INTO orders (customer_name, product, quantity, amount, status, order_date) 
               VALUES (?, ?, ?, ?, ?, ?)`;

  db.run(sql, [customer_name, product, quantity, amount, status, order_date], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error', details: err.message });
    }

    // Return created order with ID
    res.status(201).json({
      id: this.lastID,
      customer_name,
      product,
      quantity,
      amount,
      status,
      order_date,
      message: 'Order created successfully'
    });
  });
};

/**
 * Get all orders with pagination and filtering
 * Supports: page, limit, status, minAmount, maxAmount, startDate, endDate
 */
const getOrders = (req, res) => {
  // Parse pagination parameters
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  // Validate pagination parameters
  if (page < 1 || limit < 1 || limit > 100) {
    return res.status(400).json({ 
      error: 'Invalid pagination parameters',
      constraints: 'page >= 1, 1 <= limit <= 100'
    });
  }

  // Build WHERE clause based on filters
  const filters = [];
  const params = [];

  // Filter by status
  if (req.query.status) {
    const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];
    if (!validStatuses.includes(req.query.status)) {
      return res.status(400).json({ 
        error: 'Invalid status filter',
        validStatuses
      });
    }
    filters.push('status = ?');
    params.push(req.query.status);
  }

  // Filter by minimum amount
  if (req.query.minAmount) {
    const minAmount = parseFloat(req.query.minAmount);
    if (isNaN(minAmount) || minAmount < 0) {
      return res.status(400).json({ error: 'Invalid minAmount parameter' });
    }
    filters.push('amount >= ?');
    params.push(minAmount);
  }

  // Filter by maximum amount
  if (req.query.maxAmount) {
    const maxAmount = parseFloat(req.query.maxAmount);
    if (isNaN(maxAmount) || maxAmount < 0) {
      return res.status(400).json({ error: 'Invalid maxAmount parameter' });
    }
    filters.push('amount <= ?');
    params.push(maxAmount);
  }

  // Filter by date range - start date
  if (req.query.startDate) {
    filters.push('order_date >= ?');
    params.push(req.query.startDate);
  }

  // Filter by date range - end date
  if (req.query.endDate) {
    filters.push('order_date <= ?');
    params.push(req.query.endDate);
  }

  const whereClause = filters.length > 0 ? 'WHERE ' + filters.join(' AND ') : '';

  // Get total count for pagination metadata
  const countSql = `SELECT COUNT(*) as total FROM orders ${whereClause}`;
  
  db.get(countSql, params, (err, countResult) => {
    if (err) {
      return res.status(500).json({ error: 'Database error', details: err.message });
    }

    const totalOrders = countResult.total;
    const totalPages = Math.ceil(totalOrders / limit);

    // Get paginated orders
    const dataSql = `SELECT * FROM orders ${whereClause} ORDER BY order_date DESC, id DESC LIMIT ? OFFSET ?`;
    const dataParams = [...params, limit, offset];

    db.all(dataSql, dataParams, (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error', details: err.message });
      }

      // Return paginated response
      res.json({
        data: rows,
        pagination: {
          page,
          limit,
          totalOrders,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      });
    });
  });
};

/**
 * Get a single order by ID
 */
const getOrderById = (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return res.status(400).json({ error: 'Invalid order ID' });
  }

  const sql = 'SELECT * FROM orders WHERE id = ?';

  db.get(sql, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error', details: err.message });
    }

    if (!row) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(row);
  });
};

/**
 * Update an order by ID
 */
const updateOrder = (req, res) => {
  const { id } = req.params;
  const { customer_name, product, quantity, amount, status, order_date } = req.body;

  if (!id || isNaN(id)) {
    return res.status(400).json({ error: 'Invalid order ID' });
  }

  // Validate status if provided
  if (status) {
    const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status',
        validStatuses
      });
    }
  }

  // Validate quantity and amount if provided
  if ((quantity !== undefined && quantity <= 0) || (amount !== undefined && amount <= 0)) {
    return res.status(400).json({ 
      error: 'Quantity and amount must be positive numbers'
    });
  }

  // Build update query dynamically
  const updates = [];
  const params = [];

  if (customer_name) { updates.push('customer_name = ?'); params.push(customer_name); }
  if (product) { updates.push('product = ?'); params.push(product); }
  if (quantity) { updates.push('quantity = ?'); params.push(quantity); }
  if (amount) { updates.push('amount = ?'); params.push(amount); }
  if (status) { updates.push('status = ?'); params.push(status); }
  if (order_date) { updates.push('order_date = ?'); params.push(order_date); }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  params.push(id);
  const sql = `UPDATE orders SET ${updates.join(', ')} WHERE id = ?`;

  db.run(sql, params, function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error', details: err.message });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ message: 'Order updated successfully', id });
  });
};

/**
 * Delete an order by ID
 */
const deleteOrder = (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return res.status(400).json({ error: 'Invalid order ID' });
  }

  const sql = 'DELETE FROM orders WHERE id = ?';

  db.run(sql, [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error', details: err.message });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ message: 'Order deleted successfully', id });
  });
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  deleteOrder
};
