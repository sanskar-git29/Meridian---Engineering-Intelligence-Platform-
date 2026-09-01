/*
  Warnings:

  - Added the required column `organizationId` to the `RefreshToken` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "RefreshToken" ADD COLUMN     "organizationId" TEXT NOT NULL;
