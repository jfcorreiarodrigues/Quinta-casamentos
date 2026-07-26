import type { Plan } from "../types";

const API_URL = import.meta.env.VITE_STRIPE_API_URL;

/** True se o backend de pagamentos Stripe está configurado. */
export function isStripeEnabled(): boolean {
  return Boolean(API_URL);
}

/**
 * Inicia o checkout da Stripe para um plano pago. Redireciona a janela para a
 * página de pagamento. Lança erro se o backend não estiver configurado ou falhar.
 */
export async function startCheckout(plan: Plan, email?: string): Promise<void> {
  if (!API_URL) {
    throw new Error(
      "O backend de pagamentos não está configurado (VITE_STRIPE_API_URL).",
    );
  }
  if (plan === "free") return;

  const response = await fetch(`${API_URL}/create-checkout-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan, email }),
  });

  if (!response.ok) {
    let message = "Não foi possível iniciar o pagamento.";
    try {
      const err = await response.json();
      message = err.error || message;
    } catch {
      /* corpo não-JSON */
    }
    throw new Error(message);
  }

  const { url } = (await response.json()) as { url?: string };
  if (!url) throw new Error("Resposta de checkout inválida.");
  window.location.href = url;
}

/**
 * Lê o resultado de um checkout a partir dos parâmetros do URL após o redirect.
 * Devolve o plano adquirido em caso de sucesso, ou null.
 */
export function readCheckoutResult(): { status: "success" | "cancel"; plan: Plan | null } | null {
  const params = new URLSearchParams(window.location.search);
  const checkout = params.get("checkout");
  if (!checkout) return null;
  const plan = params.get("plan") as Plan | null;
  return {
    status: checkout === "success" ? "success" : "cancel",
    plan: plan && ["pro", "premium"].includes(plan) ? plan : null,
  };
}

/** Remove os parâmetros de checkout do URL sem recarregar a página. */
export function clearCheckoutParams(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete("checkout");
  url.searchParams.delete("plan");
  window.history.replaceState({}, "", url.pathname + url.search);
}
