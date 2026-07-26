import type { CoupleProfile, Task, Vendor } from "../types";
import { monthsLeft } from "./utils";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

/** Devolve true se existe uma API key configurada. */
export function hasApiKey(): boolean {
  return Boolean(import.meta.env.VITE_ANTHROPIC_API_KEY);
}

export async function callClaude(
  messages: { role: "user" | "assistant"; content: string }[],
  system: string,
  useWebSearch = false,
): Promise<string> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "A chave da API Anthropic não está configurada. Defina VITE_ANTHROPIC_API_KEY no ficheiro .env.",
    );
  }

  const body: Record<string, unknown> = {
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    system,
    messages,
  };

  if (useWebSearch) {
    body.tools = [{ type: "web_search_20250305", name: "web_search" }];
  }

  let response: Response;
  try {
    response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(
      "Não foi possível contactar o serviço. Verifique a sua ligação à internet.",
    );
  }

  if (!response.ok) {
    let message = "Erro na API";
    try {
      const err = await response.json();
      message = err.error?.message || message;
    } catch {
      /* corpo não-JSON */
    }
    if (response.status === 401) {
      message = "Chave da API inválida. Verifique VITE_ANTHROPIC_API_KEY.";
    } else if (response.status === 429) {
      message =
        "Limite de pedidos atingido. Aguarde um momento e tente novamente.";
    }
    throw new Error(message);
  }

  const data = await response.json();
  return data.content
    .filter((b: { type: string }) => b.type === "text")
    .map((b: { text: string }) => b.text)
    .join("\n");
}

// ── System prompt do Assistente (secção 7.2) ──────────────────────
const ceremonyLabel: Record<CoupleProfile["ceremony"], string> = {
  civil: "Civil",
  catolico: "Católica",
  misto: "Civil com celebração religiosa",
};

export function buildAssistantSystemPrompt(
  profile: CoupleProfile,
  done: Record<string, boolean>,
  tasks: Task[],
): string {
  const left = Math.max(0, Math.round(monthsLeft(profile.date)));
  const doneTasks = tasks.filter((t) => done[t.id]);
  const doneSummary =
    doneTasks
      .slice(-8)
      .map((t) => t.text)
      .join("; ") || "nenhuma ainda";
  const pending = tasks.filter((t) => !done[t.id]);
  const pendingTop5 =
    pending
      .slice(0, 5)
      .map((t) => t.text)
      .join("; ") || "nenhuma";

  return `És um wedding planner profissional especializado no mercado português de casamentos (2025–2026).
Estás a ajudar ${profile.noiva} e ${profile.noivo}, que se casam a ${profile.date} em ${profile.city}.
Orçamento: ${profile.budget}€. Convidados: ${profile.guests}. Cerimónia: ${ceremonyLabel[profile.ceremony]}.
Faltam ${left} meses para o casamento.
Tarefas já concluídas: ${doneSummary}.
Próximas tarefas pendentes: ${pendingTop5}.
Responde sempre em português europeu. Sê específico, prático, com números e exemplos reais do mercado português. Menciona fornecedores ou plataformas concretas (casamentos.pt, etc.) e custos realistas quando pertinente.`;
}

// ── Prompt de pesquisa de fornecedores (secção 7.3) ───────────────
export function buildVendorSearchPrompt(
  category: string,
  query: string,
  city: string,
): string {
  const matching = query ? ` matching "${query}"` : "";
  return `Search casamentos.pt and other Portuguese wedding vendor websites for "${category}" providers${matching} in ${city || "Portugal"}.
Return only a valid JSON array of up to 5 vendors. Each object must have:
- name (string)
- type (string)
- location (string)
- website (string or null)
- description (1-2 sentences in European Portuguese)
- priceRange (string or null, ex: "1500–3000 €")
- rating (string or null, ex: "4.8/5")
Return ONLY the JSON array. No markdown, no code fences, no extra text.`;
}

/** Extrai o array JSON de fornecedores da resposta do modelo, tolerante a ruído. */
export function parseVendorResponse(raw: string): Vendor[] {
  let text = raw.trim();
  // Remover eventuais code fences
  text = text.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  // Isolar o primeiro array JSON
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Não foi possível interpretar os resultados da pesquisa.");
  }
  const slice = text.slice(start, end + 1);
  const parsed = JSON.parse(slice) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error("Formato de resposta inesperado.");
  }
  return parsed
    .filter((v): v is Record<string, unknown> => typeof v === "object" && v !== null)
    .map((v) => ({
      name: String(v.name ?? "Fornecedor"),
      type: String(v.type ?? ""),
      location: String(v.location ?? ""),
      website: v.website ? String(v.website) : null,
      description: String(v.description ?? ""),
      priceRange: v.priceRange ? String(v.priceRange) : null,
      rating: v.rating ? String(v.rating) : null,
    }));
}
