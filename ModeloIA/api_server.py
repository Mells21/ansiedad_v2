from __future__ import annotations

import json
import re
import sqlite3
from datetime import datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

import joblib
import pandas as pd
from sklearn.metrics import accuracy_score, precision_score, recall_score
from sklearn.model_selection import train_test_split


BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "modelo_random_forest_ansiedad.pkl"
DATASET_PATH = BASE_DIR / "dataset_normalizado.csv"
DB_PATH = BASE_DIR / "ansiedad.sqlite3"
HOST = "127.0.0.1"
PORT = 8000

FEATURES = [
    "ansiedad_score",
    "notas",
    "conducta",
    "padres",
    "inasistencias",
    "economia",
    "sueno",
    "extra",
    "estudio",
]

TARGET = "ansiedad"
CLASS_LABELS = {
    0: "Normal",
    1: "Leve",
    2: "Moderada",
    3: "Severa",
    4: "Extrema",
}
RISK_LEVELS = {
    "Normal": "bajo",
    "Leve": "bajo",
    "Moderada": "moderado",
    "Severa": "alto",
    "Extrema": "alto",
}
ECONOMY_LABELS = {
    0: "critica",
    1: "regular",
    2: "buena",
}
EXTRA_LABELS = {
    0: "No realiza",
    1: "Ocasional",
    2: "Frecuente",
}
NOTE_LABELS = {
    1: "C",
    2: "B",
    3: "A",
    4: "AD",
}
CONDUCT_LABELS = {
    0: "mala",
    1: "regular",
    2: "buena",
}
ABSENCE_LABELS = {
    0: "normal",
    1: "regular",
    2: "grave",
}
RECOMMENDATIONS = {
    "bajo": [
        "Mantener una rutina de sueno estable y pausas de estudio saludables.",
        "Continuar con actividades recreativas que ayuden a regular el estres.",
        "Volver a responder el tamizaje si notas cambios emocionales importantes.",
    ],
    "moderado": [
        "Coordinar seguimiento con el psicologo de la institucion esta semana.",
        "Reducir sobrecarga academica con bloques de estudio cortos y descansos.",
        "Conversar con un familiar o tutor sobre cambios de sueno o preocupaciones frecuentes.",
        "Monitorear el bienestar emocional durante los proximos dias.",
    ],
    "alto": [
        "Priorizar una entrevista con el psicologo para evaluacion mas cercana.",
        "Avisar a la familia o tutor para reforzar acompanamiento inmediato.",
        "Reducir factores de estres y cuidar especialmente el descanso esta semana.",
        "No dejar pasar sintomas intensos o persistentes sin pedir apoyo.",
    ],
}
DASS_ANSIETY_QUESTIONS = [
    "Senti sequedad en la boca.",
    "Tuve dificultad para respirar sin haber hecho esfuerzo fisico.",
    "Senti temblores, por ejemplo en las manos.",
    "Me preocupaba sentir panico y hacer el ridiculo.",
    "Senti que estaba cerca de entrar en panico.",
    "Senti los latidos de mi corazon aunque no hiciera esfuerzo.",
    "Tuve miedo sin una razon clara.",
    "Me costo relajarme cuando estaba nervioso o preocupado.",
    "Senti un nudo en el estomago por tension o ansiedad.",
    "Me altere facilmente por pequenas cosas.",
    "Senti que algo malo podia pasar en cualquier momento.",
    "Me senti muy sensible al estres o a la presion.",
    "Me costo recuperar la calma despues de preocuparme.",
    "Evite situaciones por miedo a ponerme muy nervioso.",
]


def _now_iso() -> str:
    return datetime.now().isoformat()


def _load_model():
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"No se encontro el modelo en {MODEL_PATH}")

    model = joblib.load(MODEL_PATH)
    if hasattr(model, "n_jobs"):
        model.n_jobs = 1
    if hasattr(model, "verbose"):
        model.verbose = 0
    return model


