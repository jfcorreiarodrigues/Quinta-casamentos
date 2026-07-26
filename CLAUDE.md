# Wedding Planner Portugal

## Comandos essenciais
- `npm run dev`    — servidor de desenvolvimento (Vite, porta 5173)
- `npm run build`  — build de produção
- `npm run lint`   — ESLint

## Variáveis de ambiente
- `VITE_ANTHROPIC_API_KEY` — chave da API Anthropic (obrigatória para Fornecedores e Assistente IA)

Copie `.env.example` para `.env` e preencha a chave.

## Regras de desenvolvimento
- Toda a lógica de datas usa `monthsLeft(date)` de `src/lib/utils.ts`
- Tarefas definidas em `src/lib/tasks.ts` — não modificar IDs (t01–t36)
- Persistência via funções em `src/lib/storage.ts`
- Nunca fazer chamadas à API Anthropic fora de `src/lib/api.ts`
- Limites de plano verificados sempre em `src/lib/plans.ts`
- Texto sempre em português europeu (PT-PT)
- Formato de moeda: `Number(n).toLocaleString("pt-PT")` + " €"

## Arquitetura de estado
- Estado global mínimo em `App.tsx` (profile, done, plan)
- Estado local em cada componente (guests, spent, messages)
- Sem Redux ou Zustand — React state + localStorage é suficiente para MVP

## Notas de API
- Modelo: `claude-sonnet-4-20250514`
- `max_tokens: 1000` em todas as chamadas
- Web search tool: `{ type: "web_search_20250305", name: "web_search" }`
- Header obrigatório em browser: `"anthropic-dangerous-direct-browser-access": "true"`

## Segurança
Neste MVP a API key fica exposta no frontend (via Vite env). Aceitável para
desenvolvimento e demos, **não para produção**. Em produção usar backend proxy,
autenticação, rate limiting por utilizador e gestão de quotas no servidor.
