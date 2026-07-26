import "dotenv/config";
import express from "express";
import cors from "cors";
import Stripe from "stripe";

// ── Configuração ──────────────────────────────────────────────────
const {
  STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET,
  STRIPE_PRICE_PRO,
  STRIPE_PRICE_PREMIUM,
  CLIENT_URL = "http://localhost:5173",
  PORT = 4242,
} = process.env;

if (!STRIPE_SECRET_KEY) {
  console.error(
    "⚠️  STRIPE_SECRET_KEY não definida. Copie server/.env.example para server/.env e preencha as chaves.",
  );
}

const stripe = new Stripe(STRIPE_SECRET_KEY || "sk_test_placeholder");

// Mapa de plano → Price ID da Stripe (subscrições mensais)
const PRICE_BY_PLAN = {
  pro: STRIPE_PRICE_PRO,
  premium: STRIPE_PRICE_PREMIUM,
};

const app = express();
app.use(cors({ origin: CLIENT_URL }));

// ── Webhook (corpo RAW, antes do express.json) ────────────────────
// A verificação de assinatura exige o corpo em bruto.
app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  (req, res) => {
    const signature = req.headers["stripe-signature"];
    let event;

    try {
      if (!STRIPE_WEBHOOK_SECRET) {
        // Sem segredo configurado, aceita o corpo tal como veio (apenas dev).
        event = JSON.parse(req.body.toString());
      } else {
        event = stripe.webhooks.constructEvent(
          req.body,
          signature,
          STRIPE_WEBHOOK_SECRET,
        );
      }
    } catch (err) {
      console.error("❌ Falha na verificação do webhook:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Numa app real, aqui atualizaríamos a base de dados do utilizador.
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        console.log(
          `✅ Subscrição criada para ${session.customer_email || session.customer} (plano: ${session.metadata?.plan})`,
        );
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object;
        console.log(`🔄 Subscrição atualizada: ${sub.id} (${sub.status})`);
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object;
        console.log(`🛑 Subscrição cancelada: ${sub.id}`);
        break;
      }
      default:
        console.log(`ℹ️  Evento não tratado: ${event.type}`);
    }

    res.json({ received: true });
  },
);

// A partir daqui, corpo em JSON.
app.use(express.json());

// ── Health check ──────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    stripeConfigured: Boolean(STRIPE_SECRET_KEY),
    pricesConfigured: {
      pro: Boolean(STRIPE_PRICE_PRO),
      premium: Boolean(STRIPE_PRICE_PREMIUM),
    },
  });
});

// ── Criar sessão de checkout ──────────────────────────────────────
app.post("/create-checkout-session", async (req, res) => {
  try {
    const { plan, email } = req.body || {};

    if (!plan || !["pro", "premium"].includes(plan)) {
      return res
        .status(400)
        .json({ error: "Plano inválido. Use 'pro' ou 'premium'." });
    }

    const price = PRICE_BY_PLAN[plan];
    if (!price) {
      return res.status(500).json({
        error: `Price ID da Stripe não configurado para o plano '${plan}'. Defina STRIPE_PRICE_${plan.toUpperCase()} no .env.`,
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price, quantity: 1 }],
      customer_email: email || undefined,
      locale: "pt",
      metadata: { plan },
      success_url: `${CLIENT_URL}/?checkout=success&plan=${plan}`,
      cancel_url: `${CLIENT_URL}/?checkout=cancel`,
    });

    res.json({ url: session.url, id: session.id });
  } catch (err) {
    console.error("❌ Erro ao criar sessão de checkout:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`💳 Servidor de pagamentos a correr em http://localhost:${PORT}`);
  console.log(`   Frontend permitido: ${CLIENT_URL}`);
});
