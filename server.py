# -*- coding: utf-8 -*-
"""Servidor Flask de KineTrack AI. Correr con: py server.py"""

from pathlib import Path

from flask import Flask, jsonify, redirect, request, send_from_directory

from prediccion import INFO, VARIABLES, estimar_recuperacion

CARPETA_WEB = Path(__file__).resolve().parent / "public"
app = Flask(__name__, static_folder=None)
app.json.sort_keys = False


@app.get("/")
def inicio():
    if (CARPETA_WEB / "index.html").exists():
        return send_from_directory(CARPETA_WEB, "index.html")
    # En Vercel la carpeta public/ se sirve directamente
    return redirect("/index.html")


@app.get("/<path:archivo>")
def estaticos(archivo):
    return send_from_directory(CARPETA_WEB, archivo)


@app.get("/api/info")
def info():
    return jsonify(INFO)


def validar(datos):
    """RF-04: devuelve la lista de errores, vacia si todo esta bien."""
    errores = []

    faltan = [v for v in VARIABLES if datos.get(v) in (None, "")]
    if faltan:
        return [f"Falta el campo: {v}" for v in faltan]

    for v in INFO["variables_categoricas"]:
        if datos[v] not in INFO["opciones"][v]:
            errores.append(f"Valor no válido para {v}: {datos[v]}")

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

    # Coherencia del historial
    if datos["lesiones_previas_mismo_tipo"] > datos["lesiones_previas"]:
        errores.append("Las lesiones del mismo tipo no pueden ser más que el total de lesiones previas.")
    if datos["dias_baja_ultimo_anio"] > datos["dias_baja_previos"]:
        errores.append("Los días de baja del último año no pueden superar los días acumulados.")
    if datos["lesiones_previas"] == 0 and datos["dias_baja_previos"] > 0:
        errores.append("Si no hay lesiones previas, los días de baja acumulados deben ser 0.")
    return errores


@app.post("/api/estimar")
def estimar():
    """RF-05: estimacion. RNF-07: no se guarda nada."""
    datos = request.get_json(silent=True) or {}
    datos = {v: datos.get(v) for v in VARIABLES}
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
