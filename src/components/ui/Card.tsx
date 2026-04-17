import { ReactNode } from "react";

export default function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-[2rem] border border-pink-100 bg-white p-6 shadow-[0_24px_70px_-40px_rgba(190,24,93,0.5)] ${className}`}>
      {children}
    </div>
  );
}
