import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Public routes — no auth required.
 * Keep this list tight; static assets are excluded by matcher.
 */
const PUBLIC_PREFIXES = [
  "/login",
  "/auth/callback",
  "/acompanhamento",
  "/api/webhooks",
  "/api/agent",
  "/manifest.webmanifest",
  "/sw.js",
  "/icons",
];

function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true; // handled explicitly
  return PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static / files with extensions early
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/icons") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const demoMode =
    process.env.DEMO_MODE === "true" ||
    process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  const { supabaseResponse, user } = await updateSession(request);

  // ── Demo mode: no Supabase session required ─────────────────
  if (demoMode) {
    if (pathname === "/" || pathname === "/login") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return supabaseResponse;
  }

  // ── Real auth mode ──────────────────────────────────────────
  const isLogin = pathname === "/login";
  const isPublic = isPublicPath(pathname);

  // Root
  if (pathname === "/") {
    const dest = user ? "/dashboard" : "/login";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // Not logged in → only public routes
  if (!user) {
    if (isPublic || isLogin) {
      return supabaseResponse;
    }
    const loginUrl = new URL("/login", request.url);
    // Avoid stacking redirect params / loops
    if (pathname !== "/login" && !pathname.startsWith("/login")) {
      loginUrl.searchParams.set("redirect", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // Logged in on /login
  // Allow staying on login when we need to show profile/auth errors
  // (breaks the Auth-OK / Prisma-missing redirect loop)
  if (isLogin) {
    const err = request.nextUrl.searchParams.get("error");
    if (err) {
      return supabaseResponse;
    }
    const redirectTo =
      request.nextUrl.searchParams.get("redirect") || "/dashboard";
    // Only allow internal relative paths
    const safe =
      redirectTo.startsWith("/") && !redirectTo.startsWith("//")
        ? redirectTo
        : "/dashboard";
    return NextResponse.redirect(new URL(safe, request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all paths except Next static assets and common image extensions.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest)$).*)",
  ],
};
