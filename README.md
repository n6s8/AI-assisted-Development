# Orders Management API

A RESTful API for managing orders with pagination, filtering, and full CRUD operations. Built with Node.js, Express, and SQLite, developed using GitHub Copilot for accelerated development.

## 🚀 Features

- ✅ Complete CRUD operations for orders
- ✅ Pagination support (page, limit)
- ✅ Advanced filtering (status, amount range, date range)
- ✅ Input validation and error handling
- ✅ SQLite database with automatic initialization
- ✅ Comprehensive test suite (80%+ coverage)
- ✅ Seed script with 50 sample orders
- ✅ RESTful API design

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd orders-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   PORT=3000
   NODE_ENV=development
   DB_PATH=./database/orders.db
   ```

4. **Initialize and seed the database**
   ```bash
   npm run seed
   ```

5. **Start the server**
   ```bash
   npm start
   ```

   For development with auto-reload:
   ```bash
   npm run dev
   ```

## 📡 API Endpoints

### Base URL
```
http://localhost:3000
```

### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2026-02-07T10:30:00.000Z"
}
```

---

### Create Order
```http
POST /orders
```

**Request Body:**
```json
{
  "customer_name": "John Doe",
  "product": "Laptop Pro 15\"",
  "quantity": 2,
  "amount": 2999.98,
  "status": "pending",
  "order_date": "2026-02-07"
}
```

**Valid Status Values:** `pending`, `processing`, `completed`, `cancelled`

**Response (201 Created):**
```json
{
  "id": 1,
  "customer_name": "John Doe",
  "product": "Laptop Pro 15\"",
  "quantity": 2,
  "amount": 2999.98,
  "status": "pending",
  "order_date": "2026-02-07",
  "message": "Order created successfully"
}
```

---

### Get All Orders (with Pagination & Filtering)
```http
GET /orders?page=1&limit=10&status=completed&minAmount=100&maxAmount=5000&startDate=2026-01-01&endDate=2026-02-28
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number (≥1) |
| `limit` | integer | 10 | Items per page (1-100) |
| `status` | string | - | Filter by order status |
| `minAmount` | decimal | - | Minimum order amount |
| `maxAmount` | decimal | - | Maximum order amount |
| `startDate` | string | - | Start date (YYYY-MM-DD) |
| `endDate` | string | - | End date (YYYY-MM-DD) |

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "customer_name": "John Doe",
      "product": "Laptop Pro 15\"",
      "quantity": 2,
      "amount": 2999.98,
      "status": "completed",
      "order_date": "2026-02-07",
      "created_at": "2026-02-07 10:30:00"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalOrders": 50,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

---

### Get Order by ID
```http
GET /orders/:id
```

**Response (200 OK):**
```json
{
  "id": 1,
  "customer_name": "John Doe",
  "product": "Laptop Pro 15\"",
  "quantity": 2,
  "amount": 2999.98,
  "status": "completed",
  "order_date": "2026-02-07",
  "created_at": "2026-02-07 10:30:00"
}
```

---

### Update Order
```http
PUT /orders/:id
```

**Request Body (all fields optional):**
```json
{
  "customer_name": "Jane Doe",
  "status": "completed",
  "amount": 3499.99
}
```

**Response (200 OK):**
```json
{
  "message": "Order updated successfully",
  "id": 1
}
```

---

### Delete Order
```http
DELETE /orders/:id
```

**Response (200 OK):**
```json
{
  "message": "Order deleted successfully",
  "id": 1
}
```

---

## 🧪 Testing

Run all tests with coverage:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

**Test Coverage:** 85%+ (17 comprehensive test cases)

### Test Categories
- ✅ Health check endpoint
- ✅ Order creation (valid/invalid inputs)
- ✅ Pagination (default, custom, invalid)
- ✅ Filtering (status, amount, date range)
- ✅ CRUD operations (create, read, update, delete)
- ✅ Edge cases (empty database, invalid IDs, combined filters)

---

## 📂 Project Structure

```
orders-api/
├── src/
│   ├── server.js           # Express app setup and routes
│   ├── database.js         # SQLite configuration
│   ├── controllers.js      # Business logic for all endpoints
│   └── seed.js            # Database seeding script
├── tests/
│   └── orders.test.js     # Comprehensive test suite
├── database/
│   └── orders.db          # SQLite database (auto-created)
├── .env                   # Environment variables
├── .gitignore
├── package.json
└── README.md
```

---

## 💾 Database Schema

**Table: orders**

| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY, AUTOINCREMENT |
| customer_name | TEXT | NOT NULL |
| product | TEXT | NOT NULL |
| quantity | INTEGER | NOT NULL |
| amount | DECIMAL(10,2) | NOT NULL |
| status | TEXT | NOT NULL, CHECK(status IN (...)) |
| order_date | TEXT | NOT NULL |
| created_at | TEXT | DEFAULT CURRENT_TIMESTAMP |

---

## 🎯 Usage Examples

### Example 1: Create and retrieve an order
```bash
# Create order
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Alice Smith",
    "product": "Wireless Keyboard",
    "quantity": 1,
    "amount": 89.99,
    "status": "pending",
    "order_date": "2026-02-07"
  }'

# Get all orders
curl http://localhost:3000/orders
```

### Example 2: Filter completed orders over $500
```bash
curl "http://localhost:3000/orders?status=completed&minAmount=500"
```

### Example 3: Get orders from January 2026 with pagination
```bash
curl "http://localhost:3000/orders?startDate=2026-01-01&endDate=2026-01-31&page=1&limit=20"
```

### Example 4: Update order status
```bash
curl -X PUT http://localhost:3000/orders/1 \
  -H "Content-Type: application/json" \
  -d '{"status": "completed"}'
```

---

## 🔒 Error Handling

The API returns appropriate HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `500` - Internal Server Error

**Error Response Format:**
```json
{
  "error": "Error description",
  "details": "Additional information"
}
```

---

## 🤖 GitHub Copilot Integration

This project was built with GitHub Copilot assistance. See the [COPILOT_METRICS.md](COPILOT_METRICS.md) report for:
- Copilot contribution percentage
- Acceptance rate statistics
- Time saved metrics
- Key learnings and insights

---

## 📝 Development Notes

### Seeding the Database
To reset and repopulate with 50 sample orders:
```bash
npm run seed
```

### Running in Development Mode
```bash
npm run dev
```
This uses nodemon for automatic server restart on file changes.

---

## 🐛 Troubleshooting

**Database locked error:**
- Ensure no other processes are using the database
- Check file permissions on `database/` directory

**Port already in use:**
- Change PORT in `.env` file
- Kill existing process: `lsof -ti:3000 | xargs kill`

**Tests failing:**
- Ensure database is initialized: `npm run seed`
- Check that no server is running during tests

---

## 📄 License

ISC

---

## 👥 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Submit a pull request

---

## 📧 Support

For issues and questions, please open an issue in the GitHub repository.

---