import type { CoupleProfile } from "../types";
import { PHASE_NAMES, TASKS } from "../lib/tasks";
import { daysLeft, fmt, fmtDate, getUrgency, monthsLabel } from "../lib/utils";
import { getBudgetSpent, getGuests } from "../lib/storage";

const CEREMONY_LABEL: Record<CoupleProfile["ceremony"], string> = {
  civil: "Civil",
  catolico: "Católica",
  misto: "Civil com celebração religiosa",
};

const BUDGET_CATEGORIES = [
  { id: "local", label: "Local & Catering", pct: 40 },
  { id: "imagem", label: "Fotografia & Vídeo", pct: 12 },
  { id: "musica", label: "Música & Entretenimento", pct: 8 },
  { id: "flores", label: "Flores & Decoração", pct: 10 },
  { id: "vestuario", label: "Vestuário & Alianças", pct: 10 },
  { id: "papelaria", label: "Convites & Papelaria", pct: 3 },
  { id: "beleza", label: "Beleza & SPA", pct: 4 },
  { id: "transporte", label: "Transporte & Alojamento", pct: 5 },
  { id: "reserva", label: "Fundo de Reserva", pct: 8 },
];

const PHASES: (1 | 2 | 3 | 4 | 5)[] = [1, 2, 3, 4, 5];

/**
 * Vista otimizada para impressão / exportação em PDF (via "Guardar como PDF"
 * do browser). Fica oculta no ecrã e só é visível em `@media print`.
 */
export default function PrintablePlan({
  profile,
  done,
}: {
  profile: CoupleProfile;
  done: Record<string, boolean>;
}) {
  const days = daysLeft(profile.date);
  const doneCount = TASKS.filter((t) => done[t.id]).length;
  const progress = Math.round((doneCount / TASKS.length) * 100);

  const spent = getBudgetSpent();
  const totalSpent = BUDGET_CATEGORIES.reduce(
    (s, c) => s + (spent[c.id] || 0),
    0,
  );
  const balance = profile.budget - totalSpent;

  const guests = getGuests();
  const g = {
    total: guests.length,
    confirmado: guests.filter((x) => x.rsvp === "confirmado").length,
    pendente: guests.filter((x) => x.rsvp === "pendente").length,
    recusado: guests.filter((x) => x.rsvp === "recusado").length,
  };

  return (
    <div className="print-area">
      <div className="print-page">
        {/* Cabeçalho */}
        <header className="print-header">
          <div className="print-brand">💍 Wedding Planner Portugal</div>
          <h1>
            {profile.noiva} &amp; {profile.noivo}
          </h1>
          <p className="print-sub">
            {fmtDate(profile.date)} · {profile.city} ·{" "}
            {CEREMONY_LABEL[profile.ceremony]}
          </p>
          <p className="print-sub">
            {days >= 0 ? `Faltam ${days} dias` : "Data já passou"} · Progresso{" "}
            {progress}% ({doneCount}/{TASKS.length} tarefas)
          </p>
        </header>

        {/* Resumo */}
        <section className="print-grid">
          <div className="print-box">
            <span className="print-label">Orçamento total</span>
            <strong>{fmt(profile.budget)}</strong>
          </div>
          <div className="print-box">
            <span className="print-label">Gasto registado</span>
            <strong>{fmt(totalSpent)}</strong>
          </div>
          <div className="print-box">
            <span className="print-label">Saldo disponível</span>
            <strong>{fmt(balance)}</strong>
          </div>
          <div className="print-box">
            <span className="print-label">Convidados</span>
            <strong>
              {g.total} ({g.confirmado} conf. · {g.pendente} pend. ·{" "}
              {g.recusado} rec.)
            </strong>
          </div>
        </section>

        {/* Orçamento por categoria */}
        <section>
          <h2>Orçamento por categoria</h2>
          <table className="print-table">
            <thead>
              <tr>
                <th>Categoria</th>
                <th>Referência</th>
                <th>Gasto real</th>
              </tr>
            </thead>
            <tbody>
              {BUDGET_CATEGORIES.map((c) => (
                <tr key={c.id}>
                  <td>{c.label}</td>
                  <td>
                    {fmt((profile.budget * c.pct) / 100)} ({c.pct}%)
                  </td>
                  <td>{fmt(spent[c.id] || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Plano por fases */}
        {PHASES.map((phase) => {
          const tasks = TASKS.filter((t) => t.phase === phase);
          const doneInPhase = tasks.filter((t) => done[t.id]).length;
          return (
            <section key={phase} className="print-phase">
              <h2>
                Fase {phase} — {PHASE_NAMES[phase]}{" "}
                <span className="print-count">
                  ({doneInPhase}/{tasks.length})
                </span>
              </h2>
              <ul className="print-tasks">
                {tasks.map((t) => {
                  const isDone = !!done[t.id];
                  const urgency = getUrgency(t.byMonth, profile.date, isDone);
                  return (
                    <li key={t.id} className={isDone ? "is-done" : ""}>
                      <span className="print-check">{isDone ? "☑" : "☐"}</span>
                      <span className="print-task-text">
                        {t.icon} {t.text}
                      </span>
                      <span className="print-task-meta">
                        {t.cat} ·{" "}
                        {isDone
                          ? "concluída"
                          : urgency === "overdue"
                            ? monthsLabel(t.byMonth, profile.date)
                            : monthsLabel(t.byMonth, profile.date)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}

        <footer className="print-footer">
          Gerado por Wedding Planner Portugal em{" "}
          {new Date().toLocaleDateString("pt-PT")}.
        </footer>
      </div>
    </div>
  );
}
