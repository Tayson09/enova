import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const answerSchema = z.object({
  examId: z.string().cuid(),
  answers: z.record(
    z.string(),
    z.enum(["A", "B", "C", "D", "E", "ANULADA"]),
  ),
});

async function requireAdmin() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  const role =
    "role" in session.user && session.user.role === "ADMIN"
      ? session.user.role
      : "STUDENT";

  return role === "ADMIN" ? session : null;
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ examId: string }> },
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Acesso restrito ao administrador." }, {
      status: 403,
    });
  }

  const { examId } = await context.params;
  const parsed = answerSchema.safeParse({
    examId,
    answers: await request.json(),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Uma ou mais respostas são inválidas." },
      { status: 400 },
    );
  }

  const exam = await prisma.exam.findUnique({
    where: { id: parsed.data.examId },
  });

  if (!exam) {
    return NextResponse.json({ error: "Prova não encontrada." }, {
      status: 404,
    });
  }

  const start = exam.day === "DAY_1" ? 1 : 91;
  const end = exam.day === "DAY_1" ? 90 : 180;
  const entries = Object.entries(parsed.data.answers);

  if (
    entries.length !== 90 ||
    entries.some(([number]) => {
      const parsedNumber = Number(number);
      return (
        !Number.isInteger(parsedNumber) ||
        parsedNumber < start ||
        parsedNumber > end
      );
    })
  ) {
    return NextResponse.json(
      { error: "A revisão deve conter exatamente 90 questões do dia." },
      { status: 400 },
    );
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.answerKey.deleteMany({
      where: { examId: exam.id },
    });
    await transaction.question.deleteMany({
      where: { examId: exam.id },
    });

    for (let number = start; number <= end; number += 1) {
      const question = await transaction.question.create({
        data: {
          examId: exam.id,
          number,
        },
      });

      await transaction.answerKey.create({
        data: {
          examId: exam.id,
          questionId: question.id,
          correctAlternative: parsed.data.answers[String(number)],
        },
      });
    }

    await transaction.exam.update({
      where: { id: exam.id },
      data: {
        status: "REVIEW",
        importStatus: "COMPLETED",
      },
    });
  });

  return NextResponse.json({ message: "Revisão salva." });
}
