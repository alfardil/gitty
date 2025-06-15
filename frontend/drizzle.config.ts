import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./server/src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.PROD_DATABASE_URL!,
  },
});
