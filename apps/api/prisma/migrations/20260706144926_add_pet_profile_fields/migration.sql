-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('MALE', 'FEMALE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Species" ADD VALUE 'RABBIT';
ALTER TYPE "Species" ADD VALUE 'BIRD';

-- AlterTable
ALTER TABLE "pets" ADD COLUMN     "breed" TEXT,
ADD COLUMN     "sex" "Sex",
ADD COLUMN     "weight_kg" DOUBLE PRECISION;
