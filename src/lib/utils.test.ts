import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  daysLeft,
  fmt,
  getUrgency,
  monthsLabel,
  monthsLeft,
  targetDate,
  targetDateLabel,
} from "./utils";

// "Agora" fixo para tornar a matemática de datas determinística.
const NOW = new Date(2026, 0, 1, 0, 0, 0); // 1 jan 2026, hora local

/** Data ISO (YYYY-MM-DD) a N dias de NOW, em hora local (sem ruído de TZ). */
function isoInDays(days: number): string {
  const d = new Date(NOW);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});
afterEach(() => {
  vi.useRealTimers();
});

describe("daysLeft", () => {
  it("é 0 no próprio dia", () => {
    expect(daysLeft(isoInDays(0))).toBe(0);
  });
  it("conta dias futuros", () => {
    expect(daysLeft(isoInDays(7))).toBe(7);
    expect(daysLeft(isoInDays(100))).toBe(100);
  });
  it("é negativo para datas passadas", () => {
    expect(daysLeft(isoInDays(-10))).toBe(-10);
  });
  it("devolve 0 para entrada inválida ou vazia", () => {
    expect(daysLeft("")).toBe(0);
    expect(daysLeft("não-é-data")).toBe(0);
  });
});

describe("monthsLeft", () => {
  it("é ~0 no próprio dia", () => {
    expect(monthsLeft(isoInDays(0))).toBeCloseTo(0, 5);
  });
  it("aproxima meses a partir de dias (30.44/mês)", () => {
    expect(monthsLeft(isoInDays(304))).toBeCloseTo(304 / 30.44, 5);
  });
  it("é negativo para datas passadas", () => {
    expect(monthsLeft(isoInDays(-61))).toBeLessThan(0);
  });
});

describe("getUrgency", () => {
  it("devolve 'done' quando concluída, ignorando a data", () => {
    expect(getUrgency(1, isoInDays(-999), true)).toBe("done");
    expect(getUrgency(6, isoInDays(300), true)).toBe("done");
  });
  it("'overdue' quando os meses restantes <= byMonth", () => {
    // ~1 mês restante, tarefa devida ao mês 1 → devia estar feita
    expect(getUrgency(1, isoInDays(30), false)).toBe("overdue");
  });
  it("'urgent' quando restantes <= byMonth + 2", () => {
    // ~3 meses restantes, byMonth 1 → 3 <= 3
    expect(getUrgency(1, isoInDays(90), false)).toBe("urgent");
  });
  it("'soon' quando restantes <= byMonth + 4", () => {
    // ~5 meses restantes, byMonth 1 → 5 <= 5
    expect(getUrgency(1, isoInDays(150), false)).toBe("soon");
  });
  it("'upcoming' para o resto", () => {
    // ~10 meses restantes, byMonth 1
    expect(getUrgency(1, isoInDays(304), false)).toBe("upcoming");
  });
});

describe("monthsLabel", () => {
  it("mostra atraso para tarefas em falta", () => {
    expect(monthsLabel(6, isoInDays(0))).toMatch(/há ~6m atr\./);
  });
  it("mostra 'agora' quando está a par", () => {
    expect(monthsLabel(0, isoInDays(0))).toBe("agora");
  });
  it("mostra estimativa futura para tarefas a caminho", () => {
    expect(monthsLabel(1, isoInDays(304))).toMatch(/^em ~\d+m$/);
  });
});

describe("targetDate / targetDateLabel", () => {
  it("a data-limite é a data do casamento menos byMonth meses", () => {
    const wedding = isoInDays(300); // ~9,85 meses adiante
    const d6 = targetDate(6, wedding)!;
    const d3 = targetDate(3, wedding)!;
    // Tarefa devida ao mês 6 tem data-limite mais cedo que a devida ao mês 3.
    expect(d6.getTime()).toBeLessThan(d3.getTime());
  });
  it("o rótulo é concreto e começa por 'até'", () => {
    expect(targetDateLabel(6, isoInDays(300))).toMatch(/^até /);
  });
  it("devolve null / vazio para data inválida", () => {
    expect(targetDate(6, "")).toBeNull();
    expect(targetDateLabel(6, "")).toBe("");
  });
});

describe("fmt", () => {
  it("formata zero sem separador", () => {
    expect(fmt(0)).toBe("0 €");
  });
  it("arredonda para euros inteiros", () => {
    expect(fmt(1500.6).replace(/\s/g, "")).toBe("1501€");
    expect(fmt(1500.4).replace(/\s/g, "")).toBe("1500€");
  });
  it("agrupa milhares (pt-PT) e acrescenta o símbolo do euro", () => {
    expect(fmt(20000).replace(/\s/g, "")).toBe("20000€");
    expect(fmt(20000).endsWith("€")).toBe(true);
  });
});
