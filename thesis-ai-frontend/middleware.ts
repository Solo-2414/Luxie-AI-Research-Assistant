import { NextRequest, NextResponse } from "next/server"

const AUTH_ROUTES = new Set(["/login", "/signup"])
const PROTECTED_PREFIXES = ["/saved", "/dashboard", "/profile"]

function hasAuthCookie(request: NextRequest): boolean {
  return Boolean(request.cookies.get("access_token")?.value)
}

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const authenticated = hasAuthCookie(request)

  if (AUTH_ROUTES.has(pathname) && authenticated) {
    return NextResponse.redirect(new URL("/research", request.url))
  }

  if (isProtectedRoute(pathname) && !authenticated) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/login", "/signup", "/saved/:path*", "/dashboard/:path*", "/profile/:path*"],
}
