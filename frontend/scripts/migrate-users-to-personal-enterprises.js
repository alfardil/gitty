#!/usr/bin/env node

/**
 * Migration script to create personal enterprises and projects for existing users
 * Run this script to ensure all existing users have a personal enterprise and project
 */

const {
  migrateAllUsersToPersonalEnterprises,
} = require("../server/src/db/actions");

async function runMigration() {
  try {
    console.log(
      "Starting migration to assign personal enterprises and projects to users..."
    );

    const result = await migrateAllUsersToPersonalEnterprises();

    console.log(`\nMigration completed!`);
    console.log(`Total users processed: ${result.total}`);

    const successful = result.results.filter((r) => r.success);
    const failed = result.results.filter((r) => !r.success);

    console.log(`Successful assignments: ${successful.length}`);
    console.log(`Failed assignments: ${failed.length}`);

    if (failed.length > 0) {
      console.log("\nFailed assignments:");
      failed.forEach((f) => {
        console.log(`- User ID ${f.userId}: ${f.error}`);
      });
    }

    if (successful.length > 0) {
      console.log(
        `\nSuccessfully created ${successful.length} personal enterprises and projects.`
      );
    }
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };
