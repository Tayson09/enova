
"use client";

import { useState } from "react";
import Link from "next/link";
import { getSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

function StudyIllustration() {
  return (
    <svg viewBox="0 0 480 360" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-[500px]" aria-hidden="true">
      <circle cx="240" cy="180" r="148" fill="#EEF6FF"/>
      <circle cx="240" cy="180" r="112" fill="#DDEEFF"/>
      <rect x="102" y="74" width="276" height="212" rx="24" fill="white" className="shadow-sm"/>
      <rect x="102" y="74" width="276" height="52" rx="24" fill="#1677FF"/>
      <rect x="102" y="102" width="276" height="24" fill="#1677FF"/>
      <circle cx="130" cy="100" r="6" fill="white" fillOpacity=".75"/>
      <circle cx="150" cy="100" r="6" fill="white" fillOpacity=".45"/>
      <circle cx="170" cy="100" r="6" fill="white" fillOpacity=".25"/>
      <rect x="130" y="151" width="220" height="12" rx="6" fill="#D9E5F2"/>
      <rect x="130" y="175" width="178" height="12" rx="6" fill="#E7EEF6"/>
      <rect x="130" y="199" width="196" height="12" rx="6" fill="#E7EEF6"/>
      <rect x="130" y="223" width="78" height="34" rx="17" fill="#1677FF"/>
      <rect x="218" y="223" width="78" height="34" rx="17" fill="#E8F6EF"/>
      <circle cx="363" cy="254" r="50" fill="#27AE60"/>
      <path d="M339 254L355 270L388 236" stroke="white" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="96" cy="286" r="34" fill="#1677FF"/>
      <path d="M84 286H108M96 274V298" stroke="white" strokeWidth="7" strokeLinecap="round"/>
    </svg>
  );
}

export default function Home() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#F7FAFF]">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -left-32 top-36 h-72 w-72 rounded-full bg-[#1677FF]/8 blur-3xl" />
        <div className="absolute right-[-80px] top-[-60px] h-64 w-64 rounded-full bg-[#27AE60]/10 blur-3xl" />
      </div>

      <header className="relative z-10 mx-auto flex h-20 w-full max-w-7xl items-center px-6 md:px-10">
        <a href="#" className="text-2xl font-bold tracking-tight text-[#102A43]">
          enova<span className="text-[#27AE60]">.</span>
        </a>
      </header>

      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-80px)] w-full max-w-7xl items-center gap-10 px-6 pb-10 pt-2 md:px-10 lg:grid-cols-[1.12fr_.88fr] lg:gap-16 lg:pb-16">
        <div className="flex items-center justify-center lg:justify-start">
          <div className="w-full max-w-[560px]">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#1677FF]/15 bg-white px-3 py-1.5 text-xs font-semibold text-[#1677FF] shadow-sm">
              <span className="h-2 w-2 rounded-full bg-[#27AE60]" />
              Preparação inteligente para o ENEM
            </div>

            <h1 className="max-w-[540px] text-[40px] font-bold leading-[1.08] tracking-[-0.04em] text-[#102A43] sm:text-5xl lg:text-[58px]">
              Seu próximo resultado começa com{" "}
              <span className="text-[#1677FF]">uma boa estratégia.</span>
            </h1>

            <p className="mt-5 max-w-[500px] text-base leading-7 text-[#64748B]">
              Resolva questões, acompanhe seu progresso e transforme seus estudos em resultados reais.
            </p>

            <div className="-mt-2 hidden justify-center md:flex lg:justify-start">
              <StudyIllustration />
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[430px] rounded-[28px] border border-[#E7EEF6] bg-white p-6 shadow-[0_24px_70px_rgba(16,42,67,.10)] sm:p-9">
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-[#102A43]">
              Acesse sua conta
            </h2>
            <p className="mt-2 text-sm text-[#64748B]">
              Continue de onde parou.
            </p>
          </div>

          <form
            className="space-y-5"
            onSubmit={async (event) => {
              event.preventDefault();
              setError("");
              setIsSubmitting(true);

              const form = new FormData(event.currentTarget);
              const result = await signIn("credentials", {
                email: String(form.get("email")),
                password: String(form.get("password")),
                redirect: false,
              });

              setIsSubmitting(false);

              if (result?.error) {
                setError("E-mail ou senha incorretos.");
                return;
              }

              const session = await getSession();
              const extendedUser = session?.user as
                | { role?: "STUDENT" | "ADMIN" }
                | undefined;

              router.push(extendedUser?.role === "ADMIN" ? "/admin" : "/aluno");
            }}
          >
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-semibold text-[#334E68]">
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="voce@email.com"
                required
                className="h-12 w-full rounded-xl border border-[#DDE6EF] bg-white px-4 text-sm text-[#102A43] outline-none transition placeholder:text-[#9FB0C0] focus:border-[#1677FF] focus:ring-4 focus:ring-[#1677FF]/10"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-semibold text-[#334E68]">
                  Senha
                </label>
                <a href="#" className="text-xs font-semibold text-[#1677FF] hover:text-[#0E63D7]">
                  Esqueci minha senha
                </a>
              </div>

              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Digite sua senha"
                  required
                  className="h-12 w-full rounded-xl border border-[#DDE6EF] bg-white px-4 pr-20 text-sm text-[#102A43] outline-none transition placeholder:text-[#9FB0C0] focus:border-[#1677FF] focus:ring-4 focus:ring-[#1677FF]/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#64748B] hover:text-[#1677FF]"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </div>

            <label className="flex w-fit items-center gap-2 text-sm text-[#64748B]">
              <input
                type="checkbox"
                name="remember"
                className="h-4 w-4 rounded border-[#CDD8E3] accent-[#1677FF]"
              />
              Manter conectado
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="h-12 w-full rounded-xl bg-[#1677FF] text-sm font-bold text-white shadow-[0_10px_24px_rgba(22,119,255,.22)] transition hover:bg-[#0E63D7] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Entrando..." : "Entrar"}
            </button>

            {error ? (
              <p role="alert" className="text-center text-sm font-medium text-red-600">
                {error}
              </p>
            ) : null}
          </form>

          <div className="mt-7 flex items-center gap-3">
            <span className="h-px flex-1 bg-[#EDF2F7]" />
            <span className="text-xs text-[#94A3B8]">novo por aqui?</span>
            <span className="h-px flex-1 bg-[#EDF2F7]" />
          </div>

          <Link
            href="/register"
            className="mt-5 flex h-12 items-center justify-center rounded-xl border border-[#CFE8DA] bg-[#F7FCFA] text-sm font-bold text-[#238B57] transition hover:border-[#27AE60] hover:bg-[#EFF9F4]"
          >
            Criar uma conta
          </Link>
        </div>
      </section>
    </main>
  );
}
 