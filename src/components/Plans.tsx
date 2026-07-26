import { useState } from "react";
import { Check, Loader2, Sparkles, X } from "lucide-react";
import type { Plan } from "../types";
import { FEATURE_MATRIX, PLANS, PLAN_ORDER } from "../lib/plans";
import { isStripeEnabled, startCheckout } from "../lib/billing";
import { GhostButton, GoldButton, InfoBox } from "./ui";

interface Props {
  plan: Plan;
  onSelect: (p: Plan) => void;
}

const TAGLINES: Record<Plan, string> = {
  free: "Comece a organizar sem custos.",
  pro: "Tudo o que precisa para planear a sério.",
  premium: "A experiência completa, sem limites.",
};

export default function Plans({ plan, onSelect }: Props) {
  const stripeOn = isStripeEnabled();
  const [loadingPlan, setLoadingPlan] = useState<Plan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const choose = async (id: Plan) => {
    setError(null);
    // Downgrade para grátis ou modo MVP → troca imediata.
    if (id === "free" || !stripeOn) {
      onSelect(id);
      return;
    }
    // Plano pago com Stripe ativo → redireciona para o checkout.
    try {
      setLoadingPlan(id);
      await startCheckout(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao iniciar o pagamento.");
      setLoadingPlan(null);
    }
  };

  return (
    <div className="space-y-6">
      <header className="text-center">
        <h1 className="font-display text-3xl font-semibold text-ink">
          Escolha o seu plano
        </h1>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted">
          Substitua o custo de um wedding planner (1 500–5 000 €) por uma
          subscrição acessível. Mude de plano quando quiser.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {PLAN_ORDER.map((id) => {
          const cfg = PLANS[id];
          const current = plan === id;
          const highlight = id === "pro";
          return (
            <div
              key={id}
              className={`relative flex flex-col rounded-3xl border bg-white p-6 shadow-sm transition-transform ${
                highlight
                  ? "border-gold-primary shadow-md lg:-translate-y-2"
                  : "border-line"
              }`}
            >
              {highlight && (
                <span
                  className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-semibold text-white"
                  style={{
                    background: "linear-gradient(135deg,#C9A96E,#7A6040)",
                  }}
                >
                  Mais popular
                </span>
              )}

              <div className="mb-4">
                <h2 className="font-display text-xl font-semibold text-ink">
                  {cfg.name}
                </h2>
                <p className="mt-0.5 text-xs text-muted">{TAGLINES[id]}</p>
              </div>

              <div className="mb-5">
                <span className="font-display text-4xl font-semibold text-ink">
                  {cfg.price === 0
                    ? "Grátis"
                    : cfg.price.toLocaleString("pt-PT", {
                        minimumFractionDigits: 2,
                      }) + " €"}
                </span>
                {cfg.price > 0 && (
                  <span className="text-sm text-muted">/mês</span>
                )}
              </div>

              <ul className="mb-6 flex-1 space-y-2.5">
                {FEATURE_MATRIX.map((row) => {
                  const val = row.values[id];
                  const enabled = val !== false;
                  return (
                    <li
                      key={row.label}
                      className="flex items-start gap-2.5 text-sm"
                    >
                      <span
                        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                          enabled
                            ? "bg-urgency-done/20 text-urgency-done"
                            : "bg-line text-muted"
                        }`}
                      >
                        {enabled ? <Check size={11} /> : <X size={11} />}
                      </span>
                      <span className={enabled ? "text-ink" : "text-muted"}>
                        {row.label}
                        {typeof val === "string" && (
                          <span className="ml-1 font-semibold text-gold-deep">
                            — {val}
                          </span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>

              {current ? (
                <GhostButton disabled className="w-full !opacity-100">
                  <Check size={16} />
                  Plano atual
                </GhostButton>
              ) : (
                <GoldButton
                  className="w-full"
                  onClick={() => choose(id)}
                  disabled={loadingPlan !== null}
                >
                  {loadingPlan === id ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      A redirecionar…
                    </>
                  ) : cfg.price === 0 ? (
                    "Mudar para Básico"
                  ) : (
                    <>
                      <Sparkles size={16} />
                      {stripeOn ? `Subscrever ${cfg.name}` : `Escolher ${cfg.name}`}
                    </>
                  )}
                </GoldButton>
              )}
            </div>
          );
        })}
      </div>

      {error && <InfoBox tone="warn">{error}</InfoBox>}

      <p className="text-center text-xs text-muted">
        {stripeOn
          ? "Pagamento seguro processado pela Stripe. Pode cancelar a subscrição a qualquer momento."
          : "MVP — a mudança de plano é imediata e não implica pagamento real. A integração com Stripe é ativada ao definir VITE_STRIPE_API_URL."}
      </p>
    </div>
  );
}
