import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Lock, Send, Sparkles } from "lucide-react";
import type { ChatMessage, CoupleProfile, Plan } from "../types";
import { TASKS } from "../lib/tasks";
import { buildAssistantSystemPrompt, callClaude, hasApiKey } from "../lib/api";
import { monthsLeft } from "../lib/utils";
import { PLANS } from "../lib/plans";
import { getAiCount, setAiCount as persistAiCount } from "../lib/storage";
import { GoldButton, InfoBox } from "./ui";

interface Props {
  profile: CoupleProfile;
  done: Record<string, boolean>;
  plan: Plan;
  goToPlans: () => void;
}

export default function Assistant({ profile, done, plan, goToPlans }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(() => getAiCount());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    persistAiCount(count);
  }, [count]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  const cfg = PLANS[plan];
  const unlocked = cfg.aiMessageLimit > 0;
  const remaining = cfg.aiMessageLimit - count;
  const outOfMessages = cfg.aiMessageLimit !== Infinity && remaining <= 0;

  const left = Math.max(0, Math.round(monthsLeft(profile.date)));

  const suggestions = useMemo(
    () => [
      `Com ${left} meses até ao casamento, o que é mais urgente?`,
      "Qual a checklist legal para casamento civil em Portugal?",
      "Como negociar com a quinta para conseguir melhor preço?",
      "Que cláusulas críticas incluir no contrato com o fotógrafo?",
      "Quais as tendências de decoração para casamentos em 2026?",
    ],
    [left],
  );

  // ── Full-page lock (free) ───────────────────────────────────────
  if (!unlocked) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-md rounded-3xl border border-line bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gold-primary/15 text-gold-dark">
            <Lock size={28} />
          </div>
          <h1 className="font-display text-2xl font-semibold text-ink">
            Assistente IA
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            Um wedding planner virtual que conhece a sua data, orçamento e
            progresso. Disponível nos planos Pro e Premium.
          </p>
          <div className="mt-6">
            <GoldButton onClick={goToPlans}>
              <Sparkles size={16} />
              Ver planos
            </GoldButton>
          </div>
        </div>
      </div>
    );
  }

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || loading || outOfMessages) return;
    if (!hasApiKey()) {
      setError(
        "A chave da API Anthropic não está configurada. Defina VITE_ANTHROPIC_API_KEY no ficheiro .env.",
      );
      return;
    }
    setError(null);
    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content },
    ];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    try {
      const system = buildAssistantSystemPrompt(profile, done, TASKS);
      const reply = await callClaude(nextMessages, system, false);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      setCount((c) => c + 1);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Erro ao contactar o assistente.",
      );
      // Reverter a última mensagem do utilizador para poder tentar de novo
      setMessages((prev) => prev.slice(0, -1));
      setInput(content);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-180px)] min-h-[460px] flex-col">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">
            Assistente IA
          </h1>
          <p className="text-sm text-muted">
            O seu wedding planner virtual, sempre disponível.
          </p>
        </div>
        <span className="rounded-full bg-gold-primary/15 px-3 py-1 text-xs font-semibold text-gold-deep">
          {cfg.aiMessageLimit === Infinity
            ? "Mensagens ilimitadas"
            : `${Math.max(0, remaining)} mensagens restantes`}
        </span>
      </header>

      {/* Histórico */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto rounded-2xl border border-line bg-white p-4 shadow-sm"
      >
        {messages.length === 0 && (
          <div className="space-y-3">
            <InfoBox>
              Olá {profile.noiva} e {profile.noivo}! Sou o vosso assistente de
              casamento. Perguntem-me o que quiserem — conheço a vossa data,
              orçamento e progresso.
            </InfoBox>
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                Sugestões
              </p>
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  disabled={outOfMessages}
                  className="block w-full rounded-xl border border-line bg-cream/50 px-3 py-2.5 text-left text-sm text-ink transition-colors hover:border-gold-primary/50 hover:bg-gold-primary/5 disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${
              m.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "rounded-br-sm bg-gold-primary/15 text-ink"
                  : "rounded-bl-sm border border-line bg-cream/60 text-ink"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm border border-line bg-cream/60 px-4 py-2.5 text-sm text-muted">
              <Loader2 size={15} className="animate-spin" />
              A pensar…
            </div>
          </div>
        )}
      </div>

      {error && (
        <InfoBox tone="warn" className="mt-3">
          {error}
        </InfoBox>
      )}

      {outOfMessages && (
        <InfoBox tone="warn" className="mt-3">
          Esgotou as mensagens do plano Pro este mês.{" "}
          <button
            onClick={goToPlans}
            className="font-semibold text-gold-dark underline"
          >
            Passe a Premium
          </button>{" "}
          para mensagens ilimitadas.
        </InfoBox>
      )}

      {/* Input */}
      <div className="mt-3 flex items-end gap-2">
        <textarea
          className="wp-input max-h-32 min-h-[46px] resize-none"
          placeholder="Escreva a sua pergunta…"
          rows={1}
          value={input}
          disabled={outOfMessages}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
        />
        <GoldButton
          className="!px-4 !py-3"
          onClick={() => send(input)}
          disabled={loading || outOfMessages || !input.trim()}
        >
          <Send size={16} />
        </GoldButton>
      </div>
    </div>
  );
}
