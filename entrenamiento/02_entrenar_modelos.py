# -*- coding: utf-8 -*-
"""
02_entrenar_modelos.py
----------------------
PASO 2: entrenar y comparar los modelos, y guardar el mejor para la web.

Modelos que se comparan:
  1. Linea base  -> siempre predice la mediana de dias (sirve para saber si los modelos aportan algo)
  2. Random Forest
  3. XGBoost

Validaciones:
  A) Validacion cruzada agrupada por jugador (GroupKFold, 5 partes):
     un mismo jugador NUNCA queda al mismo tiempo en entrenamiento y en prueba.
  B) Validacion temporal: se entrena con 20/21, 21/22 y 22/23 y se prueba con 23/24 y 24/25
     (simula usar el modelo con lesiones "del futuro").

Metricas: MAE, RMSE, MedAE (error absoluto mediano) y R2. Todas en DIAS.

Entrada:  datos/lesiones_unificadas.csv  (sale del paso 1)
Salidas:
  resultados/comparacion_modelos.csv
  resultados/grafica_comparacion_mae.png
  resultados/grafica_real_vs_predicho.png
  resultados/grafica_importancia_variables.png
  modelo/modelo_recuperacion.joblib   -> el modelo que va a usar la web
  modelo/info_modelo.json            -> opciones del formulario, metricas, rango de error

Como correrlo:
  python 02_entrenar_modelos.py
"""

import json
from pathlib import Path

import joblib
import matplotlib
matplotlib.use("Agg")  # para guardar graficas sin abrir ventanas
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer, TransformedTargetRegressor
from sklearn.dummy import DummyRegressor
from sklearn.ensemble import RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.metrics import mean_absolute_error, mean_squared_error, median_absolute_error, r2_score
from sklearn.model_selection import GroupKFold, RandomizedSearchCV, cross_val_predict
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from xgboost import XGBRegressor

from info_web import datos_para_web

CARPETA = Path(__file__).resolve().parent
RESULTADOS = CARPETA / "resultados"
MODELO = CARPETA / "modelo"
RESULTADOS.mkdir(exist_ok=True)
MODELO.mkdir(exist_ok=True)
SEMILLA = 42  # para que los resultados se puedan repetir

# ===========================================================================
# 1. Cargar datos y definir variables
# ===========================================================================
datos = pd.read_csv(CARPETA / "datos" / "lesiones_unificadas.csv")

# Nota: la liga NO se usa como variable, para que el modelo sirva sin importar el equipo o la liga
VAR_CATEGORICAS = ["posicion", "pie_habil", "tipo_lesion", "zona_cuerpo"]
VAR_NUMERICAS = [
    "edad", "altura_cm", "mes_lesion",
    "lesiones_previas", "dias_baja_previos", "dias_baja_ultimo_anio",
    "lesiones_previas_mismo_tipo", "partidos_temporada_anterior",
]
VARIABLES = VAR_CATEGORICAS + VAR_NUMERICAS

X = datos[VARIABLES]
y = datos["dias"]
jugadores = datos["player_id"]  # para agrupar por jugador en la validacion

print(f"Datos: {len(datos)} lesiones, {jugadores.nunique()} jugadores, {len(VARIABLES)} variables")


# ===========================================================================
# 2. Preprocesamiento dentro del modelo
#    - Categoricas -> One-Hot (una columna 0/1 por cada opcion)
#    - Numericas   -> se rellenan los faltantes con la mediana
#    - La variable objetivo se transforma con log(1 + dias) porque hay
#      pocas lesiones muy largas que "jalan" el modelo. Al predecir, se
#      devuelve automaticamente a dias.
# ===========================================================================
def crear_modelo(regresor):
    preprocesador = ColumnTransformer([
        ("cat", OneHotEncoder(handle_unknown="ignore"), VAR_CATEGORICAS),
        ("num", SimpleImputer(strategy="median"), VAR_NUMERICAS),
    ])
    pipeline = Pipeline([("prep", preprocesador), ("modelo", regresor)])
    return TransformedTargetRegressor(regressor=pipeline, func=np.log1p, inverse_func=np.expm1)


modelos = {
    "Línea base (mediana)": crear_modelo(DummyRegressor(strategy="median")),
    "Random Forest": crear_modelo(RandomForestRegressor(random_state=SEMILLA, n_jobs=-1)),
    "XGBoost": crear_modelo(XGBRegressor(random_state=SEMILLA, n_jobs=-1, tree_method="hist")),
}

