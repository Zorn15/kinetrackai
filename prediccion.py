# -*- coding: utf-8 -*-
"""Estimacion del tiempo de recuperacion. Prueba rapida: python prediccion.py"""

import json
from pathlib import Path

import joblib
import pandas as pd

CARPETA = Path(__file__).resolve().parent
MODELO = joblib.load(CARPETA / "modelo" / "modelo_recuperacion.joblib")
INFO = json.loads((CARPETA / "modelo" / "info_modelo.json").read_text(encoding="utf-8"))

# El ultimo paso puede venir como nombre de un .json de XGBoost; se carga aqui
_nombre, _paso = MODELO.regressor_.steps[-1]
if isinstance(_paso, str):
    from xgboost import XGBRegressor
    _xgb = XGBRegressor()
    _xgb.load_model(CARPETA / "modelo" / _paso)
    MODELO.regressor_.steps[-1] = (_nombre, _xgb)

VARIABLES = INFO["variables_categoricas"] + INFO["variables_numericas"]

NOMBRES = {
    "posicion": "Posición",
    "pie_habil": "Pie hábil",
    "tipo_lesion": "Tipo de lesión",
    "zona_cuerpo": "Zona del cuerpo",
    "edad": "Edad",
    "altura_cm": "Altura",
    "mes_lesion": "Mes de la lesión",
    "lesiones_previas": "Lesiones previas",
    "dias_baja_previos": "Días de baja acumulados",
    "dias_baja_ultimo_anio": "Días de baja en el último año",
    "lesiones_previas_mismo_tipo": "Lesiones previas del mismo tipo",
    "partidos_temporada_anterior": "Partidos jugados la temporada anterior",
}


def _predecir(datos):
    fila = pd.DataFrame([datos])[VARIABLES]
    return float(MODELO.predict(fila)[0])


def estimar_recuperacion(datos):
    """Devuelve dias, rango, influyentes y base para los datos del formulario."""
    dias = _predecir(datos)
    bajo, alto = INFO["factor_rango"]

    # Efecto de cada variable: diferencia contra su valor tipico
    efectos = []
    for variable in VARIABLES:
        tipico = INFO["valores_tipicos"][variable]
        if datos[variable] == tipico:
            continue
        datos_tipicos = dict(datos)
        datos_tipicos[variable] = tipico
        efecto = dias - _predecir(datos_tipicos)
        efectos.append((NOMBRES[variable], round(efecto, 1)))
    efectos.sort(key=lambda e: abs(e[1]), reverse=True)

    base = _predecir(INFO["valores_tipicos"])

    return {
        "dias": round(dias),
        "rango": (round(dias * bajo), round(dias * alto)),
        "influyentes": efectos[:5],
        "base": round(base),
    }


if __name__ == "__main__":
    ejemplo = {
        "posicion": "Defensa central", "pie_habil": "Derecho",
        "tipo_lesion": "Lesión de isquiotibiales", "zona_cuerpo": "Muslo",
        "edad": 27, "altura_cm": 185, "mes_lesion": 10,
        "lesiones_previas": 3, "dias_baja_previos": 60, "dias_baja_ultimo_anio": 20,
        "lesiones_previas_mismo_tipo": 1, "partidos_temporada_anterior": 30,
    }
    resultado = estimar_recuperacion(ejemplo)
    print(f"Modelo: {INFO['modelo']}")
    print(f"Recuperacion estimada: {resultado['dias']} dias "
          f"(rango probable: {resultado['rango'][0]} a {resultado['rango'][1]} dias)")
    print("Variables que mas influyeron:")
    for nombre, efecto in resultado["influyentes"]:
        signo = "+" if efecto >= 0 else ""
        print(f"  {nombre}: {signo}{efecto} dias")
