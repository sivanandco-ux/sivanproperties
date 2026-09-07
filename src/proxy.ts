import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const PUBLIC_PATHS = ["/login", "/api/auth", "/listings", "/api/upload"];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname.startsWith(path));
}

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Session existence + the allowlist check both happen in the `signIn`
  // callback (src/lib/auth.ts) before a session cookie is ever issued, so a
  // present `req.auth` here already implies an approved tester.
  if (!req.auth) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
