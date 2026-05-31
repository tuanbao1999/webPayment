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
4. **Environment variables** (để app chạy thật):
   - **Key:** `DATABASE_URL`
   - **Value:** `postgresql://...?sslmode=require` (copy từ Netlify DB)
   - **Contains secret values:** bật **ON** (Netlify khuyến nghị — ẩn giá trị trên UI, API, build log, CLI)
   - **Scopes:** **All deploy contexts** (Build + Runtime)
   - Không commit URL/mật khẩu vào Git — chỉ đặt trên Netlify hoặc file `.env` local
5. Forms: file `public/forms.html` được detect lúc deploy
6. Form notifications → Email (tùy chọn) + Webhook → `/.netlify/functions/form-submission`
7. (Tùy chọn) `NEXT_PUBLIC_NETLIFY_FORM=true` để gửi kèm Netlify Forms khi lưu bill

## Tính năng

- **Hôm nay**: tổng chi, chưa thu, danh sách bill
- **Thêm chi tiêu**: tab mức giá / tổng tiền, bộ hay đi, preview
- **Chi tiết bill**: tick đã CK từng người
- **Danh bạ**, **Bộ hay đi**, **Mức giá**
