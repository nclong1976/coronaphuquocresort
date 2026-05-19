# Liên kết tên miền (Domain Setup)

## Cấu hình hiện tại: coronaphuquocresort.com

| Thông tin | Giá trị |
|-----------|---------|
| Domain | `coronaphuquocresort.com` |
| IP | `175.100.56.53` |
| DNS | A record, TTL 3600 |
| NS | ns1.matbao.com, ns2.matbao.com |

**File tham chiếu:** `config/domain-dns.csv`, `config/coronaphuquocresort.com.env.example`

---

## Tổng quan

Để chạy ứng dụng với tên miền riêng, cần cấu hình ở **Frontend** và **Backend**.

---

## 1. Backend (API)

### Biến môi trường (`backend/.env`)

```env
# Port (mặc định 4000)
PORT=4000

# CORS: Cho phép frontend từ tên miền truy cập API
# Phân cách bằng dấu phẩy, dùng https:// cho production
CORS_ORIGINS=https://casino.example.com,https://www.casino.example.com
```

**Lưu ý:**
- Thay `casino.example.com` bằng tên miền thực tế
- Nếu dùng cả `www` và không `www`, thêm cả hai
- Không thêm dấu `/` cuối URL

---

## 2. Frontend

### Biến môi trường (`.env` hoặc `.env.production`)

```env
# URL API backend - thay bằng domain backend khi deploy
VITE_API_URL=https://api.casino.example.com
```

**Lưu ý:**
- `VITE_` bắt buộc để Vite expose biến ra client
- Nếu frontend và backend cùng domain (reverse proxy), dùng relative: `VITE_API_URL=/api`

---

## 3. Kiến trúc triển khai

### Cách A: Frontend và Backend tách domain

| Thành phần | URL ví dụ |
|------------|-----------|
| Frontend  | `https://casino.example.com` |
| Backend   | `https://api.casino.example.com` |

- **Backend `.env`:** `CORS_ORIGINS=https://casino.example.com`
- **Frontend `.env`:** `VITE_API_URL=https://api.casino.example.com`

### Cách B: Reverse proxy (cùng domain)

Ví dụ Nginx:

```nginx
server {
    listen 443 ssl;
    server_name coronaphuquocresort.com www.coronaphuquocresort.com;

    # Frontend (Vite build)
    location / {
        root /var/www/casino/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

- **Backend `.env`:** `CORS_ORIGINS=https://coronaphuquocresort.com,https://www.coronaphuquocresort.com`
- **Frontend `.env`:** `VITE_API_URL=` (để trống = cùng domain) hoặc `VITE_API_URL=https://coronaphuquocresort.com`

---

## 4. Cấu hình nhanh cho coronaphuquocresort.com

**Frontend** – tạo `.env.production`:
```env
VITE_API_URL=https://coronaphuquocresort.com
```

**Backend** – thêm vào `backend/.env`:
```env
CORS_ORIGINS=https://coronaphuquocresort.com,https://www.coronaphuquocresort.com
```

**Nginx** (server 175.100.56.53) – thay `casino.example.com` bằng `coronaphuquocresort.com` trong cấu hình mục 3.

---

## 5. Kiểm tra

1. Build frontend: `npm run build`
2. Chạy backend: `cd backend && npm run dev`
3. Mở trình duyệt tại domain đã cấu hình
4. Kiểm tra Console: không có lỗi CORS
5. Kiểm tra Network: API trả 200, không 404

---

## 6. SSL/HTTPS

Production nên dùng HTTPS. Có thể dùng:
- **Let's Encrypt** (Certbot)
- **Cloudflare** (proxy + SSL)
- SSL từ nhà cung cấp hosting
