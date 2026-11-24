import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const answerSchema = z.object({
  number: z.number().int().min(1).max(180),
  selected: z.enum(["A", "B", "C", "D", "E"]).nullable(),
});

async function getStudentSession() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  const role =
    "role" in session.user && session.user.role === "STUDENT"
      ? session.user.role
      : "STUDENT";

  return role === "STUDENT" ? session : null;
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ examId: string }> },
) {
  const session = await getStudentSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Acesso restrito ao aluno." }, {
      status: 403,
    });
  }

  const userId = session.user.id;

  if (!userId) {
    return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });
  }

  const { examId } = await context.params;
  const parsed = answerSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Resposta inválida." }, { status: 400 });
  }

  const exam = await prisma.exam.findUnique({
    where: { id: examId, status: "PUBLISHED" },
    include: {
      questions: {
        where: { number: parsed.data.number },
        include: { answerKey: true },
      },
    },
  });

  if (!exam || exam.questions.length !== 1) {
    return NextResponse.json({ error: "Questão não encontrada." }, {
      status: 404,
    });
  }

  const question = exam.questions[0];
  const correctAlternative = question.answerKey?.correctAlternative;

  if (!correctAlternative) {
    return NextResponse.json({ error: "Esta questão não possui gabarito." }, {
      status: 409,
    });
  }

  const attempt = await prisma.attempt.upsert({
    where: {
      userId_examId: {
        userId,
        examId,
      },
    },
    create: {
      userId,
      examId,
    },
    update: {},
  });

  if (parsed.data.selected === null) {
    await prisma.attemptAnswer.deleteMany({
      where: {
        attemptId: attempt.id,
        questionId: question.id,
      },
    });

    return NextResponse.json({
      status: correctAlternative === "ANULADA" ? "annulled" : "unanswered",
      isCorrect: false,
      correctAlternative:
        correctAlternative === "ANULADA" ? "ANULADA" : null,
    });
  }

  if (correctAlternative === "ANULADA") {
    await prisma.attemptAnswer.upsert({
      where: {
        attemptId_questionId: {
          attemptId: attempt.id,
          questionId: question.id,
        },
      },
      create: {
        attemptId: attempt.id,
        questionId: question.id,
        selected: parsed.data.selected,
        isCorrect: false,
      },
      update: {
        selected: parsed.data.selected,
        isCorrect: false,
      },
    });

    return NextResponse.json({
      status: "annulled",
      isCorrect: false,
      correctAlternative: "ANULADA",
    });
  }

  const isCorrect = parsed.data.selected === correctAlternative;

  await prisma.attemptAnswer.upsert({
    where: {
      attemptId_questionId: {
        attemptId: attempt.id,
        questionId: question.id,
      },
    },
    create: {
      attemptId: attempt.id,
      questionId: question.id,
      selected: parsed.data.selected,
      isCorrect,
    },
    update: {
      selected: parsed.data.selected,
      isCorrect,
    },
  });

  return NextResponse.json({
    status: isCorrect ? "correct" : "wrong",
    isCorrect,
    correctAlternative,
  });
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ examId: string }> },
) {
  const session = await getStudentSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Acesso restrito ao aluno." }, {
      status: 403,
    });
  }

  const userId = session.user.id;

  if (!userId) {
    return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });
  }

  const { examId } = await context.params;
  const attempt = await prisma.attempt.findUnique({
    where: {
      userId_examId: {
        userId,
        examId,
      },
    },
  });

  if (!attempt) {
    return NextResponse.json({ error: "Nenhuma resposta registrada." }, {
      status: 404,
    });
  }

  await prisma.attempt.update({
    where: { id: attempt.id },
    data: { submittedAt: new Date() },
  });

  return NextResponse.json({ message: "Gabarito concluído." });
}
