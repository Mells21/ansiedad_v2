import type { ManagedUserDirectoryEntry } from "@/features/admin/models/managed-user-directory.model";
import { PanelCard } from "@/shared/components/PanelCard";
import { useAdminOutletContext } from "@/features/admin/views/AdminDashboardView";

function formatCreatedAt(value?: string) {
  if (!value) {
    return "Sin fecha";
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "Sin fecha" : parsed.toLocaleDateString("es-PE");
}

function UserDirectorySection({
  entries,
  emptyMessage,
  title,
}: {
  entries: ManagedUserDirectoryEntry[];
  emptyMessage: string;
  title: string;
}) {
  return (
    <section className="admin-directory-section">
      <div className="admin-directory-head">
        <h3>{title}</h3>
        <span className="pill">{entries.length}</span>
      </div>

      {entries.length === 0 ? (
        <div className="soft-panel">
          <p className="soft-copy">{emptyMessage}</p>
        </div>
      ) : (
        <div className="admin-directory-list">
          {entries.map((entry) => (
            <article className="admin-user-row" key={entry.id}>
              <div>
                <strong>{entry.fullName}</strong>
                <p>{entry.email || `${entry.code}@gmail.com`}</p>
              </div>
              <div className="admin-user-meta">
                <span>{entry.code}</span>
                <span>{formatCreatedAt(entry.createdAt)}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export function AdminPeopleView() {
  const { admins, psychologists, usersError, usersLoading } = useAdminOutletContext();

  return (
    <div className="admin-shell">
      <PanelCard
        title="Personal registrado"
        subtitle="Consulta a los psicologos y administradores que tienen acceso al sistema."
        action={<span className="pill">{psychologists.length + admins.length} en total</span>}
      >
        {usersError ? <p className="form-error">{usersError}</p> : null}
        {usersLoading ? <p className="soft-copy">Cargando personal...</p> : null}

        {!usersLoading ? (
          <div className="admin-directory-grid">
            <UserDirectorySection
              title="Psicologos"
              entries={psychologists}
              emptyMessage="Todavia no hay psicologos registrados."
            />
            <UserDirectorySection
              title="Administradores"
              entries={admins}
              emptyMessage="Todavia no hay administradores registrados."
            />
          </div>
        ) : null}
      </PanelCard>
    </div>
  );
}
