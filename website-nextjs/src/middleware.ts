import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const USERNAME = process.env.BASIC_AUTH_USERNAME || "4dmin";
const PASSWORD = process.env.BASIC_AUTH_PASSWORD || "testpwd123";

export function middleware(request: NextRequest) {
  const basicAuth = request.headers.get("authorization");
  if (basicAuth) {
    const [scheme, credentials] = basicAuth.split(" ");
    if (scheme === "Basic") {
      const [user, pass] = atob(credentials).split(":");
      if (user === USERNAME && pass === PASSWORD) {
        return NextResponse.next();
      }
    }
  }
  // Ask for credentials
  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Secure Area"',
    },
  });
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
