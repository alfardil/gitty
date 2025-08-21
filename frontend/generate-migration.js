#!/usr/bin/env node

const { execSync } = require("child_process");

console.log("Generating migration for README cache table...");

try {
  // Generate the migration
  execSync("npx drizzle-kit generate", {
    stdio: "inherit",
    cwd: process.cwd(),
  });

  console.log("Migration generated successfully!");
  console.log(
    'Run "npx drizzle-kit migrate" to apply the migration to your database.'
  );
} catch (error) {
  console.error("Error generating migration:", error.message);
  process.exit(1);
}
