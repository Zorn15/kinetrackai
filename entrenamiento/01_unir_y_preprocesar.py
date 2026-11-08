# -*- coding: utf-8 -*-
"""
01_unir_y_preprocesar.py
------------------------
PASO 1: unir el dataset 1 (European Football Injuries 2020-2025) con el
dataset 2 (Transfermarkt) y dejar UN SOLO archivo limpio listo para entrenar.

Entrada:
  dataset 1/full_dataset_thesis - 1.csv
  dataset 2/player_injuries/player_injuries.csv
  dataset 2/player_profiles/player_profiles.csv
  dataset 2/player_performances/player_performances.csv

Salida:
  datos/lesiones_unificadas.csv   -> el dataset final (una fila = una lesion)
  datos/reporte_preprocesamiento.txt -> resumen de cuantas filas se quedaron en cada paso

Como correrlo (desde la carpeta del proyecto):
  python 01_unir_y_preprocesar.py
"""

import re
import unicodedata
from pathlib import Path

import numpy as np
import pandas as pd

from categorias import es_lesion, tipo_lesion, zona_cuerpo, POSICIONES, PIE

# Carpeta donde esta este script (asi funciona en cualquier computador)
CARPETA = Path(__file__).resolve().parent
D1 = CARPETA / "dataset 1" / "full_dataset_thesis - 1.csv"
D2 = CARPETA / "dataset 2"
SALIDA = CARPETA / "datos"
SALIDA.mkdir(exist_ok=True)

reporte = []  # aqui vamos guardando lo que pasa en cada paso


def anotar(texto):
    print(texto)
    reporte.append(texto)


def normalizar_nombre(nombre):
    """Quita tildes, numeros entre parentesis y deja todo en minuscula.
    Ej: 'Benjamin Pavard (185727)' -> 'benjamin pavard'"""
    nombre = unicodedata.normalize("NFKD", str(nombre)).encode("ascii", "ignore").decode()
    nombre = re.sub(r"\s*\(\d+\)\s*$", "", nombre.lower())
    return re.sub(r"[^a-z ]", "", nombre).strip()


# ===========================================================================
# 1. Cargar el dataset 1 (la base del proyecto)
# ===========================================================================
d1 = pd.read_csv(D1)
anotar(f"Dataset 1 cargado: {len(d1)} lesiones")

# 'Days' viene como texto ("43 days") -> lo pasamos a numero
d1["dias"] = d1["Days"].str.extract(r"(\d+)").astype(float)
d1["fecha_lesion"] = pd.to_datetime(d1["injury_from_parsed"], format="%m/%d/%Y", errors="coerce")
d1["lesion_texto"] = d1["Injury"].str.lower().str.strip()
d1["nombre_norm"] = d1["player_name"].map(normalizar_nombre)

# Quitar duplicados exactos (mismo jugador, misma fecha, misma lesion)
antes = len(d1)
d1 = d1.drop_duplicates(["nombre_norm", "fecha_lesion", "lesion_texto"]).reset_index(drop=True)
anotar(f"Duplicados eliminados: {antes - len(d1)}")

# ===========================================================================
# 2. Cargar el dataset 2 (Transfermarkt)
# ===========================================================================
lesiones_tm = pd.read_csv(D2 / "player_injuries" / "player_injuries.csv")
lesiones_tm["fecha_lesion"] = pd.to_datetime(lesiones_tm["from_date"], errors="coerce")
lesiones_tm["lesion_texto"] = lesiones_tm["injury_reason"].str.lower().str.strip()

perfiles = pd.read_csv(
    D2 / "player_profiles" / "player_profiles.csv",
    usecols=["player_id", "player_name", "height", "foot"],
)
perfiles["nombre_norm"] = perfiles["player_name"].map(normalizar_nombre)
lesiones_tm = lesiones_tm.merge(perfiles[["player_id", "nombre_norm"]], on="player_id", how="left")

# ===========================================================================
# 3. Encontrar el player_id de cada lesion del dataset 1
#    El dataset 1 no trae player_id, asi que lo buscamos en Transfermarkt:
#    a) misma fecha + misma lesion + mismos dias (y si hay varios, el del mismo nombre)
#    b) si no aparece, mismo nombre + misma fecha
# ===========================================================================
d1["fila"] = d1.index

