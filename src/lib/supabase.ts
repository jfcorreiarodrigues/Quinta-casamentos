import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// URL e chave publishable do projeto Supabase. São públicas por design (o acesso
// aos dados é protegido por Row-Level Security), por isso podem viver no cliente.
// Podem ser sobrepostas por variáveis de ambiente (ex: outro projeto/ambiente).
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ?? "https://hsbvexmebsvblzlzdivs.supabase.co";
// Chave anon (JWT) — pública por design, protegida por RLS. Usa-se a legacy
// anon key pela compatibilidade mais ampla com o supabase-js.
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzYnZleG1lYnN2Ymx6bHpkaXZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyNTU1MDcsImV4cCI6MjEwMDgzMTUwN30.Lv55c1IuCmA-55CHcTgbf9MVHSFNezFoyH4rlTRiAcQ";

/** True se a sincronização na cloud está configurada. */
export function isCloudEnabled(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

let client: SupabaseClient | null = null;

/** Cliente Supabase singleton (ou null se a cloud não estiver configurada). */
export function getSupabase(): SupabaseClient | null {
  if (!isCloudEnabled()) return null;
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return client;
}
