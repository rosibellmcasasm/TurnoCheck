import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Refresca la sesión de Supabase en cada request y protege /app/* —
 *  sin sesión válida, redirige a /login en vez de dejar pasar.
 *  (Antes "middleware.ts" — Next.js 16 renombró la convención a "proxy".) */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const protegida = request.nextUrl.pathname.startsWith("/app") || request.nextUrl.pathname.startsWith("/admin");
  if (protegida && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // /admin además exige que el correo coincida con ADMIN_EMAIL — el resto de
  // la verificación (por si alguien intenta pasar sin sesión coincidente) la
  // hace también app/admin/layout.tsx del lado del servidor, en capa doble.
  if (request.nextUrl.pathname.startsWith("/admin") && user?.email !== process.env.ADMIN_EMAIL) {
    const url = request.nextUrl.clone();
    url.pathname = "/app";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.png|.*\\.(?:svg|png|jpg|jpeg|mp4|webp)$).*)",
  ],
};
