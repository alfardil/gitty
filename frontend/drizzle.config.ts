import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const isProd = process.env.NODE_ENV === "production";

export default defineConfig({
  out: "./drizzle",
  schema: "./server/src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: isProd
      ? process.env.PROD_DATABASE_URL!
      : process.env.DEV_DATABASE_URL! ?? process.env.PROD_DATABASE_URL!,
  },
});
