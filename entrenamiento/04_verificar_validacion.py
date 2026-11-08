# -*- coding: utf-8 -*-
"""
04_verificar_validacion.py
--------------------------
PASO 4 (soporte tecnico): revisa que la validacion del modelo este bien hecha
y mide que tan bien funciona el rango que muestra la aplicacion.

No cambia el modelo ni la aplicacion: solo lee los datos y escribe un reporte.

Que revisa:
  1. Separacion por jugador: que ningun jugador quede a la vez en entrenamiento y prueba.
  2. Registros repetidos: duplicados que queden y cuantas lesiones tiene cada jugador.
  3. Historial sin "ver el futuro": que las lesiones previas empiecen antes de la actual.
  4. Metricas fuera de muestra con los hiperparametros finales (deben coincidir con el paso 2).
  5. Validacion cruzada ANIDADA: repite la busqueda de hiperparametros dentro de cada
     particion, para saber si elegirlos con los mismos datos de prueba infla el resultado.
  6. Cobertura real del rango (percentil 25 a 75): en total, por tipo de lesion,
     por tamano de la estimacion y en la validacion temporal.

Entrada:  datos/lesiones_unificadas.csv (sale del paso 1)
          modelo/info_modelo.json       (sale del paso 2)
Salida:   resultados/verificacion_validacion.txt
          resultados/cobertura_por_tipo.csv

Como correrlo (despues de los pasos 1 y 2):
  python 04_verificar_validacion.py
  python 04_verificar_validacion.py --sin-anidada   (mas rapido, se salta el punto 5)
"""

import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer, TransformedTargetRegressor
from sklearn.impute import SimpleImputer
from sklearn.metrics import mean_absolute_error, mean_squared_error, median_absolute_error, r2_score
from sklearn.model_selection import GroupKFold, RandomizedSearchCV
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from xgboost import XGBRegressor

CARPETA = Path(__file__).resolve().parent
SEMILLA = 42
datos = pd.read_csv(CARPETA / "datos" / "lesiones_unificadas.csv")
info = json.loads((CARPETA / "modelo" / "info_modelo.json").read_text(encoding="utf-8"))

VAR_CATEGORICAS = info["variables_categoricas"]
VAR_NUMERICAS = info["variables_numericas"]
VARIABLES = VAR_CATEGORICAS + VAR_NUMERICAS
X, y, jugadores = datos[VARIABLES], datos["dias"], datos["player_id"]

reporte = []


def anotar(texto=""):
    print(texto)
    reporte.append(texto)


def crear_modelo(**hiperparametros):
    """El mismo modelo del paso 2: One-Hot + mediana + XGBoost con log(1 + dias)."""
    prep = ColumnTransformer([
        ("cat", OneHotEncoder(handle_unknown="ignore"), VAR_CATEGORICAS),
        ("num", SimpleImputer(strategy="median"), VAR_NUMERICAS),
    ])
    xgb = XGBRegressor(random_state=SEMILLA, n_jobs=-1, tree_method="hist", **hiperparametros)
    return TransformedTargetRegressor(regressor=Pipeline([("prep", prep), ("modelo", xgb)]),
                                      func=np.log1p, inverse_func=np.expm1)


def metricas(real, pred):
    return (f"MAE {mean_absolute_error(real, pred):.2f} | RMSE {np.sqrt(mean_squared_error(real, pred)):.2f} | "
            f"MedAE {median_absolute_error(real, pred):.2f} | R2 {r2_score(real, pred):.3f}")


def factores_rango(real, pred):
    """Igual que el paso 2: percentil 25 y 75 de log(1+real) - log(1+predicho)."""
    razon = np.log1p(real) - np.log1p(pred)
    return float(np.exp(np.percentile(razon, 25))), float(np.exp(np.percentile(razon, 75)))


def dentro_del_rango(real, pred, bajo, alto):
    """True si el valor real cae dentro del rango que mostraria la aplicacion (redondeado)."""
    return (real >= np.round(pred * bajo)) & (real <= np.round(pred * alto))


anotar("VERIFICACION DE LA VALIDACION - KineTrack AI")
anotar(f"Datos: {len(datos)} lesiones de {jugadores.nunique()} jugadores")
anotar(f"Hiperparametros finales (paso 2): {info['hiperparametros']}")

