import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { usersTable } from "./schema";

const db = drizzle(process.env.DATABASE_URL!);

async function main() {
  const users = await db.select().from(usersTable);
  console.log(users);
}

main();