def _load_dataset() -> pd.DataFrame:
    if not DATASET_PATH.exists():
        raise FileNotFoundError(f"No se encontro el dataset en {DATASET_PATH}")
    return pd.read_csv(DATASET_PATH)


MODEL = _load_model()
DATASET = _load_dataset()


def get_connection() -> sqlite3.Connection:
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def normalize_anxiety_score(raw_score: int) -> int:
    scaled = round((raw_score / 42) * 25)
    return max(0, min(25, scaled))


def derive_preliminary_label(score: int) -> str:
    if score <= 7:
        return "Normal"
    if score <= 9:
        return "Leve"
    if score <= 14:
        return "Moderada"
    if score <= 19:
        return "Severa"
    return "Extrema"


def map_sleep_hours(hours: float) -> int:
    if 8 <= hours <= 10:
        return 3
    if 6 <= hours <= 7:
        return 2
    if hours < 5:
        return 1
    return 0


def map_study_hours(hours: float) -> int:
    if hours <= 1:
        return 0
    if hours <= 3:
        return 1
    if hours <= 5:
        return 2
    return 3


def build_metrics() -> dict[str, Any]:
    x = DATASET[FEATURES]
    y = DATASET[TARGET]

    _, x_test, _, y_test = train_test_split(
        x,
        y,
        train_size=0.80,
        test_size=0.20,
        random_state=42,
        stratify=y,
    )

    y_pred = MODEL.predict(x_test)
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, average="macro", zero_division=0)
    recall = recall_score(y_test, y_pred, average="macro", zero_division=0)

    return {
        "accuracy": accuracy,
        "precision": precision,
        "recall": recall,
        "featureCount": len(FEATURES),
        "modelVersion": "RF v1.0",
        "lastTrainedAt": datetime.fromtimestamp(MODEL_PATH.stat().st_mtime).isoformat(),
    }


METRICS = build_metrics()


def initialize_database() -> None:
    connection = get_connection()
    cursor = connection.cursor()

    cursor.executescript(
        """
        CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT NOT NULL UNIQUE,
            full_name TEXT NOT NULL,
            grade_section TEXT NOT NULL,
            lives_with_parents INTEGER NOT NULL,
            parents_value INTEGER NOT NULL,
            economic_situation INTEGER NOT NULL,
            sleep_hours REAL NOT NULL,
            sleep_value INTEGER NOT NULL,
            extracurricular_frequency INTEGER NOT NULL,
            study_hours REAL NOT NULL,
            study_value INTEGER NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS assessments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            q1 INTEGER NOT NULL,
            q2 INTEGER NOT NULL,
            q3 INTEGER NOT NULL,
            q4 INTEGER NOT NULL,
            q5 INTEGER NOT NULL,
            q6 INTEGER NOT NULL,
            q7 INTEGER NOT NULL,
            q8 INTEGER NOT NULL,
            q9 INTEGER NOT NULL,
            q10 INTEGER NOT NULL,
            q11 INTEGER NOT NULL,
            q12 INTEGER NOT NULL,
            q13 INTEGER NOT NULL,
            q14 INTEGER NOT NULL,
            raw_score INTEGER NOT NULL,
            normalized_score INTEGER NOT NULL,
            preliminary_label TEXT NOT NULL,
            preliminary_risk TEXT NOT NULL,
            submitted_at TEXT NOT NULL,
            FOREIGN KEY(student_id) REFERENCES students(id)
        );

        CREATE TABLE IF NOT EXISTS diagnoses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            assessment_id INTEGER NOT NULL,
            notas INTEGER NOT NULL,
            conducta INTEGER NOT NULL,
            inasistencias INTEGER NOT NULL,
            predicted_class INTEGER NOT NULL,
            predicted_label TEXT NOT NULL,
            risk_level TEXT NOT NULL,
            probabilities_json TEXT NOT NULL,
            diagnosed_at TEXT NOT NULL,
            FOREIGN KEY(student_id) REFERENCES students(id),
            FOREIGN KEY(assessment_id) REFERENCES assessments(id)
        );
        """
    )

    diagnosis_columns = {
        row["name"] if "name" in row.keys() else row[1]
        for row in cursor.execute("PRAGMA table_info(diagnoses)").fetchall()
    }
    if "recommendations_json" not in diagnosis_columns:
        cursor.execute(
            "ALTER TABLE diagnoses ADD COLUMN recommendations_json TEXT NOT NULL DEFAULT '[]'"
        )

    connection.commit()
    connection.close()


