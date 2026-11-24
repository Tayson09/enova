-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'ADMIN');

-- CreateEnum
CREATE TYPE "ExamDay" AS ENUM ('DAY_1', 'DAY_2');

-- CreateEnum
CREATE TYPE "ExamStatus" AS ENUM ('DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('NOT_STARTED', 'PROCESSING', 'REVIEW_REQUIRED', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "KnowledgeArea" AS ENUM ('LANGUAGES', 'HUMAN_SCIENCES', 'NATURAL_SCIENCES', 'MATHEMATICS');

-- DropIndex
DROP INDEX "Exam_year_edition_application_key";

-- AlterTable
ALTER TABLE "Alternative" DROP COLUMN "isCorrect",
ALTER COLUMN "letter" SET DATA TYPE CHAR(1);

-- AlterTable
ALTER TABLE "Attempt" DROP COLUMN "answersJson",
DROP COLUMN "score",
ADD COLUMN "submittedAt" TIMESTAMP(3),
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Exam" DROP COLUMN "isPublished",
ADD COLUMN "day" "ExamDay" NOT NULL,
ADD COLUMN "importStatus" "ImportStatus" NOT NULL DEFAULT 'NOT_STARTED',
ADD COLUMN "pdfUrl" TEXT,
ADD COLUMN "status" "ExamStatus" NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "Question" DROP COLUMN "area",
ADD COLUMN "area" "KnowledgeArea" NOT NULL,
ALTER COLUMN "statement" DROP NOT NULL;

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'STUDENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnswerKey" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "correctAlternative" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnswerKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttemptAnswer" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "selected" CHAR(1) NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttemptAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AnswerKey_questionId_key" ON "AnswerKey"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "AnswerKey_examId_questionId_key" ON "AnswerKey"("examId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "AttemptAnswer_attemptId_questionId_key" ON "AttemptAnswer"("attemptId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "Attempt_userId_examId_key" ON "Attempt"("userId", "examId");

-- CreateIndex
CREATE UNIQUE INDEX "Exam_year_edition_application_day_key" ON "Exam"("year", "edition", "application", "day");

-- AddForeignKey
ALTER TABLE "AnswerKey" ADD CONSTRAINT "AnswerKey_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerKey" ADD CONSTRAINT "AnswerKey_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttemptAnswer" ADD CONSTRAINT "AttemptAnswer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "Attempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
