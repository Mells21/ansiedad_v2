interface StatusBadgeProps {
  children: string;
  tone?: "neutral" | "success" | "warning" | "danger";
}

export function StatusBadge({ children, tone = "neutral" }: StatusBadgeProps) {
  const className =
    tone === "neutral"
      ? "status-badge"
      : tone === "success"
        ? "status-badge status-badge--success"
        : tone === "warning"
          ? "status-badge status-badge--warning"
          : "status-badge status-badge--danger";

  return <span className={className}>{children}</span>;
}
