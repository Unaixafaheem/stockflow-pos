# StockFlow POS

A modern, portfolio-ready **Inventory + Point of Sale (POS)** web application built with React. StockFlow POS delivers a premium SaaS-style dashboard experience for managing products, processing sales, tracking customers, and analyzing business performance — all without a backend.

![StockFlow POS Dashboard](./screenshots/dashboard.png)

## Overview

StockFlow POS is a full-featured retail management system designed to demonstrate modern frontend development skills. It simulates real supermarket/business software with a polished UI, smooth animations, and complete CRUD workflows powered entirely by `localStorage`.

Perfect for showcasing in a **full-stack developer internship portfolio** — even though it runs client-side, it demonstrates the kind of data modeling, state management, and UX patterns expected in production applications.

## Features

### Dashboard
- Revenue, products, customers, and orders KPI cards
- 7-day revenue area chart
- Best-selling products bar chart
- Recent sales table
- Low stock alert panel

### Products
- Full product catalog with search and category filter
- Add, edit, and delete products with confirmation
- Low stock and out-of-stock badges
- Fields: name, category, SKU, barcode, cost/selling price, stock, threshold, supplier

### POS / Checkout
- Product search grid with click-to-add
- Cart with quantity controls and item removal
- Discount, tax (8%), and total calculation
- Payment methods: Cash, Card, Online
- Customer selection
- Receipt modal on successful checkout
- Automatic stock reduction and order persistence

### Orders / Sales
- Complete sales history with search and status filter
- Order details modal with line items
- Payment method and status badges

### Customers
- Customer database with purchase history
- Add, edit, delete customers
- Total purchases and last purchase date tracking

### Employees
- Staff management with roles and status
- Roles: Admin, Manager, Cashier, Inventory Staff

### Reports
- Sales analytics cards
- Monthly sales line chart
- Revenue by category pie chart
- Best-selling products bar chart
- Low-stock product list
- Export report button (UI)

### UX & Polish
- Dark / light mode toggle
- Responsive sidebar navigation
- Framer Motion animations
- Toast notifications
- Confirmation modals
- Loading and empty states
- Realistic sample data on first load

## Tech Stack

| Technology | Purpose |
|---|---|
| **React 19** | UI framework |
| **Vite** | Build tool & dev server |
| **Tailwind CSS 4** | Utility-first styling |
| **Framer Motion** | Page & component animations |
| **Lucide React** | Icon library |
| **Recharts** | Data visualization |
| **React Router** | Client-side routing |
| **localStorage** | Data persistence |

## Getting Started

### Prerequisites
- Node.js 18+ and npm

### Run frontend + backend (full stack)

```bash
# 1) Setup & start API (Terminal 1)
cd server
npm install
npm run db:setup
npm run dev
# API → http://localhost:5001

# 2) Start frontend (Terminal 2)
cd ..
npm install
npm run dev
# App → http://localhost:5173
```

### Demo login

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@stockflow.com` | `admin123` |
| Manager | `manager@stockflow.com` | `manager123` |
| Cashier | `cashier@stockflow.com` | `cashier123` |

### Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── layout/          # Sidebar, TopNavbar, Layout
│   └── ui/              # Reusable UI components
├── context/             # App state & toast providers
├── data/                # Sample data & constants
├── hooks/               # Custom React hooks
├── pages/               # Route pages (7 modules)
├── utils/               # Formatters & helpers
├── App.jsx              # Root component & routing
└── main.jsx             # Entry point
```

## Screenshots

| Dashboard | POS Checkout |
|---|---|
| ![Dashboard](./screenshots/dashboard.png) | ![POS](./screenshots/pos.png) |

| Products | Reports |
|---|---|
| ![Products](./screenshots/products.png) | ![Reports](./screenshots/reports.png) |

> Add your own screenshots after running the app and place them in the `screenshots/` folder.

## Portfolio Description

> **StockFlow POS** — A production-quality inventory and point-of-sale web application built with React, featuring a premium SaaS dashboard UI, real-time cart checkout, inventory management, sales analytics, and full data persistence via localStorage. Demonstrates proficiency in component architecture, state management, responsive design, data visualization, and modern UX patterns including dark mode, animations, and toast notifications.

## Future Improvements

- [ ] Backend API with Node.js / Express or Next.js API routes
- [ ] Database integration (PostgreSQL / MongoDB)
- [ ] User authentication and role-based access control
- [ ] Barcode scanner integration via webcam
- [ ] PDF receipt generation and email delivery
- [ ] Multi-store / multi-location support
- [ ] Real-time inventory sync with WebSockets
- [ ] CSV/PDF report export functionality
- [ ] Unit and integration tests with Vitest
- [ ] PWA support for offline mobile use

## License

MIT
