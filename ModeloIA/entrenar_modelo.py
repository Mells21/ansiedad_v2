# ============================================================
# ENTRENAMIENTO DEL MODELO RANDOM FOREST
# Dataset: Ansiedad escolar - Rioja, San Martín, Perú
# ============================================================

import os
import pandas as pd
import matplotlib

# Evita que matplotlib bloquee la ejecución en consola.
matplotlib.use("Agg")

import matplotlib.pyplot as plt
import joblib

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.tree import plot_tree, export_text


# ============================================================
# 1. CONFIGURACIÓN GENERAL
# ============================================================

RUTA_DATASET = "dataset_normalizado.csv"
RUTA_MODELO = "modelo_random_forest_ansiedad.pkl"
RUTA_GRAFICO_IMPORTANCIA = "importancia_variables.png"
RUTA_GRAFICO_ARBOL = "arbol_random_forest.png"

CLASES_ANSIEDAD = [
    "Normal",
    "Leve",
    "Moderada",
    "Severa",
    "Extrema"
]

VARIABLES_ENTRADA = [
    "notas",
    "conducta",
    "padres",
    "inasistencias",
    "economia",
    "sueno",
    "extra",
    "estudio"
]

VARIABLE_OBJETIVO = "ansiedad"


# ============================================================
# 2. CARGA Y VALIDACIÓN DEL DATASET
# ============================================================

if not os.path.exists(RUTA_DATASET):
    raise FileNotFoundError(f"No se encontró el archivo: {RUTA_DATASET}")

df = pd.read_csv(RUTA_DATASET)

columnas_requeridas = VARIABLES_ENTRADA + [VARIABLE_OBJETIVO]
columnas_faltantes = [col for col in columnas_requeridas if col not in df.columns]

if columnas_faltantes:
    raise ValueError(f"Faltan columnas en el dataset: {columnas_faltantes}")

print("============================================================")
print("CARGA DEL DATASET")
print("============================================================")
print(f"Archivo: {RUTA_DATASET}")
print(f"Registros: {df.shape[0]}")
print(f"Columnas: {df.shape[1]}")
print("\nPrimeros registros:")
print(df.head())


# ============================================================
# 3. DEFINICIÓN DE VARIABLES
# ============================================================

X = df[VARIABLES_ENTRADA]
y = df[VARIABLE_OBJETIVO]

print("\n============================================================")
print("VARIABLES DEL MODELO")
print("============================================================")
print("Variables de entrada:")
for variable in VARIABLES_ENTRADA:
    print(f"- {variable}")

print(f"\nVariable objetivo: {VARIABLE_OBJETIVO}")


# ============================================================
# 4. DIVISIÓN DE DATOS: ENTRENAMIENTO Y PRUEBA
# ============================================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    train_size=0.80,
    test_size=0.20,
    random_state=42,
    stratify=y
)

print("\n============================================================")
print("DIVISIÓN DEL DATASET")
print("============================================================")
print(f"Entrenamiento: {X_train.shape[0]} registros")
print(f"Prueba: {X_test.shape[0]} registros")
print("Proporción: 80% entrenamiento - 20% prueba")


# ============================================================
# 5. CONFIGURACIÓN DEL MODELO
# ============================================================

modelo = RandomForestClassifier(
    n_estimators=200,
    max_depth=10,
    min_samples_split=2,
    min_samples_leaf=1,
    random_state=42,
    class_weight="balanced",
    n_jobs=-1,
    verbose=2
)

print("\n============================================================")
print("PARÁMETROS DEL MODELO")
print("============================================================")
print(f"Algoritmo: Random Forest Classifier")
print(f"Número de árboles: {modelo.n_estimators}")
print(f"Profundidad máxima: {modelo.max_depth}")
print(f"Mínimo de muestras para dividir nodo: {modelo.min_samples_split}")
print(f"Mínimo de muestras por hoja: {modelo.min_samples_leaf}")
print(f"Balanceo de clases: {modelo.class_weight}")
print(f"Núcleos usados: todos los disponibles")


# ============================================================
# 6. ENTRENAMIENTO DEL MODELO
# ============================================================

print("\n============================================================")
print("ENTRENAMIENTO DEL MODELO")
print("============================================================")
print("Iniciando entrenamiento...")

modelo.fit(X_train, y_train)

print("Entrenamiento finalizado correctamente.")


# ============================================================
# 7. PREDICCIÓN
# ============================================================

print("\n============================================================")
print("PREDICCIÓN SOBRE DATOS DE PRUEBA")
print("============================================================")

y_pred = modelo.predict(X_test)

print("Predicciones generadas correctamente.")


# ============================================================
# 8. EVALUACIÓN DEL MODELO
# ============================================================

accuracy = accuracy_score(y_test, y_pred)

print("\n============================================================")
print("RESULTADOS DEL MODELO")
print("============================================================")
print(f"Accuracy: {accuracy:.4f}")

print("\nReporte de clasificación:")
print(classification_report(
    y_test,
    y_pred,
    target_names=CLASES_ANSIEDAD,
    zero_division=0
))

print("Matriz de confusión:")
print(confusion_matrix(y_test, y_pred))


# ============================================================
# 9. IMPORTANCIA DE VARIABLES
# ============================================================

importancias = pd.DataFrame({
    "variable": X.columns,
    "importancia": modelo.feature_importances_
}).sort_values(by="importancia", ascending=False)

variable_predominante = importancias.iloc[0]

print("\n============================================================")
print("IMPORTANCIA DE VARIABLES")
print("============================================================")
print(importancias.to_string(index=False))

print("\nVariable predominante:")
print(
    f"{variable_predominante['variable']} "
    f"({variable_predominante['importancia']:.4f})"
)


# ============================================================
# 10. GRÁFICO DE IMPORTANCIA DE VARIABLES
# ============================================================

plt.figure(figsize=(10, 6))
plt.bar(importancias["variable"], importancias["importancia"])
plt.title("Importancia de variables - Random Forest")
plt.xlabel("Variables")
plt.ylabel("Importancia")
plt.xticks(rotation=45)
plt.tight_layout()
plt.savefig(RUTA_GRAFICO_IMPORTANCIA, dpi=300, bbox_inches="tight")
plt.close()

print(f"\nGráfico guardado: {RUTA_GRAFICO_IMPORTANCIA}")


# ============================================================
# 11. REGLAS DE DECISIÓN DE UN ÁRBOL
# ============================================================

arbol = modelo.estimators_[0]

reglas = export_text(
    arbol,
    feature_names=list(X.columns),
    max_depth=4
)

print("\n============================================================")
print("REGLAS DE DECISIÓN DE UN ÁRBOL DEL BOSQUE")
print("============================================================")
print(reglas)


# ============================================================
# 12. GRÁFICO DE UN ÁRBOL DEL RANDOM FOREST
# ============================================================

plt.figure(figsize=(24, 12))

plot_tree(
    arbol,
    feature_names=X.columns,
    class_names=CLASES_ANSIEDAD,
    filled=True,
    rounded=True,
    fontsize=8,
    max_depth=3
)

plt.title("Árbol de decisión dentro del Random Forest")
plt.savefig(RUTA_GRAFICO_ARBOL, dpi=300, bbox_inches="tight")
plt.close()

print(f"Gráfico guardado: {RUTA_GRAFICO_ARBOL}")


# ============================================================
# 13. GUARDADO DEL MODELO
# ============================================================

joblib.dump(modelo, RUTA_MODELO)

print("\n============================================================")
print("MODELO GUARDADO")
print("============================================================")
print(f"Archivo generado: {RUTA_MODELO}")
