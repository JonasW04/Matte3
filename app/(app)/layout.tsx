import { AppSidebar } from "@/components/app/app-sidebar";
import { requireUser } from "@/lib/auth";

export default async function LearnerLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="min-h-screen lg:flex">
      <AppSidebar user={{ name: user.name, email: user.email, role: user.role }} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
