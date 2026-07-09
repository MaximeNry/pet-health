-- Add scan metadata to health documents. Existing (seeded) rows are
-- backfilled with a title derived from their type and placeholder file info,
-- then the columns are made NOT NULL.
ALTER TABLE "health_documents"
ADD COLUMN     "mime_type" TEXT,
ADD COLUMN     "size_bytes" INTEGER,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "title" TEXT;

UPDATE "health_documents" SET
  "title" = initcap(replace(lower("document_type"::text), '_', ' ')),
  "mime_type" = 'image/jpeg',
  "size_bytes" = 0;

ALTER TABLE "health_documents"
ALTER COLUMN "mime_type" SET NOT NULL,
ALTER COLUMN "size_bytes" SET NOT NULL,
ALTER COLUMN "title" SET NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "google_refresh_token" TEXT;
