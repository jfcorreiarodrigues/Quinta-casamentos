import { useEffect, useState } from "react";
import {
  ExternalLink,
  Heart,
  Lock,
  Loader2,
  MapPin,
  Search,
  Sparkles,
  Star,
} from "lucide-react";
import type { CoupleProfile, Plan, Vendor } from "../types";
import {
  buildVendorSearchPrompt,
  callClaude,
  hasApiKey,
  parseVendorResponse,
} from "../lib/api";
import { PLANS } from "../lib/plans";
import {
  getVendorCount,
  getVendorSaved,
  setVendorCount as persistCount,
  setVendorSaved as persistSaved,
} from "../lib/storage";
import { GhostButton, GoldButton, InfoBox } from "./ui";

interface Props {
  profile: CoupleProfile;
  plan: Plan;
  goToPlans: () => void;
}

const CATEGORIES = [
  "Fotógrafo",
  "Videógrafo",
  "Quinta / Espaço",
  "Catering",
  "Floristaria",
  "DJ / Banda",
  "Bolo de Casamento",
  "Animação",
  "Maquilhagem & Cabelo",
];

export default function Vendors({ profile, plan, goToPlans }: Props) {
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Vendor[] | null>(null);
  const [count, setCount] = useState(() => getVendorCount());
  const [saved, setSaved] = useState<Vendor[]>(() => getVendorSaved());

  useEffect(() => {
    persistCount(count);
  }, [count]);
  useEffect(() => {
    persistSaved(saved);
  }, [saved]);

  const cfg = PLANS[plan];
  const unlocked = cfg.vendorSearchLimit > 0;
  const remaining = cfg.vendorSearchLimit - count;
  const outOfSearches =
    cfg.vendorSearchLimit !== Infinity && remaining <= 0;

  // ── Full-page lock (free) ───────────────────────────────────────
  if (!unlocked) {
    return (
      <LockedFullPage
        title="Pesquisa de fornecedores"
        description="Encontre fotógrafos, quintas, catering e mais, pesquisados em tempo real no mercado português. Disponível nos planos Pro e Premium."
        goToPlans={goToPlans}
      />
    );
  }

  const search = async (categoryOverride?: string) => {
    if (loading || outOfSearches) return;
    const cat = categoryOverride ?? category;
    if (categoryOverride) setCategory(categoryOverride);
    if (!hasApiKey()) {
      setError(
        "A pesquisa de fornecedores precisa da IA configurada (proxy /api/claude com ANTHROPIC_API_KEY, ou VITE_ANTHROPIC_API_KEY em dev).",
      );
      return;
    }
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const prompt = buildVendorSearchPrompt(cat, query, profile.city);
      const raw = await callClaude(
        [{ role: "user", content: prompt }],
        "És um assistente que devolve exclusivamente JSON válido, sem texto adicional.",
        true,
      );
      const vendors = parseVendorResponse(raw);
      setResults(vendors);
      setCount((c) => c + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao pesquisar fornecedores.");
    } finally {
      setLoading(false);
    }
  };

  const isSaved = (v: Vendor) =>
    saved.some((s) => s.name === v.name && s.type === v.type);

  const toggleSave = (v: Vendor) => {
    setSaved((prev) =>
      isSaved(v)
        ? prev.filter((s) => !(s.name === v.name && s.type === v.type))
        : [...prev, v],
    );
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">
            Fornecedores
          </h1>
          <p className="text-sm text-muted">
            Pesquisa em casamentos.pt e no mercado português.
          </p>
        </div>
        <span className="rounded-full bg-gold-primary/15 px-3 py-1 text-xs font-semibold text-gold-deep">
          {cfg.vendorSearchLimit === Infinity
            ? "Pesquisas ilimitadas"
            : `${Math.max(0, remaining)} pesquisas restantes`}
        </span>
      </header>

      {/* Pesquisa */}
      <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[220px_1fr_auto]">
          <select
            className="wp-input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input
            className="wp-input"
            placeholder={`Detalhes (ex: rústico, perto de ${profile.city})`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
          />
          <GoldButton
            onClick={() => void search()}
            disabled={loading || outOfSearches}
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Search size={16} />
            )}
            {loading ? "A pesquisar…" : "Pesquisar"}
          </GoldButton>
        </div>
        {outOfSearches && (
          <InfoBox tone="warn" className="mt-3">
            Esgotou as pesquisas do plano Pro este mês.{" "}
            <button
              onClick={goToPlans}
              className="font-semibold text-gold-dark underline"
            >
              Passe a Premium
            </button>{" "}
            para pesquisas ilimitadas.
          </InfoBox>
        )}
      </section>

      {error && <InfoBox tone="warn">{error}</InfoBox>}

      {loading && (
        <div className="flex items-center justify-center gap-2 py-10 text-muted">
          <Loader2 size={18} className="animate-spin" />
          A consultar o mercado português…
        </div>
      )}

      {/* Empty state — antes da primeira pesquisa */}
      {!results && !loading && !error && (
        <section className="rounded-2xl border border-dashed border-line bg-white/60 p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gold-primary/15 text-gold-dark">
            <Search size={20} />
          </div>
          <h2 className="font-display text-lg font-semibold text-ink">
            Comece a sua pesquisa
          </h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
            Escolha uma categoria e pesquisamos fornecedores reais no mercado
            português. Sugestões para começar:
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {["Quinta / Espaço", "Fotógrafo", "Catering", "DJ / Banda"].map(
              (c) => (
                <button
                  key={c}
                  onClick={() => void search(c)}
                  disabled={outOfSearches}
                  className="rounded-full border border-line bg-cream px-3 py-1.5 text-sm text-gold-deep transition-colors hover:border-gold-primary/50 hover:bg-gold-primary/10 disabled:opacity-50"
                >
                  {c}
                </button>
              ),
            )}
          </div>
        </section>
      )}

      {/* Resultados */}
      {results && !loading && (
        <section className="space-y-3">
          <h2 className="font-display text-lg font-semibold text-ink">
            {results.length > 0
              ? `Resultados (${results.length})`
              : "Sem resultados"}
          </h2>
          {results.length === 0 && (
            <InfoBox>
              Não foram encontrados fornecedores para esta pesquisa. Tente outra
              categoria ou termos diferentes.
            </InfoBox>
          )}
          {results.map((v, i) => (
            <VendorCard
              key={`${v.name}-${i}`}
              vendor={v}
              saved={isSaved(v)}
              onToggleSave={() => toggleSave(v)}
            />
          ))}
        </section>
      )}

      {/* Guardados */}
      {saved.length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
            <Heart size={18} className="text-gold-dark" />
            Fornecedores guardados ({saved.length})
          </h2>
          {saved.map((v, i) => (
            <VendorCard
              key={`saved-${v.name}-${i}`}
              vendor={v}
              saved
              onToggleSave={() => toggleSave(v)}
            />
          ))}
        </section>
      )}
    </div>
  );
}

