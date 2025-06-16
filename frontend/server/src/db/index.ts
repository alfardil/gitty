import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const isProd = process.env.NODE_ENV === "production";

const pool = new Pool({
  connectionString: isProd
    ? process.env.PROD_DATABASE_URL
    : process.env.DEV_DATABASE_URL ?? process.env.PROD_DATABASE_URL,
});

export const db = drizzle(pool);
