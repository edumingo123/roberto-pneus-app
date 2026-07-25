/**
 * Client-safe demo mode check (NEXT_PUBLIC_ so it is available in browser).
 */
export function isDemoModeClient(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}
