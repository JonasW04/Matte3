import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  sub,
  className
}: {
  label: string;
  value: string | number;
  sub?: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border border-stone-200/80 bg-white p-5 shadow-soft", className)}>
      <div className="text-xs font-semibold uppercase tracking-wider text-stone-400">{label}</div>
      <div className="mt-2 text-3xl font-semibold tracking-tight text-stone-950">{value}</div>
      {sub && <div className="mt-1 text-sm text-stone-500">{sub}</div>}
    </div>
  );
}
