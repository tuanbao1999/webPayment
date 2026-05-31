# Quản lý chi tiêu (webPayment)

Ghi chi tiêu nhóm theo ngày: mức giá 40k/45k/50k, bộ người hay đi, tick đã chuyển khoản.

## Chạy local

```bash
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Mở http://localhost:3000

## Deploy Netlify

1. Push repo lên GitHub, connect Netlify
2. **Build settings** → **Publish directory**: **XÓA hết** (để trống).  
   Nếu đang là `/` hoặc `.` → lỗi: *publish directory cannot be the same as the base directory*.  
   File `netlify.toml` đã đặt `publish = ".next"` — trên UI **không** ghi đè thành thư mục gốc.
3. Build: `npm run build` (có `prisma db push` trong script)
4. **Environment variables** (bắt buộc — nếu thiếu sẽ lỗi P1012):
   - `DATABASE_URL` = `postgresql://...?sslmode=require` (copy từ Netlify DB)
   - **Scopes:** bật **Build** và **Runtime** (hoặc "Same value for all deploy contexts")
   - Không chỉ gán cho Functions — build cần biến này để `prisma db push`
4. Forms: file `public/forms.html` được detect lúc deploy
5. Form notifications → Email (tùy chọn) + Webhook → `/.netlify/functions/form-submission`
6. (Tùy chọn) `NEXT_PUBLIC_NETLIFY_FORM=true` để gửi kèm Netlify Forms khi lưu bill

## Tính năng

- **Hôm nay**: tổng chi, chưa thu, danh sách bill
- **Thêm chi tiêu**: tab mức giá / tổng tiền, bộ hay đi, preview
- **Chi tiết bill**: tick đã CK từng người
- **Danh bạ**, **Bộ hay đi**, **Mức giá**
