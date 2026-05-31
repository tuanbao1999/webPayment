/**
 * Build: dùng placeholder nếu chưa có DATABASE_URL (để prisma generate chạy được).
 * Production: bắt buộc DATABASE_URL thật trên Netlify UI (ghi đè placeholder).
 */
const PLACEHOLDER =
  "postgresql://build:build@127.0.0.1:5432/build?sslmode=disable";

const url =
  process.env.DATABASE_URL ||
  process.env.NETLIFY_DATABASE_URL ||
  process.env.NETLIFY_DATABASE_URL_UNPOOLED ||
  process.env.NETLIFY_DATABASE_URL_POOLED;

if (url) {
  process.env.DATABASE_URL = url;
  console.log("✓ DATABASE_URL đã có (build + runtime)");
} else {
  process.env.DATABASE_URL = PLACEHOLDER;
  console.warn(`
⚠️  Chưa có DATABASE_URL trên Netlify — build dùng placeholder tạm.

   Để app chạy thật, thêm trên Netlify:
   Project configuration → Environment variables
   → DATABASE_URL = postgresql://...?sslmode=require
   → Scopes: All (Build + Runtime)

   Sau đó deploy lại.
`);
}

export function isRealDatabaseUrl(u) {
  return (
    u &&
    !u.includes("127.0.0.1") &&
    !u.includes("@build:build") &&
    (u.startsWith("postgresql://") || u.startsWith("postgres://"))
  );
}
