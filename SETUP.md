# Hướng dẫn chạy Casino với Backend bảo mật

## 1. Cài đặt PostgreSQL

Cài PostgreSQL và tạo database:

```sql
CREATE DATABASE casino_db;
```

## 2. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Chỉnh `.env`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/casino_db"
JWT_SECRET="your-secret-key-min-32-characters"
PORT=4000
```

Khởi tạo database:
```bash
npm run db:push
npm run db:seed
```

**Tài khoản seed:** User: test@casino.com / password123 (balance 1000) | Admin: admin@casino.com / admin123

Chạy server:
```bash
npm run dev
```

Backend chạy tại `http://localhost:4000`

## 3. Frontend

```bash
# Ở thư mục gốc
npm install
```

Tạo `.env.local` (optional):
```
VITE_API_URL=http://localhost:4000
```

Chạy frontend:
```bash
npm run dev
```

Frontend chạy tại `http://localhost:3000`

## 4. Sử dụng

1. Mở http://localhost:3000
2. Đăng ký hoặc đăng nhập (test@casino.com / password123)
3. Tất cả game dùng API server (balance và kết quả từ backend)
4. Nạp/Rút: gửi yêu cầu → Admin duyệt tại Admin Dashboard
5. Admin: đăng nhập admin@casino.com / admin123 → menu → ADMIN

## API Endpoints

### Auth & Wallet
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | /api/auth/register | Đăng ký |
| POST | /api/auth/login | Đăng nhập |
| GET | /api/auth/me | Thông tin user |
| GET | /api/wallet | Số dư |
| POST | /api/wallet/deposit-request | Yêu cầu nạp tiền |
| POST | /api/wallet/withdraw-request | Yêu cầu rút tiền |

### Games (POST)
sicbo, baccarat, tigerbaccarat, baccaratlongho, dragontiger, roulette, blackjack, slot, baicao, threecard, caribbean, niuniu, texasholdem, russianpoker

### Admin (cần token admin)
GET /api/admin/users, deposits, withdraws, transactions, stats
POST /api/admin/deposit/approve, deposit/reject, withdraw/approve, withdraw/reject, user/ban, game/enable

## Provably Fair

Mỗi ván trả về `serverSeedHash`. Sau ván, server có thể reveal `serverSeed` để người chơi verify:
`sha256(server_seed) === serverSeedHash`

Kết quả: `sha256(server_seed + client_seed + nonce)`
