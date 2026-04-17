import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export default function Button({ children, className = "", ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ec2aa4] via-[#f43f93] to-[#ff6c8d] px-6 py-3 font-semibold text-white shadow-[0_24px_60px_-24px_rgba(236,42,164,0.75)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_28px_70px_-26px_rgba(236,42,164,0.8)] disabled:cursor-not-allowed disabled:opacity-70 ${className}`}
    >
      {children}
    </button>
  );
}
