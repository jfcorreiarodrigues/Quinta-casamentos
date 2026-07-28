import { useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { getSupabase } from "../lib/supabase";
import { GoldButton, InfoBox } from "./ui";

type Mode = "signin" | "signup";

export default function Auth() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sb = getSupabase();
    if (!sb || loading) return;
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await sb.auth.signUp({ email, password });
        if (error) throw error;
        // Com confirmação de email ativa, não há sessão até o utilizador confirmar.
        if (!data.session) {
          setInfo(
            "Conta criada! Confirme o seu email (verifique também o spam) e depois inicie sessão.",
          );
          setMode("signin");
        }
      } else {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // Sessão detetada pelo listener em App.
      }
    } catch (err) {
      setError(translateAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mb-2 flex justify-center">
            <span
              className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl text-white shadow-md"
              style={{ background: "linear-gradient(135deg,#C9A96E,#7A6040)" }}
            >
              💍
            </span>
          </div>
          <h1 className="font-display text-3xl font-semibold text-ink">
            Wedding Planner Portugal
          </h1>
          <p className="mt-1 text-sm text-muted">
            {mode === "signin"
              ? "Entre para aceder ao seu plano em qualquer dispositivo."
              : "Crie uma conta para guardar o seu plano na cloud."}
          </p>
        </div>

        <form
          onSubmit={submit}
          className="space-y-4 rounded-3xl border border-line bg-white p-6 shadow-sm sm:p-8"
        >
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">
              Email
            </span>
            <input
              type="email"
              required
              autoComplete="email"
              className="wp-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome@exemplo.pt"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">
              Palavra-passe
            </span>
            <input
              type="password"
              required
              minLength={6}
              autoComplete={
                mode === "signup" ? "new-password" : "current-password"
              }
              className="wp-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
            />
          </label>

          {error && <InfoBox tone="warn">{error}</InfoBox>}
          {info && (
            <InfoBox>
              <span className="flex items-start gap-2">
                <Mail size={16} className="mt-0.5 shrink-0 text-gold-dark" />
                {info}
              </span>
            </InfoBox>
          )}

          <GoldButton type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 size={16} className="animate-spin" />}
            {mode === "signin" ? "Entrar" : "Criar conta"}
          </GoldButton>

          <p className="text-center text-sm text-muted">
            {mode === "signin" ? "Ainda não tem conta?" : "Já tem conta?"}{" "}
            <button
              type="button"
              className="font-semibold text-gold-dark hover:underline"
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setError(null);
                setInfo(null);
              }}
            >
              {mode === "signin" ? "Criar conta" : "Entrar"}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}

function translateAuthError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/invalid login credentials/i.test(msg))
    return "Email ou palavra-passe incorretos.";
  if (/already registered|already exists/i.test(msg))
    return "Já existe uma conta com este email. Inicie sessão.";
  if (/email not confirmed/i.test(msg))
    return "Ainda não confirmou o email. Verifique a sua caixa de entrada.";
  if (/password should be at least/i.test(msg))
    return "A palavra-passe deve ter pelo menos 6 caracteres.";
  if (/rate limit|too many/i.test(msg))
    return "Demasiadas tentativas. Aguarde um momento e tente novamente.";
  return "Ocorreu um erro. Tente novamente.";
}
