import { getSupabase } from "./supabase";

const TABLE = "weddings";

/** Descarrega o estado (mapa de dados wp_*) do utilizador, ou null se ainda não existe. */
export async function pullState(
  userId: string,
): Promise<Record<string, unknown> | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from(TABLE)
    .select("state")
    .eq("owner_id", userId)
    .maybeSingle();
  if (error) throw error;
  const state = data?.state as Record<string, unknown> | undefined;
  if (!state || Object.keys(state).length === 0) return null;
  return state;
}

/** Guarda (upsert) o estado do utilizador na cloud. */
export async function pushState(
  userId: string,
  state: Record<string, unknown>,
): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb.from(TABLE).upsert(
    { owner_id: userId, state, updated_at: new Date().toISOString() },
    { onConflict: "owner_id" },
  );
  if (error) throw error;
}
