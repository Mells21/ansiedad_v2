interface MetricCardProps {
  label: string;
  value: string;
  tone?: "default" | "warning" | "danger";
}

export function MetricCard({ label, value, tone = "default" }: MetricCardProps) {
  const className =
    tone === "default" ? "pill" : tone === "warning" ? "pill pill--warning" : "pill pill--danger";

  return (
    <article className="card">
      <span className={className}>{label}</span>
      <p className="metric-value">{value}</p>
    </article>
  );
}
