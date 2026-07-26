import type { Plan, PlanConfig, PlanFeature } from "../types";

export const PLANS: Record<Plan, PlanConfig> = {
  free: {
    id: "free",
    name: "Básico",
    price: 0,
    vendorSearchLimit: 0,
    aiMessageLimit: 0,
    guestLimit: 30,
    timelinePhases: 2,
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 9.99,
    vendorSearchLimit: 30,
    aiMessageLimit: 50,
    guestLimit: Infinity,
    timelinePhases: 5,
  },
  premium: {
    id: "premium",
    name: "Premium",
    price: 24.99,
    vendorSearchLimit: Infinity,
    aiMessageLimit: Infinity,
    guestLimit: Infinity,
    timelinePhases: 5,
  },
};

export const PLAN_ORDER: Plan[] = ["free", "pro", "premium"];

/** Verifica se um plano tem acesso a uma dada funcionalidade. */
export function canAccess(feature: PlanFeature, plan: Plan): boolean {
  const cfg = PLANS[plan];
  switch (feature) {
    case "dashboardFull":
      return plan !== "free";
    case "timelineFull":
      return cfg.timelinePhases >= 5;
    case "budgetCategories":
      return plan !== "free";
    case "vendors":
      return cfg.vendorSearchLimit > 0;
    case "assistant":
      return cfg.aiMessageLimit > 0;
    case "guestsUnlimited":
      return cfg.guestLimit === Infinity;
    case "pdfExport":
      return plan === "premium";
    default:
      return false;
  }
}

/** Nº de tarefas visíveis por secção de urgência no dashboard. */
export function dashboardSectionLimit(plan: Plan): number {
  return plan === "free" ? 5 : Infinity;
}

/** Comparação de tabela de funcionalidades para a página de Planos. */
export interface FeatureRow {
  label: string;
  values: Record<Plan, string | boolean>;
}

export const FEATURE_MATRIX: FeatureRow[] = [
  {
    label: "Dashboard de urgências",
    values: { free: "Top 5", pro: "Completo", premium: "Completo" },
  },
  {
    label: "Timeline",
    values: { free: "Fases 1–2", pro: "Completa", premium: "Completa" },
  },
  {
    label: "Convidados",
    values: { free: "30", pro: "Ilimitado", premium: "Ilimitado" },
  },
  {
    label: "Orçamento por categoria",
    values: { free: false, pro: true, premium: true },
  },
  {
    label: "Pesquisa de fornecedores",
    values: { free: false, pro: "30×/mês", premium: "Ilimitado" },
  },
  {
    label: "Assistente IA",
    values: { free: false, pro: "50 msgs/mês", premium: "Ilimitado" },
  },
  {
    label: "Contactos verificados",
    values: { free: false, pro: false, premium: true },
  },
  {
    label: "Exportação PDF",
    values: { free: false, pro: false, premium: true },
  },
];
