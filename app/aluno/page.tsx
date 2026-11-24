import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const instant = false;

export default async function StudentPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  const role =
    "role" in session.user &&
    (session.user.role === "STUDENT" || session.user.role === "ADMIN")
      ? session.user.role
      : "STUDENT";

  if (role === "ADMIN") {
    redirect("/admin");
  }

  const exams = await prisma.exam.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ year: "desc" }, { day: "asc" }],
  });

  return (
    <main className="min-h-screen bg-[#F7FAFF] px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[#64748B]">Área do aluno</p>
            <h1 className="mt-1 text-3xl font-bold text-[#102A43]">
              Olá, {session.user.name}
            </h1>
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
          <h2 className="text-xl font-bold text-[#102A43]">Escolha uma prova</h2>
          {exams.length === 0 ? (
            <p className="mt-2 text-sm text-[#64748B]">
              Nenhuma prova publicada.
            </p>
          ) : (
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {exams.map((exam) => (
                <Link
                  key={exam.id}
                  href={`/aluno/provas/${exam.id}`}
                  className="rounded-xl border border-[#E7EEF6] p-4 transition hover:border-[#1677FF]/30"
                >
                  <p className="font-bold text-[#102A43]">{exam.title}</p>
                  <p className="mt-1 text-sm text-[#64748B]">
                    {exam.day === "DAY_1" ? "Primeiro dia" : "Segundo dia"} ·{" "}
                    {exam.color}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