# ---------------------------------------------------------------------------
# 1. Separacion por jugador
# ---------------------------------------------------------------------------
anotar("\n1. SEPARACION POR JUGADOR (GroupKFold, 5 particiones)")
grupos = GroupKFold(n_splits=5)
particiones = list(grupos.split(X, y, groups=jugadores))
for i, (ent, prueba) in enumerate(particiones, start=1):
    comunes = set(jugadores.iloc[ent]) & set(jugadores.iloc[prueba])
    anotar(f"  Particion {i}: {len(ent)} entrenamiento / {len(prueba)} prueba | "
           f"jugadores en ambos lados: {len(comunes)}")

entreno_t = datos["temporada"].isin(["20/21", "21/22", "22/23"])
prueba_t = datos["temporada"].isin(["23/24", "24/25"])
comunes_t = set(jugadores[entreno_t]) & set(jugadores[prueba_t])
anotar(f"  Validacion temporal: {entreno_t.sum()} entrenamiento / {prueba_t.sum()} prueba | "
       f"jugadores en ambos lados: {len(comunes_t)} (esperado: aqui se separa por fecha, no por jugador)")

# ---------------------------------------------------------------------------
# 2. Registros repetidos
# ---------------------------------------------------------------------------
anotar("\n2. REGISTROS REPETIDOS")
dup = datos.duplicated(["player_id", "fecha_lesion", "lesion_texto"]).sum()
anotar(f"  Duplicados (mismo jugador, fecha y lesion) que quedan: {dup}")
por_jugador = datos.groupby("player_id").size()
anotar(f"  Lesiones por jugador: mediana {por_jugador.median():.0f}, maximo {por_jugador.max()}, "
       f"jugadores con 2 o mas lesiones: {(por_jugador >= 2).sum()} de {len(por_jugador)} "
       f"({(por_jugador >= 2).mean():.1%})")
anotar("  -> Por eso se valida agrupando por jugador: sus lesiones nunca se reparten entre entrenamiento y prueba.")

# ---------------------------------------------------------------------------
# 3. Historial sin ver el futuro
# ---------------------------------------------------------------------------
anotar("\n3. HISTORIAL DE LESIONES")
datos["fecha_dt"] = pd.to_datetime(datos["fecha_lesion"])
orden = datos.sort_values(["player_id", "fecha_dt"])
primera = orden.groupby("player_id").head(1)
anotar(f"  Primeras lesiones de cada jugador (en este dataset) con historial > 0: "
       f"{(primera['lesiones_previas'] > 0).sum()} de {len(primera)} "
       f"(normal: el historial tambien usa lesiones anteriores registradas en Transfermarkt)")
# Una lesion anterior que todavia no habia terminado cuando empezo la actual
fin_anterior = orden.groupby("player_id")["fecha_dt"].shift(1) + pd.to_timedelta(
    orden.groupby("player_id")["dias"].shift(1), unit="D")
solapadas = (fin_anterior > orden["fecha_dt"]).sum()
anotar(f"  Lesiones que empiezan antes de que termine la anterior del mismo jugador: {solapadas} "
       f"({solapadas / len(datos):.1%}). En esos casos los dias de la lesion anterior aun no se conocian "
       f"completos; es una fuga pequena que se reporta como limitacion.")

# ---------------------------------------------------------------------------
# 4. Metricas fuera de muestra con los hiperparametros finales
# ---------------------------------------------------------------------------
anotar("\n4. METRICAS FUERA DE MUESTRA (hiperparametros finales, mismas particiones)")
pred = np.zeros(len(y))
for ent, prueba in particiones:
    m = crear_modelo(**info["hiperparametros"]).fit(X.iloc[ent], y.iloc[ent])
    pred[prueba] = m.predict(X.iloc[prueba])
anotar(f"  Por jugador: {metricas(y, pred)}")
m_t = crear_modelo(**info["hiperparametros"]).fit(X[entreno_t], y[entreno_t])
pred_t = m_t.predict(X[prueba_t])
anotar(f"  Temporal:    {metricas(y[prueba_t], pred_t)}")

