import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const registrationSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().transform((email) => email.toLowerCase()),
  password: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  const json = await request.json();
  const parsed = registrationSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Preencha os dados corretamente." },
      { status: 400 },
    );
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (existingUser) {
    return NextResponse.json(
      { error: "Este e-mail já está cadastrado." },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      password: passwordHash,
      role: "STUDENT",
    },
  });

  return NextResponse.json(
    { message: "Conta criada com sucesso." },
    { status: 201 },
  );
}
