import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Heart } from "lucide-react";
import type { Ceremony, CoupleProfile } from "../types";
import { KEY_TASKS } from "../lib/tasks";
import { fmt, monthsLeft } from "../lib/utils";
import { GhostButton, GoldButton, InfoBox, ProgressBar } from "./ui";

interface Props {
  onComplete: (
    profile: CoupleProfile,
    initialDone: Record<string, boolean>,
  ) => void;
}

const CEREMONY_OPTIONS: { value: Ceremony; label: string }[] = [
  { value: "civil", label: "Civil" },
  { value: "catolico", label: "Católico" },
  { value: "misto", label: "Civil com celebração religiosa" },
];

export default function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState(1);

  const [noiva, setNoiva] = useState("");
  const [noivo, setNoivo] = useState("");
  const [date, setDate] = useState("");
  const [city, setCity] = useState("");

  const [ceremony, setCeremony] = useState<Ceremony>("civil");
  const [budget, setBudget] = useState("");
  const [guests, setGuests] = useState("");

  const [checked, setChecked] = useState<Record<string, boolean>>({});

  // ── Feedback dinâmico da data ───────────────────────────────────
  const dateFeedback = useMemo(() => {
    if (!date) return null;
    const left = monthsLeft(date);
    if (left < 0)
      return { tone: "warn" as const, text: "Esta data já passou." };
    const months = Math.round(left);
    if (left > 12)
      return {
        tone: "cream" as const,
        text: `Faltam ~${months} meses — Excelente antecedência! Foque-se no espaço e fotógrafo.`,
      };
    if (left >= 6)
      return {
        tone: "cream" as const,
        text: `Faltam ~${months} meses — Bom timing. Há trabalho importante a fazer.`,
      };
    return {
      tone: "warn" as const,
      text: `Faltam ~${months} meses — Fase final! Foco máximo nas confirmações.`,
    };
  }, [date]);

  // ── Feedback dinâmico do orçamento ──────────────────────────────
  const budgetFeedback = useMemo(() => {
    const g = Number(guests);
    const b = Number(budget);
    if (!g || g <= 0) return null;
    const low = g * 150;
    const high = g * 280;
    const marketText = `Para ${g} convidados, o mercado aponta ${fmt(low)}–${fmt(high)}.`;
    if (b > 0 && b / g < 120) {
      return {
        tone: "warn" as const,
        text: `${marketText} O seu valor (${fmt(b / g)}/convidado) está abaixo da média do mercado (120 €+/convidado). Pode ser preciso ajustar expectativas.`,
      };
    }
    return { tone: "cream" as const, text: marketText };
  }, [guests, budget]);

  const keyDoneCount = Object.values(checked).filter(Boolean).length;

  // ── Validação por passo ─────────────────────────────────────────
  const step1Valid =
    noiva.trim() && noivo.trim() && date && city.trim() && monthsLeft(date) >= 0;
  const step2Valid = Number(budget) > 0 && Number(guests) > 0;

  const finish = () => {
    const profile: CoupleProfile = {
      noiva: noiva.trim(),
      noivo: noivo.trim(),
      date,
      city: city.trim(),
      ceremony,
      budget: Number(budget),
      guests: Number(guests),
      createdAt: new Date().toISOString(),
    };
    onComplete(profile, checked);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4 py-8">
      <div className="w-full max-w-lg">
        {/* Cabeçalho */}
        <div className="mb-6 text-center">
          <div className="mb-2 flex justify-center">
            <span
              className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl text-white shadow-md"
              style={{
                background: "linear-gradient(135deg,#C9A96E,#7A6040)",
              }}
            >
              💍
            </span>
          </div>
          <h1 className="font-display text-3xl font-semibold text-ink">
            Wedding Planner Portugal
          </h1>
          <p className="mt-1 text-sm text-muted">
            O seu plano de casamento, 100% adaptado à sua data.
          </p>
        </div>

        <div className="rounded-3xl border border-line bg-white p-6 shadow-sm sm:p-8">
          {/* Indicador de passos */}
          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted">
              <span>Passo {step} de 3</span>
              <span>
                {step === 1
                  ? "O casal"
                  : step === 2
                    ? "Detalhes"
                    : "O que já está feito?"}
              </span>
            </div>
            <ProgressBar value={(step / 3) * 100} />
          </div>

          {/* PASSO 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Nome da noiva">
                  <input
                    className="wp-input"
                    value={noiva}
                    onChange={(e) => setNoiva(e.target.value)}
                    placeholder="Ex: Maria"
                  />
                </Field>
                <Field label="Nome do noivo">
                  <input
                    className="wp-input"
                    value={noivo}
                    onChange={(e) => setNoivo(e.target.value)}
                    placeholder="Ex: João"
                  />
                </Field>
              </div>
              <Field label="Data do casamento">
                <input
                  type="date"
                  className="wp-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </Field>
              <Field label="Cidade / Região">
                <input
                  className="wp-input"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ex: Porto"
                />
              </Field>
              {dateFeedback && (
                <InfoBox tone={dateFeedback.tone}>{dateFeedback.text}</InfoBox>
              )}
            </div>
          )}

          {/* PASSO 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <Field label="Tipo de cerimónia">
                <select
                  className="wp-input"
                  value={ceremony}
                  onChange={(e) => setCeremony(e.target.value as Ceremony)}
                >
                  {CEREMONY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Orçamento total (€)">
                  <input
                    type="number"
                    min={0}
                    className="wp-input"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="Ex: 20000"
                  />
                </Field>
                <Field label="Nº estimado de convidados">
                  <input
                    type="number"
                    min={0}
                    className="wp-input"
                    value={guests}
                    onChange={(e) => setGuests(e.target.value)}
                    placeholder="Ex: 100"
                  />
                </Field>
              </div>
              {budgetFeedback && (
                <InfoBox tone={budgetFeedback.tone}>
                  {budgetFeedback.text}
                </InfoBox>
              )}
            </div>
          )}

          {/* PASSO 3 */}
          {step === 3 && (
            <div className="space-y-3">
              <p className="text-sm text-muted">
                Marque os marcos principais que já concluiu. Vamos adaptar o seu
                plano ao que falta fazer.
              </p>
              <div className="space-y-2">
                {KEY_TASKS.map((t) => {
                  const on = !!checked[t.id];
                  return (
                    <button
                      key={t.id}
                      onClick={() =>
                        setChecked((prev) => ({ ...prev, [t.id]: !prev[t.id] }))
                      }
                      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                        on
                          ? "border-urgency-done/50 bg-urgency-done/10"
                          : "border-line bg-white hover:bg-cream"
                      }`}
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                          on
                            ? "border-urgency-done bg-urgency-done text-white"
                            : "border-muted/50"
                        }`}
                      >
                        {on && <Check size={14} />}
                      </span>
                      <span className="text-lg">{t.icon}</span>
                      <span className="text-sm text-ink">{t.text}</span>
                    </button>
                  );
                })}
              </div>
              <InfoBox>
                <span className="flex items-center gap-2">
                  <Heart size={15} className="text-gold-dark" />
                  {keyDoneCount} de {KEY_TASKS.length} marcos concluídos
                </span>
              </InfoBox>
            </div>
          )}

          {/* Navegação */}
          <div className="mt-6 flex items-center justify-between gap-3">
            {step > 1 ? (
              <GhostButton onClick={() => setStep((s) => s - 1)}>
                <ArrowLeft size={16} />
                Voltar
              </GhostButton>
            ) : (
              <span />
            )}
            {step < 3 ? (
              <GoldButton
                onClick={() => setStep((s) => s + 1)}
                disabled={
                  (step === 1 && !step1Valid) || (step === 2 && !step2Valid)
                }
              >
                Continuar
                <ArrowRight size={16} />
              </GoldButton>
            ) : (
              <GoldButton onClick={finish}>
                Criar o meu plano
                <ArrowRight size={16} />
              </GoldButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      {children}
    </label>
  );
}
