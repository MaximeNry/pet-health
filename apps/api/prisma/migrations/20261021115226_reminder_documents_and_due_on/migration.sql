-- AlterTable
ALTER TABLE "reminder_completions" ADD COLUMN     "due_on" DATE;

-- AlterTable
ALTER TABLE "reminders" ADD COLUMN     "source_document_id" TEXT;
