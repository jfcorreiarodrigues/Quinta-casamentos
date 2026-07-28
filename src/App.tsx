import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  Calendar,
  LayoutGrid,
  ListChecks,
  Loader2,
  Menu,
  MessageCircle,
  Search,
  Settings as SettingsIcon,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import type { CoupleProfile, Plan } from "./types";
import {
  clearAll,
  exportAll,
  getDone,
  getPlan,
  getProfile,
  importAll,
  setDone as persistDone,
  setPlan as persistPlan,
  setProfile as persistProfile,
  setSyncSuspended,
} from "./lib/storage";
import { daysLeft, fmtDate } from "./lib/utils";
import { clearCheckoutParams, readCheckoutResult } from "./lib/billing";
import { getSupabase, isCloudEnabled } from "./lib/supabase";
import { pullState, pushState } from "./lib/sync";
import { PlanBadge } from "./components/ui";
import Auth from "./components/Auth";
import Onboarding from "./components/Onboarding";
import Dashboard from "./components/Dashboard";
import Timeline from "./components/Timeline";
import Budget from "./components/Budget";
import Guests from "./components/Guests";
import Vendors from "./components/Vendors";
import Assistant from "./components/Assistant";
import Plans from "./components/Plans";
import Settings from "./components/Settings";
import PrintablePlan from "./components/PrintablePlan";

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

function AppMain({
  userId,
  onSignOut,
}: {
  userId: string | null;
  onSignOut: (() => void) | null;
}) {
  const [profile, setProfileState] = useState<CoupleProfile | null>(() =>
    getProfile(),
  );
  const [done, setDoneState] = useState<Record<string, boolean>>(() =>
    getDone(),
  );
  const [plan, setPlanState] = useState<Plan>(() => getPlan());
  const [view, setView] = useState<View>("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

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

  // Sincronização na cloud: em cada mudança de dados, faz push (com debounce).
  useEffect(() => {
    if (!userId) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onChange = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        pushState(userId, exportAll().data as Record<string, unknown>).catch(
          (e) => console.warn("Falha ao sincronizar:", e),
        );
      }, 800);
    };
    window.addEventListener("wp:changed", onChange);
    return () => {
      window.removeEventListener("wp:changed", onChange);
      clearTimeout(timer);
    };
  }, [userId]);

  // Resultado de um checkout Stripe (redirect de volta ao frontend).
  // ⚠️ FRONTEIRA DE CONFIANÇA (MVP): o plano é ativado a partir do parâmetro de
  // redirect, que é forjável. Coerente com o modelo client-side deste MVP (o
  // plano vive no localStorage). Em PRODUÇÃO, a entitlement TEM de ser derivada
  // no servidor a partir do webhook Stripe + registo do utilizador — nunca do URL.
  useEffect(() => {
    const result = readCheckoutResult();
    if (!result) return;
    if (result.status === "success" && result.plan) {
      setPlanState(result.plan);
      setToast(`Subscrição ativada! Bem-vindo ao plano ${result.plan === "pro" ? "Pro" : "Premium"}. 🎉`);
    } else if (result.status === "cancel") {
      setToast("Pagamento cancelado. O seu plano mantém-se inalterado.");
    }
    clearCheckoutParams();
  }, []);

  // Auto-fechar o toast
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(id);
  }, [toast]);

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
              className="rounded-lg p-2 text-ink hover:bg-cream"
              onClick={() => setSettingsOpen(true)}
              aria-label="Definições"
              title="Definições"
            >
              <SettingsIcon size={19} />
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
      <main key={view} className="wp-fade-in mx-auto max-w-[860px] px-4 py-6">
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
          Wedding Planner Portugal ·{" "}
          {userId
            ? "Dados sincronizados na sua conta."
            : "Dados guardados apenas neste dispositivo."}
        </p>
      </footer>

      {settingsOpen && (
        <Settings
          profile={profile}
          onSave={setProfileState}
          onClose={() => setSettingsOpen(false)}
          onSignOut={onSignOut}
        />
      )}

      {/* Vista de impressão (oculta no ecrã, visível em PDF/print) */}
      <PrintablePlan profile={profile} done={done} />

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="wp-modal-in fixed inset-x-0 bottom-4 z-50 mx-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-line bg-white px-4 py-3 text-center text-sm font-medium text-ink shadow-lg"
        >
          {toast}
        </div>
      )}
    </div>
  );
}

// ── Ecrã de carregamento ──────────────────────────────────────────
function FullLoader({ label }: { label: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-cream text-muted">
      <span className="text-3xl">💍</span>
      <div className="flex items-center gap-2 text-sm">
        <Loader2 size={16} className="animate-spin" />
        {label}
      </div>
    </div>
  );
}

/**
 * Gere autenticação e sincronização quando a cloud está configurada:
 * carrega a sessão, mostra o login, e hidrata o estado a partir da cloud antes
 * de montar a app (para que os componentes leiam já os dados sincronizados).
 */
function CloudGate() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    sb.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = sb.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (!s) setHydrated(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session || hydrated) return;
    let cancelled = false;
    (async () => {
      try {
        setSyncSuspended(true);
        const remote = await pullState(session.user.id);
        if (remote) {
          // Cloud é a fonte de verdade: substitui o estado local.
          clearAll();
          importAll({
            app: "wedding-planner-portugal",
            version: 1,
            exportedAt: "",
            data: remote,
          });
        } else {
          // Primeira vez: envia eventuais dados locais para a cloud.
          const local = exportAll().data as Record<string, unknown>;
          if (Object.keys(local).length > 0) {
            await pushState(session.user.id, local);
          }
        }
      } catch (e) {
        console.warn("Falha ao sincronizar o plano:", e);
      } finally {
        setSyncSuspended(false);
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session, hydrated]);

  if (session === undefined) return <FullLoader label="A carregar…" />;
  if (session === null) return <Auth />;
  if (!hydrated) return <FullLoader label="A sincronizar o seu plano…" />;

  const sb = getSupabase();
  return (
    <AppMain
      key={session.user.id}
      userId={session.user.id}
      onSignOut={sb ? () => void sb.auth.signOut() : null}
    />
  );
}

export default function App() {
  // Sem cloud configurada, corre em modo local (localStorage), sem login.
  if (!isCloudEnabled()) {
    return <AppMain userId={null} onSignOut={null} />;
  }
  return <CloudGate />;
}
