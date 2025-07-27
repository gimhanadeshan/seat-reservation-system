// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Allow access to public routesW
    const publicRoutes = ["/", "/login", "/register"];
    if (publicRoutes.includes(pathname)) {
      return NextResponse.next();
    }

    // Redirect unauthenticated users to login
    if (!token) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check admin routes
    if (
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/api/admin")
    ) {
      if (token.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/reserve", req.url));
      }
    }

    // Allow authenticated users to access other protected routes
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Allow public routes without authentication
        const publicRoutes = ["/", "/login", "/register"];
        if (publicRoutes.includes(pathname)) {
          return true;
        }

        // Require authentication for all other routes
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)",
  ],
};
