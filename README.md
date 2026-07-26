# 💍 Wedding Planner Portugal

Aplicação web de _wedding planning_ personalizada para o mercado português
(2025–2026). Replica o valor de um wedding planner profissional num produto SaaS
freemium, com um plano 100% adaptado à data real do casamento e que evolui à
medida que o tempo passa.

**Stack:** React + Vite + TypeScript + Tailwind CSS · API Anthropic Claude.

## Funcionalidades

- **Onboarding** em 3 passos com feedback dinâmico (timing, orçamento de mercado).
- **Dashboard** com hero card, estatísticas e tarefas agrupadas por urgência.
- **Timeline** — 36 tarefas em 5 fases (accordion, progresso por fase).
- **Orçamento** por categoria com deteção de custos ocultos.
- **Convidados** — CRUD com RSVP, dietas, mesas e filtros.
- **Fornecedores** (Pro+) — pesquisa no mercado português via web search.
- **Assistente IA** (Pro+) — chat com contexto do casal.
- **Planos** — Básico / Pro / Premium (freemium).

## Começar

```bash
npm install
cp .env.example .env   # e preencha VITE_ANTHROPIC_API_KEY
npm run dev
```

Abra http://localhost:5173.

> A chave da API só é necessária para os módulos **Fornecedores** e
> **Assistente IA**. O resto da aplicação funciona sem chave.

## Scripts

| Comando           | Descrição                       |
| ----------------- | ------------------------------- |
| `npm run dev`     | Servidor de desenvolvimento     |
| `npm run build`   | Build de produção               |
| `npm run preview` | Pré-visualizar o build          |
| `npm run lint`    | ESLint                          |

## Persistência

Todos os dados ficam apenas no `localStorage` do dispositivo (sem backend neste
MVP). Ver `src/lib/storage.ts`.

## Pagamentos (opcional)

Os planos pagos podem ser processados via Stripe Checkout. O backend Express
está em [`server/`](./server/README.md). Sem `VITE_STRIPE_API_URL` definida, a
app troca de plano localmente (modo MVP, sem pagamento real).

## Deployment

Instruções de deploy do frontend (Vercel) e do backend em
[`DEPLOYMENT.md`](./DEPLOYMENT.md).

## Segurança

Neste MVP a API key da Anthropic é usada diretamente no frontend. Para produção,
usar um backend proxy, autenticação, rate limiting e gestão de quotas no
servidor. Ver `CLAUDE.md`.
