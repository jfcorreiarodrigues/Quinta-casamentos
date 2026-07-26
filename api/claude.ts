// Vercel Edge Function — proxy da API Anthropic.
// A chave (ANTHROPIC_API_KEY) vive apenas no servidor e NUNCA é enviada ao
// browser. O frontend chama /api/claude em vez de api.anthropic.com diretamente.

export const config = { runtime: "edge" };

interface ClaudeRequest {
  messages: { role: "user" | "assistant"; content: string }[];
  system: string;
  useWebSearch?: boolean;
}

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return json({ error: { message: "Método não permitido." } }, 405);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return json(
      { error: { message: "ANTHROPIC_API_KEY não configurada no servidor." } },
      500,
    );
  }

  let payload: ClaudeRequest;
  try {
    payload = (await req.json()) as ClaudeRequest;
  } catch {
    return json({ error: { message: "Corpo do pedido inválido." } }, 400);
  }

  const { messages, system, useWebSearch } = payload;
  if (!Array.isArray(messages) || typeof system !== "string") {
    return json({ error: { message: "Parâmetros em falta." } }, 400);
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

  try {
    const upstream = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    // Reencaminha a resposta (ou erro) da Anthropic tal como veio.
    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return json(
      { error: { message: "Não foi possível contactar o serviço." } },
      502,
    );
  }
}
