# Database Setup

## Option 1: Docker (nếu đã cài Docker)

```bash
cd backend
docker compose up -d
```

## Option 2: Cài PostgreSQL trên Windows

1. Tải: https://www.postgresql.org/download/windows/
2. Cài đặt, ghi nhớ mật khẩu user `postgres`
3. Mở pgAdmin hoặc psql, tạo database: `CREATE DATABASE casino_db;`
4. Sửa `backend/.env`: `DATABASE_URL="postgresql://postgres:MẬT_KHẨU@localhost:5432/casino_db"`

## Option 3: PostgreSQL đã cài sẵn

1. Tạo database:
```bash
psql -U postgres -c "CREATE DATABASE casino_db;"
```

2. Cập nhật file `.env` nếu mật khẩu khác:
```
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/casino_db"
```

3. Chạy migration:
```bash
npm run db:push
npm run db:seed
```

## Option 3: Chỉnh sửa .env

Nếu PostgreSQL đã chạy với user/password khác, sửa file `backend/.env`:

```
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/casino_db"
```
