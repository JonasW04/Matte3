"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSession, destroySession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type AuthFormState = {
  error?: string;
};

const loginSchema = z.object({
  email: z.string().email("Skriv inn en gyldig e-post."),
  password: z.string().min(1, "Skriv inn passord.")
});

const registerSchema = z.object({
  name: z.string().min(2, "Skriv inn navn."),
  email: z.string().email("Skriv inn en gyldig e-post."),
  password: z.string().min(8, "Passord må ha minst 8 tegn.")
});

export async function loginAction(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ugyldig innlogging." };
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!user) {
    return { error: "Feil e-post eller passord." };
  }

  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) {
    return { error: "Feil e-post eller passord." };
  }

  await createSession(user.id);
  redirect("/dashboard");
}

export async function registerAction(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ugyldig registrering." };
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (existing) {
    return { error: "Det finnes allerede en bruker med denne e-posten." };
  }

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      passwordHash: await bcrypt.hash(parsed.data.password, 12)
    }
  });

  await createSession(user.id);
  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
