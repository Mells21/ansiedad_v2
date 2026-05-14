interface MetricCardProps {
  label: string;
  value: string;
  tone?: "default" | "warning" | "danger";
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export function MetricCard({
  label,
  value,
  tone = "default",
  active = false,
  onClick,
  className = "",
}: MetricCardProps) {
  const badgeClassName =
    tone === "default" ? "pill" : tone === "warning" ? "pill pill--warning" : "pill pill--danger";
  const cardClassName = active
    ? `card metric-card metric-card--active ${className}`
    : `card metric-card ${className}`;

  return (
    <article
      className={cardClassName.trim()}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <span className={badgeClassName}>{label}</span>
      <p className="metric-value">{value}</p>
    </article>
  );
}
