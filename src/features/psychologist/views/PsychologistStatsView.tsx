import { useEffect, useState, useMemo, useRef } from "react";
import { fetchAllStudentStats, type StudentStatsEntry } from "@/features/psychologist/services/psychologist-stats.service";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const C = { bajo: "#10b981", moderado: "#f59e0b", alto: "#ef4444" };
const RISK_COLORS = [C.bajo, C.moderado, C.alto];

/* ── Custom Donut label ── */
function DonutLabel({ viewBox, value, total }: { viewBox?: any; value: number; total: number }) {
  const { cx, cy } = viewBox ?? { cx: 0, cy: 0 };
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <>
      <text x={cx} y={cy - 8} textAnchor="middle" fontSize={28} fontWeight={800} fill="#1e293b">{pct}%</text>
      <text x={cx} y={cy + 16} textAnchor="middle" fontSize={12} fill="#94a3b8">del total</text>
    </>
  );
}

/* ── KPI Card ── */
function KpiCard({
  label, value, sublabel, color, icon,
}: { label: string; value: number | string; sublabel?: string; color: string; icon: string }) {
  return (
    <div className="stats-kpi-card" style={{ borderTop: `4px solid ${color}` }}>
      <div className="stats-kpi-top">
        <span className="stats-kpi-icon" style={{ background: `${color}18`, color }}>{icon}</span>
        <p className="stats-kpi-label">{label}</p>
      </div>
      <strong className="stats-kpi-value" style={{ color }}>{value}</strong>
      {sublabel && <p className="stats-kpi-sub">{sublabel}</p>}
    </div>
  );
}

/* ── Chart wrapper ── */
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

