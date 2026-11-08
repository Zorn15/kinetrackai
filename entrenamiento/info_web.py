# -*- coding: utf-8 -*-
"""
info_web.py
-----------
Datos extra que muestra la web (pestana "Modelo & Info" y ayudas del formulario).
Lo llama 02_entrenar_modelos.py al final del entrenamiento.
"""

from categorias import GRUPOS_TIPO


def datos_para_web(datos, tabla_comparacion):
    """
    datos: el DataFrame de lesiones_unificadas.csv
    tabla_comparacion: la tabla de resultados del paso 2
    """
    # 1) Zona mas comun para cada tipo de lesion (la web la preselecciona al elegir el tipo)
    zona_por_tipo = {}
    for tipo, grupo in datos.groupby("tipo_lesion"):
        zonas = grupo["zona_cuerpo"].value_counts(normalize=True)
        zonas_conocidas = zonas.drop("No especificada", errors="ignore")
        # si en la mayoria de casos no se sabe la zona, se deja "No especificada"
        if zonas.get("No especificada", 0) > 0.5 or len(zonas_conocidas) == 0:
            zona_por_tipo[tipo] = "No especificada"
        else:
            zona_por_tipo[tipo] = zonas_conocidas.index[0]

    # 2) Cuantas lesiones hay de cada grupo grande (para la barra de distribucion)
    total = len(datos)
    distribucion = []
    for grupo, tipos in GRUPOS_TIPO.items():
        n = int(datos["tipo_lesion"].isin(tipos).sum())
        distribucion.append({"grupo": grupo, "n": n, "porcentaje": round(100 * n / total, 1)})

    # 3) Mediana de dias por tipo de lesion (referencia que se muestra en el formulario)
    mediana_por_tipo = datos.groupby("tipo_lesion")["dias"].median().round().astype(int).to_dict()

    # 4) Grupos de tipos (para ordenar el desplegable de la web)
    grupos = {g: [t for t in tipos if t in zona_por_tipo] for g, tipos in GRUPOS_TIPO.items()}

    # 5) Tabla de comparacion de modelos (ambas validaciones)
    comparacion = tabla_comparacion.round(3).to_dict(orient="records")

    return {
        "zona_por_tipo": zona_por_tipo,
        "distribucion_tipos": distribucion,
        "mediana_dias_por_tipo": mediana_por_tipo,
        "grupos_tipo": grupos,
        "comparacion_modelos": comparacion,
        "temporadas": sorted(datos["temporada"].unique().tolist()),
    }
