import tma4110Example from "@/data/exam-problems/tma4110-2024-h.json";
import { PageShell } from "@/components/app/page-shell";
import { ImportForm } from "@/components/app/import-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";

export default async function AdminImportPage() {
  await requireAdmin();

  return (
    <PageShell>
      <div className="mb-8">
        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">Admin</div>
        <h1 className="text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">Importer oppgaver</h1>
        <p className="mt-2 max-w-2xl text-stone-500">
          JSON-formatet kobler hver oppgave til eksamen, PDF-lenker, tema, undertema og skjult vanskelighetsgrad.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>JSON-import</CardTitle>
        </CardHeader>
        <CardContent>
          <ImportForm example={JSON.stringify(tma4110Example, null, 2)} />
        </CardContent>
      </Card>
    </PageShell>
  );
}