def row_to_dict(row: sqlite3.Row | None) -> dict[str, Any] | None:
    if row is None:
        return None
    return {key: row[key] for key in row.keys()}


def serialize_student(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": row["id"],
        "code": row["code"],
        "fullName": row["full_name"],
        "gradeSection": row["grade_section"],
        "livesWithParents": bool(row["lives_with_parents"]),
        "parentsValue": row["parents_value"],
        "economicSituation": row["economic_situation"],
        "sleepHours": row["sleep_hours"],
        "sleepValue": row["sleep_value"],
        "extracurricularFrequency": row["extracurricular_frequency"],
        "studyHours": row["study_hours"],
        "studyValue": row["study_value"],
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"],
    }


def serialize_assessment(row: sqlite3.Row | None) -> dict[str, Any] | None:
    if row is None:
        return None

    answers = [row[f"q{index}"] for index in range(1, 15)]

    return {
        "id": row["id"],
        "answers": answers,
        "rawScore": row["raw_score"],
        "normalizedScore": row["normalized_score"],
        "preliminaryLabel": row["preliminary_label"],
        "preliminaryRisk": row["preliminary_risk"],
        "submittedAt": row["submitted_at"],
    }


def serialize_diagnosis(row: sqlite3.Row | None) -> dict[str, Any] | None:
    if row is None:
        return None

    raw_recommendations = row["recommendations_json"] if "recommendations_json" in row.keys() else "[]"

    return {
        "id": row["id"],
        "notas": row["notas"],
        "conducta": row["conducta"],
        "inasistencias": row["inasistencias"],
        "recommendations": json.loads(raw_recommendations or "[]"),
        "predictedClass": row["predicted_class"],
        "predictedLabel": row["predicted_label"],
        "riskLevel": row["risk_level"],
        "probabilities": json.loads(row["probabilities_json"]),
        "diagnosedAt": row["diagnosed_at"],
    }


def build_history(student_id: int) -> list[dict[str, Any]]:
    connection = get_connection()
    cursor = connection.cursor()
    rows = cursor.execute(
        """
        SELECT
            a.id AS assessment_id,
            a.submitted_at,
            a.raw_score,
            a.normalized_score,
            a.preliminary_label,
            a.preliminary_risk,
            d.id AS diagnosis_id,
            d.predicted_label,
            d.risk_level,
            d.diagnosed_at
        FROM assessments a
        LEFT JOIN diagnoses d ON d.assessment_id = a.id
        WHERE a.student_id = ?
        ORDER BY a.submitted_at DESC
        """,
        (student_id,),
    ).fetchall()
    connection.close()

    history: list[dict[str, Any]] = []
    for row in rows:
        history.append(
            {
                "assessmentId": row["assessment_id"],
                "submittedAt": row["submitted_at"],
                "rawScore": row["raw_score"],
                "normalizedScore": row["normalized_score"],
                "preliminaryLabel": row["preliminary_label"],
                "preliminaryRisk": row["preliminary_risk"],
                "diagnosisId": row["diagnosis_id"],
                "finalLabel": row["predicted_label"],
                "finalRisk": row["risk_level"],
                "diagnosedAt": row["diagnosed_at"],
                "status": "diagnosticado" if row["diagnosis_id"] else "pendiente",
            }
        )
    return history


