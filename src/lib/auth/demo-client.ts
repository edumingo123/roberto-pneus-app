/**
 * Client-safe demo mode check (NEXT_PUBLIC_ so it is available in browser).
 * Keep NEXT_PUBLIC_DEMO_MODE in sync with DEMO_MODE on the server.
 */
export function isDemoModeClient(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}

