import type { CoupleProfile, Guest, Plan, Vendor } from "../types";

// Chaves de localStorage (ver secção 8 da spec)
const KEYS = {
  profile: "wp_profile",
  done: "wp_done",
  plan: "wp_plan",
  budgetSpent: "wp_budget_spent",
  guests: "wp_guests",
  vendorCount: "wp_vendor_count",
  aiCount: "wp_ai_count",
  vendorSaved: "wp_vendor_saved",
  notes: "wp_notes",
} as const;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage cheio ou indisponível — degradação graciosa.
    console.warn("Não foi possível guardar em localStorage:", key);
  }
}

// ── Perfil ────────────────────────────────────────────────────────
export const getProfile = (): CoupleProfile | null =>
  read<CoupleProfile | null>(KEYS.profile, null);
export const setProfile = (p: CoupleProfile): void => write(KEYS.profile, p);

// ── Tarefas concluídas ────────────────────────────────────────────
export const getDone = (): Record<string, boolean> =>
  read<Record<string, boolean>>(KEYS.done, {});
export const setDone = (d: Record<string, boolean>): void => write(KEYS.done, d);

// ── Plano ─────────────────────────────────────────────────────────
export const getPlan = (): Plan => read<Plan>(KEYS.plan, "free");
export const setPlan = (p: Plan): void => write(KEYS.plan, p);

// ── Orçamento (gasto por categoria) ───────────────────────────────
export const getBudgetSpent = (): Record<string, number> =>
  read<Record<string, number>>(KEYS.budgetSpent, {});
export const setBudgetSpent = (s: Record<string, number>): void =>
  write(KEYS.budgetSpent, s);

// ── Convidados ────────────────────────────────────────────────────
export const getGuests = (): Guest[] => read<Guest[]>(KEYS.guests, []);
export const setGuests = (g: Guest[]): void => write(KEYS.guests, g);

// ── Contadores de utilização ──────────────────────────────────────
export const getVendorCount = (): number => read<number>(KEYS.vendorCount, 0);
export const setVendorCount = (n: number): void => write(KEYS.vendorCount, n);

export const getAiCount = (): number => read<number>(KEYS.aiCount, 0);
export const setAiCount = (n: number): void => write(KEYS.aiCount, n);

// ── Fornecedores guardados ────────────────────────────────────────
export const getVendorSaved = (): Vendor[] =>
  read<Vendor[]>(KEYS.vendorSaved, []);
export const setVendorSaved = (v: Vendor[]): void => write(KEYS.vendorSaved, v);

// ── Notas por tarefa ──────────────────────────────────────────────
export const getNotes = (): Record<string, string> =>
  read<Record<string, string>>(KEYS.notes, {});
export const setNotes = (n: Record<string, string>): void =>
  write(KEYS.notes, n);

/** Limpa todos os dados da aplicação (usado em reset). */
export function clearAll(): void {
  Object.values(KEYS).forEach((k) => {
    try {
      localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  });
}
