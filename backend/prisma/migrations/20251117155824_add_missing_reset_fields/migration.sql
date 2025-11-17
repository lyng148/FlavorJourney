/*
  Warnings:

  - Made the column `token_version` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `users` ADD COLUMN `reset_password_expires_at` DATETIME(0) NULL,
    ADD COLUMN `reset_password_token` VARCHAR(255) NULL,
    MODIFY `token_version` INTEGER NOT NULL DEFAULT 0;
