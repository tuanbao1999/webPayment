import { execSync } from "child_process";
import { isRealDatabaseUrl } from "./ensure-database-url.mjs";

const url = process.env.DATABASE_URL ?? "";

if (isRealDatabaseUrl(url)) {
  console.log("→ prisma db push (database thật)...");
  execSync("npx prisma db push --accept-data-loss", { stdio: "inherit" });
} else {
  console.log("→ Bỏ qua prisma db push (chưa có DATABASE_URL thật trên Netlify)");
}
