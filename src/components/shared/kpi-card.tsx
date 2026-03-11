import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className,
}: KpiCardProps) {
  return (
    <div
      className={cn(
        "bg-card rounded-xl border p-6 space-y-2",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {Icon && (
          <div className="p-2 rounded-lg bg-muted">
            <Icon className="w-4 h-4 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p
          className={cn(
            "text-2xl font-bold tracking-tight",
            trend === "up" && "text-emerald-600",
            trend === "down" && "text-red-500"
          )}
        >
          {value}
        </p>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
