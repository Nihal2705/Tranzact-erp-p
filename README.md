# Tranzact-erp-p

A simplified manufacturing ERP: inventory, sales/purchase orders, production, dashboard and reports.

## Tech stack
React + Vite, Tailwind CSS, Axios, Recharts · Node.js + Express.js · PostgreSQL (Neon) · JWT + bcrypt

## Run locally
1. Backend: `cd backend`, copy `.env.example` to `.env` and fill it in, `npm install`, `npm run dev`
2. Frontend: `cd frontend`, copy `.env.example` to `.env`, `npm install`, `npm run dev`
3. Database: run `database/schema.sql` on your PostgreSQL database, then `node backend/src/seedUsers.js`

## Roles
- **Admin / Manager**: inventory, orders, production, dashboard, reports
- **Worker**: view inventory and production, change stock, update production status