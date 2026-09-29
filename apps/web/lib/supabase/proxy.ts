import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseConfig } from "./config";
import { safeNext } from "@/lib/auth/navigation";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, key } = supabaseConfig();
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(values) {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        values.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims && request.nextUrl.pathname.startsWith("/app")) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.search = "";
    login.searchParams.set(
      "next",
      safeNext(request.nextUrl.pathname + request.nextUrl.search),
    );
    return NextResponse.redirect(login);
  }

  if (data?.claims && request.nextUrl.pathname === "/login") {
    return NextResponse.redirect(
      new URL(safeNext(request.nextUrl.searchParams.get("next")), request.url),
    );
  }

  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
