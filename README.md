# KineTrack AI

Aplicación web que estima el tiempo de recuperación de lesiones en futbolistas usando machine learning (XGBoost).

Proyecto de grado – Ingeniería de Sistemas, Fundación Universitaria Los Libertadores.

## Estructura

- `server.py`: API en Flask (`/api/info` y `/api/estimar`).
- `prediccion.py`: carga el modelo y calcula la estimación.
- `modelo/`: modelo entrenado (preprocesamiento + XGBoost en formato JSON) e información del modelo.
- `public/`: página web (HTML, CSS, JS y fuentes).

## Correr en local

```bash
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
.venv\Scripts\python server.py
```

Luego abrir http://localhost:5000.

## Interfaz

- **Botón «Ajustes»** (único botón del encabezado): reúne idioma, tema y accesibilidad para no saturar la interfaz.
- **Modo día / modo noche**: en Ajustes se elige Sistema, Día o Noche. Por defecto sigue al sistema operativo y la elección se recuerda en el navegador. Paleta «clínico sobrio»: un solo acento teal, grises pizarra y ámbar solo para avisos.
- **Idioma español / inglés**: en Ajustes. Los textos están en `public/i18n.js` (el español se toma de `index.html`). Al modelo siempre se le envían los valores en español; solo cambia lo que se muestra.
- **Posición en la cancha**: el jugador se ubica tocando su posición sobre una cancha; un marcador animado se desliza hasta ella.
- **País y equipo**: primero se elige el país (ligas europeas del dataset, Latinoamérica y Portugal) y luego el club. Es solo informativo: el modelo no lo usa. La lista está en `public/equipos.js`.
- **Accesibilidad** (en Ajustes): tamaño de letra del 87,5 % al 200 %, súper contraste (colores de máximo contraste y bordes marcados), reducir animaciones y restablecer. Se recuerda en el navegador; si el sistema pide más contraste o menos movimiento, se activa solo.
- **Responsive**: probado en 320 px (celulares pequeños), 390 px (celulares), 768 px (tablets) y 1366 px o más (escritorio). En celular la navegación va abajo; desde tablet pasa al encabezado.
- **Accesibilidad (Resolución MinTIC 1519 de 2020)**: cumple los 29 criterios del Anexo 1 que aplican (los otros 3 son de video y audio, que la app no tiene), basados en WCAG 2.1 AA: texto base de 16 px ampliable al 200 %, contraste AA en todos los modos, mapa del sitio en el pie de página, títulos de pestaña por vista, manejo completo con teclado y errores claros. La matriz criterio por criterio está en [docs/accesibilidad-resolucion-1519.md](docs/accesibilidad-resolucion-1519.md).
- **Animaciones**: transición entre vistas y cambio de tema con View Transitions, tarjetas que aparecen al hacer scroll y micro‑animaciones en las selecciones. Se desactivan si el sistema tiene activado "reducir movimiento".

## Despliegue

Se publica en Vercel importando este repositorio. Vercel detecta la app Flask en `server.py` y sirve la carpeta `public/`.

> La estimación es una herramienta de apoyo y no reemplaza el criterio del profesional de la salud.
