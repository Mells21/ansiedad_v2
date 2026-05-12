interface MetricCardProps {
  label: string;
  value: string;
  tone?: "default" | "warning" | "danger";
  active?: boolean;
  onClick?: () => void;
}

export function MetricCard({ label, value, tone = "default", active = false, onClick }: MetricCardProps) {
  const className =
    tone === "default" ? "pill" : tone === "warning" ? "pill pill--warning" : "pill pill--danger";
  const cardClassName = active ? "card metric-card metric-card--active" : "card metric-card";

  return (
    <article className={cardClassName} onClick={onClick} role={onClick ? "button" : undefined} tabIndex={onClick ? 0 : undefined}>
      <span className={className}>{label}</span>
      <p className="metric-value">{value}</p>
    </article>
  );
}
