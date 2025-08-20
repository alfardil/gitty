// Script to assign enterprise IDs to existing subscription seats
// Run this after adding the enterpriseId column to the subscription_seats table

const { db } = require("../server/src/db");
const {
  subscriptionSeats,
  enterprises,
  users,
} = require("../server/src/db/schema");
const { eq } = require("drizzle-orm");

async function assignEnterpriseToSeats() {
  try {
    console.log("🔍 Fetching all subscription seats...");

    // Get all seats that don't have an enterpriseId
    const seatsWithoutEnterprise = await db
      .select()
      .from(subscriptionSeats)
      .where(eq(subscriptionSeats.enterpriseId, null));

    console.log(
      `Found ${seatsWithoutEnterprise.length} seats without enterprise ID`
    );

    for (const seat of seatsWithoutEnterprise) {
      // Find the user's personal enterprise
      const userEnterprises = await db
        .select()
        .from(enterprises)
        .where(eq(enterprises.ownerId, seat.ownerId));

      if (userEnterprises.length > 0) {
        const personalEnterprise = userEnterprises[0];

        // Update the seat with the enterprise ID
        await db
          .update(subscriptionSeats)
          .set({ enterpriseId: personalEnterprise.id })
          .where(eq(subscriptionSeats.id, seat.id));

        console.log(
          `✅ Assigned seat ${seat.id} to enterprise ${personalEnterprise.name}`
        );
      } else {
        console.log(
          `⚠️  No enterprise found for user ${seat.ownerId}, seat ${seat.id}`
        );
      }
    }

    console.log("🎉 Finished assigning enterprise IDs to seats");
  } catch (error) {
    console.error("❌ Error assigning enterprise IDs:", error);
  }
}

// Run the script
assignEnterpriseToSeats()
  .then(() => {
    console.log("Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
