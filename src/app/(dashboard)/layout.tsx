import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import {
  getDemoSession,
  getSession,
  isDemoMode,
} from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Demo: never hit Supabase profile lookup
  if (isDemoMode()) {
    const session = getDemoSession();
    return (
      <AppShell user={session.user} tenant={session.tenant}>
        {children}
      </AppShell>
    );
  }

  const session = await getSession();

  if (!session) {
    // Auth cookie may exist without a Prisma staff profile → break the loop:
    // go to /login?error=no_profile (middleware allows this even if Auth is valid)
    // Best-effort sign-out so the next visit is clean
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase.auth.signOut();
      }
    } catch {
      // ignore
    }
    redirect("/login?error=no_profile");
  }

  return (
    <AppShell user={session.user} tenant={session.tenant}>
      {children}
    </AppShell>
  );
}
