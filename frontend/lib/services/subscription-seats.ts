import { db } from "@/server/src/db";
import { subscriptionSeats, users } from "@/server/src/db/schema";
import { eq, and, count, sql, isNotNull } from "drizzle-orm";
import { randomBytes } from "crypto";

export interface SeatAssignment {
  id: string;
  subscriptionId: string;
  ownerId: string;
  enterpriseId?: string | null;
  seatNumber: number;
  assignedToUserId?: string | null;
  assignedAt?: string | null;
  status: "available" | "assigned" | "inactive" | null;
  inviteCode?: string | null;
  inviteCodeExpiresAt?: string | null;
  assignedUser?: {
    id: string;
    githubUsername?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
  } | null;
}

export class SubscriptionSeatsService {
  // Generate a unique invite code
  private static generateInviteCode(): string {
    return randomBytes(16).toString("hex").toUpperCase();
  }

  // Create seats for a new subscription
  static async createSeatsForSubscription(
    subscriptionId: string,
    ownerId: string,
    quantity: number,
    enterpriseId?: string
  ): Promise<void> {
    console.log(
      `Creating ${quantity} seats for subscription ${subscriptionId}, owner ${ownerId}, enterprise ${enterpriseId}`
    );
    console.log("🔍 Enterprise ID type:", typeof enterpriseId);
    console.log("🔍 Enterprise ID truthy:", !!enterpriseId);

    const seats = [];

    for (let i = 1; i <= quantity; i++) {
      const inviteCode = i === 1 ? null : this.generateInviteCode(); // First seat (owner) doesn't need invite code
      const expiresAt =
        i === 1
          ? null
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days expiry

      seats.push({
        subscriptionId,
        ownerId,
        enterpriseId,
        seatNumber: i,
        status: (i === 1 ? "assigned" : "available") as
          | "available"
          | "assigned"
          | "inactive",
        assignedToUserId: i === 1 ? ownerId : null,
        assignedAt: i === 1 ? new Date().toISOString() : null,
        inviteCode,
        inviteCodeExpiresAt: expiresAt,
      });
    }

    try {
      console.log("🔍 Seats to insert:", JSON.stringify(seats, null, 2));
      await db.insert(subscriptionSeats).values(seats);
      console.log(
        `Successfully created ${quantity} seats for subscription ${subscriptionId}`
      );
    } catch (error) {
      console.error(
        `Error creating seats for subscription ${subscriptionId}:`,
        error
      );
      throw error;
    }
  }

