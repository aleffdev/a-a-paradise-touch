import { ReactNode } from "react";

export function PalmDecor({ children }: { children?: ReactNode }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-10 -left-10 text-9xl opacity-10 animate-sway">🌴</div>
      <div className="absolute -top-6 -right-12 text-9xl opacity-10 animate-sway" style={{ animationDelay: "1.5s" }}>🌴</div>
      <div className="absolute bottom-10 left-1/4 text-7xl opacity-5">🍃</div>
      {children}
    </div>
  );
}
