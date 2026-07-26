import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Info, Pencil } from "lucide-react";
import type { CoupleProfile, Plan } from "../types";
import { fmt } from "../lib/utils";
import { canAccess } from "../lib/plans";
import { getBudgetSpent, setBudgetSpent } from "../lib/storage";
import { InfoBox, LockOverlay, ProgressBar, StatCard } from "./ui";

const BUDGET_CATEGORIES = [
  { id: "local", label: "Local & Catering", pct: 40, icon: "🏛️" },
  { id: "imagem", label: "Fotografia & Vídeo", pct: 12, icon: "📷" },
  { id: "musica", label: "Música & Entretenimento", pct: 8, icon: "🎶" },
  { id: "flores", label: "Flores & Decoração", pct: 10, icon: "💐" },
  { id: "vestuario", label: "Vestuário & Alianças", pct: 10, icon: "👗" },
  { id: "papelaria", label: "Convites & Papelaria", pct: 3, icon: "✉️" },
  { id: "beleza", label: "Beleza & SPA", pct: 4, icon: "💄" },
  { id: "transporte", label: "Transporte & Alojamento", pct: 5, icon: "🚗" },
  { id: "reserva", label: "Fundo de Reserva", pct: 8, icon: "🛡️" },
];

const HIDDEN_COSTS = [
  "Licenças musicais SPA/IGAC (variável consoante o espaço)",
  "Horas extra de fornecedores (fotógrafo, DJ, catering)",
  "Deslocações de fornecedores fora da área",
  "Alterações de costura de última hora",
  "Taxas do Registo Civil (120 € normal / 200 € urgente)",
  "Convenção antenupcial em notário (100–160 €)",
];

interface Props {
  profile: CoupleProfile;
  plan: Plan;
  onProfileChange: (p: CoupleProfile) => void;
  goToPlans: () => void;
}

export default function Budget({
  profile,
  plan,
  onProfileChange,
  goToPlans,
}: Props) {
  const [spent, setSpent] = useState<Record<string, number>>(() =>
    getBudgetSpent(),
  );
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetDraft, setBudgetDraft] = useState(String(profile.budget));

  useEffect(() => {
    setBudgetSpent(spent);
  }, [spent]);

  const unlocked = canAccess("budgetCategories", plan);

  const totalSpent = useMemo(
    () =>
      BUDGET_CATEGORIES.reduce((sum, c) => sum + (spent[c.id] || 0), 0),
    [spent],
  );
  const balance = profile.budget - totalSpent;

  const saveBudget = () => {
    const n = Number(budgetDraft);
    if (n > 0) onProfileChange({ ...profile, budget: n });
    setEditingBudget(false);
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold text-ink">
          Orçamento
        </h1>
        <p className="text-sm text-muted">
          Controle os gastos por categoria face à referência de mercado.
        </p>
      </header>

      {/* Resumo */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-muted">
              Orçamento total
            </span>
            <button
              onClick={() => {
                setBudgetDraft(String(profile.budget));
                setEditingBudget(true);
              }}
              className="text-muted hover:text-gold-dark"
              aria-label="Editar orçamento"
            >
              <Pencil size={14} />
            </button>
          </div>
          {editingBudget ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                className="wp-input"
                value={budgetDraft}
                onChange={(e) => setBudgetDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveBudget()}
                autoFocus
              />
              <button
                onClick={saveBudget}
                className="rounded-lg bg-gold-primary px-3 py-2 text-sm font-semibold text-white"
              >
                OK
              </button>
            </div>
          ) : (
            <div className="font-display text-2xl font-semibold">
              {fmt(profile.budget)}
            </div>
          )}
        </div>

        <StatCard label="Gasto registado" value={fmt(totalSpent)} />
        <StatCard
          label="Saldo disponível"
          value={fmt(balance)}
          accent={balance >= 0 ? "#7A9E7E" : "#C97B8A"}
        />
      </div>

      {/* Categorias */}
      <div className="relative">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {BUDGET_CATEGORIES.map((c, i) => {
            // No plano free, só a 1.ª categoria (local) é visível; as restantes ficam esbatidas sob overlay.
            const alloc = (profile.budget * c.pct) / 100;
            const used = spent[c.id] || 0;
            const usedPct = alloc > 0 ? (used / alloc) * 100 : 0;
            const over = used > alloc;
            const blurred = !unlocked && i > 0;

            return (
              <div
                key={c.id}
                className={`rounded-2xl border border-line bg-white p-4 shadow-sm ${
                  blurred ? "select-none blur-sm" : ""
                }`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{c.icon}</span>
                    <span className="text-sm font-semibold text-ink">
                      {c.label}
                    </span>
                  </div>
                  <span className="text-xs text-muted">
                    ref. {fmt(alloc)} ({c.pct}%)
                  </span>
                </div>
                <ProgressBar
                  value={Math.min(100, usedPct)}
                  color={over ? "#C97B8A" : "#C9A96E"}
                  height={7}
                />
                <div className="mt-2.5 flex items-center gap-2">
                  <span className="text-xs text-muted">Gasto real:</span>
                  <input
                    type="number"
                    min={0}
                    className="wp-input !py-1.5 !text-sm"
                    value={used === 0 ? "" : used}
                    placeholder="0"
                    disabled={blurred}
                    onChange={(e) =>
                      setSpent((prev) => ({
                        ...prev,
                        [c.id]: Number(e.target.value) || 0,
                      }))
                    }
                  />
                  <span className="text-sm text-muted">€</span>
                </div>
                {over && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-urgency-overdue">
                    <AlertTriangle size={13} />
                    Acima da alocação de referência.
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!unlocked && (
          <LockOverlay
            title="Orçamento por categoria"
            description="Distribua e acompanhe o gasto em todas as 9 categorias com o plano Pro."
            onUpgrade={goToPlans}
          />
        )}
      </div>

      {/* Custos ocultos — sempre visível */}
      <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Info size={18} className="text-gold-dark" />
          <h2 className="font-display text-lg font-semibold text-ink">
            Custos ocultos a não esquecer
          </h2>
        </div>
        <InfoBox tone="warn">
          <ul className="space-y-1.5">
            {HIDDEN_COSTS.map((h) => (
              <li key={h} className="flex gap-2">
                <span className="text-gold-dark">•</span>
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </InfoBox>
      </section>
    </div>
  );
}
