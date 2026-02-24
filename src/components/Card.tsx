import { ReactNode } from "react";

export function Card({
  title,
  subtitle,
  children,
  right,
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur">
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:radial-gradient(circle_at_1px_1px,#fff_1px,transparent_0)] [background-size:18px_18px]" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-white">{title}</h2>
          {subtitle ? (
            <p className="mt-1 text-sm text-white/65">{subtitle}</p>
          ) : null}
        </div>
        {right}
      </div>
      {children ? <div className="relative mt-5">{children}</div> : null}
    </div>
  );
}