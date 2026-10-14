# KineTrack AI

Aplicación web que estima el tiempo de recuperación de lesiones en futbolistas usando machine learning (XGBoost).

Proyecto de grado – Ingeniería de Sistemas, Fundación Universitaria Los Libertadores.

## Estructura

- `server.py`: API en Flask (`/api/info` y `/api/estimar`).
- `prediccion.py`: carga el modelo y calcula la estimación.
- `modelo/`: modelo entrenado (preprocesamiento + XGBoost en formato JSON) e información del modelo.
- `public/`: página web (HTML, CSS, JS y fuentes).

## Despliegue

Se publica en Vercel importando este repositorio. Vercel detecta la app Flask en `server.py` y sirve la carpeta `public/`.

> La estimación es una herramienta de apoyo y no reemplaza el criterio del profesional de la salud.