function VendorCard({
  vendor,
  saved,
  onToggleSave,
}: {
  vendor: Vendor;
  saved: boolean;
  onToggleSave: () => void;
}) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-base font-semibold text-ink">
            {vendor.name}
          </h3>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted">
            {vendor.type && <span>{vendor.type}</span>}
            {vendor.location && (
              <span className="flex items-center gap-1">
                <MapPin size={12} />
                {vendor.location}
              </span>
            )}
            {vendor.rating && (
              <span className="flex items-center gap-1 text-gold-dark">
                <Star size={12} fill="currentColor" />
                {vendor.rating}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onToggleSave}
          className={`shrink-0 rounded-lg p-2 transition-colors ${
            saved
              ? "bg-gold-primary/15 text-gold-dark"
              : "text-muted hover:bg-cream"
          }`}
          aria-label={saved ? "Remover dos guardados" : "Guardar fornecedor"}
        >
          <Heart size={16} fill={saved ? "currentColor" : "none"} />
        </button>
      </div>

      {vendor.description && (
        <p className="mt-2 text-sm leading-relaxed text-ink/80">
          {vendor.description}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-3">
        {vendor.priceRange && (
          <span className="rounded-full bg-cream px-2.5 py-1 text-xs font-medium text-gold-deep">
            {vendor.priceRange}
          </span>
        )}
        {vendor.website && (
          <a
            href={
              vendor.website.startsWith("http")
                ? vendor.website
                : `https://${vendor.website}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm font-semibold text-gold-dark hover:underline"
          >
            Visitar website
            <ExternalLink size={13} />
          </a>
        )}
      </div>
    </div>
  );
}

function LockedFullPage({
  title,
  description,
  goToPlans,
}: {
  title: string;
  description: string;
  goToPlans: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md rounded-3xl border border-line bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gold-primary/15 text-gold-dark">
          <Lock size={28} />
        </div>
        <h1 className="font-display text-2xl font-semibold text-ink">
          {title}
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
          {description}
        </p>
        <div className="mt-6">
          <GoldButton onClick={goToPlans}>
            <Sparkles size={16} />
            Ver planos
          </GoldButton>
        </div>
        <div className="mt-3">
          <GhostButton onClick={goToPlans}>Saber mais</GhostButton>
        </div>
      </div>
    </div>
  );
}
