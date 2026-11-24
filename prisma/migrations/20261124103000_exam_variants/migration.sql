-- CreateEnum
CREATE TYPE "ExamColor" AS ENUM ('BLUE', 'PINK', 'YELLOW', 'WHITE', 'GREEN', 'ORANGE', 'GRAY', 'BROWN', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ForeignLanguage" AS ENUM ('ENGLISH', 'SPANISH', 'NONE');

-- AlterTable
ALTER TABLE "Exam"
ADD COLUMN "color" "ExamColor" NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN "foreignLanguage" "ForeignLanguage" NOT NULL DEFAULT 'NONE';

-- DropIndex
DROP INDEX "Exam_year_edition_application_day_key";

-- CreateIndex
CREATE UNIQUE INDEX "Exam_year_edition_application_day_color_foreignLanguage_key"
ON "Exam"("year", "edition", "application", "day", "color", "foreignLanguage");
