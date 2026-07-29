import { useEffect, useRef, useState } from "react";
import { Download, LogOut, RotateCcw, Upload, X } from "lucide-react";
import type { Ceremony, CoupleProfile } from "../types";
import { monthsLeft } from "../lib/utils";
import { clearAll, exportAll, importAll } from "../lib/storage";
import { getSupabase } from "../lib/supabase";
import { pushState } from "../lib/sync";
import { GhostButton, GoldButton, InfoBox } from "./ui";

interface Props {
  profile: CoupleProfile;
  onSave: (p: CoupleProfile) => void;
  onClose: () => void;
  onSignOut?: (() => void) | null;
}

const CEREMONY_OPTIONS: { value: Ceremony; label: string }[] = [
  { value: "civil", label: "Civil" },
  { value: "catolico", label: "Católico" },
  { value: "misto", label: "Civil com celebração religiosa" },
];

export default function Settings({
  profile,
  onSave,
  onClose,
  onSignOut,
}: Props) {
  const [draft, setDraft] = useState<CoupleProfile>(profile);
  const [confirmReset, setConfirmReset] = useState(false);
  const [backupMsg, setBackupMsg] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const exportData = () => {
    const backup = exportAll();
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const stamp = new Date().toISOString().slice(0, 10);
    a.download = `wedding-planner-backup-${stamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupMsg("Backup exportado. Guarde o ficheiro em local seguro.");
  };

  const importData = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (importAll(parsed)) {
          setBackupMsg("Dados importados. A recarregar…");
          setTimeout(() => window.location.reload(), 900);
        } else {
          setBackupMsg("Ficheiro de backup inválido.");
        }
      } catch {
        setBackupMsg("Não foi possível ler o ficheiro.");
      }
    };
    reader.readAsText(file);
  };

  // Fechar com Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const valid =
    draft.noiva.trim() &&
    draft.noivo.trim() &&
    draft.date &&
    draft.city.trim() &&
    draft.budget > 0 &&
    draft.guests > 0;

  const save = () => {
    if (!valid) return;
    onSave({
      ...draft,
      noiva: draft.noiva.trim(),
      noivo: draft.noivo.trim(),
      city: draft.city.trim(),
    });
    onClose();
  };

  const reset = async () => {
    // Se houver sessão na cloud, apaga também o registo remoto antes de recarregar.
    try {
      const sb = getSupabase();
      const { data } = (await sb?.auth.getSession()) ?? { data: null };
      const userId = data?.session?.user.id;
      if (sb && userId) await pushState(userId, {});
    } catch {
      /* segue mesmo assim */
    }
    clearAll();
    window.location.reload();
  };

  return (
    <div
      className="wp-overlay-in fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="wp-modal-in max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-line bg-white p-6 shadow-xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-ink">
            Definições do casamento
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted hover:bg-cream"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nome da noiva">
              <input
                className="wp-input"
                value={draft.noiva}
                onChange={(e) => setDraft({ ...draft, noiva: e.target.value })}
              />
            </Field>
            <Field label="Nome do noivo">
              <input
                className="wp-input"
                value={draft.noivo}
                onChange={(e) => setDraft({ ...draft, noivo: e.target.value })}
              />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Data do casamento">
              <input
                type="date"
                className="wp-input"
                value={draft.date}
                onChange={(e) => setDraft({ ...draft, date: e.target.value })}
              />
            </Field>
            <Field label="Cidade / Região">
              <input
                className="wp-input"
                value={draft.city}
                onChange={(e) => setDraft({ ...draft, city: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Tipo de cerimónia">
            <select
              className="wp-input"
              value={draft.ceremony}
              onChange={(e) =>
                setDraft({ ...draft, ceremony: e.target.value as Ceremony })
              }
            >
              {CEREMONY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Orçamento total (€)">
              <input
                type="number"
                min={0}
                className="wp-input"
                value={draft.budget || ""}
                onChange={(e) =>
                  setDraft({ ...draft, budget: Number(e.target.value) || 0 })
                }
              />
            </Field>
            <Field label="Nº estimado de convidados">
              <input
                type="number"
                min={0}
                className="wp-input"
                value={draft.guests || ""}
                onChange={(e) =>
                  setDraft({ ...draft, guests: Number(e.target.value) || 0 })
                }
              />
            </Field>
          </div>

          {draft.date && monthsLeft(draft.date) < 0 && (
            <InfoBox tone="warn">Esta data já passou.</InfoBox>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <GhostButton onClick={onClose}>Cancelar</GhostButton>
          <GoldButton onClick={save} disabled={!valid}>
            Guardar alterações
          </GoldButton>
        </div>

        {/* Backup — exportar / importar */}
        <div className="mt-6 border-t border-line pt-5">
          <h3 className="mb-1 text-sm font-semibold text-ink">
            Backup dos dados
          </h3>
          <p className="mb-3 text-xs text-muted">
            Os dados ficam só neste dispositivo. Exporte um backup para não
            perder o plano (e para o mover para outro dispositivo).
          </p>
          <div className="flex flex-wrap gap-2">
            <GhostButton onClick={exportData}>
              <Download size={16} />
              Exportar dados
            </GhostButton>
            <GhostButton onClick={() => fileInput.current?.click()}>
              <Upload size={16} />
              Importar dados
            </GhostButton>
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importData(f);
                e.target.value = "";
              }}
            />
          </div>
          {backupMsg && (
            <p className="mt-2 text-xs font-medium text-gold-deep">
              {backupMsg}
            </p>
          )}
        </div>

        {/* Sessão */}
        {onSignOut && (
          <div className="mt-6 border-t border-line pt-5">
            <button
              onClick={() => {
                onSignOut();
                onClose();
              }}
              className="flex items-center gap-2 text-sm font-medium text-ink hover:text-gold-dark"
            >
              <LogOut size={15} />
              Terminar sessão
            </button>
          </div>
        )}

        {/* Zona de reset */}
        <div className="mt-6 border-t border-line pt-5">
          {!confirmReset ? (
            <button
              onClick={() => setConfirmReset(true)}
              className="flex items-center gap-2 text-sm font-medium text-urgency-overdue hover:underline"
            >
              <RotateCcw size={15} />
              Recomeçar do zero (apagar todos os dados)
            </button>
          ) : (
            <InfoBox tone="warn">
              <p className="mb-3">
                Isto apaga o perfil, tarefas, convidados e orçamento deste
                dispositivo. Esta ação é irreversível.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => void reset()}
                  className="rounded-lg bg-urgency-overdue px-4 py-2 text-sm font-semibold text-white hover:brightness-105"
                >
                  Sim, apagar tudo
                </button>
                <GhostButton onClick={() => setConfirmReset(false)}>
                  Cancelar
                </GhostButton>
              </div>
            </InfoBox>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      {children}
    </label>
  );
}
