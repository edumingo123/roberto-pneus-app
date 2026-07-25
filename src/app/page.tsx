import { redirect } from "next/navigation";

/**
 * Root is handled primarily by middleware.
 * Fallback: send to dashboard (middleware will bounce unauthenticated users to /login).
 */
export default function HomePage() {
  redirect("/dashboard");
}
