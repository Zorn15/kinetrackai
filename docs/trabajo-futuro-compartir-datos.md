# Trabajo futuro: compartir casos y hacer seguimiento

Idea propuesta por el equipo el 18 de octubre de 2026. **No está implementada.** Queda registrada para una siguiente fase del proyecto y sirve como base para la sección de *recomendaciones y trabajo futuro* del documento de grado.

## Problema que resuelve

El modelo aprendió solo de futbolistas profesionales hombres de las cinco grandes ligas europeas. Esa es la limitación n.º 1 declarada en la vista «Modelo & Info». Hoy no hay forma de saber qué tan bien acierta con jugadores colombianos, amateurs, juveniles o mujeres.

Si los fisioterapeutas que usan la herramienta comparten sus casos y luego reportan cuántos días tardó realmente la recuperación, se puede:

1. **Medir el error real del modelo en Colombia**, comparando lo estimado con lo real.
2. **Ampliar el dataset** con casos locales y reentrenar el modelo.
3. **Detectar recuperaciones más rápidas o más lentas** de lo esperado mediante el seguimiento semanal.

## Flujo propuesto

1. **Consentimiento.** Después del resultado aparece una tarjeta: «¿Quieres compartir este caso, de forma anónima, para mejorar el modelo?», con una casilla **sin marcar por defecto**, la finalidad explicada y un enlace a la política de tratamiento de datos.
2. **Código del caso.** Si acepta, se guarda el caso y se muestra un código aleatorio, como `KT-7F3K-92QD`, que también sale en el informe PDF. No hay cuentas ni contraseñas: el código es la llave del caso.
3. **Seguimiento.** Con el código, el fisioterapeuta actualiza el estado cada semana: en rehabilitación, volvió a entrenar, volvió a competir, recaída o cirugía. Cuando registra la **fecha real de retorno**, el caso se cierra con los días reales.
4. **Panel de resultados.** Muestra el número de casos compartidos y cerrados, y el error real (MAE) frente al de la validación del modelo (±22,6 días).
5. **Reentrenamiento.** Los casos cerrados se exportan a CSV y se suman al dataset. El modelo se reentrena de forma manual y controlada, no automática.

## Qué se guarda y qué no

| Se guarda (solo con autorización) | No se guarda nunca |
|---|---|
| Las 12 variables del modelo (edad, posición, lesión, historial…) | Nombre, apellido o documento |
| País del club | Nombre del club (en ligas pequeñas permitiría identificar al jugador) |
| Estimación, rango y versión del modelo | Notas de texto libre (podrían contener datos personales) |
| Estados del seguimiento y fecha real de retorno | Dirección IP o datos del dispositivo |

## Aspectos legales (Colombia)

- Los datos de salud son **datos sensibles** según la **Ley 1581 de 2012**, artículo 5. Su tratamiento exige **autorización previa, expresa e informada**, que debe ser opcional (artículo 6). El Decreto 1377 de 2013 la reglamenta.
- Hay que publicar una **política de tratamiento de datos** que explique la finalidad, los derechos del titular (conocer, actualizar, rectificar y suprimir) y un canal de contacto.
- El requisito **RNF-07** cambiaría de «no se almacenan datos» a «solo se almacenan datos anónimos de la lesión, con autorización expresa».

## Propuesta técnica

- **Base de datos:** PostgreSQL alojada (Neon o Supabase tienen plan gratuito), porque Vercel no conserva archivos entre ejecuciones. La conexión iría en una variable de entorno `DATABASE_URL`, con SQLite como respaldo para desarrollo local.
- **Tablas:**
  - `casos`: id, hash del código, fecha, variables del modelo (JSON), país, días estimados, rango, versión del modelo, versión del consentimiento, estado.
  - `seguimientos`: id, caso, fecha, estado, días desde la lesión, fecha real de retorno.
- **API (Flask):** `POST /api/casos` (compartir), `GET /api/casos/<codigo>` (consultar), `POST /api/casos/<codigo>/seguimiento` (actualizar) y `GET /api/estadisticas` (panel).
- **Seguridad:** códigos aleatorios largos, guardados como *hash*, con límite de intentos por minuto para evitar que se adivinen.

## Cambios en el documento de grado

- Nuevos requisitos funcionales para compartir un caso, hacer seguimiento y ver el panel de resultados.
- Modificar el RNF-07 y agregar la política de datos.
- Nuevos casos de uso en el diagrama.
- En CRISP-DM, cerrar el ciclo con la fase de **monitoreo del modelo en producción**.
