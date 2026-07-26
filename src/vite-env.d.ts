/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ANTHROPIC_API_KEY: string;
  /** URL do backend de pagamentos Stripe (opcional). Sem ela, o MVP troca de plano localmente. */
  readonly VITE_STRIPE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
