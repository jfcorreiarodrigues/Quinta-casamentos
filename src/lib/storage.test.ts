import { beforeEach, describe, expect, it } from "vitest";
import {
  exportAll,
  getGuests,
  getPlan,
  importAll,
  setGuests,
  setPlan,
} from "./storage";

// localStorage em memória (o ambiente de teste é "node", sem DOM).
function createLocalStorageMock(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    removeItem: (k: string) => {
      store.delete(k);
    },
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
  } as Storage;
}

beforeEach(() => {
  Object.defineProperty(globalThis, "localStorage", {
    value: createLocalStorageMock(),
    configurable: true,
    writable: true,
  });
});

describe("backup / restauro", () => {
  it("faz roundtrip export → import", () => {
    setPlan("premium");
    setGuests([
      {
        id: "g1",
        name: "Ana",
        side: "noiva",
        rsvp: "confirmado",
        diet: "normal",
        table: "Mesa 1",
      },
    ]);

    const backup = exportAll();
    expect(backup.app).toBe("wedding-planner-portugal");

    localStorage.clear();
    expect(getPlan()).toBe("free"); // confirmar que limpou

    expect(importAll(backup)).toBe(true);
    expect(getPlan()).toBe("premium");
    expect(getGuests()).toHaveLength(1);
    expect(getGuests()[0].name).toBe("Ana");
  });

  it("rejeita backups inválidos", () => {
    expect(importAll(null)).toBe(false);
    expect(importAll({ app: "outra-app" })).toBe(false);
    expect(importAll({ app: "wedding-planner-portugal", data: "x" })).toBe(
      false,
    );
  });

  it("ignora chaves desconhecidas (não escreve lixo)", () => {
    importAll({
      app: "wedding-planner-portugal",
      version: 1,
      exportedAt: "",
      data: { hack: 1, wp_plan: "pro" },
    });
    expect(localStorage.getItem("hack")).toBeNull();
    expect(getPlan()).toBe("pro");
  });
});
