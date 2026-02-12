import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("token");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/datos/:path*"],
};
