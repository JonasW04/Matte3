import type { PropsWithChildren } from "react";
import { MotionPage } from "@/components/app/motion-page";
import { cn } from "@/lib/utils";

export function PageShell({
  children,
  className,
  width = "wide"
}: PropsWithChildren<{ className?: string; width?: "wide" | "medium" | "narrow" }>) {
  return (
    <MotionPage>
      <main
        className={cn(
          "mx-auto w-full px-4 py-6 sm:px-6 lg:px-10 lg:py-10",
          width === "wide" && "max-w-7xl",
          width === "medium" && "max-w-5xl",
          width === "narrow" && "max-w-3xl",
          className
        )}
      >
        {children}
      </main>
    </MotionPage>
  );
}
