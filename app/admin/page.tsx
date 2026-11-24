import { redirect } from "next/navigation";
import Link from "next/link";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AdminImportForm } from "./AdminImportForm";

export const instant = false;

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  const role =
    "role" in session.user &&
    (session.user.role === "STUDENT" || session.user.role === "ADMIN")
      ? session.user.role
      : "STUDENT";

  if (role !== "ADMIN") {
    redirect("/aluno");
  }

  const exams = await prisma.exam.findMany({
    orderBy: [{ year: "desc" }, { day: "asc" }],
    include: {
      _count: {
        select: { answerKeys: true },
      },
    },
  });

  return (
    <main className="min-h-screen bg-[#F7FAFF] px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[#64748B]">Painel administrativo</p>
            <h1 className="mt-1 text-3xl font-bold text-[#102A43]">Gabaritos</h1>
          </div>

          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button className="rounded-xl border border-[#DDE6EF] bg-white px-4 py-2 text-sm font-semibold text-[#334E68]">
              Sair
            </button>
          </form>
        </header>

        <section className="mt-10 rounded-[28px] border border-[#E7EEF6] bg-white p-8">
          <h2 className="text-xl font-bold text-[#102A43]">Importar prova</h2>
          <p className="mt-2 text-sm text-[#64748B]">
            Faça upload do PDF oficial. Apenas o gabarito será extraído.
          </p>
          <AdminImportForm />
        </section>

        {exams.length > 0 ? (
          <section className="mt-6 rounded-[28px] border border-[#E7EEF6] bg-white p-8">
            <h2 className="text-xl font-bold text-[#102A43]">Provas cadastradas</h2>
            <div className="mt-5 space-y-3">
              {exams.map((exam) => (
                <article
                  key={exam.id}
                  className="flex flex-col gap-2 rounded-xl border border-[#EDF2F7] p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-[#102A43]">{exam.title}</p>
                    <p className="mt-1 text-sm text-[#64748B]">
                      {exam._count.answerKeys} respostas · {exam.status} ·{" "}
                      {exam.color} ·{" "}
                      {exam.foreignLanguage === "NONE"
                        ? "Sem língua estrangeira"
                        : exam.foreignLanguage}
                    </p>
                  </div>
                  <Link
                    href={`/admin/provas/${exam.id}/revisar`}
                    className="h-10 shrink-0 rounded-lg border border-[#1677FF]/20 px-4 text-sm font-bold text-[#1677FF] flex items-center justify-center"
                  >
                    Revisar
                  </Link>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
