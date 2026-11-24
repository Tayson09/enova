"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function RegisterPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const form = new FormData(event.currentTarget);
    const name = String(form.get("name"));
    const email = String(form.get("email"));
    const password = String(form.get("password"));

    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Não foi possível criar sua conta.");
      setIsSubmitting(false);
      return;
    }

    await signIn("credentials", {
      email,
      password,
      callbackUrl: "/aluno",
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7FAFF] px-6">
      <section className="w-full max-w-[430px] rounded-[28px] border border-[#E7EEF6] bg-white p-6 shadow-[0_24px_70px_rgba(16,42,67,.10)] sm:p-9">
        <h1 className="text-2xl font-bold tracking-tight text-[#102A43]">
          Criar conta
        </h1>
        <p className="mt-2 text-sm text-[#64748B]">
          Comece a acompanhar seu desempenho no ENEM.
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-semibold text-[#334E68]">
              Nome
            </label>
            <input
              id="name"
              name="name"
              minLength={2}
              maxLength={100}
              required
              autoComplete="name"
              className="h-12 w-full rounded-xl border border-[#DDE6EF] px-4 text-sm outline-none focus:border-[#1677FF] focus:ring-4 focus:ring-[#1677FF]/10"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-semibold text-[#334E68]">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="h-12 w-full rounded-xl border border-[#DDE6EF] px-4 text-sm outline-none focus:border-[#1677FF] focus:ring-4 focus:ring-[#1677FF]/10"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-semibold text-[#334E68]">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              minLength={8}
              maxLength={128}
              required
              autoComplete="new-password"
              className="h-12 w-full rounded-xl border border-[#DDE6EF] px-4 text-sm outline-none focus:border-[#1677FF] focus:ring-4 focus:ring-[#1677FF]/10"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-12 w-full rounded-xl bg-[#1677FF] text-sm font-bold text-white disabled:opacity-60"
          >
            {isSubmitting ? "Criando conta..." : "Criar conta"}
          </button>

          {error ? (
            <p role="alert" className="text-center text-sm font-medium text-red-600">
              {error}
            </p>
          ) : null}
        </form>

        <Link href="/" className="mt-6 block text-center text-sm font-semibold text-[#1677FF]">
          Já tenho uma conta
        </Link>
      </section>
    </main>
  );
}
