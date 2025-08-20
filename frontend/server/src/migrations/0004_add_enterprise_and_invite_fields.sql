-- Migration to add enterprise_id, invite_code, and invite_code_expires_at columns to subscription_seats table

-- Add enterprise_id column
ALTER TABLE subscription_seats 
ADD COLUMN enterprise_id UUID REFERENCES enterprises(id);

-- Add invite_code column
ALTER TABLE subscription_seats 
ADD COLUMN invite_code VARCHAR(64) UNIQUE;

-- Add invite_code_expires_at column
ALTER TABLE subscription_seats 
ADD COLUMN invite_code_expires_at TIMESTAMP;

-- Add index on enterprise_id for better query performance
CREATE INDEX idx_subscription_seats_enterprise_id ON subscription_seats(enterprise_id);

-- Add index on invite_code for better lookup performance
CREATE INDEX idx_subscription_seats_invite_code ON subscription_seats(invite_code);
