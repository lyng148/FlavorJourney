/*
  Warnings:

  - You are about to drop the column `generated_text` on the `saved_templates` table. All the data in the column will be lost.
  - You are about to drop the `template_groups` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `templates` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `generated_text_ja` to the `saved_templates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `generated_text_vi` to the `saved_templates` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `templates` DROP FOREIGN KEY `templates_ibfk_1`;

-- AlterTable
ALTER TABLE `saved_templates` DROP COLUMN `generated_text`,
    ADD COLUMN `audio_url` VARCHAR(500) NULL,
    ADD COLUMN `generated_text_ja` TEXT NOT NULL,
    ADD COLUMN `generated_text_vi` TEXT NOT NULL;

-- DropTable
DROP TABLE `template_groups`;

-- DropTable
DROP TABLE `templates`;
