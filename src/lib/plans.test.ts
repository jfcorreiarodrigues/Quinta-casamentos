import { describe, expect, it } from "vitest";
import type { PlanFeature } from "../types";
import { canAccess, dashboardSectionLimit, PLANS } from "./plans";

describe("canAccess", () => {
  const gatedFeatures: PlanFeature[] = [
    "dashboardFull",
    "timelineFull",
    "budgetCategories",
    "vendors",
    "assistant",
    "guestsUnlimited",
  ];

  it("bloqueia todas as funcionalidades pagas no plano free", () => {
    for (const f of gatedFeatures) {
      expect(canAccess(f, "free")).toBe(false);
    }
  });

  it("liberta todas as funcionalidades no plano pro", () => {
    for (const f of gatedFeatures) {
      expect(canAccess(f, "pro")).toBe(true);
    }
  });

  it("liberta todas as funcionalidades no plano premium", () => {
    for (const f of gatedFeatures) {
      expect(canAccess(f, "premium")).toBe(true);
    }
  });

  it("reserva a exportação PDF apenas para o plano premium", () => {
    expect(canAccess("pdfExport", "free")).toBe(false);
    expect(canAccess("pdfExport", "pro")).toBe(false);
    expect(canAccess("pdfExport", "premium")).toBe(true);
  });
});

describe("dashboardSectionLimit", () => {
  it("limita a 5 no free e é ilimitado nos planos pagos", () => {
    expect(dashboardSectionLimit("free")).toBe(5);
    expect(dashboardSectionLimit("pro")).toBe(Infinity);
    expect(dashboardSectionLimit("premium")).toBe(Infinity);
  });
});

describe("configuração dos planos", () => {
  it("respeita os limites de convidados da spec", () => {
    expect(PLANS.free.guestLimit).toBe(30);
    expect(PLANS.pro.guestLimit).toBe(Infinity);
    expect(PLANS.premium.guestLimit).toBe(Infinity);
  });

  it("respeita as fases de timeline da spec", () => {
    expect(PLANS.free.timelinePhases).toBe(2);
    expect(PLANS.pro.timelinePhases).toBe(5);
    expect(PLANS.premium.timelinePhases).toBe(5);
  });

  it("respeita os preços da spec", () => {
    expect(PLANS.free.price).toBe(0);
    expect(PLANS.pro.price).toBe(9.99);
    expect(PLANS.premium.price).toBe(24.99);
  });
});
