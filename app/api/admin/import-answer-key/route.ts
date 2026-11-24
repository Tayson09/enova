import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { extractAnswerKey } from "@/lib/answer-key";
import { prisma } from "@/lib/prisma";

const metadataSchema = z.object({
  year: z.coerce.number().int().min(1998).max(2100),
  edition: z.string().trim().min(2).max(100),
  application: z.string().trim().min(2).max(100),
  day: z.enum(["DAY_1", "DAY_2"]),
  color: z.enum([
    "BLUE",
    "PINK",
    "YELLOW",
    "WHITE",
    "GREEN",
    "ORANGE",
    "GRAY",
    "BROWN",
    "UNKNOWN",
  ]),
  foreignLanguage: z.enum(["ENGLISH", "SPANISH", "NONE"]),
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const role =
    "role" in session.user && session.user.role === "ADMIN"
      ? session.user.role
      : "STUDENT";

  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso restrito ao administrador." }, {
      status: 403,
    });
  }

  const formData = await request.formData();
  const parsedMetadata = metadataSchema.safeParse({
    year: formData.get("year"),
    edition: formData.get("edition"),
    application: formData.get("application"),
    day: formData.get("day"),
    color: formData.get("color"),
    foreignLanguage: formData.get("foreignLanguage"),
  });

  if (!parsedMetadata.success) {
    return NextResponse.json(
      { error: "Preencha os dados da prova corretamente." },
      { status: 400 },
    );
  }

  const file = formData.get("pdf");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Selecione o PDF oficial do gabarito." },
      { status: 400 },
    );
  }

  if (file.type !== "application/pdf") {
    return NextResponse.json(
      { error: "O arquivo enviado precisa ser um PDF." },
      { status: 400 },
    );
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json(
      { error: "O PDF pode ter no máximo 10 MB." },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  if (buffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
    return NextResponse.json(
      { error: "Este não é um arquivo PDF válido." },
      { status: 400 },
    );
  }

  let extractedText = "";

  try {
    const workerPath = path.resolve(
      process.cwd(),
      "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs",
    );
    const workerUrl = pathToFileURL(workerPath).href;
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(buffer),
      useWorkerFetch: false,
    });
    const document = await loadingTask.promise;
    const pageTexts: string[] = [];

    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const lines = new Map<number, Array<{ x: number; text: string }>>();

      for (const item of textContent.items) {
        if (!("str" in item) || !("transform" in item)) {
          continue;
        }

        const y = Math.round(item.transform[5] / 2) * 2;
        const line = lines.get(y) ?? [];
        line.push({ x: item.transform[4], text: item.str });
        lines.set(y, line);
      }

      const orderedLines = [...lines.entries()]
        .sort(([yA], [yB]) => yB - yA)
        .map(([, line]) =>
          line
            .sort((itemA, itemB) => itemA.x - itemB.x)
            .map((item) => item.text)
            .join(" "),
        );

      pageTexts.push(orderedLines.join("\n"));
      page.cleanup();
    }

    extractedText = pageTexts.join("\n");
    await loadingTask.destroy();
  } catch (error) {
    console.error("Falha ao extrair texto do PDF:", error);

    const details =
      error instanceof Error
        ? error.message
        : "Erro desconhecido ao processar o PDF.";

    return NextResponse.json(
      {
        error: "Não foi possível ler o PDF enviado.",
        details,
      },
      { status: 422 },
    );
  }

  const extracted = extractAnswerKey(extractedText, parsedMetadata.data.day);

  if (extracted.missing.length > 0) {
    return NextResponse.json(
      {
        error: "O gabarito não foi identificado por completo.",
        missing: extracted.missing,
        foundCount: Object.keys(extracted.answers).length,
      },
      { status: 422 },
    );
  }

  const {
    year,
    edition,
    application,
    day,
    color,
  } = parsedMetadata.data;
  const foreignLanguage = parsedMetadata.data.foreignLanguage;

  await prisma.$transaction(async (transaction) => {
    const exam = await transaction.exam.upsert({
      where: {
        year_edition_application_day_color_foreignLanguage: {
          year,
          edition,
          application,
          day,
          color,
          foreignLanguage,
        },
      },
      create: {
        title: `ENEM ${year} - ${edition} - ${application}`,
        year,
        edition,
        application,
        day,
        color,
        foreignLanguage,
        status: "REVIEW",
        importStatus: "COMPLETED",
      },
      update: {
        title: `ENEM ${year} - ${edition} - ${application}`,
        status: "REVIEW",
        importStatus: "COMPLETED",
      },
    });

    await transaction.answerKey.deleteMany({
      where: { examId: exam.id },
    });

    await transaction.question.deleteMany({
      where: { examId: exam.id },
    });

    const start = day === "DAY_1" ? 1 : 91;
    const end = day === "DAY_1" ? 90 : 180;

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
          correctAlternative: extracted.answers[number],
        },
      });
    }
  });

  return NextResponse.json({
    message: "Gabarito importado e aguardando revisão.",
    examId: (
      await prisma.exam.findUnique({
        where: {
          year_edition_application_day_color_foreignLanguage: {
            year,
            edition,
            application,
            day,
            color,
            foreignLanguage,
          },
        },
        select: { id: true },
      })
    )?.id,
  });
}
