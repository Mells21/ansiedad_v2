import random
import pandas as pd

def ansiedad_nivel(score):
    if score <= 7:
        return "Normal"
    elif score <= 9:
        return "Leve"
    elif score <= 14:
        return "Moderada"
    elif score <= 19:
        return "Severa"
    else:
        return "Extremadamente severa"

notas = ["AD","A","B","C"]
conducta = ["buena","regular","mala"]
vive = ["Sí","No"]
inasistencias = [1,2,3,4,5,6]
economia = ["buena","regular","crítica"]
sueno = [4,5,6,7,8,9]
extra = ["No realiza","Ocasional","Frecuente"]
estudio = [1,2,3,4,5,6]

data = []

for _ in range(250):
    score = random.randint(0,25)
    row = [
        score,
        ansiedad_nivel(score),
        random.choices(notas, weights=[1,2,4,5])[0],
        random.choices(conducta, weights=[3,5,4])[0],
        random.choices(vive, weights=[8,2])[0],
        random.choice(inasistencias),
        random.choices(economia, weights=[2,5,6])[0],
        random.choice(sueno),
        random.choices(extra, weights=[5,3,2])[0],
        random.choice(estudio)
    ]
    data.append(row)

df = pd.DataFrame(data, columns=[
    "ansiedad_score","ansiedad_nivel","notas","conducta",
    "vive_padres","inasistencias","economia",
    "sueno","extracurriculares","horas_estudio"
])

df.to_csv("dataset_rioja.csv", index=False)
print("CSV generado 🔥")