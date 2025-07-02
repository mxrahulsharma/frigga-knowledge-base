/*
  Warnings:

  - You are about to drop the column `lastEditedAt` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `lastEditorId` on the `Document` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Document" DROP CONSTRAINT "Document_lastEditorId_fkey";

-- AlterTable
ALTER TABLE "Document" DROP COLUMN "lastEditedAt",
DROP COLUMN "lastEditorId";
