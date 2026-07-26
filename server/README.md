# 💳 Backend de pagamentos — Stripe

Servidor Express simples que trata da subscrição dos planos **Pro** (9,99 €/mês)
e **Premium** (24,99 €/mês) via Stripe Checkout.

> Pós-MVP. O frontend continua a funcionar sem este servidor (mudança de plano
> instantânea). Quando `VITE_STRIPE_API_URL` está definido no frontend, os botões
> dos planos pagos passam a redirecionar para o Stripe Checkout.

## Endpoints

| Método | Rota                       | Descrição                                        |
| ------ | -------------------------- | ------------------------------------------------ |
| `GET`  | `/health`                  | Estado do servidor e configuração                |
| `POST` | `/create-checkout-session` | Cria uma sessão de Checkout (`{ plan, email }`)  |
| `POST` | `/webhook`                 | Recebe eventos da Stripe (assinatura verificada) |

## Configuração

1. Crie os produtos/preços no [Dashboard da Stripe](https://dashboard.stripe.com/products)
   (subscrição mensal): um para Pro (9,99 €) e outro para Premium (24,99 €).
   Anote os **Price IDs** (`price_...`).

2. Configure o ambiente:

   ```bash
   cd server
   npm install
   cp .env.example .env   # preencha as chaves e Price IDs
   ```

3. Arranque o servidor:

   ```bash
   npm run dev   # http://localhost:4242
   ```

## Testar localmente com a Stripe CLI

```bash
# 1. Instale e autentique a CLI
stripe login

# 2. Reencaminhe os webhooks para o servidor local
stripe listen --forward-to localhost:4242/webhook
# → copie o "whsec_..." para STRIPE_WEBHOOK_SECRET no .env e reinicie o servidor

# 3. Dispare um evento de teste
stripe trigger checkout.session.completed
```

Cartão de teste: `4242 4242 4242 4242`, qualquer data futura e CVC.

## Ligar ao frontend

No `.env` do frontend (raiz do projeto), defina:

```
VITE_STRIPE_API_URL=http://localhost:4242
```

Sem esta variável, o frontend mantém o comportamento de MVP (troca de plano
imediata, sem pagamento real).

## Produção

- Alojar num serviço Node (Railway, Render, Fly.io) ou como funções serverless.
- Usar chaves `sk_live_...` e um webhook secret de produção.
- Persistir o plano do utilizador numa base de dados a partir dos eventos do
  webhook (fonte de verdade), em vez de confiar apenas no `localStorage`.
