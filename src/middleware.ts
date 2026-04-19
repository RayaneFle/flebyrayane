import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  const isApi = pathname.startsWith("/api/");

  if (!token) {
    if (isApi) {
      return NextResponse.json({ message: "Non autorise." }, { status: 401 });
    }
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // /admin pages and /api/admin/* routes are admin or teacher only
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (token.role !== "admin" && token.role !== "teacher") {
      if (isApi) {
        return NextResponse.json({ message: "Acces refuse." }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/api/admin/:path*",
    "/api/classrooms/:path*",
    "/api/lessons/:path*",
    "/api/activities/:path*/results",
    "/api/user/:path*",
    "/api/enrollments/:path*",
    "/api/upload",
  ],
};
