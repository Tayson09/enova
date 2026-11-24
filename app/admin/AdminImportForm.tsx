"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ImportResponse = {
  message?: string;
  examId?: string;
  error?: string;
  details?: string;
  missing?: number[];
  foundCount?: number;
};

export function AdminImportForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [response, setResponse] = useState<ImportResponse | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setResponse(null);

    const formData = new FormData(event.currentTarget);

    try {
      const result = await fetch("/api/admin/import-answer-key", {
        method: "POST",
        body: formData,
      });

      const data = (await result.json()) as ImportResponse;
      setResponse(data);

      if (result.ok && data.examId) {
        router.push(`/admin/provas/${data.examId}/revisar`);
      }
    } catch {
      setResponse({
        error: "Não foi possível enviar o PDF.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 grid gap-5 md:grid-cols-2">
      <div>
        <label htmlFor="year" className="mb-2 block text-sm font-semibold text-[#334E68]">
          Ano
        </label>
        <input
          id="year"
          name="year"
          type="number"
          min={1998}
          max={2100}
          defaultValue={new Date().getFullYear()}
          required
          className="h-12 w-full rounded-xl border border-[#DDE6EF] px-4 text-sm outline-none focus:border-[#1677FF] focus:ring-4 focus:ring-[#1677FF]/10"
        />
      </div>

      <div>
        <label htmlFor="edition" className="mb-2 block text-sm font-semibold text-[#334E68]">
          Edição
        </label>
        <input
          id="edition"
          name="edition"
          placeholder="Regular"
          defaultValue="Regular"
          required
          className="h-12 w-full rounded-xl border border-[#DDE6EF] px-4 text-sm outline-none focus:border-[#1677FF] focus:ring-4 focus:ring-[#1677FF]/10"
        />
      </div>

      <div>
        <label htmlFor="application" className="mb-2 block text-sm font-semibold text-[#334E68]">
          Aplicação
        </label>
        <input
          id="application"
          name="application"
          placeholder="Aplicação regular"
          defaultValue="Aplicação regular"
          required
          className="h-12 w-full rounded-xl border border-[#DDE6EF] px-4 text-sm outline-none focus:border-[#1677FF] focus:ring-4 focus:ring-[#1677FF]/10"
        />
      </div>

      <div>
        <label htmlFor="day" className="mb-2 block text-sm font-semibold text-[#334E68]">
          Dia da prova
        </label>
        <select
          id="day"
          name="day"
          required
          className="h-12 w-full rounded-xl border border-[#DDE6EF] bg-white px-4 text-sm outline-none focus:border-[#1677FF] focus:ring-4 focus:ring-[#1677FF]/10"
        >
          <option value="DAY_1">Primeiro dia</option>
          <option value="DAY_2">Segundo dia</option>
        </select>
      </div>

      <div>
        <label htmlFor="color" className="mb-2 block text-sm font-semibold text-[#334E68]">
          Cor do caderno
        </label>
        <select
          id="color"
          name="color"
          required
          className="h-12 w-full rounded-xl border border-[#DDE6EF] bg-white px-4 text-sm outline-none focus:border-[#1677FF] focus:ring-4 focus:ring-[#1677FF]/10"
        >
          <option value="BLUE">Azul</option>
          <option value="PINK">Rosa</option>
          <option value="YELLOW">Amarela</option>
          <option value="WHITE">Branca</option>
          <option value="GREEN">Verde</option>
          <option value="ORANGE">Laranja</option>
          <option value="GRAY">Cinza</option>
          <option value="BROWN">Marrom</option>
        </select>
      </div>

      <div>
        <label htmlFor="foreignLanguage" className="mb-2 block text-sm font-semibold text-[#334E68]">
          Língua estrangeira
        </label>
        <select
          id="foreignLanguage"
          name="foreignLanguage"
          required
          className="h-12 w-full rounded-xl border border-[#DDE6EF] bg-white px-4 text-sm outline-none focus:border-[#1677FF] focus:ring-4 focus:ring-[#1677FF]/10"
        >
          <option value="NONE">Nenhuma / não se aplica</option>
          <option value="ENGLISH">Inglês</option>
          <option value="SPANISH">Espanhol</option>
        </select>
      </div>

      <div className="md:col-span-2">
        <label htmlFor="pdf" className="mb-2 block text-sm font-semibold text-[#334E68]">
          PDF oficial do gabarito
        </label>
        <input
          id="pdf"
          name="pdf"
          type="file"
          accept="application/pdf,.pdf"
          required
          className="block w-full rounded-xl border border-[#DDE6EF] bg-white text-sm file:mr-4 file:h-12 file:border-0 file:bg-[#1677FF] file:px-5 file:font-semibold file:text-white"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="h-12 rounded-xl bg-[#1677FF] text-sm font-bold text-white shadow-[0_10px_24px_rgba(22,119,255,.22)] disabled:cursor-not-allowed disabled:opacity-60 md:col-span-2"
      >
        {isSubmitting ? "Importando gabarito..." : "Importar gabarito"}
      </button>

      {response?.message ? (
        <p role="status" className="text-sm font-semibold text-[#238B57] md:col-span-2">
          {response.message}
        </p>
      ) : null}

      {response?.error ? (
        <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700 md:col-span-2">
          <p className="font-semibold">{response.error}</p>
          {response.details ? (
            <p className="mt-1 break-words font-mono text-xs">{response.details}</p>
          ) : null}
          {response.foundCount !== undefined ? (
            <p className="mt-1">
              Respostas encontradas: {response.foundCount}. Questões não identificadas:{" "}
              {response.missing?.join(", ") || "nenhuma"}.
            </p>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
