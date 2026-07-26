import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { CoupleProfile, Plan, Task } from "../types";
import { PHASE_NAMES, TASKS } from "../lib/tasks";
import { getUrgency, monthsLabel } from "../lib/utils";
import { PLANS } from "../lib/plans";
import { LockOverlay, ProgressBar, UrgencyBadge } from "./ui";

interface Props {
  profile: CoupleProfile;
  done: Record<string, boolean>;
  plan: Plan;
  toggleTask: (id: string) => void;
  goToPlans: () => void;
}

const PHASES: (1 | 2 | 3 | 4 | 5)[] = [1, 2, 3, 4, 5];

export default function Timeline({
  profile,
  done,
  plan,
  toggleTask,
  goToPlans,
}: Props) {
  const [open, setOpen] = useState<Record<number, boolean>>({ 1: true });
  const unlockedPhases = PLANS[plan].timelinePhases;

  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-display text-2xl font-semibold text-ink">
          Plano completo
        </h1>
        <p className="text-sm text-muted">
          As 36 etapas do seu casamento, organizadas em 5 fases.
        </p>
      </header>

      {PHASES.map((phase) => {
        const tasks = TASKS.filter((t) => t.phase === phase);
        const doneInPhase = tasks.filter((t) => done[t.id]).length;
        const pct = Math.round((doneInPhase / tasks.length) * 100);
        const locked = phase > unlockedPhases;
        const isOpen = !!open[phase] && !locked;

        return (
          <section
            key={phase}
            className="relative overflow-hidden rounded-2xl border border-line bg-white shadow-sm"
          >
            <button
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
              onClick={() =>
                !locked && setOpen((o) => ({ ...o, [phase]: !o[phase] }))
              }
              disabled={locked}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-display text-sm font-semibold text-white"
                style={{
                  background: "linear-gradient(135deg,#C9A96E,#7A6040)",
                }}
              >
                {phase}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="truncate font-display text-base font-semibold text-ink">
                    {PHASE_NAMES[phase]}
                  </h2>
                  <span className="shrink-0 text-xs text-muted">
                    {doneInPhase}/{tasks.length}
                  </span>
                </div>
                <div className="mt-1.5">
                  <ProgressBar value={pct} height={6} />
                </div>
              </div>
              {!locked && (
                <ChevronDown
                  size={18}
                  className={`shrink-0 text-muted transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              )}
            </button>

            {isOpen && (
              <ul className="divide-y divide-line border-t border-line">
                {tasks.map((t) => (
                  <PhaseTaskRow
                    key={t.id}
                    task={t}
                    date={profile.date}
                    done={!!done[t.id]}
                    onToggle={() => toggleTask(t.id)}
                  />
                ))}
              </ul>
            )}

            {locked && (
              <div className="relative min-h-[120px]">
                <div className="pointer-events-none px-4 py-6 opacity-40">
                  <div className="space-y-2">
                    <div className="h-3 w-3/4 rounded bg-line" />
                    <div className="h-3 w-2/3 rounded bg-line" />
                    <div className="h-3 w-4/5 rounded bg-line" />
                  </div>
                </div>
                <LockOverlay
                  title={`Fase ${phase} bloqueada`}
                  description="As fases 3 a 5 estão disponíveis nos planos Pro e Premium."
                  onUpgrade={goToPlans}
                />
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

function PhaseTaskRow({
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
          className={`text-sm ${done ? "text-muted line-through" : "text-ink"}`}
        >
          {task.text}
        </div>
        <div className="text-xs text-muted">{task.cat}</div>
      </div>
      <UrgencyBadge
        urgency={urgency}
        text={done ? "Feito" : monthsLabel(task.byMonth, date)}
      />
    </li>
  );
}
