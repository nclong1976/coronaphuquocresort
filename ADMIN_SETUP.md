# Admin Dashboard Setup

## Overview

The Admin Control Panel is a separate React application for managing the casino platform.

## Prerequisites

- Backend running (see `SETUP.md`)
- PostgreSQL with schema applied (`npm run db:push` in backend)
- Seed run (`npm run db:seed` in backend)

## Run Admin Dashboard

```bash
cd admin-dashboard
npm install
cp .env.example .env
# Set VITE_API_URL=http://localhost:4000 (or your backend URL)
npm run dev
```

Admin dashboard runs at **http://localhost:3001**

## Login

- **Email:** admin@casino.com
- **Password:** admin123

(From backend seed - create admin user if not exists)

## Features

| Page | Description |
|------|-------------|
| Dashboard | Real-time stats, bet volume, game popularity charts |
| Users | Search, view profile, ban/unban, transaction & login history |
| Financial | Total deposits/withdrawals, revenue charts |
| Games | Enable/disable games, min/max bet settings |
| Deposits | Approve/reject deposit requests |
| Withdrawals | Approve/reject withdrawal requests |
| Transactions | Filter by user, type |
| Support | Live chat with users (WebSocket) |
| System | API latency, WebSocket status, uptime |

## Backend Requirements

The backend must have:
- Socket.io for real-time updates
- Support routes (`/api/support/tickets`, `/api/support/message`)
- Extended admin APIs (see `backend/src/routes/adminRoutes.ts`)

Run `npm run db:push` to add SupportTicket, SupportMessage, UserLoginHistory tables.
