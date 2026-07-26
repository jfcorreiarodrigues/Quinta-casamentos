import { useEffect, useMemo, useState } from "react";
import { Download, Plus, Trash2, UserPlus } from "lucide-react";
import type { Diet, Guest, GuestSide, Plan, RSVP } from "../types";
import { uid } from "../lib/utils";
import { PLANS } from "../lib/plans";
import { getGuests, setGuests as persistGuests } from "../lib/storage";
import { GhostButton, GoldButton, StatCard, UpgradeCTA } from "./ui";

interface Props {
  plan: Plan;
  goToPlans: () => void;
}

const SIDE_LABEL: Record<GuestSide, string> = {
  noiva: "Noiva",
  noivo: "Noivo",
  ambos: "Ambos",
};

const RSVP_LABEL: Record<RSVP, string> = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  recusado: "Recusado",
};

const RSVP_COLOR: Record<RSVP, string> = {
  pendente: "#B8993A",
  confirmado: "#7A9E7E",
  recusado: "#C97B8A",
};

const DIET_LABEL: Record<Diet, string> = {
  normal: "Normal",
  vegetariano: "Vegetariano",
  vegan: "Vegan",
  sem_gluten: "Sem Glúten",
  diabetico: "Diabético",
};

const RSVP_FILTERS: ("todos" | RSVP)[] = [
  "todos",
  "confirmado",
  "pendente",
  "recusado",
];

