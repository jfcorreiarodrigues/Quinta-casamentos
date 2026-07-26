// ── Perfil do casal ───────────────────────────────────────────────
export type Ceremony = "civil" | "catolico" | "misto";

export interface CoupleProfile {
  noiva: string;
  noivo: string;
  date: string; // ISO date "YYYY-MM-DD"
  city: string;
  ceremony: Ceremony;
  budget: number; // euros
  guests: number; // número estimado
  createdAt: string;
}

// ── Tarefas ───────────────────────────────────────────────────────
export interface Task {
  id: string; // "t01", "t02", ...
  text: string;
  byMonth: number; // meses antes do casamento em que deve estar feita
  phase: 1 | 2 | 3 | 4 | 5;
  cat: string; // categoria (ex: "Legal", "Gastronomia")
  icon: string; // emoji
  key?: boolean; // marco principal (usado no onboarding)
}

export type Urgency = "overdue" | "urgent" | "soon" | "upcoming" | "done";

// ── Planos ────────────────────────────────────────────────────────
export type Plan = "free" | "pro" | "premium";

export interface PlanConfig {
  id: Plan;
  name: string;
  price: number; // 0 | 9.99 | 24.99
  vendorSearchLimit: number; // 0 | 30 | Infinity
  aiMessageLimit: number; // 0 | 50 | Infinity
  guestLimit: number; // 30 | Infinity | Infinity
  timelinePhases: number; // 2 | 5 | 5
}

export type PlanFeature =
  | "dashboardFull"
  | "timelineFull"
  | "budgetCategories"
  | "vendors"
  | "assistant"
  | "guestsUnlimited";

// ── Convidados ────────────────────────────────────────────────────
export type GuestSide = "noiva" | "noivo" | "ambos";
export type RSVP = "pendente" | "confirmado" | "recusado";
export type Diet =
  | "normal"
  | "vegetariano"
  | "vegan"
  | "sem_gluten"
  | "diabetico";

export interface Guest {
  id: string;
  name: string;
  side: GuestSide;
  rsvp: RSVP;
  diet: Diet;
  table: string;
}

// ── Fornecedores ──────────────────────────────────────────────────
export interface Vendor {
  name: string;
  type: string;
  location: string;
  website: string | null;
  description: string;
  priceRange: string | null;
  rating: string | null;
}

// ── Orçamento ─────────────────────────────────────────────────────
export interface BudgetCategory {
  id: string;
  label: string;
  pct: number;
  icon: string;
}

export interface BudgetEntry {
  categoryId: string;
  spent: number;
}

// ── Assistente ────────────────────────────────────────────────────
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
