import type { ReactNode } from "react";

interface PanelCardProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function PanelCard({ title, subtitle, action, children, className }: PanelCardProps) {
  return (
    <article className={className ? `card ${className}` : "card"}>
      <div className="card-head">
        <div>
          <h3 className="card-title">{title}</h3>
          {subtitle ? <p className="card-subtitle">{subtitle}</p> : null}
        </div>
        {action ? <div>{action}</div> : null}
      </div>
      {children}
    </article>
  );
}
