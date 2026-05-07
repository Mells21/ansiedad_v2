import { Link, useNavigate, useParams } from "react-router-dom";
import { useMemo } from "react";
import type { ManagedUserDirectoryEntry } from "@/features/admin/models/managed-user-directory.model";
import { useAdminOutletContext } from "@/features/admin/views/AdminDashboardView";

function formatCreatedAt(value?: string) {
  if (!value) {
    return "Sin fecha";
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "Sin fecha" : parsed.toLocaleDateString("es-PE");
}

function ArrowLeftIcon() {
  return (
    <svg aria-hidden="true" className="admin-students-arrow" viewBox="0 0 24 24">
      <path d="M14.5 6.5L9 12l5.5 5.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <path d="M19 12H9" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function GraduationIcon() {
  return (
    <svg aria-hidden="true" className="admin-students-symbol" viewBox="0 0 24 24">
      <path d="M3.5 9.5L12 5l8.5 4.5L12 14 3.5 9.5Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M7 11.8V15c0 .9 2.2 2 5 2s5-1.1 5-2v-3.2" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function SectionIcon() {
  return (
    <svg aria-hidden="true" className="admin-students-symbol" viewBox="0 0 24 24">
      <circle cx="9" cy="8.2" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4.5 18.2c.7-2.8 2.6-4.2 4.5-4.2s3.8 1.4 4.5 4.2" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <circle cx="16.5" cy="9.4" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M15.2 14.2c1.6.2 3 1.2 3.8 3.1" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function StudentIcon() {
  return (
    <svg aria-hidden="true" className="admin-student-avatar-icon" viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="3.1" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M6.5 18.5c.9-3 3-4.6 5.5-4.6s4.6 1.6 5.5 4.6" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function StudentTableRow({ entry, index }: { entry: ManagedUserDirectoryEntry; index: number }) {
  return (
    <tr>
      <td>{index + 1}</td>
      <td>
        <div className="admin-student-cell">
          <span className="admin-student-avatar">
            <StudentIcon />
          </span>
          <strong>{entry.fullName}</strong>
        </div>
      </td>
      <td>{entry.email || `${entry.code}@gmail.com`}</td>
      <td>{entry.code}</td>
      <td>{formatCreatedAt(entry.createdAt)}</td>
    </tr>
  );
}

export function AdminStudentsView() {
  const navigate = useNavigate();
  const { grade: gradeParam, section: sectionParam } = useParams();
  const { filteredStudents, groupedStudents, setStudentSearchTerm, studentSearchTerm, usersError, usersLoading } =
    useAdminOutletContext();

  const selectedGradeData = useMemo(
    () => groupedStudents.find((entry) => entry.grade === gradeParam) ?? null,
    [gradeParam, groupedStudents],
  );

  const selectedSectionData = useMemo(() => {
    if (!selectedGradeData || !sectionParam) {
      return null;
    }

    return selectedGradeData.sections.find((entry) => entry.section === sectionParam) ?? null;
  }, [sectionParam, selectedGradeData]);

  const isSearching = Boolean(studentSearchTerm.trim());

  return (
    <section className="admin-students-page">
      <div className="admin-students-toolbar">
        <div>
          <div className="admin-students-breadcrumbs">
            <Link to="/admin/estudiantes">Grados</Link>
            {gradeParam ? <span>/</span> : null}
            {gradeParam ? <span>{gradeParam} Grado</span> : null}
            {sectionParam ? <span>/</span> : null}
            {sectionParam ? <span>Seccion {sectionParam}</span> : null}
          </div>

          <div className="admin-students-title-row">
            {gradeParam ? (
              <button
                className="admin-students-back"
                type="button"
                onClick={() =>
                  navigate(sectionParam ? `/admin/estudiantes/${encodeURIComponent(gradeParam)}` : "/admin/estudiantes")
                }
              >
                <ArrowLeftIcon />
              </button>
            ) : null}

            <div>
              <h2 className="admin-students-title">
                {sectionParam
                  ? `Estudiantes - ${gradeParam} ${sectionParam}`
                  : gradeParam
                    ? `Secciones del ${gradeParam} Grado`
                    : "Grados"}
              </h2>
              <p className="admin-students-subtitle">
                {sectionParam
                  ? `Total: ${selectedSectionData?.students.length ?? 0} estudiantes`
                  : gradeParam
                    ? "Selecciona una seccion para continuar."
                    : "Selecciona un grado para ver sus secciones."}
              </p>
            </div>
          </div>
        </div>

        <label className="admin-students-search">
          <span>Buscar estudiante</span>
          <input
            value={studentSearchTerm}
            onChange={(event) => setStudentSearchTerm(event.target.value)}
            placeholder="Nombre, DNI, grado o seccion"
          />
        </label>
      </div>

      {usersError ? <p className="form-error">{usersError}</p> : null}
      {usersLoading ? <p className="soft-copy">Cargando estudiantes...</p> : null}

      {!usersLoading && isSearching ? (
        filteredStudents.length === 0 ? (
          <div className="soft-panel">
            <p className="soft-copy">No se encontraron estudiantes con esa busqueda.</p>
          </div>
        ) : (
          <div className="admin-students-table-shell">
            <table className="admin-students-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Estudiante</th>
                  <th>Correo</th>
                  <th>DNI</th>
                  <th>Registro</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((entry, index) => (
                  <StudentTableRow entry={entry} index={index} key={entry.id} />
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : null}

      {!usersLoading && !isSearching && !gradeParam ? (
        <div className="admin-students-card-grid">
          {groupedStudents.map((entry) => (
            <Link className="admin-grade-showcase" key={entry.grade} to={`/admin/estudiantes/${encodeURIComponent(entry.grade)}`}>
              <span className="admin-grade-badge">{entry.sections.length} Secciones</span>
              <span className="admin-grade-icon">
                <GraduationIcon />
              </span>
              <strong>{entry.grade}</strong>
              <small>Grado</small>
            </Link>
          ))}
        </div>
      ) : null}

      {!usersLoading && !isSearching && gradeParam && !sectionParam ? (
        selectedGradeData ? (
          <div className="admin-students-card-grid">
            {selectedGradeData.sections.map((entry, index) => (
              <Link
                className="admin-section-showcase"
                key={entry.section}
                style={{ ["--section-accent" as string]: index % 4 === 0 ? "#1d8f7a" : index % 4 === 1 ? "#3f61f0" : index % 4 === 2 ? "#c13894" : "#d95c13" }}
                to={`/admin/estudiantes/${encodeURIComponent(selectedGradeData.grade)}/${encodeURIComponent(entry.section)}`}
              >
                <span className="admin-section-icon">
                  <SectionIcon />
                </span>
                <strong>Seccion {entry.section}</strong>
                <small>{entry.students.length} estudiantes</small>
              </Link>
            ))}
          </div>
        ) : (
          <div className="soft-panel">
            <p className="soft-copy">El grado solicitado no existe.</p>
          </div>
        )
      ) : null}

      {!usersLoading && !isSearching && sectionParam ? (
        selectedSectionData ? (
          <div className="admin-students-table-shell">
            <table className="admin-students-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Estudiante</th>
                  <th>Correo</th>
                  <th>DNI</th>
                  <th>Registro</th>
                </tr>
              </thead>
              <tbody>
                {selectedSectionData.students.map((entry, index) => (
                  <StudentTableRow entry={entry} index={index} key={entry.id} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="soft-panel">
            <p className="soft-copy">La seccion solicitada no existe en ese grado.</p>
          </div>
        )
      ) : null}
    </section>
  );
}
