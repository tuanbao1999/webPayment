import fs from "fs";
import path from "path";

const dir = path.join(process.cwd(), "prisma");
fs.mkdirSync(dir, { recursive: true });