# ---------------------------------------------------------------------------
# 5. Validacion cruzada anidada
# ---------------------------------------------------------------------------
if "--sin-anidada" not in sys.argv:
    anotar("\n5. VALIDACION CRUZADA ANIDADA (busqueda de hiperparametros dentro de cada particion)")
    espacio = {
        "regressor__modelo__n_estimators": [300, 500, 800],
        "regressor__modelo__learning_rate": [0.02, 0.03, 0.05],
        "regressor__modelo__max_depth": [3, 4, 5, 6],
        "regressor__modelo__min_child_weight": [1, 5, 10],
        "regressor__modelo__subsample": [0.7, 0.8, 1.0],
        "regressor__modelo__colsample_bytree": [0.6, 0.8, 1.0],
    }
    pred_anidada = np.zeros(len(y))
    for i, (ent, prueba) in enumerate(particiones, start=1):
        busqueda = RandomizedSearchCV(crear_modelo(), espacio, n_iter=10, cv=GroupKFold(n_splits=5),
                                      scoring="neg_mean_absolute_error", random_state=SEMILLA, n_jobs=1)
        busqueda.fit(X.iloc[ent], y.iloc[ent], groups=jugadores.iloc[ent])
        pred_anidada[prueba] = busqueda.predict(X.iloc[prueba])
        anotar(f"  Particion {i}: MAE {mean_absolute_error(y.iloc[prueba], pred_anidada[prueba]):.2f}")
    anotar(f"  Anidada total: {metricas(y, pred_anidada)}")

# ---------------------------------------------------------------------------
# 6. Cobertura del rango
# ---------------------------------------------------------------------------
anotar("\n6. COBERTURA REAL DEL RANGO (cuantas veces el valor real cae dentro del rango)")
bajo, alto = info["factor_rango"]
anotar(f"  Rango de la aplicacion: estimacion x {bajo} hasta estimacion x {alto} (objetivo: 50%)")
dentro = dentro_del_rango(y.values, pred, bajo, alto)
anotar(f"  Total (por jugador): {dentro.mean():.1%}")
anotar(f"  Valor real por debajo del rango: {(y.values < np.round(pred * bajo)).mean():.1%} | "
       f"por encima: {(y.values > np.round(pred * alto)).mean():.1%}")

# Temporal honesto: el rango se calcula SOLO con las temporadas de entrenamiento
pred_ent_t = np.zeros(entreno_t.sum())
Xe, ye, ge = X[entreno_t], y[entreno_t], jugadores[entreno_t]
for ent, prueba in GroupKFold(n_splits=5).split(Xe, ye, groups=ge):
    m = crear_modelo(**info["hiperparametros"]).fit(Xe.iloc[ent], ye.iloc[ent])
    pred_ent_t[prueba] = m.predict(Xe.iloc[prueba])
b_t, a_t = factores_rango(ye.values, pred_ent_t)
anotar(f"  Temporal (rango calculado con 20/21-22/23, probado en 23/24-24/25): "
       f"{dentro_del_rango(y[prueba_t].values, pred_t, b_t, a_t).mean():.1%}")

datos["pred"], datos["dentro"] = pred, dentro
tamanos = pd.cut(datos["pred"], [0, 14, 28, 60, 1000], labels=["hasta 14 dias", "15 a 28", "29 a 60", "mas de 60"])
anotar("  Por tamano de la estimacion:")
for nombre, grupo in datos.groupby(tamanos, observed=True):
    anotar(f"    {nombre:<15} {grupo['dentro'].mean():.1%}  ({len(grupo)} lesiones)")

por_tipo = (datos.groupby("tipo_lesion")
            .agg(lesiones=("dias", "size"), mediana_real=("dias", "median"),
                 mediana_estimada=("pred", "median"), cobertura=("dentro", "mean"))
            .sort_values("lesiones", ascending=False))
por_tipo["cobertura"] = (por_tipo["cobertura"] * 100).round(1)
por_tipo["mediana_estimada"] = por_tipo["mediana_estimada"].round(1)
anotar(f"  Por tipo de lesion: entre {por_tipo['cobertura'].min():.1f}% y {por_tipo['cobertura'].max():.1f}% "
       f"(ver resultados/cobertura_por_tipo.csv)")
anotar(por_tipo.to_string())

(CARPETA / "resultados").mkdir(exist_ok=True)
por_tipo.to_csv(CARPETA / "resultados" / "cobertura_por_tipo.csv", encoding="utf-8-sig")
(CARPETA / "resultados" / "verificacion_validacion.txt").write_text("\n".join(reporte), encoding="utf-8")
print("\nListo -> resultados/verificacion_validacion.txt")
