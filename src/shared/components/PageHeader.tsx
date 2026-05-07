interface PageHeaderProps {
  title: string;
  subtitle: string;
  badge?: string;
}

export function PageHeader({ title, subtitle, badge }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div>
        <p className="eyebrow">Panel</p>
        <h2 className="page-title">{title}</h2>
        <p className="page-subtitle">{subtitle}</p>
      </div>

      {badge ? <span className="pill">{badge}</span> : null}
    </header>
  );
}