def build_student_detail(student_id: int) -> dict[str, Any] | None:
    connection = get_connection()
    cursor = connection.cursor()

    student = cursor.execute(
        "SELECT * FROM students WHERE id = ?",
        (student_id,),
    ).fetchone()

    if student is None:
        connection.close()
        return None

    latest_assessment = cursor.execute(
        "SELECT * FROM assessments WHERE student_id = ? ORDER BY submitted_at DESC LIMIT 1",
        (student_id,),
    ).fetchone()

    latest_diagnosis = cursor.execute(
        """
        SELECT d.*
        FROM diagnoses d
        INNER JOIN assessments a ON a.id = d.assessment_id
        WHERE d.student_id = ?
        ORDER BY d.diagnosed_at DESC
        LIMIT 1
        """,
        (student_id,),
    ).fetchone()
    connection.close()

    detail = {
        "student": serialize_student(student),
        "latestAssessment": serialize_assessment(latest_assessment),
        "latestDiagnosis": serialize_diagnosis(latest_diagnosis),
        "history": build_history(student_id),
    }

    assessment = detail["latestAssessment"]
    diagnosis = detail["latestDiagnosis"]

    if assessment is not None:
        detail["recommendations"] = RECOMMENDATIONS[assessment["preliminaryRisk"]]
        detail["status"] = "diagnosticado" if diagnosis else "pendiente_diagnostico"
    else:
        detail["recommendations"] = RECOMMENDATIONS["bajo"]
        detail["status"] = "sin_respuestas"

    return detail


def build_prediction(features: dict[str, int]) -> dict[str, Any]:
    frame = pd.DataFrame([features], columns=FEATURES)
    prediction = int(MODEL.predict(frame)[0])
    probabilities = MODEL.predict_proba(frame)[0]
    predicted_label = CLASS_LABELS.get(prediction, str(prediction))
    risk_level = RISK_LEVELS[predicted_label]

    return {
        "predictedClass": prediction,
        "predictedLabel": predicted_label,
        "riskLevel": risk_level,
        "probabilities": [
            {
                "label": CLASS_LABELS.get(int(label), str(label)),
                "value": round(float(probability), 4),
            }
            for label, probability in zip(MODEL.classes_, probabilities)
        ],
    }


