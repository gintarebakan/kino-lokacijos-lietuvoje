// src/components/ui/NavigationBackButton.tsx
import { ChevronLeft } from "lucide-react";

interface NavigationBackButtonProps {
  onClick: () => void;
  label?: string; // optional visible label, omit for icon-only
  className?: string;
}

export function NavigationBackButton({
  onClick,
  label,
  className = "",
}: NavigationBackButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label="Grįžti atgal"
      className={[
        // Position — caller controls absolute/fixed, this handles the offset
        "absolute top-4 left-4 z-50",
        // Shape & size
        "flex items-center justify-center gap-1.5",
        label ? "rounded-full px-3 h-10 min-w-10" : "rounded-full w-10 h-10",
        // Cinematic glass surface
        "bg-black/50 backdrop-blur-md border border-white/10",
        // Color
        "text-amber-400",
        // Interaction
        "transition-all duration-200 ease-out",
        "hover:bg-black/70 hover:scale-105 hover:border-amber-400/30",
        "active:scale-95 active:bg-black/80",
        // Focus ring for a11y
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60",
        className,
      ].join(" ")}
    >
      <ChevronLeft
        size={20}
        strokeWidth={2.5}
        className="flex-shrink-0"
        aria-hidden="true"
      />
      {label && (
        <span className="text-sm font-semibold tracking-wide pr-0.5">
          {label}
        </span>
      )}
    </button>
  );
}