-- Adds the uploader (owner of the Drive file) to each document so that any
-- household member can read/delete files living in another member's Drive.

ALTER TABLE "health_documents" ADD COLUMN "uploader_user_id" TEXT;

-- Backfill: the uploader was never recorded, so assume the household OWNER
-- scanned the pre-existing documents (single-user households in practice).
UPDATE "health_documents" hd
SET "uploader_user_id" = (
  SELECT hm."user_id"
  FROM "household_members" hm
  WHERE hm."household_id" = hd."household_id"
    AND hm."role" = 'OWNER'
  LIMIT 1
);

ALTER TABLE "health_documents" ALTER COLUMN "uploader_user_id" SET NOT NULL;
