import type { Task } from "../types";

// As 36 tarefas exatas da especificação. IDs imutáveis (t01–t36).
export const TASKS: Task[] = [
  // FASE 1 — Inceção e Fundamentação
  { id: "t01", text: "Anunciar o noivado", byMonth: 18, phase: 1, cat: "Celebração", icon: "💍", key: true },
  { id: "t02", text: "Definir orçamento global", byMonth: 17, phase: 1, cat: "Financeiro", icon: "💰", key: true },
  { id: "t03", text: "Escolher tipo de cerimónia (civil/católico/misto)", byMonth: 17, phase: 1, cat: "Cerimónia", icon: "⛪", key: true },
  { id: "t04", text: "Definir nº estimado de convidados", byMonth: 16, phase: 1, cat: "Convidados", icon: "👥", key: true },
  { id: "t05", text: "Escolher data e época do ano", byMonth: 16, phase: 1, cat: "Data", icon: "📅", key: true },
  { id: "t06", text: "Pesquisar quintas e espaços", byMonth: 15, phase: 1, cat: "Local", icon: "🏛️" },
  { id: "t07", text: "Contratar wedding planner (se aplicável)", byMonth: 15, phase: 1, cat: "Equipa", icon: "📋" },

  // FASE 2 — Contratação Estratégica
  { id: "t08", text: "Reservar o espaço / quinta", byMonth: 14, phase: 2, cat: "Local", icon: "🏰", key: true },
  { id: "t09", text: "Contratar empresa de catering", byMonth: 13, phase: 2, cat: "Gastronomia", icon: "🍽️", key: true },
  { id: "t10", text: "Selecionar fotógrafo", byMonth: 13, phase: 2, cat: "Imagem", icon: "📸", key: true },
  { id: "t11", text: "Selecionar videógrafo", byMonth: 12, phase: 2, cat: "Imagem", icon: "🎥" },
  { id: "t12", text: "Reservar banda ou DJ", byMonth: 12, phase: 2, cat: "Música", icon: "🎶", key: true },
  { id: "t13", text: "Iniciar pesquisa do vestido de noiva", byMonth: 12, phase: 2, cat: "Vestuário", icon: "👗" },
  { id: "t14", text: "Definir lista de convidados", byMonth: 12, phase: 2, cat: "Convidados", icon: "📝" },

  // FASE 3 — Desenvolvimento Logístico e Estético
  { id: "t15", text: "Escolher padrinhos e damas de honra", byMonth: 11, phase: 3, cat: "Equipa", icon: "👨‍👩‍👧" },
  { id: "t16", text: "Definir tema e paleta de cores", byMonth: 10, phase: 3, cat: "Estética", icon: "🎨" },
  { id: "t17", text: "Contratar floristaria e decoração", byMonth: 9, phase: 3, cat: "Decoração", icon: "💐" },
  { id: "t18", text: "Encomendar bolo de casamento", byMonth: 9, phase: 3, cat: "Gastronomia", icon: "🎂" },
  { id: "t19", text: "Criar lista de presentes", byMonth: 8, phase: 3, cat: "Presentes", icon: "🎁" },
  { id: "t20", text: "Reservar lua de mel", byMonth: 8, phase: 3, cat: "Viagem", icon: "✈️", key: true },
  { id: "t21", text: "Escolher alianças", byMonth: 7, phase: 3, cat: "Vestuário", icon: "💍" },
  { id: "t22", text: "Planear animação infantil", byMonth: 7, phase: 3, cat: "Entretenimento", icon: "🎠" },

  // FASE 4 — Conformidade Legal
  { id: "t23", text: "Dar entrada no processo no Registo Civil", byMonth: 6, phase: 4, cat: "Legal", icon: "⚖️", key: true },
  { id: "t24", text: "Definir regime de bens / convenção antenupcial", byMonth: 6, phase: 4, cat: "Legal", icon: "📜" },
  { id: "t25", text: "Enviar convites (8–12 semanas antes)", byMonth: 4, phase: 4, cat: "Convidados", icon: "✉️", key: true },
  { id: "t26", text: "Organizar alojamento para convidados", byMonth: 4, phase: 4, cat: "Logística", icon: "🏨" },
  { id: "t27", text: "Coordenar transportes", byMonth: 3, phase: 4, cat: "Logística", icon: "🚗" },
  { id: "t28", text: "Licenças musicais SPA/IGAC", byMonth: 3, phase: 4, cat: "Legal", icon: "🎵" },
  { id: "t29", text: "Provas de vestido e fato", byMonth: 3, phase: 4, cat: "Vestuário", icon: "👗" },

  // FASE 5 — Execução Final
  { id: "t30", text: "Degustação do menu final", byMonth: 2.5, phase: 5, cat: "Gastronomia", icon: "🍴" },
  { id: "t31", text: "Ensaio de cabelo e maquilhagem", byMonth: 2, phase: 5, cat: "Beleza", icon: "💄" },
  { id: "t32", text: "Finalizar plano de mesas", byMonth: 1.5, phase: 5, cat: "Convidados", icon: "🪑" },
  { id: "t33", text: "Confirmar presença de todos os fornecedores", byMonth: 1, phase: 5, cat: "Equipa", icon: "✅", key: true },
  { id: "t34", text: "Lista de músicas (cerimónia e festa)", byMonth: 1, phase: 5, cat: "Música", icon: "🎵" },
  { id: "t35", text: "Entregar alianças ao padrinho", byMonth: 0.5, phase: 5, cat: "Logística", icon: "💍" },
  { id: "t36", text: "Delegar responsabilidades no dia D", byMonth: 0.25, phase: 5, cat: "Logística", icon: "📋" },
];

export const PHASE_NAMES: Record<number, string> = {
  1: "Inceção e Fundamentação",
  2: "Contratação Estratégica",
  3: "Desenvolvimento Logístico e Estético",
  4: "Conformidade Legal",
  5: "Execução Final",
};

export const KEY_TASKS = TASKS.filter((t) => t.key);
