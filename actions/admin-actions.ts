"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { importExamProblems } from "@/lib/problem-import";

export type ImportState = {
  error?: string;
  success?: string;
};

export async function importProblemsAction(_state: ImportState, formData: FormData): Promise<ImportState> {
  await requireAdmin();

  const raw = formData.get("payload");
  if (typeof raw !== "string" || raw.trim().length === 0) {
    return { error: "Lim inn JSON først." };
  }

  try {
    const payload = JSON.parse(raw);
    const result = await importExamProblems(prisma, payload);
    revalidatePath("/tema");
    revalidatePath("/dashboard");
    return { success: `Importerte/oppdaterte ${result.imported} oppgaver.` };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Import feilet." };
  }
}