# a) fecha + lesion + dias
cand = d1[["fila", "fecha_lesion", "lesion_texto", "dias", "nombre_norm"]].merge(
    lesiones_tm[["player_id", "fecha_lesion", "lesion_texto", "days_missed", "nombre_norm"]],
    left_on=["fecha_lesion", "lesion_texto", "dias"],
    right_on=["fecha_lesion", "lesion_texto", "days_missed"],
    how="inner",
    suffixes=("", "_tm"),
)
cand["mismo_nombre"] = cand["nombre_norm"] == cand["nombre_norm_tm"]
n_cand = cand.groupby("fila")["player_id"].transform("nunique")
# nos quedamos con: candidato unico, o el que tenga el mismo nombre
cand = cand[(n_cand == 1) | cand["mismo_nombre"]]
cand = cand.sort_values("mismo_nombre", ascending=False).drop_duplicates("fila")
emparejado = dict(zip(cand["fila"], cand["player_id"]))

# b) nombre + fecha (para las que faltan)
faltan = d1[~d1["fila"].isin(emparejado)]
cand2 = faltan[["fila", "nombre_norm", "fecha_lesion"]].merge(
    lesiones_tm[["player_id", "nombre_norm", "fecha_lesion"]].drop_duplicates(),
    on=["nombre_norm", "fecha_lesion"],
)
cand2 = cand2[cand2.groupby("fila")["player_id"].transform("nunique") == 1].drop_duplicates("fila")
emparejado.update(dict(zip(cand2["fila"], cand2["player_id"])))

d1["player_id"] = d1["fila"].map(emparejado)
anotar(f"Lesiones del dataset 1 emparejadas con Transfermarkt: {d1['player_id'].notna().sum()} "
       f"de {len(d1)} ({d1['player_id'].notna().mean():.1%})")
d1 = d1[d1["player_id"].notna()].copy()
d1["player_id"] = d1["player_id"].astype(int)
d1_completo = d1.copy()  # copia con TODAS las lesiones emparejadas (se usa en el historial)

# ===========================================================================
# 4. Quitar lo que no es lesion (covid, gripa, 'fitness', descanso, etc.)
# ===========================================================================
antes = len(d1)
d1 = d1[d1["lesion_texto"].map(es_lesion)].copy()
anotar(f"Registros que no son lesiones (enfermedades, covid, etc.) eliminados: {antes - len(d1)}")

# Lesiones de mas de 1 anio son casos extremos (fin de carrera, etc.) que distorsionan el modelo
antes = len(d1)
d1 = d1[d1["dias"] <= 365].copy()
anotar(f"Lesiones de mas de 365 dias eliminadas: {antes - len(d1)}")

# ===========================================================================
# 5. Variables de la lesion
# ===========================================================================
d1["tipo_lesion"] = d1["lesion_texto"].map(tipo_lesion)
d1["zona_cuerpo"] = d1["lesion_texto"].map(zona_cuerpo)
d1["mes_lesion"] = d1["fecha_lesion"].dt.month

# ===========================================================================
# 6. Variables del jugador (del dataset 1 + perfil de Transfermarkt)
# ===========================================================================
d1["posicion"] = d1["player_position"].map(POSICIONES).fillna("Mediocentro")
d1["edad"] = d1["player_age"]
d1["liga"] = d1["league"]

perfiles["altura_cm"] = perfiles["height"].replace(0, np.nan)  # 0 = dato faltante
perfiles["pie_habil"] = perfiles["foot"].map(PIE)
d1 = d1.merge(perfiles[["player_id", "altura_cm", "pie_habil"]], on="player_id", how="left")

