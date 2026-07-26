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

// ── Backup / restauro (exportar/importar todos os dados) ──────────
const BACKUP_VERSION = 1;

export interface BackupData {
  app: "wedding-planner-portugal";
  version: number;
  exportedAt: string;
  data: Record<string, unknown>;
}

/** Serializa todos os dados guardados num objeto de backup. */
export function exportAll(): BackupData {
  const data: Record<string, unknown> = {};
  for (const key of Object.values(KEYS)) {
    const raw = (() => {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    })();
    if (raw !== null) {
      try {
        data[key] = JSON.parse(raw);
      } catch {
        /* ignora entradas corrompidas */
      }
    }
  }
  return {
    app: "wedding-planner-portugal",
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  };
}

/**
 * Restaura os dados a partir de um objeto de backup. Só aceita chaves conhecidas
 * (`wp_*`) e valida o formato. Devolve true em caso de sucesso.
 */
export function importAll(backup: unknown): boolean {
  if (
    !backup ||
    typeof backup !== "object" ||
    (backup as BackupData).app !== "wedding-planner-portugal" ||
    typeof (backup as BackupData).data !== "object"
  ) {
    return false;
  }
  const known = new Set<string>(Object.values(KEYS));
  const incoming = (backup as BackupData).data;
  let wrote = false;
  for (const [key, value] of Object.entries(incoming)) {
    if (!known.has(key)) continue;
    try {
      localStorage.setItem(key, JSON.stringify(value));
      wrote = true;
    } catch {
      /* localStorage cheio/indisponível */
    }
  }
  return wrote;
}