def upsert_student_intake(payload: dict[str, Any]) -> dict[str, Any]:
    required_fields = [
        "code",
        "fullName",
        "gradeSection",
        "livesWithParents",
        "economicSituation",
        "sleepHours",
        "extracurricularFrequency",
        "studyHours",
        "answers",
    ]
    missing = [field for field in required_fields if field not in payload]
    if missing:
        raise ValueError(f"Faltan campos del alumno: {', '.join(missing)}")

    answers = payload["answers"]
    if not isinstance(answers, list) or len(answers) != 14:
        raise ValueError("Las respuestas del DASS deben incluir exactamente 14 valores.")

    answer_values = [int(value) for value in answers]
    if any(value < 0 or value > 3 for value in answer_values):
        raise ValueError("Cada respuesta del DASS debe estar entre 0 y 3.")

    raw_score = sum(answer_values)
    normalized_score = normalize_anxiety_score(raw_score)
    preliminary_label = derive_preliminary_label(normalized_score)
    preliminary_risk = RISK_LEVELS[preliminary_label]
    lives_with_parents = bool(payload["livesWithParents"])
    parents_value = 1 if lives_with_parents else 0
    economic_situation = int(payload["economicSituation"])
    sleep_hours = float(payload["sleepHours"])
    sleep_value = map_sleep_hours(sleep_hours)
    extracurricular_frequency = int(payload["extracurricularFrequency"])
    study_hours = float(payload["studyHours"])
    study_value = map_study_hours(study_hours)
    code = str(payload["code"]).strip().upper()
    full_name = str(payload["fullName"]).strip()
    grade_section = str(payload["gradeSection"]).strip()

    if not code or not full_name or not grade_section:
        raise ValueError("Codigo, nombre y grado/seccion son obligatorios.")

    now = _now_iso()
    connection = get_connection()
    cursor = connection.cursor()

    existing = cursor.execute(
        "SELECT id FROM students WHERE code = ?",
        (code,),
    ).fetchone()

    if existing:
        student_id = existing["id"]
        cursor.execute(
            """
            UPDATE students
            SET
                full_name = ?,
                grade_section = ?,
                lives_with_parents = ?,
                parents_value = ?,
                economic_situation = ?,
                sleep_hours = ?,
                sleep_value = ?,
                extracurricular_frequency = ?,
                study_hours = ?,
                study_value = ?,
                updated_at = ?
            WHERE id = ?
            """,
            (
                full_name,
                grade_section,
                int(lives_with_parents),
                parents_value,
                economic_situation,
                sleep_hours,
                sleep_value,
                extracurricular_frequency,
                study_hours,
                study_value,
                now,
                student_id,
            ),
        )
    else:
        cursor.execute(
            """
            INSERT INTO students (
                code,
                full_name,
                grade_section,
                lives_with_parents,
                parents_value,
                economic_situation,
                sleep_hours,
                sleep_value,
                extracurricular_frequency,
                study_hours,
                study_value,
                created_at,
                updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                code,
                full_name,
                grade_section,
                int(lives_with_parents),
                parents_value,
                economic_situation,
                sleep_hours,
                sleep_value,
                extracurricular_frequency,
                study_hours,
                study_value,
                now,
                now,
            ),
        )
        student_id = cursor.lastrowid

    cursor.execute(
        """
        INSERT INTO assessments (
            student_id,
            q1, q2, q3, q4, q5, q6, q7,
            q8, q9, q10, q11, q12, q13, q14,
            raw_score,
            normalized_score,
            preliminary_label,
            preliminary_risk,
            submitted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            student_id,
            *answer_values,
            raw_score,
            normalized_score,
            preliminary_label,
            preliminary_risk,
            now,
        ),
    )

    connection.commit()
    connection.close()

    detail = build_student_detail(student_id)
    if detail is None:
        raise ValueError("No se pudo reconstruir la ficha del alumno.")
    return detail


