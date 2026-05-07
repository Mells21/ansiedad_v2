import pandas as pd

# Cargar dataset
df = pd.read_csv("dataset_rioja.csv")

# -------------------------
# MAPEOS 
# -------------------------

map_ansiedad = {
    "Normal": 0,
    "Leve": 1,
    "Moderada": 2,
    "Severa": 3,
    "Extremadamente severa": 4
}

map_notas = {
    "C": 1,
    "B": 2,
    "A": 3,
    "AD": 4
}

map_conducta = {
    "mala": 0,
    "regular": 1,
    "buena": 2
}

map_padres = {
    "No": 0,
    "Sí": 1
}

def map_inasistencias(x):
    if x <= 2:
        return 0  # normal
    elif x <= 4:
        return 1  # regular
    else:
        return 2  # grave

map_economia = {
    "crítica": 0,
    "regular": 1,
    "buena": 2
}

def map_sueno(x):
    if 8 <= x <= 10:
        return 3  # normal
    elif 6 <= x <= 7:
        return 2  # insuficiente
    elif x < 5:
        return 1  # muy insuficiente
    else:
        return 0  # excesivo

map_extra = {
    "No realiza": 0,
    "Ocasional": 1,
    "Frecuente": 2
}

def map_estudio(x):
    if x <= 1:
        return 0  # muy bajo
    elif x <= 3:
        return 1  # bajo
    elif x <= 5:
        return 2  # adecuado
    else:
        return 3  # alto

# -------------------------
# APLICAR TRANSFORMACIONES
# -------------------------

df["ansiedad"] = df["ansiedad_nivel"].map(map_ansiedad)
df["notas"] = df["notas"].map(map_notas)
df["conducta"] = df["conducta"].map(map_conducta)
df["padres"] = df["vive_padres"].map(map_padres)
df["inasistencias"] = df["inasistencias"].apply(map_inasistencias)
df["economia"] = df["economia"].map(map_economia)
df["sueno"] = df["sueno"].apply(map_sueno)
df["extra"] = df["extracurriculares"].map(map_extra)
df["estudio"] = df["horas_estudio"].apply(map_estudio)

# -------------------------
# FEATURES Y TARGET
# -------------------------

X = df[[
    "ansiedad_score",
    "notas",
    "conducta",
    "padres",
    "inasistencias",
    "economia",
    "sueno",
    "extra",
    "estudio"
]]

y = df["ansiedad"]

df_normalizado = pd.concat([X, y], axis=1)

df_normalizado.to_csv("dataset_normalizado.csv", index=False)

print("Dataset normalizado guardado 🔥")