import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const isProd = process.env.NODE_ENV === "production";

export default defineConfig({
  out: "./server/src/migrations",
  schema: "./server/src/db/drizzle-schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: isProd
      ? process.env.PROD_DATABASE_URL!
      : (process.env.DEV_DATABASE_URL! ?? process.env.PROD_DATABASE_URL!),
  },
});
