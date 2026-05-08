"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { importProblemsAction, type ImportState } from "@/actions/admin-actions";
import { Button } from "@/components/ui/button";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button variant="ntnu" disabled={pending}>
      {pending ? "Importerer..." : "Importer JSON"}
    </Button>
  );
}

export function ImportForm({ example }: { example: string }) {
  const [state, action] = useActionState<ImportState, FormData>(importProblemsAction, {});

  return (
    <form action={action} className="space-y-4">
      <textarea
        name="payload"
        defaultValue={example}
        spellCheck={false}
        className="min-h-[520px] w-full rounded-lg border border-stone-200 bg-stone-950 p-4 font-mono text-xs leading-relaxed text-stone-100 outline-none focus:border-stone-400"
      />
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm">
          {state.error && <span className="font-semibold text-red-700">{state.error}</span>}
          {state.success && <span className="font-semibold text-emerald-700">{state.success}</span>}
        </div>
        <Submit />
      </div>
    </form>
  );
}
