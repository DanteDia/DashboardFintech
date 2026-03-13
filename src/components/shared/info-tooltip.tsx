"use client";

import { useState, useRef, useEffect } from "react";
import { Info } from "lucide-react";

interface InfoTooltipProps {
  text: string;
}

export function InfoTooltip({ text }: InfoTooltipProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative inline-flex" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="p-0.5 rounded-full hover:bg-muted transition-colors"
        aria-label="Información"
      >
        <Info className="w-3.5 h-3.5 text-muted-foreground/60" />
      </button>
      {open && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 rounded-lg bg-popover border shadow-lg text-xs text-popover-foreground leading-relaxed">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
            <div className="w-2 h-2 rotate-45 bg-popover border-r border-b" />
          </div>
        </div>
      )}
    </div>
  );
}

interface ChartCardProps {
  title: string;
  info?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export function ChartCard({ title, info, subtitle, children, className }: ChartCardProps) {
  return (
    <div className={`bg-card rounded-xl border p-6 ${className ?? ""}`}>
      <div className="flex items-center gap-1.5 mb-1">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        {info && <InfoTooltip text={info} />}
      </div>
      {subtitle && <p className="text-xs text-muted-foreground mb-4">{subtitle}</p>}
      {!subtitle && <div className="mb-3" />}
      {children}
    </div>
  );
}
