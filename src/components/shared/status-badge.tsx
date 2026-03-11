import { STATUS_COLORS, VERIFICATION_COLORS } from "@/lib/constants";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = status.toUpperCase().trim();
  const config = STATUS_COLORS[normalized as keyof typeof STATUS_COLORS];

  if (!config) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
        {status || "-"}
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
      style={{ backgroundColor: config.bg, color: config.text }}
    >
      {config.label}
    </span>
  );
}

interface VerificationBadgeProps {
  status: string;
}

export function VerificationBadge({ status }: VerificationBadgeProps) {
  const normalized = status.toUpperCase().trim();
  const config =
    VERIFICATION_COLORS[normalized as keyof typeof VERIFICATION_COLORS] ||
    VERIFICATION_COLORS[""];

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
      style={{ backgroundColor: config.bg, color: config.text }}
    >
      {config.label}
    </span>
  );
}
