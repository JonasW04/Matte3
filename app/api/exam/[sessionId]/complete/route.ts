import { NextResponse } from "next/server";
import { completeExamSessionById } from "@/actions/exam-actions";
import { getCurrentUser } from "@/lib/auth";

export async function POST(_request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionId } = await params;
  await completeExamSessionById(sessionId, user.id);
  return NextResponse.json({ ok: true });
}
