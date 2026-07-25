import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import {
  getDemoSession,
  getSession,
  isDemoMode,
} from "@/lib/auth/session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session = await getSession();

  if (!session && isDemoMode()) {
    session = getDemoSession();
  }

  // Local UI preview when Supabase is not configured
  if (!session) {
    const hasSupabase =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project");

    if (!hasSupabase) {
      session = getDemoSession();
    } else {
      redirect("/login");
    }
  }

  return (
    <AppShell user={session.user} tenant={session.tenant}>
      {children}
    </AppShell>
  );
}
