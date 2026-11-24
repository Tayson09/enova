import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AnswerReviewForm } from "./AnswerReviewForm";

export const instant = false;

export default async function AnswerReviewPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  const role =
    "role" in session.user && session.user.role === "ADMIN"
      ? session.user.role
      : "STUDENT";

  if (role !== "ADMIN") {
    redirect("/aluno");
  }

  const { examId } = await params;
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      answerKeys: {
        include: { question: true },
        orderBy: { question: { number: "asc" } },
      },
    },
  });

  if (!exam) {
    notFound();
  }

  const answers = exam.answerKeys.map((answer) => ({
    number: answer.question.number,
    alternative: answer.correctAlternative,
  }));

  return (
    <main className="min-h-screen bg-[#F7FAFF] px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <Link href="/admin" className="text-sm font-semibold text-[#1677FF]">
          ← Voltar para gabaritos
        </Link>

        <header className="mt-5">
          <p className="text-sm text-[#64748B]">Revisão do gabarito</p>
          <h1 className="mt-1 text-3xl font-bold text-[#102A43]">
            {exam.title}
          </h1>
          <p className="mt-2 text-sm text-[#64748B]">
            {exam.day === "DAY_1" ? "Primeiro dia" : "Segundo dia"} ·{" "}
            {exam.color} ·{" "}
            {exam.foreignLanguage === "NONE"
              ? "Sem língua estrangeira"
              : exam.foreignLanguage}
          </p>
        </header>

        <AnswerReviewForm
          examId={exam.id}
          initialStatus={exam.status}
          answers={answers}
        />
      </div>
    </main>
  );
}