  // Get all seats for a subscription
  static async getSeatsBySubscription(
    subscriptionId: string
  ): Promise<SeatAssignment[]> {
    const seats = await db
      .select({
        id: subscriptionSeats.id,
        subscriptionId: subscriptionSeats.subscriptionId,
        ownerId: subscriptionSeats.ownerId,
        seatNumber: subscriptionSeats.seatNumber,
        assignedToUserId: subscriptionSeats.assignedToUserId,
        assignedAt: subscriptionSeats.assignedAt,
        status: subscriptionSeats.status,
        inviteCode: subscriptionSeats.inviteCode,
        inviteCodeExpiresAt: subscriptionSeats.inviteCodeExpiresAt,
        assignedUser: {
          id: users.id,
          githubUsername: users.githubUsername,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
      })
      .from(subscriptionSeats)
      .leftJoin(users, eq(subscriptionSeats.assignedToUserId, users.id))
      .where(eq(subscriptionSeats.subscriptionId, subscriptionId))
      .orderBy(subscriptionSeats.seatNumber);

    return seats;
  }

  // Get available seats for a subscription
  static async getAvailableSeats(
    subscriptionId: string
  ): Promise<SeatAssignment[]> {
    const seats = await db
      .select()
      .from(subscriptionSeats)
      .where(
        and(
          eq(subscriptionSeats.subscriptionId, subscriptionId),
          eq(subscriptionSeats.status, "available")
        )
      )
      .orderBy(subscriptionSeats.seatNumber);

    return seats;
  }

  // Assign a seat to a user
  static async assignSeat(seatId: string, userId: string): Promise<void> {
    await db
      .update(subscriptionSeats)
      .set({
        assignedToUserId: userId,
        assignedAt: new Date().toISOString(),
        status: "assigned",
        updatedAt: new Date().toISOString(),
      })
      .where(eq(subscriptionSeats.id, seatId));
  }

  // Unassign a seat
  static async unassignSeat(seatId: string): Promise<void> {
    // Generate a new invite code for the seat
    const newInviteCode = this.generateInviteCode();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now

    await db
      .update(subscriptionSeats)
      .set({
        assignedToUserId: null,
        assignedAt: null,
        status: "available",
        inviteCode: newInviteCode,
        inviteCodeExpiresAt: expiresAt.toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(subscriptionSeats.id, seatId));

    console.log(
      `🔄 Generated new invite code ${newInviteCode} for unassigned seat ${seatId}`
    );
  }

  // Check if a user has access to a subscription
  static async userHasAccess(
    userId: string,
    subscriptionId: string
  ): Promise<boolean> {
    const seat = await db
      .select()
      .from(subscriptionSeats)
      .where(
        and(
          eq(subscriptionSeats.subscriptionId, subscriptionId),
          eq(subscriptionSeats.assignedToUserId, userId),
          eq(subscriptionSeats.status, "assigned")
        )
      )
      .limit(1);

    return seat.length > 0;
  }

  // Get seats owned by a user
  static async getSeatsByOwner(ownerId: string): Promise<SeatAssignment[]> {
    const seats = await db
      .select({
        id: subscriptionSeats.id,
        subscriptionId: subscriptionSeats.subscriptionId,
        ownerId: subscriptionSeats.ownerId,
        enterpriseId: subscriptionSeats.enterpriseId,
        seatNumber: subscriptionSeats.seatNumber,
        assignedToUserId: subscriptionSeats.assignedToUserId,
        assignedAt: subscriptionSeats.assignedAt,
        status: subscriptionSeats.status,
        inviteCode: subscriptionSeats.inviteCode,
        inviteCodeExpiresAt: subscriptionSeats.inviteCodeExpiresAt,
        assignedUser: {
          id: users.id,
          githubUsername: users.githubUsername,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
      })
      .from(subscriptionSeats)
      .leftJoin(users, eq(subscriptionSeats.assignedToUserId, users.id))
      .where(eq(subscriptionSeats.ownerId, ownerId))
      .orderBy(subscriptionSeats.subscriptionId, subscriptionSeats.seatNumber);

    return seats;
  }

  // Get seats for an enterprise
  static async getSeatsByEnterprise(
    enterpriseId: string
  ): Promise<SeatAssignment[]> {
    const seats = await db
      .select({
        id: subscriptionSeats.id,
        subscriptionId: subscriptionSeats.subscriptionId,
        ownerId: subscriptionSeats.ownerId,
        enterpriseId: subscriptionSeats.enterpriseId,
        seatNumber: subscriptionSeats.seatNumber,
        assignedToUserId: subscriptionSeats.assignedToUserId,
        assignedAt: subscriptionSeats.assignedAt,
        status: subscriptionSeats.status,
        inviteCode: subscriptionSeats.inviteCode,
        inviteCodeExpiresAt: subscriptionSeats.inviteCodeExpiresAt,
        assignedUser: {
          id: users.id,
          githubUsername: users.githubUsername,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
      })
      .from(subscriptionSeats)
      .leftJoin(users, eq(subscriptionSeats.assignedToUserId, users.id))
      .where(eq(subscriptionSeats.enterpriseId, enterpriseId))
      .orderBy(subscriptionSeats.subscriptionId, subscriptionSeats.seatNumber);

    return seats;
  }

  // Get count of seats for a subscription
  static async getSeatCount(subscriptionId: string): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(subscriptionSeats)
      .where(eq(subscriptionSeats.subscriptionId, subscriptionId));

    return result[0]?.count || 0;
  }

  // Get count of assigned seats for a subscription
  static async getAssignedSeatCount(subscriptionId: string): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(subscriptionSeats)
      .where(
        and(
          eq(subscriptionSeats.subscriptionId, subscriptionId),
          eq(subscriptionSeats.status, "assigned")
        )
      );

    return result[0]?.count || 0;
  }

  // Get available invite codes for a user
  static async getAvailableInviteCodes(
    ownerId: string
  ): Promise<SeatAssignment[]> {
    const seats = await db
      .select({
        id: subscriptionSeats.id,
        subscriptionId: subscriptionSeats.subscriptionId,
        ownerId: subscriptionSeats.ownerId,
        seatNumber: subscriptionSeats.seatNumber,
        assignedToUserId: subscriptionSeats.assignedToUserId,
        assignedAt: subscriptionSeats.assignedAt,
        status: subscriptionSeats.status,
        inviteCode: subscriptionSeats.inviteCode,
        inviteCodeExpiresAt: subscriptionSeats.inviteCodeExpiresAt,
      })
      .from(subscriptionSeats)
      .where(
        and(
          eq(subscriptionSeats.ownerId, ownerId),
          eq(subscriptionSeats.status, "available"),
          isNotNull(subscriptionSeats.inviteCode)
        )
      )
      .orderBy(subscriptionSeats.subscriptionId, subscriptionSeats.seatNumber);

    return seats;
  }

  // Redeem an invite code
  static async redeemInviteCode(
    inviteCode: string,
    userId: string
  ): Promise<boolean> {
    console.log("🔍 Attempting to redeem invite code:", inviteCode);
    console.log("🔍 For user ID:", userId);

    const seat = await db
      .select()
      .from(subscriptionSeats)
      .where(
        and(
          eq(subscriptionSeats.inviteCode, inviteCode),
          eq(subscriptionSeats.status, "available"),
          sql`${subscriptionSeats.inviteCodeExpiresAt} > NOW()`
        )
      )
      .limit(1);

    console.log("🔍 Found seat:", seat.length > 0 ? seat[0] : "No seat found");

    if (seat.length === 0) {
      console.log("❌ No valid seat found for invite code");
      return false; // Invalid or expired code
    }

    // Assign the seat to the user
    await db
      .update(subscriptionSeats)
      .set({
        assignedToUserId: userId,
        assignedAt: new Date().toISOString(),
        status: "assigned",
        inviteCode: null, // Clear the invite code after use
        inviteCodeExpiresAt: null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(subscriptionSeats.id, seat[0].id));

    // Update the user's subscription plan to PRO
    await db
      .update(users)
      .set({
        subscriptionPlan: "PRO",
      })
      .where(eq(users.id, userId));

    console.log("✅ Successfully assigned seat and updated user to PRO plan");

    return true;
  }

  // Get invite codes for a user's seats
  static async getInviteCodes(ownerId: string): Promise<SeatAssignment[]> {
    const seats = await db
      .select({
        id: subscriptionSeats.id,
        subscriptionId: subscriptionSeats.subscriptionId,
        ownerId: subscriptionSeats.ownerId,
        seatNumber: subscriptionSeats.seatNumber,
        assignedToUserId: subscriptionSeats.assignedToUserId,
        assignedAt: subscriptionSeats.assignedAt,
        status: subscriptionSeats.status,
        inviteCode: subscriptionSeats.inviteCode,
        inviteCodeExpiresAt: subscriptionSeats.inviteCodeExpiresAt,
        assignedUser: {
          id: users.id,
          githubUsername: users.githubUsername,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
      })
      .from(subscriptionSeats)
      .leftJoin(users, eq(subscriptionSeats.assignedToUserId, users.id))
      .where(eq(subscriptionSeats.ownerId, ownerId))
      .orderBy(subscriptionSeats.subscriptionId, subscriptionSeats.seatNumber);

    return seats;
  }
}
