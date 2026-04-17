import { ReactNode } from "react";

export default function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white/10 backdrop-blur-md p-6 rounded-2xl shadow-lg ${className}`}>
      {children}
    </div>
  );
}