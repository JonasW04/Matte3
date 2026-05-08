"use client";

import { useEffect, useRef } from "react";
import renderMathInElement from "katex/contrib/auto-render";

export function MathText({ children, className }: { children: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    renderMathInElement(ref.current, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "\\[", right: "\\]", display: true },
        { left: "$", right: "$", display: false },
        { left: "\\(", right: "\\)", display: false }
      ],
      throwOnError: false
    });
  }, [children]);

  return (
    <div
      ref={ref}
      className={className}
      dangerouslySetInnerHTML={{
        __html: children
          .split(/\n{2,}/)
          .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br />")}</p>`)
          .join("")
      }}
    />
  );
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