# ===========================================================================
# 7. Historial de lesiones ANTES de cada lesion (usando todo Transfermarkt)
#    IMPORTANTE: solo se cuentan lesiones que empezaron ANTES de la actual,
#    para no "ver el futuro" (fuga de informacion).
#    OJO: Transfermarkt solo trae las 15 lesiones mas recientes de cada jugador,
#    por eso el historial se arma juntando Transfermarkt + el propio dataset 1.
# ===========================================================================
hist = pd.concat([
    lesiones_tm[["player_id", "fecha_lesion", "lesion_texto", "days_missed"]],
    d1_completo[["player_id", "fecha_lesion", "lesion_texto", "dias"]].rename(columns={"dias": "days_missed"}),
]).dropna(subset=["fecha_lesion", "days_missed"])
hist = hist[hist["lesion_texto"].map(es_lesion)]
hist["tipo_lesion"] = hist["lesion_texto"].map(tipo_lesion)
hist = hist[hist["player_id"].isin(d1["player_id"])]
hist = hist.drop_duplicates(["player_id", "fecha_lesion", "lesion_texto"])
hist_por_jugador = {pid: g for pid, g in hist.groupby("player_id")}


def historial(fila):
    g = hist_por_jugador.get(fila["player_id"])
    if g is None:
        return pd.Series([0, 0, 0, 0])
    previas = g[g["fecha_lesion"] < fila["fecha_lesion"]]
    ultimo_anio = previas[previas["fecha_lesion"] >= fila["fecha_lesion"] - pd.Timedelta(days=365)]
    mismo_tipo = previas[previas["tipo_lesion"] == fila["tipo_lesion"]]
    return pd.Series([
        len(previas),                      # cuantas lesiones tuvo antes
        previas["days_missed"].sum(),      # dias de baja acumulados en toda su carrera
        ultimo_anio["days_missed"].sum(),  # dias de baja en los ultimos 12 meses
        len(mismo_tipo),                   # cuantas veces tuvo antes este mismo tipo de lesion
    ])


print("Calculando historial de lesiones (puede tardar 1-2 minutos)...")
d1[["lesiones_previas", "dias_baja_previos", "dias_baja_ultimo_anio", "lesiones_previas_mismo_tipo"]] = (
    d1.apply(historial, axis=1).astype(int)
)

# ===========================================================================
# 8. Partidos jugados en la temporada anterior (carga de juego)
# ===========================================================================
rend = pd.read_csv(
    D2 / "player_performances" / "player_performances.csv",
    usecols=["player_id", "season_name", "nb_on_pitch"],
)
rend = rend[rend["player_id"].isin(d1["player_id"])]
partidos = rend.groupby(["player_id", "season_name"])["nb_on_pitch"].sum().reset_index()


def temporada_anterior(t):
    """'21/22' -> '20/21'"""
    a, b = t.split("/")
    return f"{int(a) - 1:02d}/{int(b) - 1:02d}"


d1["temporada_anterior"] = d1["Season"].map(temporada_anterior)
partidos.columns = ["player_id", "temporada_anterior", "partidos_temporada_anterior"]
d1 = d1.merge(partidos, on=["player_id", "temporada_anterior"], how="left")
d1["partidos_temporada_anterior"] = d1["partidos_temporada_anterior"].fillna(0).astype(int)

# ===========================================================================
# 9. Guardar el dataset final
# ===========================================================================
columnas = [
    # identificadores (NO se usan para entrenar, solo para validar por jugador y por temporada)
    "player_id", "player_name", "club", "Season", "fecha_lesion", "lesion_texto",
    # variables de entrada del modelo
    "edad", "posicion", "liga", "altura_cm", "pie_habil",
    "tipo_lesion", "zona_cuerpo", "mes_lesion",
    "lesiones_previas", "dias_baja_previos", "dias_baja_ultimo_anio",
    "lesiones_previas_mismo_tipo", "partidos_temporada_anterior",
    # variable objetivo
    "dias",
]
final = d1[columnas].rename(columns={"Season": "temporada", "player_name": "jugador"})
final.to_csv(SALIDA / "lesiones_unificadas.csv", index=False, encoding="utf-8-sig")

anotar(f"\nDATASET FINAL: {len(final)} lesiones de {final['player_id'].nunique()} jugadores")
anotar(f"Mediana de dias de baja: {final['dias'].median():.0f}")
anotar(f"Valores faltantes de altura: {final['altura_cm'].isna().sum()} | pie habil: {final['pie_habil'].isna().sum()}")
anotar("\nLesiones por tipo:\n" + final["tipo_lesion"].value_counts().to_string())

(SALIDA / "reporte_preprocesamiento.txt").write_text("\n".join(reporte), encoding="utf-8")
print("\nListo -> datos/lesiones_unificadas.csv")
