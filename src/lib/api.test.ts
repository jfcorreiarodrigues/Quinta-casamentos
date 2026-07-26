import { describe, expect, it } from "vitest";
import type { CoupleProfile } from "../types";
import { TASKS } from "./tasks";
import {
  buildAssistantSystemPrompt,
  buildVendorSearchPrompt,
  parseVendorResponse,
} from "./api";

describe("parseVendorResponse", () => {
  const CLEAN = JSON.stringify([
    {
      name: "Quinta X",
      type: "Espaço",
      location: "Porto",
      website: "quintax.pt",
      description: "Uma quinta.",
      priceRange: "3000–5000 €",
      rating: "4.8/5",
    },
  ]);

  it("interpreta um array JSON limpo", () => {
    const [v] = parseVendorResponse(CLEAN);
    expect(v.name).toBe("Quinta X");
    expect(v.rating).toBe("4.8/5");
  });

  it("interpreta um array dentro de code fences", () => {
    const raw = "```json\n" + CLEAN + "\n```";
    expect(parseVendorResponse(raw)).toHaveLength(1);
  });

  it("isola o array quando há texto à volta", () => {
    const raw = `Aqui estão os resultados: ${CLEAN} Espero que ajude!`;
    expect(parseVendorResponse(raw)[0].name).toBe("Quinta X");
  });

  it("recupera objetos de um array com vírgula final", () => {
    const raw = '[{"name":"A","type":"Foto"},]';
    const out = parseVendorResponse(raw);
    expect(out).toHaveLength(1);
    expect(out[0].name).toBe("A");
  });

  it("recupera objetos quando falta a vírgula entre eles", () => {
    const raw = '[{"name":"A"} {"name":"B"}]';
    const out = parseVendorResponse(raw);
    expect(out.map((v) => v.name)).toEqual(["A", "B"]);
  });

  it("normaliza campos em falta para valores por omissão", () => {
    const [v] = parseVendorResponse('[{"type":"DJ"}]');
    expect(v.name).toBe("Fornecedor");
    expect(v.website).toBeNull();
    expect(v.priceRange).toBeNull();
    expect(v.rating).toBeNull();
  });

  it("lança erro quando não há JSON aproveitável", () => {
    expect(() => parseVendorResponse("desculpe, não encontrei nada")).toThrow();
  });
});

describe("buildVendorSearchPrompt", () => {
  it("inclui categoria, pesquisa e cidade", () => {
    const p = buildVendorSearchPrompt("Fotógrafo", "rústico", "Braga");
    expect(p).toContain("Fotógrafo");
    expect(p).toContain('matching "rústico"');
    expect(p).toContain("Braga");
  });

  it("usa Portugal quando a cidade está vazia e omite o 'matching' sem pesquisa", () => {
    const p = buildVendorSearchPrompt("Catering", "", "");
    expect(p).toContain("in Portugal");
    expect(p).not.toContain("matching");
  });
});

describe("buildAssistantSystemPrompt", () => {
  const profile: CoupleProfile = {
    noiva: "Maria",
    noivo: "João",
    date: "2027-06-12",
    city: "Coimbra",
    ceremony: "catolico",
    budget: 25000,
    guests: 120,
    createdAt: new Date().toISOString(),
  };

  it("inclui o contexto do casal e exige português europeu", () => {
    const s = buildAssistantSystemPrompt(profile, {}, TASKS);
    expect(s).toContain("Maria");
    expect(s).toContain("João");
    expect(s).toContain("Coimbra");
    expect(s).toContain("português europeu");
  });

  it("resume as tarefas concluídas e as próximas pendentes", () => {
    const done = { t01: true };
    const s = buildAssistantSystemPrompt(profile, done, TASKS);
    expect(s).toContain("Anunciar o noivado"); // concluída
    expect(s).toContain("Próximas tarefas pendentes:");
  });
});
