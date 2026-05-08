import * as React from "react";
import { ProgressStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-stone-100 text-stone-700",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-800",
  danger: "bg-red-50 text-red-700",
  info: "bg-blue-50 text-blue-700"
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium", tones[tone], className)}
      {...props}
    />
  );
}

export function StatusBadge({ status }: { status: ProgressStatus }) {
  if (status === ProgressStatus.SOLVED) return <Badge tone="success">Klart</Badge>;
  if (status === ProgressStatus.NOT_SOLVED) return <Badge tone="warning">Ikke klart</Badge>;
  return <Badge>Ikke forsøkt</Badge>;
}
