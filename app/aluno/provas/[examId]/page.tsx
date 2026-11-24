import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AnswerSheet } from "./AnswerSheet";

export const instant = false;

export default async function AnswerSheetPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  const role =
    "role" in session.user &&
    (session.user.role === "STUDENT" || session.user.role === "ADMIN")
      ? session.user.role
      : "STUDENT";

  if (role !== "STUDENT") {
    redirect("/admin");
  }

  const userId = session.user.id;

  if (!userId) {
    redirect("/");
  }

  const { examId } = await params;
  const exam = await prisma.exam.findFirst({
    where: { id: examId, status: "PUBLISHED" },
    include: {
      questions: {
        include: { answerKey: true },
        orderBy: { number: "asc" },
      },
      attempts: {
        where: { userId },
        include: { answers: true },
        take: 1,
      },
    },
  });

  if (!exam) {
    notFound();
  }

  const attempt = exam.attempts[0];
  const existingAnswers: Record<
    number,
    { selected: string; status: "correct" | "wrong" | "annulled" }
  > = {};

  for (const answer of attempt?.answers ?? []) {
    const question = exam.questions.find(
      (item) => item.id === answer.questionId,
    );

    if (!question) {
      continue;
    }

    if (question.answerKey?.correctAlternative === "ANULADA") {
      existingAnswers[question.number] = {
        selected: answer.selected,
        status: "annulled",
      };
    } else {
      existingAnswers[question.number] = {
        selected: answer.selected,
        status: answer.isCorrect ? "correct" : "wrong",
      };
    }
  }

  const start = exam.day === "DAY_1" ? 1 : 91;
  const end = exam.day === "DAY_1" ? 90 : 180;
  const numbers = Array.from(
    { length: end - start + 1 },
    (_, index) => start + index,
  );

  return (
    <AnswerSheet
      examId={exam.id}
      title={exam.title}
      day={exam.day}
      color={exam.color}
      language={exam.foreignLanguage}
      numbers={numbers}
      annulledNumbers={exam.questions
        .filter(
          (question) =>
            question.answerKey?.correctAlternative === "ANULADA",
        )
        .map((question) => question.number)}
      initialAnswers={existingAnswers}
    />
  );
}
