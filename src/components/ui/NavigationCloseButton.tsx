// src/components/ui/NavigationCloseButton.tsx
import { X } from "lucide-react";

interface NavigationCloseButtonProps {
  onClick: () => void;
  className?: string;
}

export function NavigationCloseButton({
  onClick,
  className = "",
}: NavigationCloseButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label="Uždaryti"
      className={[
        // Position
        "absolute top-4 right-4 z-50",
        // Shape & size — identical to back button
        "flex items-center justify-center w-10 h-10 rounded-full",
        // Cinematic glass surface
        "bg-black/50 backdrop-blur-md border border-white/10",
        // Color — white for close, amber for back (intentional contrast)
        "text-white/80",
        // Interaction
        "transition-all duration-200 ease-out",
        "hover:bg-black/70 hover:scale-105 hover:text-white hover:border-white/20",
        "active:scale-95 active:bg-black/80",
        // Focus ring
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
        className,
      ].join(" ")}
    >
      <X size={18} strokeWidth={2.5} aria-hidden="true" />
    </button>
  );
}