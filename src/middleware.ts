import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

type Role = "admin" | "operador" | "visitante";

type AuthTokenPayload = {
  role?: Role;
  forcePasswordChange?: boolean;
  exp?: number;
};

const publicRoutes = ["/login", "/_next", "/favicon.ico"];
const authCookieName = process.env.AUTH_COOKIE_NAME || "safira_token";

const rolePermissions: Record<Role, string[]> = {
  admin: [
    "/dashboard",
    "/postos",
    "/status-automacao",
    "/cadastros",
    "/relatorios",
  ],
  operador: ["/dashboard", "/postos", "/status-automacao"],
  visitante: ["/dashboard"],
};

function decodePayload(token: string): AuthTokenPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  try {
    const payloadPart = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payloadPart.padEnd(
      Math.ceil(payloadPart.length / 4) * 4,
      "=",
    );
    const json = atob(padded);
    return JSON.parse(json) as AuthTokenPayload;
  } catch {
    return null;
  }
}

function canAccess(pathname: string, role: Role) {
  const allowed = rolePermissions[role] ?? [];
  return allowed.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    const token = request.cookies.get(authCookieName)?.value;
    const payload = token ? decodePayload(token) : null;

    if (pathname === "/login" && payload?.role) {
      const nextUrl = new URL(
        payload.forcePasswordChange ? "/mudar-senha" : "/dashboard",
        request.url,
      );
      return NextResponse.redirect(nextUrl);
    }

    return NextResponse.next();
  }

  const authToken = request.cookies.get(authCookieName)?.value;

  if (!authToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const payload = decodePayload(authToken);
  if (!payload?.role) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  const nowInSeconds = Math.floor(Date.now() / 1000);
  if (typeof payload.exp === "number" && payload.exp < nowInSeconds) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (payload.forcePasswordChange && pathname !== "/mudar-senha") {
    return NextResponse.redirect(new URL("/mudar-senha", request.url));
  }

  if (!payload.forcePasswordChange && pathname === "/mudar-senha") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (pathname !== "/mudar-senha" && !canAccess(pathname, payload.role)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
