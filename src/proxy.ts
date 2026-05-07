import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const API_KEY_GATED = /^\/api\/(trpc|rest|openapi\.json)/;
const API_KEY_EXEMPT = /^\/api\/(webhooks|cron|rest\/health)/;

// Constant-time string comparison. Edge runtime doesn't expose
// `node:crypto.timingSafeEqual`, so we hand-roll it.
function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export default clerkMiddleware(async (_auth, req) => {
  const { pathname } = req.nextUrl;
  if (API_KEY_GATED.test(pathname) && !API_KEY_EXEMPT.test(pathname)) {
    const provided = req.headers.get("x-api-key") ?? "";
    const expected = process.env.MOBILE_API_KEY ?? "";
    if (!expected || !timingSafeEqualStr(provided, expected)) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }
});

export const config = {
  matcher: ["/api/(.*)"],
};
