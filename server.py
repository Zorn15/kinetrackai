# -*- coding: utf-8 -*-
"""
servidor.py
-----------
Servidor web (Flask) de KineTrack AI.
  - Muestra la pagina que esta en la carpeta  web/
  - Recibe los datos del formulario y devuelve la estimacion del modelo

Como correrlo:
  py servidor.py
y abrir en el navegador:  http://localhost:5000
"""

from pathlib import Path

from flask import Flask, jsonify, redirect, request, send_from_directory

from prediccion import INFO, VARIABLES, estimar_recuperacion

CARPETA_WEB = Path(__file__).resolve().parent / "public"
app = Flask(__name__, static_folder=None)
app.json.sort_keys = False  # mantener el orden original de los datos


@app.get("/")
def inicio():
    """Pagina principal."""
    if (CARPETA_WEB / "index.html").exists():
        return send_from_directory(CARPETA_WEB, "index.html")
    return redirect("/index.html")  # en Vercel la pagina la sirve la carpeta public/


@app.get("/api/info")
def info():
    """Informacion del modelo: opciones de los desplegables, metricas, distribucion, etc."""
    return jsonify(INFO)


def validar(datos):
    """RF-04: revisa que esten todos los campos y que los valores tengan sentido.
    Devuelve una lista de errores (vacia si todo esta bien)."""
    errores = []

    faltan = [v for v in VARIABLES if datos.get(v) in (None, "")]
    if faltan:
        return [f"Falta el campo: {v}" for v in faltan]

    # Las opciones de texto deben ser de las que conoce el modelo
    for v in INFO["variables_categoricas"]:
        if datos[v] not in INFO["opciones"][v]:
            errores.append(f"Valor no válido para {v}: {datos[v]}")

    # Los numeros deben ser numeros y estar en rangos razonables
    limites = {
        "edad": (15, 45), "altura_cm": (150, 215), "mes_lesion": (1, 12),
        "lesiones_previas": (0, 60), "dias_baja_previos": (0, 4000),
        "dias_baja_ultimo_anio": (0, 365), "lesiones_previas_mismo_tipo": (0, 60),
        "partidos_temporada_anterior": (0, 80),
    }
    for v, (minimo, maximo) in limites.items():
        try:
            datos[v] = float(datos[v])
        except (TypeError, ValueError):
            errores.append(f"{v} debe ser un número")
            continue
        if not minimo <= datos[v] <= maximo:
            errores.append(f"{v} debe estar entre {minimo} y {maximo}")

    if errores:
        return errores

    # Coherencia entre campos del historial
    if datos["lesiones_previas_mismo_tipo"] > datos["lesiones_previas"]:
        errores.append("Las lesiones del mismo tipo no pueden ser más que el total de lesiones previas.")
    if datos["dias_baja_ultimo_anio"] > datos["dias_baja_previos"]:
        errores.append("Los días de baja del último año no pueden superar los días acumulados.")
    if datos["lesiones_previas"] == 0 and datos["dias_baja_previos"] > 0:
        errores.append("Si no hay lesiones previas, los días de baja acumulados deben ser 0.")
    return errores


@app.post("/api/estimar")
def estimar():
    """RF-05: recibe el formulario y devuelve la estimacion.
    RNF-07: no se guarda nada; los datos solo se usan para calcular y se descartan."""
    datos = request.get_json(silent=True) or {}
    datos = {v: datos.get(v) for v in VARIABLES}  # solo las variables del modelo
    errores = validar(datos)
    if errores:
        return jsonify({"ok": False, "errores": errores}), 400

    resultado = estimar_recuperacion(datos)
    return jsonify({
        "ok": True,
        "dias": resultado["dias"],
        "rango": resultado["rango"],
        "base": resultado["base"],
        "influyentes": [{"variable": n, "efecto": e} for n, e in resultado["influyentes"]],
        "modelo": INFO["modelo"],
    })


if __name__ == "__main__":
    print("\n  KineTrack AI listo ->  http://localhost:5000\n")
    app.run(host="127.0.0.1", port=5000, debug=False)
