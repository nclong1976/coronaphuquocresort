# Triển khai production — Casino (player + API + admin)

Cấu trúc:

| Thành phần | Thư mục | Build output |
|------------|---------|----------------|
| Ứng dụng người chơi (Vite + single-file) | `./` | `dist/index.html` |
| API + Socket.io | `./backend` | `backend/dist/*.js` |
| Admin dashboard | `./admin-dashboard` | `admin-dashboard/dist/` |

## 1. Chuẩn bị server

- Node.js **20+** (LTS khuyến nghị).
- PostgreSQL (khớp `DATABASE_URL` trong Prisma).
- Reverse proxy (Nginx / Caddy / Cloudflare) bật **HTTPS** cho domain.

## 2. Biến môi trường

### Backend (`backend/.env`)

Xem `backend/.env.example` và `backend/.env.production.example`.

- `DATABASE_URL` — chuỗi Postgres hợp lệ.
- `JWT_SECRET` — **≥ 32 ký tự** (production sẽ từ chối nếu ngắn hơn).
- `CORS_ORIGINS` — danh sách origin frontend, ví dụ `https://yourdomain.com` (khớp **chính xác** với URL trình duyệt, gồm `https` và không có `/` cuối).

### Player app

File `.env.production` ở root project (đã có mẫu). Biến bắt buộc:

- `VITE_API_URL` — URL công khai của API (cùng host với proxy hoặc subdomain), ví dụ `https://yourdomain.com` nếu API nằm sau cùng domain tại `/api`.

### Admin dashboard

Tạo `admin-dashboard/.env.production` từ `admin-dashboard/.env.production.example`:

- `VITE_API_URL` — giống player (backend base URL).

## 3. Build từng phần

```bash
# 1) Backend
cd backend
npm ci
npx prisma generate
npx prisma migrate deploy   # hoặc db push tùy quy trình DB
npm run build
NODE_ENV=production node dist/server.js   # hoặc dùng PM2/systemd (mục 5)

# 2) Player SPA (từ root `làm lại/`)
cd ..
npm ci
npm run build
# Kết quả: dist/index.html (single file)

# 3) Admin
cd admin-dashboard
npm ci
npm run build
# Kết quả: dist/
```

Kiểm tra nhanh trên máy build:

```bash
# TypeScript
cd .. && npx tsc --noEmit
cd backend && npx tsc --noEmit
cd ../admin-dashboard && npm run build
```

## 4. Nginx (ví dụ — một domain, API `/api`, Socket.io)

- Proxy `location /api/` → `http://127.0.0.1:4000/api/`.
- Proxy `location /socket.io/` → `http://127.0.0.1:4000` với header WebSocket.
- Phục vụ `dist/index.html` của player tại `/` (hoặc subpath nếu chỉnh `base` trong Vite).
- Thư mục `/admin/` có thể trỏ tới `admin-dashboard/dist/` hoặc subdomain riêng.

Đặt `client_max_body_size` đủ lớn nếu có upload (backend `express.json` limit ~22mb).

## 5. Chạy API lâu dài

```bash
cd backend
NODE_ENV=production PORT=4000 node dist/server.js
```

Hoặc PM2:

```bash
pm2 start dist/server.js --name casino-api --cwd /path/to/backend
```

## 6. Kiểm tra sau deploy

- `GET https://yourdomain.com/api/health` → `{ "status": "ok" }`.
- Mở player: đăng nhập, ví, game — không lỗi CORS / 404 trên `/api`.
- Socket: DevTools Network → WS hoặc polling tới cùng host đã cấu hình trong `VITE_API_URL`.

## 7. Lưu ý dev vs production

- Dev player: `VITE_API_URL` để trống → fetch `/api` qua proxy Vite tới `127.0.0.1:4000`.
- Production: **phải** set `VITE_API_URL` và `CORS_ORIGINS` khớp domain thật.
- `backend/src/server.ts`: khi **không** có `CORS_ORIGINS`, Express dùng `origin: true` (tiện LAN); production nên luôn set `CORS_ORIGINS`.
