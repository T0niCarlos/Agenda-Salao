import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Renova a sessão do Supabase Auth a cada requisição e propaga os cookies
 * atualizados tanto para a requisição quanto para a resposta. Chamado pelo
 * proxy.ts na raiz do projeto.
 *
 * Retorna também o `user` (pode ser null) para que o proxy decida sobre
 * redirects de borda (ex.: /dashboard sem sessão). A autorização definitiva
 * (sessão + vínculo com admin_users) continua sendo checada no servidor em
 * app/(admin)/dashboard/layout.tsx — isto aqui é só uma otimização de UX.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  // Importante: NÃO remover esta chamada. Ela força a renovação do token
  // (se necessário) antes de qualquer Server Component rodar. Sem isso,
  // sessões expiram silenciosamente em produção.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response: supabaseResponse, user };
}