def diagnose_student(student_id: int, payload: dict[str, Any]) -> dict[str, Any]:
    required = ["notas", "conducta", "inasistencias"]
    missing = [field for field in required if field not in payload]
    if missing:
        raise ValueError(f"Faltan variables del psicologo: {', '.join(missing)}")

    notas = int(payload["notas"])
    conducta = int(payload["conducta"])
    inasistencias = int(payload["inasistencias"])
    recommendations = payload.get("recommendations", [])
    if not isinstance(recommendations, list):
        raise ValueError("Las recomendaciones deben enviarse como una lista.")
    recommendation_values = [str(item).strip() for item in recommendations if str(item).strip()]

    connection = get_connection()
    cursor = connection.cursor()
    student = cursor.execute("SELECT * FROM students WHERE id = ?", (student_id,)).fetchone()
    assessment = cursor.execute(
        "SELECT * FROM assessments WHERE student_id = ? ORDER BY submitted_at DESC LIMIT 1",
        (student_id,),
    ).fetchone()

    if student is None or assessment is None:
        connection.close()
        raise ValueError("No existe una ficha del alumno lista para diagnosticar.")

    features = {
        "ansiedad_score": assessment["normalized_score"],
        "notas": notas,
        "conducta": conducta,
        "padres": student["parents_value"],
        "inasistencias": inasistencias,
        "economia": student["economic_situation"],
        "sueno": student["sleep_value"],
        "extra": student["extracurricular_frequency"],
        "estudio": student["study_value"],
    }

    prediction = build_prediction(features)
    now = _now_iso()

    existing_diagnosis = cursor.execute(
        "SELECT id FROM diagnoses WHERE assessment_id = ?",
        (assessment["id"],),
    ).fetchone()

    if existing_diagnosis:
        cursor.execute(
            """
            UPDATE diagnoses
            SET notas = ?, conducta = ?, inasistencias = ?, predicted_class = ?, predicted_label = ?,
                risk_level = ?, probabilities_json = ?, recommendations_json = ?, diagnosed_at = ?
            WHERE assessment_id = ?
            """,
            (
                notas,
                conducta,
                inasistencias,
                prediction["predictedClass"],
                prediction["predictedLabel"],
                prediction["riskLevel"],
                json.dumps(prediction["probabilities"]),
                json.dumps(recommendation_values),
                now,
                assessment["id"],
            ),
        )
    else:
        cursor.execute(
            """
            INSERT INTO diagnoses (
                student_id,
                assessment_id,
                notas,
                conducta,
                inasistencias,
                predicted_class,
                predicted_label,
                risk_level,
                probabilities_json,
                recommendations_json,
                diagnosed_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                student_id,
                assessment["id"],
                notas,
                conducta,
                inasistencias,
                prediction["predictedClass"],
                prediction["predictedLabel"],
                prediction["riskLevel"],
                json.dumps(prediction["probabilities"]),
                json.dumps(recommendation_values),
                now,
            ),
        )

    connection.commit()
    connection.close()

    detail = build_student_detail(student_id)
    if detail is None:
        raise ValueError("No se pudo reconstruir el caso diagnosticado.")
    return detail


def get_psychologist_dashboard() -> dict[str, Any]:
    connection = get_connection()
    cursor = connection.cursor()
    rows = cursor.execute(
        """
        SELECT
            s.id,
            s.full_name,
            s.grade_section,
            a.normalized_score,
            a.preliminary_risk,
            a.submitted_at,
            d.predicted_label,
            d.risk_level,
            d.diagnosed_at
        FROM students s
        INNER JOIN assessments a ON a.id = (
            SELECT a2.id
            FROM assessments a2
            WHERE a2.student_id = s.id
            ORDER BY a2.submitted_at DESC
            LIMIT 1
        )
        LEFT JOIN diagnoses d ON d.assessment_id = a.id
        ORDER BY COALESCE(d.diagnosed_at, a.submitted_at) DESC
        """
    ).fetchall()
    connection.close()

    alerts: list[dict[str, Any]] = []
    section_map: dict[str, list[str]] = {}

    for row in rows:
        effective_risk = row["risk_level"] or row["preliminary_risk"]
        alerts.append(
            {
                "id": row["id"],
                "studentName": row["full_name"],
                "gradeSection": row["grade_section"],
                "riskLevel": effective_risk,
                "latestScore": row["normalized_score"],
                "status": "diagnosticado" if row["risk_level"] else "pendiente",
                "latestLabel": row["predicted_label"] or derive_preliminary_label(row["normalized_score"]),
                "submittedAt": row["submitted_at"],
            }
        )
        section_map.setdefault(row["grade_section"], []).append(effective_risk)

    sections = []
    for section, risks in sorted(section_map.items()):
        if "alto" in risks:
            dominant = "alto"
        elif "moderado" in risks:
            dominant = "moderado"
        else:
            dominant = "bajo"
        sections.append(
            {
                "label": section,
                "students": len(risks),
                "risk": dominant,
                "note": "Seguimiento focalizado desde psicologia escolar." if dominant != "bajo" else "Monitoreo estable.",
            }
        )

    return {
        "stats": {
            "highAlerts": len([item for item in alerts if item["riskLevel"] == "alto"]),
            "moderateAlerts": len([item for item in alerts if item["riskLevel"] == "moderado"]),
            "testsThisMonth": len(alerts),
            "pendingDiagnosis": len([item for item in alerts if item["status"] == "pendiente"]),
        },
        "alerts": alerts,
        "sections": sections,
        "dailyRecommendations": [
            "Completar primero los casos pendientes con mayor puntaje de ansiedad.",
            "Cruzar notas, conducta e inasistencias antes de confirmar un diagnostico.",
            "Usar el historial del alumno para detectar escalamiento rapido del riesgo.",
        ],
    }


def parse_json_body(handler: BaseHTTPRequestHandler) -> dict[str, Any]:
    content_length = int(handler.headers.get("Content-Length", "0"))
    raw_body = handler.rfile.read(content_length).decode("utf-8") if content_length else "{}"
    return json.loads(raw_body or "{}")


class AnxietyApiHandler(BaseHTTPRequestHandler):
    server_version = "AnxietyModelAPI/2.0"

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self._send_common_headers()
        self.end_headers()

    def do_GET(self) -> None:
        route = urlparse(self.path).path
        try:
            if route == "/api/health":
                self._send_json(200, {"status": "ok"})
                return

            if route == "/api/metrics":
                self._send_json(200, METRICS)
                return

            if route == "/api/student/form-meta":
                self._send_json(
                    200,
                    {
                        "dassQuestions": DASS_ANSIETY_QUESTIONS,
                        "economyOptions": [
                            {"value": 0, "label": "A veces faltan recursos importantes en casa"},
                            {"value": 1, "label": "Alcanzamos con algunos ajustes"},
                            {"value": 2, "label": "Contamos con lo necesario para estudiar con tranquilidad"},
                        ],
                        "extracurricularOptions": [
                            {"value": 0, "label": "No realizo actividades extracurriculares"},
                            {"value": 1, "label": "Participo de vez en cuando"},
                            {"value": 2, "label": "Participo con frecuencia"},
                        ],
                    },
                )
                return

            if route == "/api/psychologist/dashboard":
                self._send_json(200, get_psychologist_dashboard())
                return

            detail_match = re.fullmatch(r"/api/students/(\d+)", route)
            if detail_match:
                detail = build_student_detail(int(detail_match.group(1)))
                if detail is None:
                    self._send_json(404, {"message": "Alumno no encontrado"})
                    return
                self._send_json(200, detail)
                return
        except ValueError as error:
            self._send_json(400, {"message": str(error)})
            return
        except Exception as error:  # pragma: no cover
            self._send_json(500, {"message": f"Error interno del servidor: {error}"})
            return

        self._send_json(404, {"message": "Ruta no encontrada"})

    def do_POST(self) -> None:
        route = urlparse(self.path).path

        try:
            payload = parse_json_body(self)
        except json.JSONDecodeError:
            self._send_json(400, {"message": "El cuerpo debe ser un JSON valido"})
            return

        try:
            if route == "/api/students/intake":
                self._send_json(200, upsert_student_intake(payload))
                return

            diagnose_match = re.fullmatch(r"/api/students/(\d+)/diagnose", route)
            if diagnose_match:
                self._send_json(200, diagnose_student(int(diagnose_match.group(1)), payload))
                return
        except ValueError as error:
            self._send_json(400, {"message": str(error)})
            return
        except Exception as error:  # pragma: no cover
            self._send_json(500, {"message": f"Error interno del servidor: {error}"})
            return

        self._send_json(404, {"message": "Ruta no encontrada"})

    def log_message(self, format: str, *args: Any) -> None:
        return

    def _send_common_headers(self) -> None:
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")

    def _send_json(self, status_code: int, payload: dict[str, Any]) -> None:
        encoded = json.dumps(payload, ensure_ascii=True).encode("utf-8")
        self.send_response(status_code)
        self._send_common_headers()
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)


def main() -> None:
    initialize_database()
    server = ThreadingHTTPServer((HOST, PORT), AnxietyApiHandler)
    print(f"API del modelo activa en http://{HOST}:{PORT}")
    server.serve_forever()


if __name__ == "__main__":
    main()
