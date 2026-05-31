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
2. **Build settings**: Publish directory để **trống** (plugin `@netlify/plugin-nextjs` tự xử lý). Nếu đặt `/` hoặc repo root → deploy lỗi.
3. Build: `npm run build` (có `prisma db push` trong script)
4. Env: `DATABASE_URL` = `file:./prisma/dev.db` hoặc [Turso](https://turso.tech) (`libsql://...`) cho production
4. Forms: file `public/forms.html` được detect lúc deploy
5. Form notifications → Email (tùy chọn) + Webhook → `/.netlify/functions/form-submission`
6. (Tùy chọn) `NEXT_PUBLIC_NETLIFY_FORM=true` để gửi kèm Netlify Forms khi lưu bill

## Tính năng

- **Hôm nay**: tổng chi, chưa thu, danh sách bill
- **Thêm chi tiêu**: tab mức giá / tổng tiền, bộ hay đi, preview
- **Chi tiết bill**: tick đã CK từng người
- **Danh bạ**, **Bộ hay đi**, **Mức giá**
