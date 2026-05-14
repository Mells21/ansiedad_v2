import { useEffect, useMemo, useRef, useState } from "react";
import { fetchAllStudentStats, type StudentStatsEntry } from "@/features/psychologist/services/psychologist-stats.service";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const C = { bajo: "#10b981", moderado: "#f59e0b", alto: "#ef4444" };

function KpiCard({
  label,
  value,
  sublabel,
  color,
  icon,
}: {
  label: string;
  value: number | string;
  sublabel?: string;
  color: string;
  icon: string;
}) {
  return (
    <div className="stats-kpi-card" style={{ borderTop: `4px solid ${color}` }}>
      <div className="stats-kpi-top">
        <span className="stats-kpi-icon" style={{ background: `${color}18`, color }}>{icon}</span>
        <p className="stats-kpi-label">{label}</p>
      </div>
      <strong className="stats-kpi-value" style={{ color }}>{value}</strong>
      {sublabel ? <p className="stats-kpi-sub">{sublabel}</p> : null}
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="stats-chart-card">
      <div className="stats-chart-header">
        <div>
          <h3 className="stats-chart-title">{title}</h3>
          <p className="stats-chart-sub">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

const customTooltipStyle = {
  background: "white",
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
  boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
  fontSize: "0.85rem",
};

function getRisk(entry: StudentStatsEntry) {
  return entry.latestDiagnosis?.riskLevel || entry.latestAssessment?.preliminaryRisk || "bajo";
}

function formatMonthLabel(value: string) {
  const [year, month] = value.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("es-PE", { month: "short", year: "numeric" });
}

export function PsychologistStatsView() {
  const [data, setData] = useState<StudentStatsEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportingPdf, setExportingPdf] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAllStudentStats().then((res) => {
      setData(res);
      setLoading(false);
    });
  }, []);

  const counts = useMemo(() => {
    const c = { bajo: 0, moderado: 0, alto: 0 };
    data.forEach((entry) => {
      c[getRisk(entry)] += 1;
    });
    return c;
  }, [data]);

  const pieData = useMemo(
    () => [
      { name: "Bajo", value: counts.bajo, color: C.bajo },
      { name: "Moderado", value: counts.moderado, color: C.moderado },
      { name: "Alto", value: counts.alto, color: C.alto },
    ],
    [counts],
  );

  const gradeData = useMemo(() => {
    const map = new Map<string, { grade: string; bajo: number; moderado: number; alto: number; total: number }>();

    data.forEach((entry) => {
      const source = entry.gradeSection.trim() || "Sin seccion";
      const gradeKey = source.split(" ")[0] || "Sin";
      const risk = getRisk(entry);

      if (!map.has(gradeKey)) {
        map.set(gradeKey, { grade: gradeKey, bajo: 0, moderado: 0, alto: 0, total: 0 });
      }

      const bucket = map.get(gradeKey);
      if (!bucket) return;
      bucket[risk] += 1;
      bucket.total += 1;
    });

    return Array.from(map.values()).sort((a, b) => a.grade.localeCompare(b.grade, undefined, { numeric: true }));
  }, [data]);

  const sectionSummary = useMemo(() => {
    const map = new Map<string, { section: string; total: number; high: number; pending: number; dominantRisk: string }>();

    data.forEach((entry) => {
      const section = entry.gradeSection.trim() || "Sin seccion";
      const risk = getRisk(entry);

      if (!map.has(section)) {
        map.set(section, { section, total: 0, high: 0, pending: 0, dominantRisk: "Bajo" });
      }

      const bucket = map.get(section);
      if (!bucket) return;
      bucket.total += 1;
      if (risk === "alto") bucket.high += 1;
      if (!entry.latestDiagnosis) bucket.pending += 1;
    });

    return Array.from(map.values())
      .map((row) => {
        const related = data.filter((entry) => (entry.gradeSection.trim() || "Sin seccion") === row.section);
        const riskCount = related.reduce(
          (acc, entry) => {
            acc[getRisk(entry)] += 1;
            return acc;
          },
          { bajo: 0, moderado: 0, alto: 0 },
        );
        const dominantRisk =
          riskCount.alto >= riskCount.moderado && riskCount.alto >= riskCount.bajo
            ? "Alto"
            : riskCount.moderado >= riskCount.bajo
              ? "Moderado"
              : "Bajo";

        return {
          ...row,
          dominantRisk,
        };
      })
      .sort((a, b) => b.high - a.high || b.pending - a.pending || a.section.localeCompare(b.section));
  }, [data]);

  const genderData = useMemo(() => {
    const map = new Map<string, { gender: string; bajo: number; moderado: number; alto: number }>();

    data.forEach((entry) => {
      const gender =
        entry.gender === "masculino" ? "Masculino" : entry.gender === "femenino" ? "Femenino" : "Otro / sin dato";
      const risk = getRisk(entry);
      if (!map.has(gender)) {
        map.set(gender, { gender, bajo: 0, moderado: 0, alto: 0 });
      }
      const bucket = map.get(gender);
      if (!bucket) return;
      bucket[risk] += 1;
    });

    return Array.from(map.values());
  }, [data]);

  const timelineData = useMemo(() => {
    const map = new Map<string, { month: string; evaluaciones: number; diagnosticados: number }>();

    data.forEach((entry) => {
      const submittedAt = entry.latestAssessment?.submittedAt;
      if (!submittedAt) return;
      const date = new Date(submittedAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      if (!map.has(monthKey)) {
        map.set(monthKey, { month: monthKey, evaluaciones: 0, diagnosticados: 0 });
      }

      const bucket = map.get(monthKey);
      if (!bucket) return;
      bucket.evaluaciones += 1;
      if (entry.latestDiagnosis) {
        bucket.diagnosticados += 1;
      }
    });

    return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
  }, [data]);

  const diagnosticados = data.filter((entry) => entry.latestDiagnosis).length;
  const pendientes = data.length - diagnosticados;
  const diagPct = data.length > 0 ? Math.round((diagnosticados / data.length) * 100) : 0;

  const exportExcel = () => {
    const resumenGeneral = [
      { indicador: "Total evaluados", valor: data.length },
      { indicador: "Riesgo alto", valor: counts.alto },
      { indicador: "Riesgo moderado", valor: counts.moderado },
      { indicador: "Riesgo bajo", valor: counts.bajo },
      { indicador: "Con diagnostico final", valor: diagnosticados },
      { indicador: "Pendientes de revision", valor: pendientes },
    ];

    const resumenSecciones = sectionSummary.map((row) => ({
      seccion: row.section,
      total_estudiantes: row.total,
      riesgo_dominante: row.dominantRisk,
      casos_alto_riesgo: row.high,
      pendientes_revision: row.pending,
    }));

    const resumenGrados = gradeData.map((row) => ({
      grado: row.grade,
      total: row.total,
      bajo: row.bajo,
      moderado: row.moderado,
      alto: row.alto,
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(resumenGeneral), "Resumen_General");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(resumenSecciones), "Secciones");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(resumenGrados), "Grados");
    XLSX.writeFile(wb, `Reporte_Estadistico_Anonimo_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const exportPDF = async () => {
    if (!reportRef.current) return;
    setExportingPdf(true);

    try {
      const margin = 14;
      const pdf = new jsPDF("p", "mm", "a4");
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const contentW = pageW - margin * 2;
      const today = new Date().toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" });

      pdf.setFillColor(16, 43, 67);
      pdf.rect(0, 0, pageW, 22, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(13);
      pdf.setFont("helvetica", "bold");
      pdf.text("Reporte estadistico general de ansiedad escolar", margin, 14);
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Generado: ${today} | ${data.length} estudiantes evaluados`, pageW - margin, 14, { align: "right" });
      pdf.setTextColor(0, 0, 0);

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#f8fafc",
        windowWidth: 1200,
      });

      const imgData = canvas.toDataURL("image/png");
      const imgH = (canvas.height * contentW) / canvas.width;
      const startY = 26;
      const usableH = pageH - startY - margin;

      let remainingH = imgH;
      let srcOffsetRatio = 0;

      while (remainingH > 0) {
        const sliceH = Math.min(remainingH, usableH);
        const sliceRatio = sliceH / imgH;
        const srcY = srcOffsetRatio * canvas.height;
        const srcSliceH = sliceRatio * canvas.height;

        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = srcSliceH;
        const ctx = sliceCanvas.getContext("2d");
        if (!ctx) break;
        ctx.drawImage(canvas, 0, -srcY);

        const sliceData = sliceCanvas.toDataURL("image/png");
        const yPos = srcOffsetRatio === 0 ? startY : margin;
        pdf.addImage(sliceData || imgData, "PNG", margin, yPos, contentW, sliceH);

        remainingH -= sliceH;
        srcOffsetRatio += sliceRatio;

        if (remainingH > 0) {
          pdf.addPage();
          pdf.setFillColor(16, 43, 67);
          pdf.rect(0, 0, pageW, 12, "F");
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(9);
          pdf.setFont("helvetica", "bold");
          pdf.text("Reporte estadistico general - continuacion", margin, 8);
          pdf.setTextColor(0, 0, 0);
        }
      }

      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i += 1) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(160, 160, 160);
        pdf.text(`Pagina ${i} de ${totalPages} | Reporte confidencial sin datos nominales`, pageW / 2, pageH - 5, {
          align: "center",
        });
      }

      pdf.save(`Reporte_Estadistico_Anonimo_${new Date().toISOString().split("T")[0]}.pdf`);
    } finally {
      setExportingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="stats-loading">
        <div className="stats-loading-spinner" />
        <p>Analizando estadisticas institucionales...</p>
      </div>
    );
  }

  return (
    <div className="stats-shell">
      <div className="stats-topbar">
        <div>
          <h1 className="stats-main-title">Analisis estadistico general</h1>
          <p className="stats-main-sub">
            Panorama institucional anonimo. Este reporte no muestra nombres ni codigos de estudiantes.
          </p>
        </div>
        <div className="stats-export-actions">
          <button className="stats-btn-export stats-btn-export--ghost" onClick={exportExcel}>
            <span>Descargar</span> Excel
          </button>
          <button className="stats-btn-export" onClick={exportPDF} disabled={exportingPdf}>
            {exportingPdf ? "Generando..." : "PDF"}
          </button>
        </div>
      </div>

      <div ref={reportRef} className="stats-content">
        <div className="stats-kpi-grid">
          <KpiCard label="Total evaluados" value={data.length} sublabel="con al menos 1 test" color="#6366f1" icon="TE" />
          <KpiCard
            label="Riesgo alto"
            value={counts.alto}
            sublabel={`${data.length > 0 ? Math.round((counts.alto / data.length) * 100) : 0}% del total`}
            color={C.alto}
            icon="RA"
          />
          <KpiCard
            label="Riesgo moderado"
            value={counts.moderado}
            sublabel={`${data.length > 0 ? Math.round((counts.moderado / data.length) * 100) : 0}% del total`}
            color={C.moderado}
            icon="RM"
          />
          <KpiCard label="Riesgo bajo" value={counts.bajo} sublabel="en monitoreo estable" color={C.bajo} icon="RB" />
          <KpiCard label="Diagnosticados" value={`${diagPct}%`} sublabel={`${diagnosticados} casos con cierre`} color="#0f766e" icon="DG" />
        </div>

        <div className="stats-charts-row">
          <ChartCard title="Distribucion de riesgo" subtitle="Proporcion total de niveles de ansiedad detectados">
            <div className="stats-donut-wrap">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={4} dataKey="value" strokeWidth={0}>
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={customTooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="stats-donut-legend">
                {pieData.map((entry) => (
                  <div key={entry.name} className="stats-legend-item">
                    <span className="stats-legend-dot" style={{ background: entry.color }} />
                    <span className="stats-legend-label">{entry.name}</span>
                    <strong className="stats-legend-val">{entry.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>

          <ChartCard title="Ansiedad por grado" subtitle="Distribucion de niveles por anio escolar">
            <div style={{ height: 260, marginTop: "1rem" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gradeData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="grade" tick={{ fontSize: 13, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={customTooltipStyle} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "0.8rem", paddingTop: "1rem" }} />
                  <Bar dataKey="bajo" name="Bajo" fill={C.bajo} stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="moderado" name="Moderado" fill={C.moderado} stackId="a" />
                  <Bar dataKey="alto" name="Alto" fill={C.alto} stackId="a" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        <ChartCard title="Comparativa por genero" subtitle="Tendencias agregadas segun sexo reportado por el estudiante">
          <div style={{ height: 260, marginTop: "1rem" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={genderData} layout="vertical" barSize={28}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis dataKey="gender" type="category" width={110} tick={{ fontSize: 13, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={customTooltipStyle} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "0.8rem", paddingTop: "1rem" }} />
                <Bar dataKey="bajo" name="Bajo" fill={C.bajo} stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="moderado" name="Moderado" fill={C.moderado} stackId="a" />
                <Bar dataKey="alto" name="Alto" fill={C.alto} stackId="a" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Actividad mensual" subtitle="Cuantos test ingresaron y cuantos ya tienen diagnostico final">
          <div style={{ height: 260, marginTop: "1rem" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tickFormatter={formatMonthLabel} tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={customTooltipStyle}
                  labelFormatter={(value) => formatMonthLabel(String(value))}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "0.8rem", paddingTop: "1rem" }} />
                <Bar dataKey="evaluaciones" name="Evaluaciones" fill="#6366f1" radius={[6, 6, 0, 0]} />
                <Bar dataKey="diagnosticados" name="Diagnosticados" fill="#0f766e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <div className="stats-chart-card">
          <div className="stats-chart-header">
            <div>
              <h3 className="stats-chart-title">Resumen anonimo por seccion</h3>
              <p className="stats-chart-sub">Solo se muestran indicadores agregados para proteger la confidencialidad estudiantil.</p>
            </div>
          </div>
          <div className="stats-table-wrap">
            <table className="stats-table">
              <thead>
                <tr>
                  <th>Seccion</th>
                  <th>Total evaluados</th>
                  <th>Riesgo dominante</th>
                  <th>Casos alto riesgo</th>
                  <th>Pendientes</th>
                </tr>
              </thead>
              <tbody>
                {sectionSummary.map((row) => {
                  const color =
                    row.dominantRisk === "Alto" ? C.alto : row.dominantRisk === "Moderado" ? C.moderado : C.bajo;

                  return (
                    <tr key={row.section}>
                      <td><strong>{row.section}</strong></td>
                      <td>{row.total}</td>
                      <td>
                        <span className="stats-risk-badge" style={{ color, background: `${color}18` }}>
                          {row.dominantRisk}
                        </span>
                      </td>
                      <td>{row.high}</td>
                      <td>{row.pending}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="stats-chart-card">
          <div className="stats-chart-header">
            <div>
              <h3 className="stats-chart-title">Criterio de privacidad</h3>
              <p className="stats-chart-sub">Este modulo presenta un reporte estadistico institucional y omite datos nominales de estudiantes.</p>
            </div>
          </div>
          <div className="stats-table-wrap" style={{ padding: "1.25rem 1.5rem" }}>
            <p className="stats-chart-sub" style={{ margin: 0 }}>
              Se excluyen nombres, codigos, DNI, puntajes individuales y cualquier detalle clinico identificable. La ficha personal
              de cada estudiante sigue disponible solo dentro de la atencion directa del psicologo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
