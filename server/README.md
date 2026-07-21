# StockFlow POS — Backend API

Express + Prisma + SQLite backend with JWT authentication, role-based access, and REST APIs.

## Quick start

```bash
# From project root
cd server
npm install
npm run db:setup
npm run dev
```

API runs at **http://localhost:5001**

In another terminal:

```bash
cd "/Users/unaizafaheem/POS web application"
npm install
npm run dev
```

Frontend: **http://localhost:5173** (proxies `/api` → backend)

## Demo users

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@stockflow.com | admin123 |
| Manager | manager@stockflow.com | manager123 |
| Cashier | cashier@stockflow.com | cashier123 |

## Roles

- **Admin** — full access
- **Manager** — dashboard, products, POS, orders, customers, employees, reports
- **Cashier** — dashboard, POS, orders, customers (no products/employees/reports management)

## Tech

- Express
- Prisma ORM
- SQLite (swap `DATABASE_URL` to PostgreSQL when ready)
- JWT access + refresh tokens
- bcrypt password hashing
