-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('VACCINATION', 'PRESCRIPTION', 'LAB_RESULT', 'CERTIFICATE', 'OTHER');

-- CreateTable
CREATE TABLE "health_documents" (
    "id" TEXT NOT NULL,
    "pet_id" TEXT NOT NULL,
    "household_id" TEXT NOT NULL,
    "drive_file_id" TEXT NOT NULL,
    "document_type" "DocumentType" NOT NULL,
    "document_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "health_documents_pkey" PRIMARY KEY ("id")
);
