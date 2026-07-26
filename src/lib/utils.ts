import type { Urgency } from "../types";

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const DAYS_PER_MONTH = 30.44; // média

/** Meses (fracionários) até à data do casamento. Pode ser negativo se a data já passou. */
export function monthsLeft(date: string): number {
  if (!date) return 0;
  const target = new Date(date + "T00:00:00");
  if (isNaN(target.getTime())) return 0;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffDays = (target.getTime() - now.getTime()) / MS_PER_DAY;
  return diffDays / DAYS_PER_MONTH;
}

/** Dias inteiros até à data do casamento. Pode ser negativo. */
export function daysLeft(date: string): number {
  if (!date) return 0;
  const target = new Date(date + "T00:00:00");
  if (isNaN(target.getTime())) return 0;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / MS_PER_DAY);
}

/**
 * Calcula a urgência de uma tarefa.
 * - done:     tarefa marcada como concluída
 * - overdue:  meses restantes <= byMonth  (devia estar feita)
 * - urgent:   meses restantes <= byMonth + 2
 * - soon:     meses restantes <= byMonth + 4
 * - upcoming: resto
 */
export function getUrgency(
  byMonth: number,
  date: string,
  isDone: boolean,
): Urgency {
  if (isDone) return "done";
  const left = monthsLeft(date);
  if (left <= byMonth) return "overdue";
  if (left <= byMonth + 2) return "urgent";
  if (left <= byMonth + 4) return "soon";
  return "upcoming";
}

export interface UrgencyMetaEntry {
  label: string;
  color: string; // hex
  bg: string; // rgba subtil
  order: number;
}

export const urgencyMeta: Record<Urgency, UrgencyMetaEntry> = {
  overdue: { label: "Atrasadas", color: "#C97B8A", bg: "rgba(201,123,138,0.10)", order: 0 },
  urgent: { label: "Urgentes", color: "#D4855A", bg: "rgba(212,133,90,0.10)", order: 1 },
  soon: { label: "Em breve", color: "#B8993A", bg: "rgba(184,153,58,0.10)", order: 2 },
  upcoming: { label: "A caminho", color: "#6B8CAE", bg: "rgba(107,140,174,0.10)", order: 3 },
  done: { label: "Concluídas", color: "#7A9E7E", bg: "rgba(122,158,126,0.10)", order: 4 },
};

/** Formata um número como moeda em euros (PT-PT). */
export function fmt(n: number): string {
  return Number(Math.round(n)).toLocaleString("pt-PT") + " €";
}

/** Formata uma data ISO como "12 de junho de 2026". */
export function fmtDate(date: string): string {
  if (!date) return "";
  const d = new Date(date + "T00:00:00");
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("pt-PT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Rótulo curto de meses restantes para os badges temporais. */
export function monthsLabel(byMonth: number, date: string): string {
  const left = monthsLeft(date);
  const diff = left - byMonth;
  if (diff <= 0) {
    const atraso = Math.max(0, Math.round(-diff));
    return atraso <= 0 ? "agora" : `há ~${atraso}m atr.`;
  }
  return `em ~${Math.round(diff)}m`;
}

/**
 * Data-limite real de uma tarefa = data do casamento menos `byMonth` meses.
 * Devolve null se a data for inválida.
 */
export function targetDate(byMonth: number, date: string): Date | null {
  if (!date) return null;
  const wedding = new Date(date + "T00:00:00");
  if (isNaN(wedding.getTime())) return null;
  const d = new Date(wedding);
  d.setDate(d.getDate() - Math.round(byMonth * DAYS_PER_MONTH));
  return d;
}

/** Rótulo concreto da data-limite, ex: "até 15 set 2026" (ou "" se inválida). */
export function targetDateLabel(byMonth: number, date: string): string {
  const d = targetDate(byMonth, date);
  if (!d) return "";
  const label = d.toLocaleDateString("pt-PT", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `até ${label}`;
}

/** Gera um id simples único o suficiente para uso local. */
export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
