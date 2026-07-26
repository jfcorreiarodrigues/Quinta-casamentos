import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  LayoutGrid,
  ListChecks,
  Menu,
  MessageCircle,
  Search,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import type { CoupleProfile, Plan } from "./types";
import {
  getDone,
  getPlan,
  getProfile,
  setDone as persistDone,
  setPlan as persistPlan,
  setProfile as persistProfile,
} from "./lib/storage";
import { daysLeft, fmtDate } from "./lib/utils";
import { PlanBadge } from "./components/ui";
import Onboarding from "./components/Onboarding";
import Dashboard from "./components/Dashboard";
import Timeline from "./components/Timeline";
import Budget from "./components/Budget";
import Guests from "./components/Guests";
import Vendors from "./components/Vendors";
import Assistant from "./components/Assistant";
import Plans from "./components/Plans";

export type View =
  | "dashboard"
  | "timeline"
  | "budget"
  | "guests"
  | "vendors"
  | "assistant"
  | "plans";

const NAV: { id: View; label: string; icon: typeof LayoutGrid }[] = [
  { id: "dashboard", label: "Início", icon: LayoutGrid },
  { id: "timeline", label: "Plano", icon: ListChecks },
  { id: "budget", label: "Orçamento", icon: Wallet },
  { id: "guests", label: "Convidados", icon: Users },
  { id: "vendors", label: "Fornecedores", icon: Search },
  { id: "assistant", label: "Assistente", icon: MessageCircle },
  { id: "plans", label: "Planos", icon: Sparkles },
];

export default function App() {
  const [profile, setProfileState] = useState<CoupleProfile | null>(() =>
    getProfile(),
  );
  const [done, setDoneState] = useState<Record<string, boolean>>(() =>
    getDone(),
  );
  const [plan, setPlanState] = useState<Plan>(() => getPlan());
  const [view, setView] = useState<View>("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);

  // Persistência reativa
  useEffect(() => {
    if (profile) persistProfile(profile);
  }, [profile]);
  useEffect(() => {
    persistDone(done);
  }, [done]);
  useEffect(() => {
    persistPlan(plan);
  }, [plan]);

  const toggleTask = (id: string) =>
    setDoneState((prev) => ({ ...prev, [id]: !prev[id] }));

  const goToPlans = () => {
    setView("plans");
    setMenuOpen(false);
  };

  const days = useMemo(
    () => (profile ? daysLeft(profile.date) : 0),
    [profile],
  );

  // ── Onboarding ──────────────────────────────────────────────────
  if (!profile) {
    return (
      <Onboarding
        onComplete={(p, initialDone) => {
          setProfileState(p);
          setDoneState(initialDone);
        }}
      />
    );
  }

  const commonProps = { profile, done, plan, toggleTask, goToPlans };

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-[860px] items-center justify-between gap-3 px-4 py-3">
          <button
            className="flex items-center gap-2 text-left"
            onClick={() => setView("dashboard")}
          >
            <span className="text-xl">💍</span>
            <div className="leading-tight">
              <div className="font-display text-base font-semibold text-ink">
                Wedding Planner
              </div>
              <div className="hidden text-xs text-muted sm:block">
                {profile.noiva} &amp; {profile.noivo} ·{" "}
                {days >= 0 ? `${days} dias` : "data passada"}
              </div>
            </div>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={goToPlans}
              className="transition-transform hover:scale-105"
              title="Ver planos"
            >
              <PlanBadge plan={plan} />
            </button>
            <button
              className="rounded-lg p-2 text-ink hover:bg-cream sm:hidden"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>

        {/* Navegação — desktop / tablet */}
        <nav className="tabs-scroll mx-auto hidden max-w-[860px] gap-1 overflow-x-auto px-2 pb-2 sm:flex">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-gold-primary/15 text-gold-deep"
                    : "text-muted hover:bg-cream hover:text-ink"
                }`}
              >
                <Icon size={16} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Navegação — mobile (menu) */}
        {menuOpen && (
          <nav className="grid grid-cols-2 gap-1 border-t border-line px-3 py-3 sm:hidden">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = view === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setView(item.id);
                    setMenuOpen(false);
                  }}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-gold-primary/15 text-gold-deep"
                      : "text-muted hover:bg-cream"
                  }`}
                >
                  <Icon size={16} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        )}
      </header>

      {/* Conteúdo */}
      <main className="mx-auto max-w-[860px] px-4 py-6">
        {view === "dashboard" && (
          <Dashboard {...commonProps} onNavigate={setView} />
        )}
        {view === "timeline" && <Timeline {...commonProps} />}
        {view === "budget" && (
          <Budget
            profile={profile}
            plan={plan}
            onProfileChange={setProfileState}
            goToPlans={goToPlans}
          />
        )}
        {view === "guests" && <Guests plan={plan} goToPlans={goToPlans} />}
        {view === "vendors" && (
          <Vendors profile={profile} plan={plan} goToPlans={goToPlans} />
        )}
        {view === "assistant" && (
          <Assistant
            profile={profile}
            done={done}
            plan={plan}
            goToPlans={goToPlans}
          />
        )}
        {view === "plans" && (
          <Plans plan={plan} onSelect={setPlanState} />
        )}
      </main>

      {/* Rodapé */}
      <footer className="mx-auto max-w-[860px] px-4 pb-10 pt-4 text-center text-xs text-muted">
        <div className="flex items-center justify-center gap-1.5">
          <Calendar size={13} />
          {profile.noiva} &amp; {profile.noivo} — {fmtDate(profile.date)} ·{" "}
          {profile.city}
        </div>
        <p className="mt-2">
          Wedding Planner Portugal · Dados guardados apenas neste dispositivo.
        </p>
      </footer>
    </div>
  );
}
