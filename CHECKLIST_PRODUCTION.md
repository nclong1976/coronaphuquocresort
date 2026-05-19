# Checklist trước khi đưa vào hoạt động

## Đã sẵn sàng

- [x] Build frontend & backend
- [x] CORS, JWT, rate limiting
- [x] Database (Prisma + PostgreSQL)
- [x] Domain: coronaphuquocresort.com (175.100.56.53)
- [x] Tài liệu triển khai (DOMAIN_SETUP.md)

---

## Cần thực hiện trước khi go-live

### 1. Cấu hình môi trường production

**Frontend** – tạo `.env.production`:
```env
VITE_API_URL=https://coronaphuquocresort.com
```

**Backend** – cập nhật `backend/.env`:
```env
NODE_ENV=production
CORS_ORIGINS=https://coronaphuquocresort.com,https://www.coronaphuquocresort.com
JWT_SECRET=<chuỗi-bí-mật-ít-nhất-32-ký-tự>
DATABASE_URL=postgresql://...  # Database production
```

### 2. SSL/HTTPS

- Cài đặt SSL (Let's Encrypt hoặc từ nhà cung cấp)
- Cấu hình Nginx reverse proxy theo DOMAIN_SETUP.md

### 3. Database

- Chạy migration: `cd backend && npx prisma migrate deploy`
- **Không** chạy `db:seed` trên production (tạo user test)

### 4. Process manager (khuyến nghị)

- Dùng PM2 hoặc systemd để chạy backend ổn định:
```bash
pm2 start backend/dist/server.js --name casino-api
```

### 5. Kiểm tra cuối

- [ ] Build: `npm run build` (frontend), `cd backend && npm run build`
- [ ] Test API: đăng nhập, đặt cược Sic Bo
- [ ] Kiểm tra Console trình duyệt: không lỗi CORS
- [ ] Kiểm tra WebSocket (chat Sic Bo)
