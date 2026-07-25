import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { APP_NAME } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Entrar",
};

export default function LoginPage() {
  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-orange text-white font-bold text-xl shadow-lg shadow-brand-orange/30">
          RP
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          {APP_NAME}
        </h1>
        <p className="mt-1 text-sm text-white/70">
          Gestão de oficina e centro automotivo
        </p>
      </div>

      <div className="rounded-2xl bg-card p-6 shadow-xl border border-border">
        <Suspense
          fallback={
            <div className="space-y-4">
              <Skeleton className="h-11 w-full rounded-xl" />
              <Skeleton className="h-11 w-full rounded-xl" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
