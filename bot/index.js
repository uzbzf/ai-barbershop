import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

dotenv.config({
  path: path.join(root, ".env"),
  override: true,
});

process.env.DATABASE_URL = `file:${path.join(root, "prisma", "dev.db")}`;

await import("./dialog.js");
