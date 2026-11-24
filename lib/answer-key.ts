export type ExtractedAnswerKey = {
  answers: Record<number, "A" | "B" | "C" | "D" | "E" | "ANULADA">;
  missing: number[];
};

export type AnswerKeyDay = "DAY_1" | "DAY_2";

export function extractAnswerKey(
  text: string,
  day: AnswerKeyDay,
): ExtractedAnswerKey {
  const answers: ExtractedAnswerKey["answers"] = {};
  const start = day === "DAY_1" ? 1 : 91;
  const end = day === "DAY_1" ? 90 : 180;

  const normalized = text
    .replace(/\u00a0/g, " ")
    .replace(/[—–]/g, "-")
    .replace(/\t/g, " ")
    .replace(/\r/g, "\n");

  const patterns = [
    /(?:^|[\s|;])0*(\d{1,3})\s*(?:[-.:]\s*)?([A-E])(?=[\s|;,]|$)/gim,
    /\b([A-E])[ \t]*(?:[-.:][ \t]*)?0*(\d{1,3})\b/gim,
    /(?:^|[\s|;])0*(\d{1,3})[ \t]*(?:[-.:][ \t]*)?(?:ANULADA|ANULADO)(?=[\s|;,]|$)/gim,
    /\b(?:ANULADA|ANULADO)\b[ \t]*(?:[-.:][ \t]*)?0*(\d{1,3})(?=[\s|;,]|$)/gim,
  ];

  for (const pattern of patterns) {
    for (const match of normalized.matchAll(pattern)) {
      let number: number;
      let letter: "A" | "B" | "C" | "D" | "E" | "ANULADA";

      if (pattern === patterns[0]) {
        number = Number(match[1]);
        letter = match[2].toUpperCase() as "A" | "B" | "C" | "D" | "E";
      } else if (pattern === patterns[1]) {
        number = Number(match[2]);
        letter = match[1].toUpperCase() as "A" | "B" | "C" | "D" | "E";
      } else if (pattern === patterns[2]) {
        number = Number(match[1]);
        letter = "ANULADA";
      } else {
        number = Number(match[1]);
        letter = "ANULADA";
      }

      if (number >= start && number <= end) {
        answers[number] = letter as "A" | "B" | "C" | "D" | "E";
      }
    }
  }

  const missing: number[] = [];

  for (let number = start; number <= end; number += 1) {
    if (!answers[number]) {
      missing.push(number);
    }
  }

  return { answers, missing };
}
