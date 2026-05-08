"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock } from "lucide-react";

export function ExamTimer({ sessionId, startedAt, timeLimitMinutes }: { sessionId: string; startedAt: string; timeLimitMinutes: number | null }) {
  const router = useRouter();
  const endsAt = useMemo(() => {
    if (!timeLimitMinutes) return null;
    return new Date(startedAt).getTime() + timeLimitMinutes * 60 * 1000;
  }, [startedAt, timeLimitMinutes]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!endsAt) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [endsAt]);

  useEffect(() => {
    if (!endsAt || now < endsAt) return;
    void fetch(`/api/exam/${sessionId}/complete`, { method: "POST" }).finally(() => {
      router.push(`/eksamen/${sessionId}/resultat`);
      router.refresh();
    });
  }, [endsAt, now, router, sessionId]);

  if (!endsAt) {
    return <span className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600">Uten tidsbegrensning</span>;
  }

  const seconds = Math.max(0, Math.floor((endsAt - now) / 1000));
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;

  return (
    <span className="inline-flex items-center gap-2 rounded-lg bg-stone-900 px-3 py-2 font-mono text-sm font-semibold text-white">
      <Clock className="h-4 w-4" />
      {String(minutes).padStart(2, "0")}:{String(rest).padStart(2, "0")}
    </span>
  );
}