# ===========================================================================
# 3. Ajuste de hiperparametros (busqueda aleatoria con validacion por jugador)
# ===========================================================================
grupos_cv = GroupKFold(n_splits=5)

busquedas = {
    "Random Forest": {
        "regressor__modelo__n_estimators": [200, 400],
        "regressor__modelo__max_depth": [None, 12, 20],
        "regressor__modelo__min_samples_leaf": [3, 5, 10, 20],
        "regressor__modelo__max_features": [0.3, 0.5, 0.8],
    },
    "XGBoost": {
        "regressor__modelo__n_estimators": [300, 500, 800],
        "regressor__modelo__learning_rate": [0.02, 0.03, 0.05],
        "regressor__modelo__max_depth": [3, 4, 5, 6],
        "regressor__modelo__min_child_weight": [1, 5, 10],
        "regressor__modelo__subsample": [0.7, 0.8, 1.0],
        "regressor__modelo__colsample_bytree": [0.6, 0.8, 1.0],
    },
}

mejores_parametros = {}
for nombre, parametros in busquedas.items():
    print(f"\nBuscando los mejores hiperparametros de {nombre} (tarda unos minutos)...")
    busqueda = RandomizedSearchCV(
        modelos[nombre], parametros, n_iter=10, cv=grupos_cv,
        scoring="neg_mean_absolute_error", random_state=SEMILLA, n_jobs=1,
    )
    busqueda.fit(X, y, groups=jugadores)
    modelos[nombre] = busqueda.best_estimator_
    mejores_parametros[nombre] = {k.split("__")[-1]: v for k, v in busqueda.best_params_.items()}
    print("  Mejores:", mejores_parametros[nombre], f"| MAE: {-busqueda.best_score_:.2f} dias")


# ===========================================================================
# 4. Evaluar cada modelo con las dos validaciones
# ===========================================================================
def metricas(real, predicho):
    return {
        "MAE": mean_absolute_error(real, predicho),
        "RMSE": np.sqrt(mean_squared_error(real, predicho)),
        "MedAE": median_absolute_error(real, predicho),
        "R2": r2_score(real, predicho),
    }


filas = []
predicciones_cv = {}

entreno_t = datos["temporada"].isin(["20/21", "21/22", "22/23"])
prueba_t = datos["temporada"].isin(["23/24", "24/25"])

for nombre, modelo in modelos.items():
    # A) validacion cruzada agrupada por jugador
    pred = cross_val_predict(modelo, X, y, cv=grupos_cv, groups=jugadores)
    predicciones_cv[nombre] = pred
    filas.append({"Modelo": nombre, "Validación": "Por jugador (GroupKFold)", **metricas(y, pred)})

    # B) validacion temporal
    modelo.fit(X[entreno_t], y[entreno_t])
    pred_t = modelo.predict(X[prueba_t])
    filas.append({"Modelo": nombre, "Validación": "Temporal (23/24-24/25)", **metricas(y[prueba_t], pred_t)})

tabla = pd.DataFrame(filas).round(3)
tabla.to_csv(RESULTADOS / "comparacion_modelos.csv", index=False, encoding="utf-8-sig")
print("\n================ COMPARACION DE MODELOS ================")
print(tabla.to_string(index=False))

# El mejor modelo = el de menor MAE en la validacion por jugador
cv = tabla[tabla["Validación"] == "Por jugador (GroupKFold)"]
mejor = cv[cv["Modelo"] != "Línea base (mediana)"].sort_values("MAE").iloc[0]["Modelo"]
print(f"\nMejor modelo: {mejor}")

# ===========================================================================
# 5. Graficas
# ===========================================================================
# 5.1 Comparacion del MAE
fig, ax = plt.subplots(figsize=(8, 4.5))
pivote = tabla.pivot(index="Modelo", columns="Validación", values="MAE").loc[list(modelos)]
pivote.plot(kind="bar", ax=ax, color=["#2a6f97", "#a9d6e5"], edgecolor="black", rot=0)
ax.set_ylabel("MAE (días)")
ax.set_ylim(0, pivote.values.max() * 1.35)  # espacio para la leyenda
ax.legend(title="Validación", loc="upper right")
ax.set_title("Error absoluto medio por modelo (menor es mejor)")
for barras in ax.containers:
    ax.bar_label(barras, fmt="%.1f", fontsize=8)
plt.tight_layout()
plt.savefig(RESULTADOS / "grafica_comparacion_mae.png", dpi=150)
plt.close()

