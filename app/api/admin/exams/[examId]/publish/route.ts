import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();

  if (!session?.user) {
    return false;
  }

  return (
    "role" in session.user &&
    session.user.role === "ADMIN"
  );
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ examId: string }> },
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Acesso restrito ao administrador." }, {
      status: 403,
    });
  }

  const { examId } = await context.params;
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      answerKeys: {
        include: { question: true },
      },
    },
  });

  if (!exam) {
    return NextResponse.json({ error: "Prova não encontrada." }, {
      status: 404,
    });
  }

  const expectedCount = exam.day === "DAY_1" ? 90 : 90;
  const start = exam.day === "DAY_1" ? 1 : 91;
  const end = exam.day === "DAY_1" ? 90 : 180;

  if (exam.answerKeys.length !== expectedCount) {
    return NextResponse.json(
      { error: "A prova precisa conter exatamente 90 respostas antes da publicação." },
      { status: 400 },
    );
  }

  const validNumbers = new Set<number>();
  let invalidAnswer = false;

  for (const answer of exam.answerKeys) {
    if (
      !["A", "B", "C", "D", "E", "ANULADA"].includes(answer.correctAlternative)
    ) {
      invalidAnswer = true;
    }

    if (
      answer.question.number >= start &&
      answer.question.number <= end
    ) {
      validNumbers.add(answer.question.number);
    }
  }

  if (invalidAnswer || validNumbers.size !== expectedCount) {
    return NextResponse.json(
      { error: "Revise todas as respostas antes de publicar o gabarito." },
      { status: 400 },
    );
  }

  await prisma.exam.update({
    where: { id: exam.id },
    data: {
      status: "PUBLISHED",
      importStatus: "COMPLETED",
    },
  });

  return NextResponse.json({ message: "Gabarito publicado com sucesso." });
}
