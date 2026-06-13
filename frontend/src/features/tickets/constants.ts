export const STATUS_COLORS: Record<string, string> = {
  ABERTO: "#378ADD",
  EM_ATENDIMENTO: "#BA7517",
  AGUARDANDO_SOLICITANTE: "#8b5cf6",
  RESOLVIDO: "#1D9E75",
  ENCERRADO: "#5F5E5A",
  CANCELADO: "#A32D2D",
  REABERTO: "#D85A30",
};

export const PRIORITY_COLORS: Record<string, string> = {
  BAIXA: "#5F5E5A",
  MEDIA: "#378ADD",
  ALTA: "#BA7517",
  URGENTE: "#A32D2D",
};

export const ALL_STATUSES = [
  "ABERTO",
  "EM_ATENDIMENTO",
  "AGUARDANDO_SOLICITANTE",
  "RESOLVIDO",
  "ENCERRADO",
  "CANCELADO",
  "REABERTO",
] as const;

export const ALL_PRIORITIES = ["BAIXA", "MEDIA", "ALTA", "URGENTE"] as const;
