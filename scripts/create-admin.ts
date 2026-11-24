import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

async function main() {
  const name = process.env.ADMIN_NAME?.trim();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!name || !email || !password) {
    throw new Error(
      "Configure ADMIN_NAME, ADMIN_EMAIL e ADMIN_PASSWORD no arquivo .env.",
    );
  }

  if (password.length < 12) {
    throw new Error("A senha do administrador deve ter pelo menos 12 caracteres.");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    create: {
      name,
      email,
      password: passwordHash,
      role: "ADMIN",
    },
    update: {
      name,
      password: passwordHash,
      role: "ADMIN",
    },
  });

  console.log(`Administrador criado ou atualizado: ${email}`);
}

main()
  .finally(() => prisma.$disconnect())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
