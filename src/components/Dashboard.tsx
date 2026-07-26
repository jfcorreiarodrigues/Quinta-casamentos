import { useMemo } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Clock,
  Users,
  Wallet,
} from "lucide-react";
import type { CoupleProfile, Plan, Task, Urgency } from "../types";
import type { View } from "../App";
import { TASKS } from "../lib/tasks";
import {
  daysLeft,
  fmt,
  fmtDate,
  getUrgency,
  targetDateLabel,
  urgencyMeta,
} from "../lib/utils";
import { dashboardSectionLimit } from "../lib/plans";
import { InfoBox, ProgressBar, StatCard, UpgradeCTA } from "./ui";

interface Props {
  profile: CoupleProfile;
  done: Record<string, boolean>;
  plan: Plan;
  toggleTask: (id: string) => void;
  goToPlans: () => void;
  onNavigate: (v: View) => void;
}

const CEREMONY_LABEL: Record<CoupleProfile["ceremony"], string> = {
  civil: "Civil",
  catolico: "Católica",
  misto: "Civil + religiosa",
};

const SECTION_ORDER: Urgency[] = [
  "overdue",
  "urgent",
  "soon",
  "upcoming",
  "done",
];

export default function Dashboard({
  profile,
  done,
  plan,
  toggleTask,
  goToPlans,
}: Props) {
  const days = daysLeft(profile.date);

  const grouped = useMemo(() => {
    const g: Record<Urgency, Task[]> = {
      overdue: [],
      urgent: [],
      soon: [],
      upcoming: [],
      done: [],
    };
    for (const t of TASKS) {
      const u = getUrgency(t.byMonth, profile.date, !!done[t.id]);
      g[u].push(t);
    }
    return g;
  }, [profile.date, done]);

  const doneCount = TASKS.filter((t) => done[t.id]).length;
  const progress = Math.round((doneCount / TASKS.length) * 100);
  const baseLimit = dashboardSectionLimit(plan);
  // Nunca esconder tarefas atrasadas atrás do paywall — são as mais críticas.
  const limitFor = (u: Urgency) => (u === "overdue" ? Infinity : baseLimit);
  // Muitas atrasadas costuma significar pouco tempo de antecedência.
  const showRunwayNote = grouped.overdue.length >= 8;

  return (
    <div className="space-y-6">
      {/* Hero card */}
      <div
        className="relative overflow-hidden rounded-3xl p-6 text-white shadow-md sm:p-8"
        style={{
          background:
            "linear-gradient(135deg, #2A2118 0%, #4A3B28 55%, #7A6040 100%)",
        }}
      >
        <div className="absolute -right-8 -top-10 text-[9rem] opacity-10">
          💍
        </div>
        <div className="relative">
          <p className="text-sm font-medium text-gold-primary">
            O casamento de
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold sm:text-4xl">
            {profile.noiva} &amp; {profile.noivo}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/80">
            <span className="flex items-center gap-1.5">
              <CalendarDays size={15} />
              {fmtDate(profile.date)}
            </span>
            <span className="text-white/40">·</span>
            <span>{profile.city}</span>
          </div>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex-1">
              <div className="mb-1.5 flex items-center justify-between text-xs text-white/70">
                <span>Progresso do plano</span>
                <span>
                  {doneCount}/{TASKS.length} tarefas · {progress}%
                </span>
              </div>
              <ProgressBar
                value={progress}
                color="#C9A96E"
                track="rgba(255,255,255,0.18)"
                height={10}
              />
            </div>
            <div className="text-right">
              <div className="font-display text-4xl font-semibold leading-none text-gold-primary">
                {days >= 0 ? days : "—"}
              </div>
              <div className="text-xs text-white/70">
                {days >= 0 ? "dias que faltam" : "data já passou"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          label="Orçamento"
          value={fmt(profile.budget)}
          icon={<Wallet size={16} />}
        />
        <StatCard
          label="Convidados"
          value={profile.guests}
          icon={<Users size={16} />}
        />
        <StatCard label="Cerimónia" value={CEREMONY_LABEL[profile.ceremony]} />
        <StatCard
          label="Atrasadas"
          value={grouped.overdue.length}
          accent={
            grouped.overdue.length > 0 ? urgencyMeta.overdue.color : undefined
          }
          icon={<AlertTriangle size={16} />}
        />
        <StatCard
          label="Urgentes"
          value={grouped.urgent.length}
          accent={
            grouped.urgent.length > 0 ? urgencyMeta.urgent.color : undefined
          }
          icon={<Clock size={16} />}
        />
      </div>

      {/* Nota empática quando há pouco tempo até à data */}
      {showRunwayNote && (
        <InfoBox tone="warn">
          Começaste com pouco tempo até à data, por isso várias tarefas de
          arranque surgem já como prioritárias. Não entres em pânico: ataca
          primeiro as marcadas a vermelho, decide o essencial (espaço, catering,
          fotógrafo) e delega ou simplifica o resto.
        </InfoBox>
      )}

      {/* Secções por urgência */}
      <div className="space-y-4">
        {SECTION_ORDER.map((u) => {
          const tasks = grouped[u];
          if (tasks.length === 0) return null;
          const meta = urgencyMeta[u];
          const visible = tasks.slice(0, limitFor(u));
          const hidden = tasks.length - visible.length;

          return (
            <section
              key={u}
              className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm"
              style={{ borderLeft: `4px solid ${meta.color}` }}
            >
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ backgroundColor: meta.bg }}
              >
                <h2
                  className="font-display text-base font-semibold"
                  style={{ color: meta.color }}
                >
                  {meta.label}
                </h2>
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-semibold"
                  style={{ backgroundColor: meta.color, color: "#fff" }}
                >
                  {tasks.length}
                </span>
              </div>

              <ul className="divide-y divide-line">
                {visible.map((t) => (
                  <TaskRow
                    key={t.id}
                    task={t}
                    date={profile.date}
                    done={!!done[t.id]}
                    onToggle={() => toggleTask(t.id)}
                  />
                ))}
              </ul>

              {hidden > 0 && (
                <div className="px-4 pb-4 pt-1">
                  <UpgradeCTA
                    message={`Mais ${hidden} ${
                      hidden === 1 ? "tarefa nesta secção" : "tarefas nesta secção"
                    } no plano Pro.`}
                    onUpgrade={goToPlans}
                  />
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function TaskRow({
  task,
  date,
  done,
  onToggle,
}: {
  task: Task;
  date: string;
  done: boolean;
  onToggle: () => void;
}) {
  const urgency = getUrgency(task.byMonth, date, done);
  const meta = urgencyMeta[urgency];
  return (
    <li className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-cream/60">
      <button
        onClick={onToggle}
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
          done
            ? "border-urgency-done bg-urgency-done text-white"
            : "border-muted/50 hover:border-gold-primary"
        }`}
        aria-label={done ? "Marcar como pendente" : "Marcar como concluída"}
      >
        {done && (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 13l4 4L19 7"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
      <span className="text-lg">{task.icon}</span>
      <div className="min-w-0 flex-1">
        <div
          className={`truncate text-sm ${
            done ? "text-muted line-through" : "text-ink"
          }`}
        >
          {task.text}
        </div>
        <div className="text-xs text-muted">{task.cat}</div>
      </div>
      {!done && (
        <span
          className="shrink-0 whitespace-nowrap text-xs font-medium"
          style={{ color: meta.color }}
        >
          {targetDateLabel(task.byMonth, date)}
        </span>
      )}
    </li>
  );
}
