# Accesibilidad web de KineTrack AI · Resolución MinTIC 1519 de 2020

Este documento muestra cómo la interfaz de KineTrack AI cumple las **Directrices de Accesibilidad Web** del **Anexo 1 de la Resolución 1519 de 2020 del Ministerio de Tecnologías de la Información y las Comunicaciones (MinTIC)**.

- **Fuente oficial:** MinTIC, *Anexo 1. Directrices de accesibilidad web*: <https://gobiernodigital.mintic.gov.co/692/articles-160770_Directrices_Accesibilidad_web.pdf>
- **Estándar de referencia:** la resolución exige como mínimo el nivel **AA** de las pautas **WCAG 2.1** del W3C (numeral 1.3 del anexo).
- **Alcance:** la norma es obligatoria para los *sujetos obligados* (entidades públicas y quienes cumplen funciones públicas). KineTrack AI es un proyecto académico y la adopta de forma **voluntaria** como criterio de calidad. Esto incluye el requisito no funcional RNF-01 de usabilidad.
- **Fecha de verificación:** 17 de octubre de 2026.

## Resumen

| Resultado | Criterios |
|---|---|
| Cumple | 29 (CC1, CC4–CC17, CC19–CC32) |
| No aplica: la app no tiene video ni audio | 3 (CC2, CC3, CC18) |
| No cumple | 0 |

## Matriz de cumplimiento (CC1–CC32)

### 2.2.3.1 Alternativas a lo sensorial

| Criterio | Estado | Cómo se cumple en KineTrack AI |
|---|---|---|
| **CC1.** Alternativa texto para elementos no textuales | Cumple | Los íconos decorativos llevan `aria-hidden="true"` y siempre van junto a un texto. La silueta del cuerpo, el anillo de días y las barras de variables repiten su información en texto: zona elegida, número de días, «+7,1 días» y porcentajes. Los botones que solo tienen ícono (tema, accesibilidad, cerrar) tienen nombre accesible. |
| **CC2.** Complemento para videos o elementos multimedia | No aplica | La aplicación no tiene videos ni multimedia. |
| **CC3.** Guion para solo video y solo audio | No aplica | No hay contenidos de solo audio o solo video. |

### 2.2.3.2 Lo visual entregado adecuadamente

