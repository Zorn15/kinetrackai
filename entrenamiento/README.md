# Entrenamiento y verificación del modelo

Scripts para reproducir el dataset unificado, las métricas y la verificación de la validación de KineTrack AI.

1. Descargar los datasets de Kaggle en esta carpeta:
   - European Football Injuries (2020-2025) → `dataset 1/`
   - Football Datasets (Transfermarkt) → `dataset 2/`
2. Instalar las librerías: `pip install -r requirements_entrenamiento.txt`
3. Ejecutar en orden desde esta carpeta:
   - `python 01_unir_y_preprocesar.py` → `datos/lesiones_unificadas.csv`
   - `python 02_entrenar_modelos.py` → `resultados/` y `modelo/`
   - `python 04_verificar_validacion.py` → `resultados/verificacion_validacion.txt`
     (con `--sin-anidada` se salta la validación anidada, que es la parte más lenta)

Los datasets, los datos procesados y los resultados no se suben al repositorio.
