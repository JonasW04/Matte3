import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  className,
  indicatorClassName
}: {
  value: number;
  className?: string;
  indicatorClassName?: string;
}) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-2 overflow-hidden rounded-full bg-stone-100", className)}>
      <div
        className={cn("h-full rounded-full bg-ink transition-all duration-700 ease-out", indicatorClassName)}
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}
