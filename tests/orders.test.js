// Comprehensive test suite for Orders API
// GitHub Copilot generates test cases based on endpoint descriptions
const request = require('supertest');
const app = require('../src/server');
const { db, initializeDatabase } = require('../src/database');

// Setup and teardown
beforeAll(async () => {
  await initializeDatabase();
});

afterAll((done) => {
  db.close(done);
});

beforeEach((done) => {
  // Clear orders table before each test
  db.run('DELETE FROM orders', done);
});

describe('Orders API Tests', () => {

  // Test 1: Health check endpoint
  describe('GET /health', () => {
    test('should return health status', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 'OK');
      expect(res.body).toHaveProperty('timestamp');
    });
  });

  // Tests 2-5: POST /orders - Create order
  describe('POST /orders', () => {

    test('should create a new order with valid data', async () => {
      const newOrder = {
        customer_name: 'John Doe',
        product: 'Laptop',
        quantity: 2,
        amount: 1999.99,
        status: 'pending',
        order_date: '2026-02-01'
      };

      const res = await request(app)
        .post('/orders')
        .send(newOrder);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.customer_name).toBe(newOrder.customer_name);
      expect(res.body.product).toBe(newOrder.product);
      expect(res.body.message).toBe('Order created successfully');
    });

    test('should reject order with missing required fields', async () => {
      const invalidOrder = {
        customer_name: 'Jane Doe',
        product: 'Mouse'
        // Missing quantity, amount, status, order_date
      };

      const res = await request(app)
        .post('/orders')
        .send(invalidOrder);

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error', 'Missing required fields');
    });

    test('should reject order with invalid status', async () => {
      const invalidOrder = {
        customer_name: 'John Doe',
        product: 'Keyboard',
        quantity: 1,
        amount: 99.99,
        status: 'invalid_status',
        order_date: '2026-02-01'
      };

      const res = await request(app)
        .post('/orders')
        .send(invalidOrder);

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Invalid status');
    });

    test('should reject order with negative quantity', async () => {
      const invalidOrder = {
        customer_name: 'John Doe',
        product: 'Monitor',
        quantity: -5,
        amount: 299.99,
        status: 'pending',
        order_date: '2026-02-01'
      };

      const res = await request(app)
        .post('/orders')
        .send(invalidOrder);

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain('positive numbers');
    });
  });

  // Tests 6-10: GET /orders - Pagination and filtering
  describe('GET /orders - Pagination', () => {

    beforeEach(async () => {
      // Create 25 test orders
      const orders = Array.from({ length: 25 }, (_, i) => ({
        customer_name: `Customer ${i + 1}`,
        product: `Product ${i + 1}`,
        quantity: i + 1,
        amount: (i + 1) * 100,
        status: ['pending', 'processing', 'completed'][i % 3],
        order_date: `2026-02-${String(i + 1).padStart(2, '0')}`
      }));

      for (const order of orders) {
        await new Promise((resolve) => {
          db.run(
            'INSERT INTO orders (customer_name, product, quantity, amount, status, order_date) VALUES (?, ?, ?, ?, ?, ?)',
            [order.customer_name, order.product, order.quantity, order.amount, order.status, order.order_date],
            resolve
          );
        });
      }
    });

    test('should return paginated orders with default pagination', async () => {
      const res = await request(app).get('/orders');

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('pagination');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeLessThanOrEqual(10);
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(10);
    });

    test('should return correct page with custom pagination', async () => {
      const res = await request(app).get('/orders?page=2&limit=5');

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBeLessThanOrEqual(5);
      expect(res.body.pagination.page).toBe(2);
      expect(res.body.pagination.limit).toBe(5);
    });

    test('should reject invalid pagination parameters', async () => {
      const res = await request(app).get('/orders?page=0&limit=200');

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain('Invalid pagination parameters');
    });

    test('should include pagination metadata', async () => {
      const res = await request(app).get('/orders?limit=10');

      expect(res.statusCode).toBe(200);
      expect(res.body.pagination).toHaveProperty('totalOrders');
      expect(res.body.pagination).toHaveProperty('totalPages');
      expect(res.body.pagination).toHaveProperty('hasNextPage');
      expect(res.body.pagination).toHaveProperty('hasPreviousPage');
    });
  });

  // Tests 11-13: GET /orders - Filtering
  describe('GET /orders - Filtering', () => {

    beforeEach(async () => {
      const testOrders = [
        { customer_name: 'Alice', product: 'Laptop', quantity: 1, amount: 1500, status: 'completed', order_date: '2026-01-15' },
        { customer_name: 'Bob', product: 'Mouse', quantity: 2, amount: 50, status: 'pending', order_date: '2026-01-20' },
        { customer_name: 'Charlie', product: 'Keyboard', quantity: 1, amount: 120, status: 'processing', order_date: '2026-02-01' },
        { customer_name: 'Diana', product: 'Monitor', quantity: 3, amount: 900, status: 'completed', order_date: '2026-02-05' }
      ];

      for (const order of testOrders) {
        await new Promise((resolve) => {
          db.run(
            'INSERT INTO orders (customer_name, product, quantity, amount, status, order_date) VALUES (?, ?, ?, ?, ?, ?)',
            [order.customer_name, order.product, order.quantity, order.amount, order.status, order.order_date],
            resolve
          );
        });
      }
    });

    test('should filter orders by status', async () => {
      const res = await request(app).get('/orders?status=completed');

      expect(res.statusCode).toBe(200);
      expect(res.body.data.every(order => order.status === 'completed')).toBe(true);
      expect(res.body.data.length).toBe(2);
    });

    test('should filter orders by amount range', async () => {
      const res = await request(app).get('/orders?minAmount=100&maxAmount=1000');

      expect(res.statusCode).toBe(200);
      res.body.data.forEach(order => {
        expect(order.amount).toBeGreaterThanOrEqual(100);
        expect(order.amount).toBeLessThanOrEqual(1000);
      });
    });

    test('should filter orders by date range', async () => {
      const res = await request(app).get('/orders?startDate=2026-02-01&endDate=2026-02-28');

      expect(res.statusCode).toBe(200);
      res.body.data.forEach(order => {
        expect(order.order_date >= '2026-02-01').toBe(true);
        expect(order.order_date <= '2026-02-28').toBe(true);
      });
    });

    test('should reject invalid status filter', async () => {
      const res = await request(app).get('/orders?status=invalid');

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Invalid status filter');
    });
  });

  // Test 14: GET /orders/:id
  describe('GET /orders/:id', () => {

    test('should get order by ID', async () => {
      // Create test order first
      const createRes = await request(app)
        .post('/orders')
        .send({
          customer_name: 'Test User',
          product: 'Test Product',
          quantity: 1,
          amount: 100,
          status: 'pending',
          order_date: '2026-02-01'
        });

      const orderId = createRes.body.id;
      const res = await request(app).get(`/orders/${orderId}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.id).toBe(orderId);
      expect(res.body.customer_name).toBe('Test User');
    });

    test('should return 404 for non-existent order', async () => {
      const res = await request(app).get('/orders/99999');

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('Order not found');
    });
  });

  // Test 15: PUT /orders/:id
  describe('PUT /orders/:id', () => {

    test('should update order successfully', async () => {
      // Create test order
      const createRes = await request(app)
        .post('/orders')
        .send({
          customer_name: 'Old Name',
          product: 'Old Product',
          quantity: 1,
          amount: 100,
          status: 'pending',
          order_date: '2026-02-01'
        });

      const orderId = createRes.body.id;

      // Update order
      const updateRes = await request(app)
        .put(`/orders/${orderId}`)
        .send({
          customer_name: 'New Name',
          status: 'completed'
        });

      expect(updateRes.statusCode).toBe(200);
      expect(updateRes.body.message).toBe('Order updated successfully');

      // Verify update
      const getRes = await request(app).get(`/orders/${orderId}`);
      expect(getRes.body.customer_name).toBe('New Name');
      expect(getRes.body.status).toBe('completed');
    });

    test('should return 404 when updating non-existent order', async () => {
      const res = await request(app)
        .put('/orders/99999')
        .send({ status: 'completed' });

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('Order not found');
    });
  });

  // Test 16: DELETE /orders/:id
  describe('DELETE /orders/:id', () => {

    test('should delete order successfully', async () => {
      // Create test order
      const createRes = await request(app)
        .post('/orders')
        .send({
          customer_name: 'To Delete',
          product: 'Product',
          quantity: 1,
          amount: 100,
          status: 'pending',
          order_date: '2026-02-01'
        });

      const orderId = createRes.body.id;

      // Delete order
      const deleteRes = await request(app).delete(`/orders/${orderId}`);
      expect(deleteRes.statusCode).toBe(200);
      expect(deleteRes.body.message).toBe('Order deleted successfully');

      // Verify deletion
      const getRes = await request(app).get(`/orders/${orderId}`);
      expect(getRes.statusCode).toBe(404);
    });

    test('should return 404 when deleting non-existent order', async () => {
      const res = await request(app).delete('/orders/99999');

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('Order not found');
    });
  });

  // Test 17: Edge case - Empty database
  describe('Edge Cases', () => {

    test('should handle empty database gracefully', async () => {
      const res = await request(app).get('/orders');

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toEqual([]);
      expect(res.body.pagination.totalOrders).toBe(0);
    });

    test('should handle combined filters correctly', async () => {
      // Create test data
      await request(app).post('/orders').send({
        customer_name: 'Test', product: 'Product', quantity: 1,
        amount: 500, status: 'completed', order_date: '2026-02-01'
      });

      const res = await request(app).get('/orders?status=completed&minAmount=400&maxAmount=600');

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    test('should handle invalid order ID format', async () => {
      const res = await request(app).get('/orders/invalid-id');

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Invalid order ID');
    });
  });

});
