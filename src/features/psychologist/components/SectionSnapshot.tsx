import type { PsychologistSectionSnapshot } from "@/features/psychologist/models/psychologist-dashboard.model";
import { PanelCard } from "@/shared/components/PanelCard";
import { StatusBadge } from "@/shared/components/StatusBadge";

interface SectionSnapshotProps {
  sections: PsychologistSectionSnapshot[];
}

export function SectionSnapshot({ sections }: SectionSnapshotProps) {
  return (
    <PanelCard title="Grados y secciones" subtitle="Vista rapida para priorizar acompanamiento.">
      <div className="stack-grid">
        {sections.length === 0 ? (
          <p className="soft-copy">Las secciones apareceran cuando los alumnos envien sus fichas.</p>
        ) : (
          sections.map((section) => (
            <div className="soft-panel" key={section.label}>
              <div className="inline-spread">
                <strong>{section.label}</strong>
                <StatusBadge
                  tone={
                    section.risk === "alto"
                      ? "danger"
                      : section.risk === "moderado"
                        ? "warning"
                        : "success"
                  }
                >
                  {section.risk}
                </StatusBadge>
              </div>
              <p className="soft-copy">{section.students} estudiantes activos</p>
              <p className="soft-copy">{section.note}</p>
            </div>
          ))
        )}
      </div>
    </PanelCard>
  );
}
