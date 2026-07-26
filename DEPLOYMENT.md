# 🚀 Deployment

## Frontend — Vercel

O frontend é uma app estática (Vite) e faz deploy direto na Vercel.

### Opção A — Dashboard (recomendado)

1. Faça _push_ do repositório para o GitHub.
2. Em [vercel.com/new](https://vercel.com/new), importe o repositório.
3. A Vercel deteta automaticamente o Vite (`vercel.json` já fixa as definições):
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Em **Settings → Environment Variables**, adicione:

   | Nome                     | Valor                          | Obrigatória                     |
   | ------------------------ | ------------------------------ | ------------------------------- |
   | `VITE_ANTHROPIC_API_KEY` | `sk-ant-api03-...`             | Sim (Fornecedores/Assistente)   |
   | `VITE_STRIPE_API_URL`    | URL público do backend Stripe  | Não (só se usar pagamentos)     |

5. **Deploy.**

### Opção B — CLI

```bash
npm i -g vercel
vercel            # primeira vez: configura o projeto
vercel --prod     # deploy de produção
```

Defina as variáveis de ambiente com:

```bash
vercel env add VITE_ANTHROPIC_API_KEY production
vercel env add VITE_STRIPE_API_URL production   # opcional
```

> ⚠️ **Segurança:** `VITE_*` é embebida no bundle do browser. A chave da
> Anthropic fica exposta no cliente — aceitável para MVP/demo, **não para
> produção**. Em produção, encaminhe as chamadas à Anthropic por um backend
> proxy (as mesmas notas do `CLAUDE.md`).

## Backend de pagamentos — Stripe (opcional)

O servidor Express em `server/` **não** vai para a Vercel como parte do
frontend. Aloje-o à parte:

- **Railway / Render / Fly.io** — deploy do diretório `server/` como serviço Node
  (`npm start`).
- Configure as variáveis de `server/.env.example` no painel do serviço.
- Aponte `VITE_STRIPE_API_URL` (no frontend) para o URL público do servidor.
- No Dashboard da Stripe, registe o webhook `https://<servidor>/webhook`.

Ver `server/README.md` para detalhes e teste local com a Stripe CLI.
