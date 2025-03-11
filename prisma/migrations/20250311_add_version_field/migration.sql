-- Add version field to User model for optimistic concurrency control
ALTER TABLE "User" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;
