# Casino Backend API

Secure backend for the casino web application.

## Prerequisites

- Node.js 18+
- PostgreSQL

## Setup

1. **Install dependencies**
   ```bash
   cd backend && npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set:
   - `DATABASE_URL` - PostgreSQL connection string (e.g. `postgresql://user:pass@localhost:5432/casino_db`)
   - `JWT_SECRET` - Min 32 characters for production

3. **Initialize database**
   ```bash
   npm run db:push
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

API runs at `http://localhost:4000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register (email, username, fullName, password)
- `POST /api/auth/login` - Login (email, password)
- `GET /api/auth/me` - Get current user (Bearer token required)

### Wallet
- `GET /api/wallet` - Get balance (Bearer token required)

### Games (all require Bearer token)
- `POST /api/games/sicbo` - Body: `{ bets: { BIG?, SMALL? }, clientSeed? }`
- `POST /api/games/baccarat` - Body: `{ bets: { PLAYER?, BANKER?, TIE? }, clientSeed? }`
- `POST /api/games/dragontiger` - Body: `{ bets: { DRAGON?, TIGER?, TIE? }, clientSeed? }`
- `POST /api/games/roulette` - Body: `{ bets: { RED?, BLACK? }, clientSeed? }`
- `POST /api/games/blackjack` - Body: `{ amount, clientSeed? }`
- `POST /api/games/slot` - Body: `{ amount, clientSeed? }`

### Transactions
- `GET /api/transactions` - List transactions (Bearer token required)

## Provably Fair RNG

Each game response includes `serverSeedHash`. After the round, you can verify results using:
`sha256(server_seed + client_seed + nonce)`.
