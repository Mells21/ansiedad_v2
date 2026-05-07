import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { AdminOutletContextValue } from "@/features/admin/models/admin-outlet-context.model";
import type { ManagedUserDirectoryEntry } from "@/features/admin/models/managed-user-directory.model";
import type { ModelMetrics } from "@/features/admin/models/model-metrics.model";
import { getManagedUsers, getModelMetrics } from "@/features/admin/services/admin.service";
import { getCurrentSession, logout } from "@/features/auth/services/auth.service";

function normalizeSearch(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function useAdminDashboard(): AdminOutletContextValue {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [usersLoading, setUsersLoading] = useState(true);
  const [students, setStudents] = useState<ManagedUserDirectoryEntry[]>([]);
  const [psychologists, setPsychologists] = useState<ManagedUserDirectoryEntry[]>([]);
  const [admins, setAdmins] = useState<ManagedUserDirectoryEntry[]>([]);
  const [studentSearchTerm, setStudentSearchTerm] = useState("");
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const session = getCurrentSession();

  useEffect(() => {
    let isMounted = true;

    getModelMetrics()
      .then((result) => {
        if (!isMounted) {
          return;
        }

        setMetrics(result);
        setMetricsError(null);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setMetrics(null);
        setMetricsError("No se pudieron cargar las metricas del modelo.");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    setUsersLoading(true);
    getManagedUsers()
      .then((result) => {
        if (!isMounted) {
          return;
        }

        setStudents(result.students);
        setPsychologists(result.psychologists);
        setAdmins(result.admins);
        setUsersError(null);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setStudents([]);
        setPsychologists([]);
        setAdmins([]);
        setUsersError("No se pudo cargar el listado de usuarios.");
      })
      .finally(() => {
        if (isMounted) {
          setUsersLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const totalUsers = useMemo(
    () => students.length + psychologists.length + admins.length,
    [admins.length, psychologists.length, students.length],
  );

  const groupedStudents = useMemo(() => {
    const grouped = new Map<string, Map<string, ManagedUserDirectoryEntry[]>>();

    students.forEach((student) => {
      const grade = student.grade?.trim() || "Sin grado";
      const section = student.section?.trim() || "Sin seccion";

      if (!grouped.has(grade)) {
        grouped.set(grade, new Map<string, ManagedUserDirectoryEntry[]>());
      }

      const sections = grouped.get(grade)!;
      const currentEntries = sections.get(section) ?? [];
      currentEntries.push(student);
      sections.set(section, currentEntries);
    });

    return Array.from(grouped.entries())
      .sort((left, right) => left[0].localeCompare(right[0], "es"))
      .map(([grade, sections]) => ({
        grade,
        totalStudents: Array.from(sections.values()).reduce((sum, entries) => sum + entries.length, 0),
        sections: Array.from(sections.entries())
          .sort((left, right) => left[0].localeCompare(right[0], "es"))
          .map(([section, entries]) => ({
            section,
            students: [...entries].sort((left, right) => left.fullName.localeCompare(right.fullName, "es")),
          })),
      }));
  }, [students]);

  const selectedGradeData = useMemo(
    () => groupedStudents.find((entry) => entry.grade === selectedGrade) ?? null,
    [groupedStudents, selectedGrade],
  );

  const selectedSectionStudents = useMemo(() => {
    if (!selectedGradeData || !selectedSection) {
      return [];
    }

    return selectedGradeData.sections.find((entry) => entry.section === selectedSection)?.students ?? [];
  }, [selectedGradeData, selectedSection]);

  const filteredStudents = useMemo(() => {
    const normalizedSearch = normalizeSearch(studentSearchTerm.trim());

    if (!normalizedSearch) {
      return [];
    }

    return students.filter((student) => {
      const haystack = normalizeSearch(
        [student.fullName, student.code, student.email, student.grade, student.section, student.gradeSection]
          .filter(Boolean)
          .join(" "),
      );

      return haystack.includes(normalizedSearch);
    });
  }, [studentSearchTerm, students]);

  const selectGrade = (grade: string) => {
    setSelectedGrade((current) => {
      const nextGrade = current === grade ? null : grade;
      setSelectedSection(null);
      return nextGrade;
    });
  };

  const selectSection = (section: string) => {
    setSelectedSection((current) => (current === section ? null : section));
  };

  const closeSession = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return {
    admins,
    closeSession,
    filteredStudents,
    groupedStudents,
    metrics,
    metricsError,
    psychologists,
    session,
    selectGrade,
    selectSection,
    selectedGrade,
    selectedGradeData,
    selectedSection,
    selectedSectionStudents,
    setStudentSearchTerm,
    students,
    studentSearchTerm,
    totalUsers,
    usersError,
    usersLoading,
  };
}
