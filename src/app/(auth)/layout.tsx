export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-primary">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-orange/20 via-transparent to-transparent pointer-events-none" />
      <div className="relative flex flex-1 flex-col items-center justify-center p-4">
        {children}
      </div>
      <p className="relative text-center text-xs text-white/40 pb-6">
        Roberto Pneus App · Multi-tenant SaaS
      </p>
    </div>
  );
}