export function PsychologistStatsView() {
  const [data, setData] = useState<StudentStatsEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportingPdf, setExportingPdf] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAllStudentStats().then(res => {
      setData(res);
      setLoading(false);
    });
  }, []);

  const counts = useMemo(() => {
    const c = { bajo: 0, moderado: 0, alto: 0 };
    data.forEach(e => {
      const r = e.latestDiagnosis?.riskLevel || e.latestAssessment?.preliminaryRisk || "bajo";
      c[r as keyof typeof c]++;
    });
    return c;
  }, [data]);

  const pieData = useMemo(() => [
    { name: "Bajo", value: counts.bajo, color: C.bajo },
    { name: "Moderado", value: counts.moderado, color: C.moderado },
    { name: "Alto", value: counts.alto, color: C.alto },
  ], [counts]);

  const gradeData = useMemo(() => {
    const map = new Map<string, { grade: string; bajo: number; moderado: number; alto: number }>();
    data.forEach(e => {
      const grade = e.student.gradeSection.split(" ")[0] || "U";
      const risk = e.latestDiagnosis?.riskLevel || e.latestAssessment?.preliminaryRisk || "bajo";
      if (!map.has(grade)) map.set(grade, { grade: `${grade}°`, bajo: 0, moderado: 0, alto: 0 });
      (map.get(grade)! as any)[risk]++;
    });
    return Array.from(map.values()).sort((a, b) => a.grade.localeCompare(b.grade));
  }, [data]);

  const genderData = useMemo(() => {
    const map = new Map<string, { gender: string; bajo: number; moderado: number; alto: number }>();
    data.forEach(e => {
      const g = e.student.gender === "masculino" ? "Masculino" : e.student.gender === "femenino" ? "Femenino" : "Otro";
      const risk = e.latestDiagnosis?.riskLevel || e.latestAssessment?.preliminaryRisk || "bajo";
      if (!map.has(g)) map.set(g, { gender: g, bajo: 0, moderado: 0, alto: 0 });
      (map.get(g)! as any)[risk]++;
    });
    return Array.from(map.values());
  }, [data]);

  const diagPct = data.length > 0 ? Math.round((data.filter(e => e.latestDiagnosis).length / data.length) * 100) : 0;

  const exportExcel = () => {
    const rows = data.map(e => ({
      Estudiante: e.student.fullName,
      DNI: e.student.code,
      Sexo: e.student.gender,
      Grado_Seccion: e.student.gradeSection,
      Riesgo: e.latestDiagnosis?.riskLevel || e.latestAssessment?.preliminaryRisk || "Pendiente",
      Puntaje: e.latestAssessment?.normalizedScore || 0,
      Fecha: e.latestAssessment?.submittedAt ? new Date(e.latestAssessment.submittedAt).toLocaleDateString("es-PE") : "--",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reporte_Ansiedad");
    XLSX.writeFile(wb, `Reporte_Ansiedad_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const exportPDF = async () => {
    if (!reportRef.current) return;
    setExportingPdf(true);

    try {
      const MARGIN = 14; // mm
      const pdf = new jsPDF("p", "mm", "a4");
      const pageW = pdf.internal.pageSize.getWidth();   // 210mm
      const pageH = pdf.internal.pageSize.getHeight();  // 297mm
      const contentW = pageW - MARGIN * 2;

      // ── Page header ──
      const today = new Date().toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" });
      pdf.setFillColor(16, 43, 67);
      pdf.rect(0, 0, pageW, 22, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(13);
      pdf.setFont("helvetica", "bold");
      pdf.text("Reporte de Análisis de Ansiedad Escolar", MARGIN, 14);
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Generado: ${today} · ${data.length} estudiantes`, pageW - MARGIN, 14, { align: "right" });
      pdf.setTextColor(0, 0, 0);

      // ── Capture content ──
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#f8fafc",
        windowWidth: 1200,
      });

      const imgData = canvas.toDataURL("image/png");
      const imgH = (canvas.height * contentW) / canvas.width; // scaled height in mm

      const startY = 26; // below header
      const usableH = pageH - startY - MARGIN; // usable height per page

      let remainingH = imgH;
      let srcOffsetRatio = 0;

      while (remainingH > 0) {
        const sliceH = Math.min(remainingH, usableH);
        const sliceRatio = sliceH / imgH;
        const srcY = srcOffsetRatio * canvas.height;
        const srcSliceH = sliceRatio * canvas.height;

        // Create a slice canvas
        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = srcSliceH;
        const ctx = sliceCanvas.getContext("2d")!;
        ctx.drawImage(canvas, 0, -srcY);

        const sliceData = sliceCanvas.toDataURL("image/png");
        const yPos = srcOffsetRatio === 0 ? startY : MARGIN;
        pdf.addImage(sliceData, "PNG", MARGIN, yPos, contentW, sliceH);

        remainingH -= sliceH;
        srcOffsetRatio += sliceRatio;

        if (remainingH > 0) {
          pdf.addPage();
          // Repeat header on new pages
          pdf.setFillColor(16, 43, 67);
          pdf.rect(0, 0, pageW, 12, "F");
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(9);
          pdf.setFont("helvetica", "bold");
          pdf.text("Reporte de Ansiedad Escolar — continuación", MARGIN, 8);
          pdf.setTextColor(0, 0, 0);
        }
      }

      // Footer on each page
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(160, 160, 160);
        pdf.text(`Página ${i} de ${totalPages} · Documento confidencial`, pageW / 2, pageH - 5, { align: "center" });
      }

      pdf.save(`Reporte_Psicologico_${new Date().toISOString().split("T")[0]}.pdf`);
    } finally {
      setExportingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="stats-loading">
        <div className="stats-loading-spinner" />
        <p>Analizando datos institucionales...</p>
      </div>
    );
  }

  return (
    <div className="stats-shell">
      {/* ── TOP BAR ── */}
      <div className="stats-topbar">
        <div>
          <h1 className="stats-main-title">Análisis Estadístico</h1>
          <p className="stats-main-sub">
            Panorama de salud mental de la institución · {data.length} estudiantes evaluados
          </p>
        </div>
        <div className="stats-export-actions">
          <button className="stats-btn-export stats-btn-export--ghost" onClick={exportExcel}>
            <span>⬇</span> Excel
          </button>
          <button className="stats-btn-export" onClick={exportPDF} disabled={exportingPdf}>
            {exportingPdf ? "Generando..." : "PDF"}
          </button>
        </div>
      </div>

      <div ref={reportRef} className="stats-content">
        {/* ── KPI ROW ── */}
        <div className="stats-kpi-grid">
          <KpiCard label="Total Estudiantes" value={data.length} sublabel="con al menos 1 test" color="#6366f1" icon="TE" />
          <KpiCard label="Riesgo Alto" value={counts.alto} sublabel={`${data.length > 0 ? Math.round(counts.alto / data.length * 100) : 0}% del total`} color={C.alto} icon="RA" />
          <KpiCard label="Riesgo Moderado" value={counts.moderado} sublabel={`${data.length > 0 ? Math.round(counts.moderado / data.length * 100) : 0}% del total`} color={C.moderado} icon="RM" />
          <KpiCard label="Riesgo Bajo" value={counts.bajo} sublabel="en monitoreo estable" color={C.bajo} icon="RB" />
          <KpiCard label="Diagnosticados" value={`${diagPct}%`} sublabel="tienen diagnóstico final" color="#6366f1" icon="DG" />
        </div>

        {/* ── ROW 1: Donut + Grade bars ── */}
        <div className="stats-charts-row">
          <ChartCard title="Distribución de Riesgo" subtitle="Proporción total de niveles de ansiedad detectados">
            <div className="stats-donut-wrap">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%" cy="50%"
                    innerRadius={70} outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={customTooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="stats-donut-legend">
                {pieData.map(d => (
                  <div key={d.name} className="stats-legend-item">
                    <span className="stats-legend-dot" style={{ background: d.color }} />
                    <span className="stats-legend-label">{d.name}</span>
                    <strong className="stats-legend-val">{d.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>

          <ChartCard title="Ansiedad por Grado" subtitle="Distribución de niveles por año escolar">
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

        {/* ── ROW 2: Gender ── */}
        <ChartCard title="Comparativa por Género" subtitle="Tendencias de ansiedad diferenciadas por sexo del estudiante">
          <div style={{ height: 260, marginTop: "1rem" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={genderData} layout="vertical" barSize={28}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis dataKey="gender" type="category" width={90} tick={{ fontSize: 13, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={customTooltipStyle} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "0.8rem", paddingTop: "1rem" }} />
                <Bar dataKey="bajo" name="Bajo" fill={C.bajo} stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="moderado" name="Moderado" fill={C.moderado} stackId="a" />
                <Bar dataKey="alto" name="Alto" fill={C.alto} stackId="a" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* ── Student table ── */}
        <div className="stats-chart-card">
          <div className="stats-chart-header">
            <div>
              <h3 className="stats-chart-title">Registro Detallado</h3>
              <p className="stats-chart-sub">Listado completo de estudiantes evaluados</p>
            </div>
          </div>
          <div className="stats-table-wrap">
            <table className="stats-table">
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>DNI</th>
                  <th>Grado</th>
                  <th>Género</th>
                  <th>Puntaje</th>
                  <th>Nivel</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {data.map((entry, i) => {
                  const risk = entry.latestDiagnosis?.riskLevel || entry.latestAssessment?.preliminaryRisk || "bajo";
                  const label = entry.latestDiagnosis?.predictedLabel || entry.latestAssessment?.preliminaryLabel || "—";
                  const color = C[risk as keyof typeof C];
                  return (
                    <tr key={i}>
                      <td><strong>{entry.student.fullName}</strong></td>
                      <td className="stats-td-muted">{entry.student.code}</td>
                      <td className="stats-td-muted">{entry.student.gradeSection}</td>
                      <td className="stats-td-muted" style={{ textTransform: "capitalize" }}>{entry.student.gender || "—"}</td>
                      <td><strong>{entry.latestAssessment?.normalizedScore ?? "—"}</strong></td>
                      <td>
                        <span className="stats-risk-badge" style={{ color, background: `${color}18` }}>
                          {label}
                        </span>
                      </td>
                      <td>
                        <span className="stats-status-dot" style={{ background: entry.latestDiagnosis ? C.bajo : C.moderado }} />
                        {entry.latestDiagnosis ? "Diagnosticado" : "Pendiente"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