# 5.2 Real vs predicho (mejor modelo)
fig, ax = plt.subplots(figsize=(6, 6))
ax.scatter(y, predicciones_cv[mejor], alpha=0.15, s=8, color="#2a6f97")
ax.plot([1, 365], [1, 365], "k--", linewidth=1)
ax.set_xscale("log"); ax.set_yscale("log")
ax.set_xlabel("Días reales"); ax.set_ylabel("Días predichos")
ax.set_title(f"Real vs predicho - {mejor}")
plt.tight_layout()
plt.savefig(RESULTADOS / "grafica_real_vs_predicho.png", dpi=150)
plt.close()

# ===========================================================================
# 6. Entrenar el mejor modelo con TODOS los datos y guardarlo
# ===========================================================================
modelo_final = modelos[mejor]
modelo_final.fit(X, y)
joblib.dump(modelo_final, MODELO / "modelo_recuperacion.joblib")

# 6.1 Importancia de variables (sumando las columnas One-Hot de cada variable)
prep = modelo_final.regressor_.named_steps["prep"]
regresor = modelo_final.regressor_.named_steps["modelo"]
nombres_cols = prep.get_feature_names_out()


def variable_original(columna):
    """'cat__posicion_Portero' -> 'posicion'   |   'num__edad' -> 'edad'"""
    nombre = columna.split("__", 1)[1]
    if nombre in VARIABLES:
        return nombre
    return next(v for v in VAR_CATEGORICAS if nombre.startswith(v + "_"))


importancia = pd.Series(regresor.feature_importances_, index=nombres_cols)
importancia.index = [variable_original(c) for c in importancia.index]
importancia = importancia.groupby(level=0).sum().sort_values()

fig, ax = plt.subplots(figsize=(7, 5))
importancia.plot(kind="barh", ax=ax, color="#2a6f97")
ax.set_xlabel("Importancia relativa")
ax.set_title(f"Importancia de variables - {mejor}")
plt.tight_layout()
plt.savefig(RESULTADOS / "grafica_importancia_variables.png", dpi=150)
plt.close()

# 6.2 Rango de error para mostrar en la web
#     Se mira, en la validacion, que tanto se aleja el valor real del predicho.
#     El rango cubre al 50% de los casos (del percentil 25 al 75).
razon = np.log1p(y) - np.log1p(predicciones_cv[mejor])
factor_bajo, factor_alto = float(np.exp(np.percentile(razon, 25))), float(np.exp(np.percentile(razon, 75)))

# 6.3 Informacion que necesita la web (opciones del formulario, etc.)
info = {
    "modelo": mejor,
    "hiperparametros": mejores_parametros.get(mejor, {}),
    "variables_categoricas": VAR_CATEGORICAS,
    "variables_numericas": VAR_NUMERICAS,
    "opciones": {v: sorted(datos[v].dropna().unique().tolist()) for v in VAR_CATEGORICAS},
    "rangos_numericos": {v: [float(datos[v].min()), float(datos[v].max())] for v in VAR_NUMERICAS},
    # valor "tipico" de cada variable (moda o mediana): se usa en la web para explicar
    # cuanto cambia la estimacion por cada variable del jugador
    "valores_tipicos": {
        **{v: datos[v].mode()[0] for v in VAR_CATEGORICAS},
        **{v: float(datos[v].median()) for v in VAR_NUMERICAS},
        # para el mes se usa el mas frecuente (la mediana daria julio, que es pretemporada y no es "tipico")
        "mes_lesion": float(datos["mes_lesion"].mode()[0]),
    },
    "metricas_validacion_por_jugador": cv[cv["Modelo"] == mejor].iloc[0][["MAE", "RMSE", "MedAE", "R2"]].to_dict(),
    "factor_rango": [round(factor_bajo, 3), round(factor_alto, 3)],
    "importancia_global": importancia.sort_values(ascending=False).round(4).to_dict(),
    "n_lesiones_entrenamiento": int(len(datos)),
    "n_jugadores_entrenamiento": int(jugadores.nunique()),
    # datos extra para la web (zona sugerida por tipo, distribucion, comparacion de modelos, etc.)
    **datos_para_web(datos, tabla),
}
(MODELO / "info_modelo.json").write_text(json.dumps(info, ensure_ascii=False, indent=2), encoding="utf-8")

print("\nListo:")
print("  modelo/modelo_recuperacion.joblib")
print("  modelo/info_modelo.json")
print("  resultados/ (tabla y graficas)")
