-- AlterTable
ALTER TABLE "households" ADD COLUMN     "document_types" TEXT[] DEFAULT ARRAY['Vaccination', 'Prescription', 'Lab result', 'Certificate']::TEXT[];
