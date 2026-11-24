"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type AnswerStatus = "correct" | "wrong" | "annulled" | "unanswered";

type InitialAnswer = {
  selected: string;
  status: Exclude<AnswerStatus, "unanswered">;
};

type Props = {
  examId: string;
  title: string;
  day: "DAY_1" | "DAY_2";
  color: string;
  language: string;
  numbers: number[];
  annulledNumbers: number[];
  initialAnswers: Record<number, InitialAnswer>;
};

const alternatives = ["A", "B", "C", "D", "E"] as const;

export function AnswerSheet({
  examId,
  title,
  day,
  color,
  language,
  numbers,
  annulledNumbers,
  initialAnswers,
}: Props) {
  const [answers, setAnswers] =
    useState<Record<number, InitialAnswer>>(initialAnswers);
  const [activeNumber, setActiveNumber] = useState(numbers[0]);
  const [savingNumber, setSavingNumber] = useState<number | null>(null);
  const [finishMessage, setFinishMessage] = useState("");
  const [pulse, setPulse] = useState<{
    number: number;
    status: AnswerStatus;
  } | null>(null);

  const stats = useMemo(() => {
    const values = numbers.map((number) => answers[number]);
    const annulled = annulledNumbers.length;
    const correct = values.filter((answer) => answer?.status === "correct").length;
    const wrong = values.filter((answer) => answer?.status === "wrong").length;
    const answered = correct + wrong;
    const normalBlank = numbers.filter(
      (number) =>
        !annulledNumbers.includes(number) &&
        !answers[number],
    ).length;
    const filled = numbers.filter(
      (number) => answers[number] || annulledNumbers.includes(number),
    ).length;

    return {
      correct,
      wrong,
      annulled,
      blank: normalBlank,
      answered,
      progress: Math.round((filled / numbers.length) * 100),
      accuracy: answered > 0 ? Math.round((correct / answered) * 100) : 0,
    };
  }, [answers, annulledNumbers, numbers]);

  async function selectAnswer(number: number, selected: string) {
    const current = answers[number];
    const nextSelected = current?.selected === selected ? null : selected;

    setSavingNumber(number);
    setFinishMessage("");

    try {
      const response = await fetch(`/api/aluno/exams/${examId}/answer`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number, selected: nextSelected }),
      });

      const data = await response.json();

      if (!response.ok) {
        setSavingNumber(null);
        return;
      }

      if (nextSelected === null) {
        setAnswers((currentAnswers) => {
          const next = { ...currentAnswers };
          delete next[number];
          return next;
        });
        setPulse({ number, status: "unanswered" });
      } else {
        setAnswers((currentAnswers) => ({
          ...currentAnswers,
          [number]: {
            selected: nextSelected,
            status: data.status,
          },
        }));
        setPulse({ number, status: data.status });
      }
    } finally {
      setSavingNumber(null);
      window.setTimeout(() => setPulse(null), 650);
    }
  }

  async function finishAttempt() {
    setFinishMessage("");

    const response = await fetch(`/api/aluno/exams/${examId}/answer`, {
      method: "POST",
    });
    const data = await response.json();

    setFinishMessage(
      response.ok
        ? `${data.message} Você acertou ${stats.correct} de ${stats.answered} respondidas.`
        : data.error ?? "Não foi possível finalizar.",
    );
  }

  const activeAnswer = answers[activeNumber];

  return (
    <main className="answer-sheet-shell min-h-screen overflow-hidden">
      <div className="answer-ambient answer-ambient-one" />
      <div className="answer-ambient answer-ambient-two" />

      <header className="relative z-10 border-b border-white/70 bg-white/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/aluno"
            className="group flex items-center gap-3 text-[#102A43]"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#DDE6EF] bg-white text-lg transition group-hover:-translate-x-1">
              ←
            </span>
            <span className="hidden sm:block">
              <span className="block text-xs font-semibold text-[#64748B]">
                Voltar
              </span>
              <span className="block text-sm font-bold">Meus gabaritos</span>
            </span>
          </Link>

          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#1677FF]">
              Modo prova
            </p>
            <h1 className="mt-0.5 max-w-[240px] truncate text-sm font-extrabold text-[#102A43] sm:max-w-none sm:text-base">
              {title}
            </h1>
          </div>

          <button
            type="button"
            onClick={finishAttempt}
            className="finish-button h-10 rounded-full px-4 text-xs font-extrabold text-white sm:px-5"
          >
            Finalizar
          </button>
        </div>
      </header>

      <div className="relative z-10 mx-auto grid max-w-[1500px] gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[1fr_290px] lg:px-8">
        <section className="min-w-0">
          <div className="mb-4 grid grid-cols-3 gap-2 sm:flex sm:gap-3">
            <div className="answer-metric answer-metric-correct">
              <span className="answer-metric-label">Acertos</span>
              <strong>{stats.correct}</strong>
            </div>
            <div className="answer-metric answer-metric-wrong">
              <span className="answer-metric-label">Erros</span>
              <strong>{stats.wrong}</strong>
            </div>
            <div className="answer-metric">
              <span className="answer-metric-label">Respondidas</span>
              <strong>{stats.answered}</strong>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/80 bg-white/88 p-4 shadow-[0_18px_60px_rgba(16,42,67,.10)] backdrop-blur-xl sm:p-6">
            <div className="mb-5 flex items-end justify-between">
              <div>
                <p className="text-xs font-bold text-[#1677FF]">
                  Questão {activeNumber}
                </p>
                <h2 className="mt-1 text-xl font-extrabold text-[#102A43] sm:text-2xl">
                  Marque sua resposta
                </h2>
              </div>
              <span className="rounded-full bg-[#EFF5FF] px-3 py-1.5 text-xs font-bold text-[#1677FF]">
                {day === "DAY_1" ? "1º DIA" : "2º DIA"}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2 sm:gap-3">
              {alternatives.map((alternative) => {
                const isSelected = activeAnswer?.selected === alternative;
                const status = isSelected ? activeAnswer.status : undefined;

                return (
                  <button
                    key={alternative}
                    type="button"
                    disabled={savingNumber === activeNumber}
                    onClick={() => selectAnswer(activeNumber, alternative)}
                    className={[
                      "answer-choice",
                      isSelected && status === "correct"
                        ? "answer-choice-correct"
                        : "",
                      isSelected && status === "wrong"
                        ? "answer-choice-wrong"
                        : "",
                      isSelected && status === "annulled"
                        ? "answer-choice-annulled"
                        : "",
                      isSelected ? "answer-choice-selected" : "",
                      pulse?.number === activeNumber &&
                      pulse.status === "correct" &&
                      isSelected
                        ? "answer-pulse-correct"
                        : "",
                      pulse?.number === activeNumber &&
                      pulse.status === "wrong" &&
                      isSelected
                        ? "answer-pulse-wrong"
                        : "",
                    ].join(" ")}
                  >
                    <span>{alternative}</span>
                  </button>
                );
              })}
            </div>

            <div
              className={[
                "mt-5 min-h-12 rounded-2xl px-4 py-3 text-sm transition",
                activeAnswer?.status === "correct"
                  ? "answer-feedback-correct"
                  : "",
                activeAnswer?.status === "wrong"
                  ? "answer-feedback-wrong"
                  : "",
                activeAnswer?.status === "annulled"
                  ? "answer-feedback-annulled"
                  : "",
                !activeAnswer ? "bg-[#F7F9FC] text-[#64748B]" : "",
              ].join(" ")}
            >
              {!activeAnswer
                ? "Escolha uma alternativa para conferir sua resposta."
                : activeAnswer.status === "correct"
                  ? "Resposta correta."
                  : activeAnswer.status === "wrong"
                    ? "Resposta incorreta."
                    : "Questão anulada."}
            </div>

            {finishMessage ? (
              <div
                role="status"
                className="mt-4 rounded-2xl border border-[#DDE6EF] bg-[#F8FAFC] px-4 py-3 text-sm font-semibold text-[#334E68]"
              >
                {finishMessage}
              </div>
            ) : null}
          </div>

          <div className="mt-5 rounded-[28px] border border-white/80 bg-white/88 p-4 shadow-[0_18px_60px_rgba(16,42,67,.08)] backdrop-blur-xl sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-[#102A43]">
                Navegação rápida
              </h2>
              <span className="text-xs font-semibold text-[#64748B]">
                {stats.progress}% preenchido
              </span>
            </div>

            <div className="answer-number-grid">
              {numbers.map((number) => {
                const answer = answers[number];
                const isAnnulled = annulledNumbers.includes(number);
                const isActive = activeNumber === number;

                return (
                  <button
                    key={number}
                    type="button"
                    onClick={() => setActiveNumber(number)}
                    className={[
                      "answer-number",
                      isActive ? "answer-number-active" : "",
                      isAnnulled ? "answer-number-annulled" : "",
                      answer?.status === "correct"
                        ? "answer-number-correct"
                        : "",
                      answer?.status === "wrong"
                        ? "answer-number-wrong"
                        : "",
                    ].join(" ")}
                    aria-label={`Questão ${number}${answer ? `, selecionada ${answer.selected}` : ""}`}
                  >
                    {number}
                    {answer ? (
                      <span>{answer.selected}</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="overflow-hidden rounded-[28px] border border-white/80 bg-[#102A43] p-5 text-white shadow-[0_24px_70px_rgba(16,42,67,.22)]">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#80B7FF]">
              Seu desempenho
            </p>

            <div className="mt-5 flex items-end justify-between">
              <div>
                <strong className="text-5xl tracking-tight">
                  {stats.accuracy}
                </strong>
                <span className="ml-1 text-lg text-white/70">%</span>
              </div>
              <span className="mb-1 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold">
                precisão
              </span>
            </div>

            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#1677FF] to-[#27AE60] transition-[width] duration-700"
                style={{ width: `${stats.accuracy}%` }}
              />
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/[.07] p-3">
                <span className="block text-xs text-white/60">Em branco</span>
                <strong className="mt-1 block text-xl">{stats.blank}</strong>
              </div>
              <div className="rounded-2xl bg-white/[.07] p-3">
                <span className="block text-xs text-white/60">Anuladas</span>
                <strong className="mt-1 block text-xl">{stats.annulled}</strong>
              </div>
            </div>

            <div className="mt-5 border-t border-white/10 pt-5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/60">Preenchimento</span>
                <span className="font-bold">{stats.progress}%</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[#1677FF] transition-[width] duration-700"
                  style={{ width: `${stats.progress}%` }}
                />
              </div>
            </div>

            <div className="mt-5 flex items-center gap-2 text-xs text-white/60">
              <span className="h-2 w-2 rounded-full bg-[#27AE60] shadow-[0_0_12px_#27AE60]" />
              Respostas salvas automaticamente
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-[#E7EEF6] bg-white/85 p-4 text-xs text-[#64748B] backdrop-blur-xl">
            <span className="font-bold text-[#102A43]">{color}</span>
            <span> · {language === "NONE" ? "Sem língua estrangeira" : language}</span>
          </div>
        </aside>
      </div>
    </main>
  );
}
