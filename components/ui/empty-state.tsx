import { SearchX } from "lucide-react";

export function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-stone-300 bg-white px-6 py-10 text-center">
      <SearchX className="mx-auto mb-3 h-8 w-8 text-stone-300" />
      <h3 className="text-sm font-semibold text-stone-900">{title}</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-stone-500">{text}</p>
    </div>
  );
}
