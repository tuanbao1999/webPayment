/**
 * Netlify build/runtime cần DATABASE_URL (PostgreSQL).
 * Extension Netlify DB có thể inject NETLIFY_DATABASE_URL — copy sang DATABASE_URL nếu cần.
 */
const url =
  process.env.DATABASE_URL ||
  process.env.NETLIFY_DATABASE_URL ||
  process.env.NETLIFY_DATABASE_URL_UNPOOLED;

if (!url) {
  console.error(`
❌ Thiếu DATABASE_URL khi build/deploy

Trên Netlify:
  1. Project configuration → Environment variables
  2. Add variable: DATABASE_URL
  3. Value: postgresql://...?sslmode=require  (từ Netlify DB / Neon)
  4. Scopes: chọn cả Build và Runtime (hoặc "All")
  5. Deploy lại (Clear cache and deploy)

Xem README.md phần Deploy Netlify.
`);
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = url;
  console.log("ℹ️  Dùng biến DB từ NETLIFY_DATABASE_URL → DATABASE_URL");
}