export default function Guests({ plan, goToPlans }: Props) {
  const [guests, setGuests] = useState<Guest[]>(() => getGuests());
  const [filter, setFilter] = useState<"todos" | RSVP>("todos");

  // Formulário
  const [name, setName] = useState("");
  const [side, setSide] = useState<GuestSide>("noiva");
  const [rsvp, setRsvp] = useState<RSVP>("pendente");
  const [diet, setDiet] = useState<Diet>("normal");
  const [table, setTable] = useState("");

  useEffect(() => {
    persistGuests(guests);
  }, [guests]);

  const limit = PLANS[plan].guestLimit;
  const atLimit = guests.length >= limit;

  const stats = useMemo(() => {
    return {
      total: guests.length,
      confirmado: guests.filter((g) => g.rsvp === "confirmado").length,
      pendente: guests.filter((g) => g.rsvp === "pendente").length,
      recusado: guests.filter((g) => g.rsvp === "recusado").length,
    };
  }, [guests]);

  const filtered = useMemo(
    () =>
      filter === "todos"
        ? guests
        : guests.filter((g) => g.rsvp === filter),
    [guests, filter],
  );

  const addGuest = () => {
    if (!name.trim() || atLimit) return;
    setGuests((prev) => [
      ...prev,
      {
        id: uid(),
        name: name.trim(),
        side,
        rsvp,
        diet,
        table: table.trim(),
      },
    ]);
    setName("");
    setTable("");
    setDiet("normal");
    setRsvp("pendente");
  };

  const removeGuest = (id: string) =>
    setGuests((prev) => prev.filter((g) => g.id !== id));

  const updateRsvp = (id: string, r: RSVP) =>
    setGuests((prev) =>
      prev.map((g) => (g.id === id ? { ...g, rsvp: r } : g)),
    );

  const exportCsv = () => {
    if (guests.length === 0) return;
    const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
    const header = ["Nome", "Lado", "RSVP", "Dieta", "Mesa"];
    const rows = guests.map((g) =>
      [
        g.name,
        SIDE_LABEL[g.side],
        RSVP_LABEL[g.rsvp],
        DIET_LABEL[g.diet],
        g.table,
      ]
        .map((v) => esc(String(v ?? "")))
        .join(","),
    );
    // BOM para acentos abrirem bem no Excel.
    const csv = "﻿" + [header.map(esc).join(","), ...rows].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "convidados.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">
            Convidados
          </h1>
          <p className="text-sm text-muted">
            Faça a gestão da lista e das confirmações (RSVP).
          </p>
        </div>
        <GhostButton onClick={exportCsv} disabled={guests.length === 0}>
          <Download size={16} />
          Exportar CSV
        </GhostButton>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total" value={stats.total} />
        <StatCard
          label="Confirmados"
          value={stats.confirmado}
          accent="#7A9E7E"
        />
        <StatCard label="Pendentes" value={stats.pendente} accent="#B8993A" />
        <StatCard label="Recusados" value={stats.recusado} accent="#C97B8A" />
      </div>

      {/* Formulário */}
      <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <UserPlus size={18} className="text-gold-dark" />
          <h2 className="font-display text-lg font-semibold text-ink">
            Adicionar convidado
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <input
            className="wp-input"
            placeholder="Nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addGuest()}
          />
          <select
            className="wp-input"
            value={side}
            onChange={(e) => setSide(e.target.value as GuestSide)}
          >
            {(Object.keys(SIDE_LABEL) as GuestSide[]).map((s) => (
              <option key={s} value={s}>
                Lado: {SIDE_LABEL[s]}
              </option>
            ))}
          </select>
          <select
            className="wp-input"
            value={rsvp}
            onChange={(e) => setRsvp(e.target.value as RSVP)}
          >
            {(Object.keys(RSVP_LABEL) as RSVP[]).map((r) => (
              <option key={r} value={r}>
                {RSVP_LABEL[r]}
              </option>
            ))}
          </select>
          <select
            className="wp-input"
            value={diet}
            onChange={(e) => setDiet(e.target.value as Diet)}
          >
            {(Object.keys(DIET_LABEL) as Diet[]).map((d) => (
              <option key={d} value={d}>
                {DIET_LABEL[d]}
              </option>
            ))}
          </select>
          <input
            className="wp-input"
            placeholder="Mesa (ex: Mesa 3)"
            value={table}
            onChange={(e) => setTable(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addGuest()}
          />
          <GoldButton onClick={addGuest} disabled={!name.trim() || atLimit}>
            <Plus size={16} />
            Adicionar
          </GoldButton>
        </div>

        {atLimit && (
          <UpgradeCTA
            message={`Atingiu o limite de ${limit} convidados do plano Básico.`}
            onUpgrade={goToPlans}
          />
        )}
        {!atLimit && plan === "free" && (
          <p className="mt-2 text-xs text-muted">
            {guests.length}/{limit} convidados (plano Básico).
          </p>
        )}
      </section>

      {/* Filtros + tabela */}
      <section className="rounded-2xl border border-line bg-white shadow-sm">
        <div className="flex flex-wrap gap-1.5 border-b border-line p-3">
          {RSVP_FILTERS.map((f) => {
            const active = filter === f;
            const label =
              f === "todos" ? "Todos" : RSVP_LABEL[f as RSVP];
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-gold-primary/15 text-gold-deep"
                    : "text-muted hover:bg-cream"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-muted">
            {guests.length === 0
              ? "Ainda não adicionou convidados."
              : "Nenhum convidado neste filtro."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-2.5 font-medium">Nome</th>
                  <th className="px-4 py-2.5 font-medium">Lado</th>
                  <th className="px-4 py-2.5 font-medium">RSVP</th>
                  <th className="px-4 py-2.5 font-medium">Dieta</th>
                  <th className="px-4 py-2.5 font-medium">Mesa</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((g) => (
                  <tr key={g.id} className="hover:bg-cream/50">
                    <td className="px-4 py-2.5 font-medium text-ink">
                      {g.name}
                    </td>
                    <td className="px-4 py-2.5 text-muted">
                      {SIDE_LABEL[g.side]}
                    </td>
                    <td className="px-4 py-2.5">
                      <select
                        value={g.rsvp}
                        onChange={(e) =>
                          updateRsvp(g.id, e.target.value as RSVP)
                        }
                        className="rounded-md border border-line bg-white px-2 py-1 text-xs font-semibold"
                        style={{ color: RSVP_COLOR[g.rsvp] }}
                      >
                        {(Object.keys(RSVP_LABEL) as RSVP[]).map((r) => (
                          <option key={r} value={r}>
                            {RSVP_LABEL[r]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2.5 text-muted">
                      {DIET_LABEL[g.diet]}
                    </td>
                    <td className="px-4 py-2.5 text-muted">{g.table || "—"}</td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={() => removeGuest(g.id)}
                        className="text-muted transition-colors hover:text-urgency-overdue"
                        aria-label="Remover convidado"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
