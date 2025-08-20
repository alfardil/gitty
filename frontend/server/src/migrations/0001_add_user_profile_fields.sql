-- Add linkedin and role fields to users table
ALTER TABLE "users" ADD COLUMN "linkedin" varchar(512);
ALTER TABLE "users" ADD COLUMN "role" varchar(255);