| Criterio | Estado | Cómo se cumple |
|---|---|---|
| **CC4.** Textos e imágenes ampliables y en tamaños adecuados | Cumple | El texto base es de 16 px, el equivalente en pantalla del «tamaño 12» que da de ejemplo la norma, y ningún texto visible baja de 12 px. Todos los tamaños de letra están en `rem`, así que respetan el zoom y la configuración del navegador. El **panel de accesibilidad** permite ampliar el texto del 87,5 % al **200 %**. Se verificó que a 200 % no se desborda nada ni hay desplazamiento horizontal en 390, 768 y 1280 px de ancho. |
| **CC5.** Contraste de color suficiente | Cumple | Todos los textos cumplen el contraste WCAG AA (4,5:1), verificado con axe-core en modo día, modo noche, inglés y súper contraste. El modo **súper contraste** aumenta el contraste sin usar blanco puro sobre negro puro (#F2F2F2 sobre #121212, y #111111 sobre #FAFAFA), como recomienda la norma. |
| **CC6.** Imágenes alternas al texto cuando sea posible | Cumple (opcional) | Las secciones, botones y pasos combinan texto con un ícono que representa lo mismo. La silueta anatómica ilustra la zona del cuerpo elegida. |
| **CC7.** Identificación coherente | Cumple | Las acciones iguales usan el mismo texto e ícono en todas partes. Por ejemplo, «Formulario», «Resultado ML» y «Modelo & Info» se ven igual en el menú superior, en el inferior del celular y en el mapa del sitio. |

### 2.2.3.3 Estructura para todos

| Criterio | Estado | Cómo se cumple |
|---|---|---|
| **CC8.** Todo documento y página organizado en secciones | Cumple | Regiones HTML5: `header`, `nav`, `main`, `footer`. Cada vista es una `section` con nombre (`aria-labelledby`), un `h1` y subtítulos `h2`/`h3` sin repetir. |
| **CC9.** Contenedores como tablas y listas usados correctamente | Cumple | La tabla de comparación de modelos tiene `caption` y encabezados `th scope="col"`. Las fuentes de datos, las limitaciones, el pipeline y el mapa del sitio son listas (`ul`/`ol`). No se usan tablas para maquetar. |
| **CC10.** Permitir saltar bloques que se repiten | Cumple | Enlace «Saltar al contenido» al inicio de la página. Aparece al pulsar Tab. |
| **CC11.** Lenguaje de marcado bien utilizado | Cumple | `index.html` pasa el validador **html-validate** (reglas recomendadas) sin errores. Se corrigieron las etiquetas `<label>` que contenían `<div>` y los menús sin nombre único. |
| **CC12.** Permitir encontrar las páginas por múltiples vías | Cumple | Cada vista tiene su dirección (`#formulario`, `#resultado`, `#modelo`). Se llega a ellas por el menú superior, el menú inferior del celular, el **mapa del sitio del pie de página** y los botones Atrás/Adelante del navegador. No hay buscador porque el sitio tiene solo tres vistas. |
| **CC13.** Navegación coherente | Cumple | El proceso siempre es el mismo: formulario → calcular → resultado → nueva consulta. Los menús mantienen el mismo orden en todas las vistas. |

### 2.2.3.4 Secuencia y orden revisado

| Criterio | Estado | Cómo se cumple |
|---|---|---|
| **CC14.** Orden adecuado de los contenidos | Cumple | El orden del código es el mismo orden visual: encabezado → contenido → pie. Sin estilos, el contenido se sigue entendiendo. |
| **CC15.** Advertencias bien ubicadas | Cumple | Las **instrucciones** y el **aviso de privacidad** (RNF-07) están *antes* del formulario. Los campos opcionales dicen «(opcional)» junto a su nombre. |
| **CC16.** Orden adecuado al navegar con tabulación | Cumple | El Tab recorre los campos en el orden visual. Se verificó automáticamente. |
| **CC17.** Foco visible al navegar con tabulación | Cumple | El elemento con foco tiene un contorno de 3 px (4 px en súper contraste) de color contrastante. |

### 2.2.3.5 Eventos automáticos y temporizados

| Criterio | Estado | Cómo se cumple |
|---|---|---|
| **CC18.** No utilizar audio automático | No aplica | La aplicación no reproduce sonido. |
| **CC19.** Permitir control de eventos temporizados | Cumple | El aviso de error dura 8 segundos, se **pausa** si el mouse o el foco están sobre él y tiene **botón para cerrarlo**. Los mismos errores quedan escritos de forma permanente en el «Control de integridad». |
| **CC20.** Permitir control de contenidos con movimiento y parpadeo | Cumple | El panel de accesibilidad tiene **«Reducir animaciones»**, que detiene todas las animaciones, incluido el punto que late en la silueta. También se respeta la opción «reducir movimiento» del sistema operativo. No hay parpadeos de más de 3 veces por segundo. |
| **CC21.** No generar actualización automática de páginas | Cumple | La página nunca se recarga sola. |
| **CC22.** No generar cambios automáticos al recibir el foco o entradas | Cumple | Recibir el foco no cambia nada. Cuando al elegir un tipo de lesión se sugiere la zona del cuerpo, el cambio **se avisa en texto** («Zona sugerida automáticamente…», también anunciado al lector de pantalla) y se puede cambiar. |

### 2.2.3.6 Etiquetas e instrucciones adecuadas

| Criterio | Estado | Cómo se cumple |
|---|---|---|
| **CC23.** Textos adecuados en títulos, páginas y secciones | Cumple | El título de la pestaña sigue el formato de la norma, «Página – Sitio»: *Formulario – KineTrack AI*, *Resultado ML – KineTrack AI*, *Modelo & Info – KineTrack AI*. Las secciones tienen títulos únicos y claros. |
| **CC24.** Nombres e indicaciones claras en campos de formulario | Cumple | Todos los campos tienen etiqueta asociada (`<label for>`, `aria-labelledby` o `aria-label`) y su unidad: «Edad (años)», «Estatura (cm)», «Días de baja acumulados». Por ejemplo, el campo «Fecha y momento del evento» se renombró a «Fecha de la lesión», porque solo pide la fecha. |
| **CC25.** Instrucciones expresas y claras | Cumple | Al inicio del formulario se explica qué hacer y qué campos son opcionales. Los colores nunca son la única pista: los efectos de las variables llevan signo + o −, los errores llevan ícono y texto, y lo seleccionado lleva ícono o cambio de forma. |
| **CC26.** Enlaces adecuados | Cumple | Los enlaces se entienden por sí solos: «Saltar al contenido», «Datos de la lesión», «Información y transparencia del modelo». No hay enlaces como «aquí» o «ver más». |
| **CC27.** Idioma | Cumple | Se declara `lang="es"` (o `lang="en"`). Hay un **botón para cambiar entre español e inglés** que actualiza el atributo. Los nombres en inglés dentro del texto en español, como los nombres de los datasets, están marcados con `lang="en"`. |
| **CC28.** Manejo del error | Cumple | Los errores se muestran en texto claro, dicen qué pasó y cómo corregirlo. Por ejemplo: «Las recaídas del mismo tipo no pueden ser más que el total de lesiones previas». El «Control de integridad» los anuncia al lector de pantalla (`aria-live`). Además, los rangos de los controles evitan muchos errores antes de que ocurran. |
| **CC29.** Imágenes de texto | Cumple | No hay texto dentro de imágenes. Todo el texto es texto real. |

### 2.2.3.7 Todo elemento capturable

| Criterio | Estado | Cómo se cumple |
|---|---|---|
| **CC30.** Objetos programados | Cumple | Los controles propios (botones − / +, la cancha para elegir la posición —un botón con nombre completo por posición—, pie hábil, zonas, panel de Ajustes e interruptores) se manejan con teclado, tienen nombre y anuncian su estado (`aria-pressed`, `role="switch"`). Las zonas del cuerpo pasaron de `role="radio"`, que exige navegar con flechas, a botones con `aria-pressed`. El calendario de fecha es el nativo del navegador. |
| **CC31.** Desde una letra hasta un elemento complejo utilizable | Cumple | Codificación UTF-8 declarada (`<meta charset="utf-8">`). No hay objetos de redes sociales ni elementos externos sin accesibilidad. |
| **CC32.** Manejable por teclado | Cumple | Todo se puede usar con teclado. Se verificó abrir el panel con Enter, activar el súper contraste con Espacio, cerrar con Esc y que el foco regrese al botón. |

## Requisitos generales del Capítulo 1 del anexo

| Numeral | Requisito | Estado |
|---|---|---|
| 1.3 | WCAG 2.1 nivel AA | Cumple: 0 errores de axe-core en las reglas WCAG 2.0/2.1 A y AA. |
| 1.5 | Subtítulos y Lengua de Señas Colombiana en contenidos audiovisuales | No aplica: no hay contenidos audiovisuales. |
| 1.6 | Mapa del sitio con enlace en el pie de página | Cumple: el pie de página tiene el mapa del sitio. **Pendiente:** el archivo `sitemap.xml` para buscadores necesita la dirección pública definitiva de la aplicación, por ejemplo la de Vercel. |

## Herramientas de accesibilidad del sitio

El botón **«Ajustes»** del encabezado, y el botón «Ajustes de accesibilidad» del pie de página, abren un panel con:

1. **Tamaño del texto:** A− / A+, del 87,5 % al 200 % (CC4).
2. **Súper contraste:** colores de máximo contraste y bordes marcados (CC5).
3. **Reducir animaciones:** detiene movimientos y transiciones (CC20).
4. **Restablecer.**

El mismo panel incluye el **cambio de idioma** español/inglés (CC27) y el **tema** (Sistema, Día o Noche). Las preferencias se guardan en el navegador. Si el sistema operativo pide más contraste o menos movimiento, se activan solas.

## Cómo se verificó

La norma advierte que los validadores automáticos no reemplazan la revisión (numeral 2.2.3.8). Por eso se combinaron:

- **Revisión manual** criterio por criterio contra el texto del Anexo 1.
- **axe-core 4.10** (WCAG 2.0/2.1 A y AA): 0 errores en las tres vistas, con celular y escritorio, modo día y noche, español e inglés, y súper contraste.
- **html-validate 9.4** (reglas recomendadas): 0 errores en `index.html`.
- **125 pruebas automáticas con Playwright**, 28 de ellas dedicadas a la Resolución 1519: tamaño mínimo de letra, ampliación al 200 % sin desbordes, título de pestaña, mapa del sitio, direcciones por vista, aviso de errores, orden de tabulación, foco visible, uso solo con teclado y aviso del cambio automático de zona.

**Recomendación pendiente:** hacer una prueba con un lector de pantalla real (NVDA en Windows o TalkBack en Android) y, si es posible, con un usuario con discapacidad visual, antes de la sustentación.
