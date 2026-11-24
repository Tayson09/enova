"use client";

import { useState } from "react";

type Answer = {
  number: number;
  alternative: string;
};

type Props = {
  examId: string;
  initialStatus: string;
  answers: Answer[];
};

export function AnswerReviewForm({
  examId,
  initialStatus,
  answers,
}: Props) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(
      answers.map((answer) => [
        String(answer.number),
        ["A", "B", "C", "D", "E", "ANULADA"].includes(answer.alternative)
          ? answer.alternative
          : "ANULADA",
      ]),
    ),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function saveReview() {
    setIsSaving(true);
    setMessage("");
    setError("");

    const response = await fetch(`/api/admin/exams/${examId}/review`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Não foi possível salvar a revisão.");
    } else {
      setMessage(data.message);
    }

    setIsSaving(false);
  }

  async function publishExam() {
    setIsPublishing(true);
    setMessage("");
    setError("");

    const saveResponse = await fetch(`/api/admin/exams/${examId}/review`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!saveResponse.ok) {
      const saveError = await saveResponse.json();
      setError(saveError.error ?? "Não foi possível salvar antes da publicação.");
      setIsPublishing(false);
      return;
    }

    const response = await fetch(`/api/admin/exams/${examId}/publish`, {
      method: "POST",
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Não foi possível publicar o gabarito.");
    } else {
      setMessage(data.message);
      window.location.reload();
    }

    setIsPublishing(false);
  }

  return (
    <section className="mt-8 rounded-[28px] border border-[#E7EEF6] bg-white p-6 sm:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-[#64748B]">
          Status: {initialStatus}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={saveReview}
            disabled={isSaving || isPublishing}
            className="h-11 rounded-xl border border-[#DDE6EF] px-4 text-sm font-bold text-[#334E68] disabled:opacity-60"
          >
            {isSaving ? "Salvando..." : "Salvar revisão"}
          </button>
          <button
            type="button"
            onClick={publishExam}
            disabled={isSaving || isPublishing || initialStatus === "PUBLISHED"}
            className="h-11 rounded-xl bg-[#27AE60] px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPublishing ? "Publicando..." : "Publicar gabarito"}
          </button>
        </div>
      </div>

      {message ? (
        <p role="status" className="mb-5 rounded-xl bg-[#EFF9F4] p-3 text-sm font-semibold text-[#238B57]">
          {message}
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="mb-5 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {answers.map((answer) => (
          <label
            key={answer.number}
            className="flex items-center justify-between rounded-xl border border-[#E7EEF6] px-3 py-2"
          >
            <span className="text-sm font-bold text-[#102A43]">
              {answer.number}
            </span>
            <select
              aria-label={`Questão ${answer.number}`}
              value={values[String(answer.number)]}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  [String(answer.number)]: event.target.value,
                }))
              }
              className="h-9 rounded-lg border border-[#DDE6EF] bg-white px-2 text-sm font-semibold outline-none focus:border-[#1677FF]"
            >
              {["A", "B", "C", "D", "E", "ANULADA"].map((alternative) => (
                <option key={alternative} value={alternative}>
                  {alternative}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
    </section>
  );
}
