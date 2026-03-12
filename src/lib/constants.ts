export const OPERATION_TYPES = {
  "Income Wire": { label: "Income Wire", color: "#4285f4", prefix: "INC-" },
  "Outcome Wire": { label: "Outcome Wire", color: "#ea4335", prefix: "OUT-" },
  USDT: { label: "USDT", color: "#34a853", prefix: "USD-" },
  Nanocard: { label: "Nanocard", color: "#fbbc04", prefix: "NAN-" },
  "Cash To Cash": { label: "Cash To Cash", color: "#9c27b0", prefix: "CTC-" },
  Intereses: { label: "Intereses", color: "#ff6d00", prefix: "INT-" },
} as const;

export const OPERATION_COLORS: Record<string, string> = {
  "Income Wire": "#4285f4",
  "Outcome Wire": "#ea4335",
  USDT: "#34a853",
  Nanocard: "#fbbc04",
  "Cash To Cash": "#9c27b0",
  Intereses: "#ff6d00",
};

export const STATUS_COLORS = {
  CERRADO: { bg: "#d4edda", text: "#155724", label: "Cerrada" },
  ABIERTA: { bg: "#fff3cd", text: "#856404", label: "Abierta" },
  DEBE: { bg: "#fff3cd", text: "#856404", label: "Debe" },
  DEBEMOS: { bg: "#f8d7da", text: "#721c24", label: "Debemos" },
} as const;

export const VERIFICATION_COLORS = {
  SI: { bg: "#d4edda", text: "#155724", label: "Verificado" },
  CL: { bg: "#cce5ff", text: "#004085", label: "Cliente" },
  NO: { bg: "#f8d7da", text: "#721c24", label: "No verificado" },
  "": { bg: "#f0f0f0", text: "#6c757d", label: "Sin verificar" },
} as const;

export const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: "LayoutDashboard" },
  { href: "/operaciones", label: "Operaciones", icon: "ArrowLeftRight" },
  { href: "/clientes", label: "Clientes", icon: "Users" },
  { href: "/bancos", label: "Bancos", icon: "Landmark" },
  { href: "/movimientos", label: "Movimientos", icon: "List" },
  { href: "/salidas", label: "Salidas", icon: "ArrowUpRight" },
  { href: "/historico", label: "Historico", icon: "History" },
] as const;

export const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
] as const;
