# Casino Admin Dashboard

Full-featured admin control panel for the casino platform.

## Features

- **Overview Dashboard** - Real-time stats, bet volume, game popularity
- **User Management** - Search, view profile, ban/unban, transaction history, login history
- **Financial Dashboard** - Deposits, withdrawals, revenue charts
- **Game Management** - Enable/disable games, min/max bet settings
- **Deposit Management** - Approve/reject deposit requests
- **Withdrawal Management** - Approve/reject withdrawal requests
- **Transaction Logs** - Filter by user, type, date
- **Live Support Chat** - Real-time chat with users (WebSocket)
- **System Monitoring** - API latency, WebSocket status, uptime

## Setup

```bash
cd admin-dashboard
npm install
cp .env.example .env
# Edit .env: VITE_API_URL=http://localhost:4000
npm run dev
```

Runs at http://localhost:3001

## Login

Use admin credentials (from backend seed):
- Email: admin@casino.com
- Password: admin123

## Tech Stack

- React + TypeScript
- Vite
- TailwindCSS
- React Query
- Recharts
- Socket.io-client
- React Router
