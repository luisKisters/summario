import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;
  const redirectTo = requestUrl.searchParams.get("next") ?? "/meetings";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host");
      console.log("Forwarded Host:", forwardedHost);
      console.log("Origin:", origin);
      console.log("Redirect To:", redirectTo);
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv) {
        // In development, redirect to localhost
        return NextResponse.redirect(`${origin}${redirectTo}`);
      } else if (forwardedHost) {
        // In production with forwarded host, use https
        return NextResponse.redirect(`https://${forwardedHost}${redirectTo}`);
      } else {
        // Fallback to origin
        return NextResponse.redirect(`${origin}${redirectTo}`);
      }
    }
  }

  // If there's an error or no code, redirect to auth error page
  return NextResponse.redirect(
    `${origin}/auth/error?error=Authentication failed`
  );
}
