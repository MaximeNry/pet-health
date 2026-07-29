-- Generalizes documents from single-scan to multi-page. Each `HealthDocument`
-- becomes an aggregate root owning an ordered collection of `DocumentPage`s
-- (one Google Drive file per page). Non-destructive: every existing document
-- is turned into a valid one-page document BEFORE its file columns are dropped.

-- 1. The new page table.
CREATE TABLE "document_pages" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "drive_file_id" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_pages_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "document_pages_document_id_position_key" ON "document_pages"("document_id", "position");

CREATE INDEX "document_pages_document_id_idx" ON "document_pages"("document_id");

ALTER TABLE "document_pages"
    ADD CONSTRAINT "document_pages_document_id_fkey"
    FOREIGN KEY ("document_id") REFERENCES "health_documents"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- 2. Backfill: every legacy document becomes a document with exactly one page
-- at position 1, carrying its former Drive file, mime type and size. Runs
-- before the columns are dropped so no document ends up with zero pages.
INSERT INTO "document_pages" ("id", "document_id", "position", "drive_file_id", "mime_type", "size_bytes", "created_at")
SELECT gen_random_uuid(), "id", 1, "drive_file_id", "mime_type", "size_bytes", "created_at"
FROM "health_documents";

-- 3. Only now drop the single-file columns from the aggregate root.
ALTER TABLE "health_documents" DROP COLUMN "drive_file_id";
ALTER TABLE "health_documents" DROP COLUMN "mime_type";
ALTER TABLE "health_documents" DROP COLUMN "size_bytes";
