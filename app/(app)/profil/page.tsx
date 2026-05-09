import { Mail, Shield, UserRound } from "lucide-react";
import { logoutAction } from "@/actions/auth-actions";
import { PageShell } from "@/components/app/page-shell";
import { StatCard } from "@/components/app/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeGlobalProgress, computeTopicProgress } from "@/lib/progress";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireUser();

  const [problems, topics] = await Promise.all([
    prisma.problem.findMany({
      where: { isSeedMock: false },
      include: {
        progress: { where: { userId: user.id } }
      }
    }),
    prisma.topic.findMany({
      include: {
        subtopics: true,
        problems: {
          where: { isSeedMock: false },
          include: {
            progress: { where: { userId: user.id } }
          }
        }
      },
      orderBy: { order: "asc" }
    })
  ]);

  const stats = computeGlobalProgress(problems, user.id);
  const ranked = topics
    .map((topic) => ({ topic, progress: computeTopicProgress(topic, user.id) }))
    .sort((a, b) => b.progress.percentSolved - a.progress.percentSolved);

  return (
    <PageShell>
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-lg bg-ink text-xl font-bold text-white">
            {user.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">Profil</div>
            <h1 className="text-3xl font-semibold tracking-tight text-stone-950">{user.name}</h1>
            <p className="mt-1 text-sm text-stone-500">Medlem siden {formatDate(user.createdAt)}</p>
          </div>
        </div>
        <form action={logoutAction}>
          <Button variant="outline">Logg ut</Button>
        </form>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Klart" value={stats.solved} />
        <StatCard label="Ikke klart" value={stats.notSolved} />
        <StatCard label="Forsøkt" value={stats.attempted} />
        <StatCard label="Progresjon" value={`${stats.percentSolved}%`} />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Konto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-3 rounded-lg bg-stone-50 p-3">
              <UserRound className="h-4 w-4 text-stone-400" />
              <span className="font-medium text-stone-900">{user.name}</span>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-stone-50 p-3">
              <Mail className="h-4 w-4 text-stone-400" />
              <span className="font-medium text-stone-900">{user.email}</span>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-stone-50 p-3">
              <Shield className="h-4 w-4 text-stone-400" />
              <span className="font-medium text-stone-900">{user.role === "ADMIN" ? "Administrator" : "Student"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Beste temaer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {ranked.slice(0, 5).map(({ topic, progress }) => (
              <div key={topic.id}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-semibold text-stone-900">{topic.name}</span>
                  <span className="text-stone-500">{progress.percentSolved}%</span>
                </div>
                <ProgressBar value={progress.percentSolved} indicatorClassName="bg-emerald-600" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
