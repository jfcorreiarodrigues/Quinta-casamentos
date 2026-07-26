import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Lock, Sparkles } from "lucide-react";
import type { Plan, Urgency } from "../../types";
import { urgencyMeta } from "../../lib/utils";
import { PLANS } from "../../lib/plans";

// ── GoldButton ────────────────────────────────────────────────────
export function GoldButton({
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:shadow-md hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      style={{
        background: "linear-gradient(135deg, #C9A96E 0%, #A0785A 100%)",
      }}
      {...props}
    >
      {children}
    </button>
  );
}

// ── GhostButton ───────────────────────────────────────────────────
export function GhostButton({
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-gold-primary/60 bg-transparent px-5 py-2.5 text-sm font-semibold text-gold-dark transition-all duration-200 hover:bg-gold-primary/10 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

// ── InfoBox ───────────────────────────────────────────────────────
export function InfoBox({
  children,
  tone = "cream",
  className = "",
}: {
  children: ReactNode;
  tone?: "cream" | "warn";
  className?: string;
}) {
  const styles =
    tone === "warn"
      ? "border-urgency-urgent/40 bg-urgency-urgent/10 text-ink"
      : "border-line bg-cream text-ink";
  return (
    <div
      className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${styles} ${className}`}
    >
      {children}
    </div>
  );
}

// ── StatCard ──────────────────────────────────────────────────────
export function StatCard({
  label,
  value,
  icon,
  accent,
  sub,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  accent?: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">
          {label}
        </span>
        {icon && <span className="text-muted">{icon}</span>}
      </div>
      <div
        className="font-display text-2xl font-semibold leading-tight"
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </div>
      {sub && <div className="mt-0.5 text-xs text-muted">{sub}</div>}
    </div>
  );
}

// ── UrgencyBadge ──────────────────────────────────────────────────
export function UrgencyBadge({
  urgency,
  text,
}: {
  urgency: Urgency;
  text?: string;
}) {
  const meta = urgencyMeta[urgency];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: meta.bg, color: meta.color }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: meta.color }}
      />
      {text ?? meta.label}
    </span>
  );
}

// ── ProgressBar ───────────────────────────────────────────────────
export function ProgressBar({
  value,
  color = "#C9A96E",
  track = "#EDE5D5",
  height = 8,
}: {
  value: number; // 0–100
  color?: string;
  track?: string;
  height?: number;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      className="w-full overflow-hidden rounded-full"
      style={{ backgroundColor: track, height }}
    >
      <div
        className="h-full rounded-full transition-all duration-500 ease-out"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

// ── LockOverlay ───────────────────────────────────────────────────
export function LockOverlay({
  title,
  description,
  onUpgrade,
  requiredPlan = "pro",
}: {
  title: string;
  description: string;
  onUpgrade: () => void;
  requiredPlan?: Plan;
}) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-2xl bg-cream/80 p-6 text-center backdrop-blur-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold-primary/15 text-gold-dark">
        <Lock size={22} />
      </div>
      <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
      <p className="max-w-xs text-sm text-muted">{description}</p>
      <GoldButton onClick={onUpgrade}>
        <Sparkles size={16} />
        Desbloquear com {PLANS[requiredPlan].name}
      </GoldButton>
    </div>
  );
}

// ── PlanBadge ─────────────────────────────────────────────────────
export function PlanBadge({ plan }: { plan: Plan }) {
  const cfg = PLANS[plan];
  const style =
    plan === "premium"
      ? { background: "linear-gradient(135deg,#C9A96E,#7A6040)", color: "#fff" }
      : plan === "pro"
        ? { background: "rgba(201,169,110,0.18)", color: "#7A6040" }
        : { background: "#EDE5D5", color: "#7A6040" };
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={style}
    >
      {plan !== "free" && <Sparkles size={12} />}
      {cfg.name}
    </span>
  );
}

// ── UpgradeCTA (linha compacta) ───────────────────────────────────
export function UpgradeCTA({
  message,
  onUpgrade,
}: {
  message: string;
  onUpgrade: () => void;
}) {
  return (
    <div className="mt-3 flex flex-col items-center gap-2 rounded-xl border border-dashed border-gold-primary/50 bg-gold-primary/5 px-4 py-3 text-center sm:flex-row sm:justify-between sm:text-left">
      <span className="text-sm text-gold-deep">{message}</span>
      <GoldButton className="shrink-0" onClick={onUpgrade}>
        <Sparkles size={16} />
        Fazer upgrade
      </GoldButton>
    </div>
  );
}
