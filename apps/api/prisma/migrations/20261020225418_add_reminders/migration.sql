-- CreateEnum
CREATE TYPE "ReminderCategory" AS ENUM ('VACCINE', 'ANTIPARASITIC', 'DEWORMING', 'CHECKUP', 'OTHER');

-- CreateEnum
CREATE TYPE "RecurrenceUnit" AS ENUM ('DAY', 'WEEK', 'MONTH', 'YEAR');

-- CreateEnum
CREATE TYPE "ReminderStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateTable
CREATE TABLE "reminders" (
    "id" TEXT NOT NULL,
    "pet_id" TEXT NOT NULL,
    "household_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "ReminderCategory" NOT NULL,
    "due_date" DATE NOT NULL,
    "recurrence_every" INTEGER,
    "recurrence_unit" "RecurrenceUnit",
    "status" "ReminderStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reminder_completions" (
    "id" TEXT NOT NULL,
    "reminder_id" TEXT NOT NULL,
    "done_on" DATE NOT NULL,
    "done_by" TEXT NOT NULL,
    "health_document_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reminder_completions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reminders_pet_id_idx" ON "reminders"("pet_id");

-- CreateIndex
CREATE INDEX "reminders_household_id_status_due_date_idx" ON "reminders"("household_id", "status", "due_date");

-- CreateIndex
CREATE INDEX "reminder_completions_reminder_id_idx" ON "reminder_completions"("reminder_id");

-- CreateIndex
CREATE UNIQUE INDEX "reminder_completions_reminder_id_done_on_key" ON "reminder_completions"("reminder_id", "done_on");

-- AddForeignKey
ALTER TABLE "reminder_completions" ADD CONSTRAINT "reminder_completions_reminder_id_fkey" FOREIGN KEY ("reminder_id") REFERENCES "reminders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
