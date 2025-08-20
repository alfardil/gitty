-- Create seat_status enum
CREATE TYPE "seat_status" AS ENUM ('available', 'assigned', 'inactive');

-- Create subscription_seats table
CREATE TABLE "subscription_seats" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "subscriptionId" varchar(255) NOT NULL,
  "ownerId" uuid NOT NULL,
  "seatNumber" integer NOT NULL,
  "assignedToUserId" uuid,
  "assignedAt" timestamp,
  "status" "seat_status" DEFAULT 'available' NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

-- Add foreign key constraints
ALTER TABLE "subscription_seats" ADD CONSTRAINT "subscription_seats_owner_id_users_id_fk" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "subscription_seats" ADD CONSTRAINT "subscription_seats_assigned_to_user_id_users_id_fk" FOREIGN KEY ("assignedToUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- Add unique constraint
ALTER TABLE "subscription_seats" ADD CONSTRAINT "subscription_seats_subscription_id_seat_number_unique" UNIQUE ("subscriptionId", "seatNumber");
