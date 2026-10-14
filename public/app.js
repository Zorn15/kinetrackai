/* =====================================================================
   KineTrack AI - logica de la pagina
   1. Pide al servidor la informacion del modelo (/api/info)
   2. Arma el formulario con esas opciones
   3. Valida los datos (RF-04) y los envia a /api/estimar
   4. Muestra el resultado (RF-05 a RF-09) y la info del modelo (RF-10)
   ===================================================================== */

let INFO = null;          // informacion del modelo que manda el servidor
let ultimoResultado = null;

// Valores del formulario (lo que se envia al modelo)
const estado = {
  edad: 26,
  altura_cm: 182,
  posicion: "Mediocentro",
  equipo: "Sin equipo / No especifica",  // solo se muestra, NO entra al modelo
  pie_habil: "Derecho",
  tipo_lesion: "Lesión de isquiotibiales",
  zona_cuerpo: "Muslo",
  fecha: hoyISO(),
  lesiones_previas: 0,
  lesiones_previas_mismo_tipo: 0,
  dias_baja_previos: 0,
  dias_baja_ultimo_anio: 0,
  partidos_temporada_anterior: 25,
};
const ESTADO_INICIAL = { ...estado };

// Posiciones agrupadas como en el prototipo (Portero / Defensa / Mediocampo / Ataque)
const GRUPOS_POSICION = [
  { nombre: "Portero", icono: "sports_handball", posiciones: ["Portero"] },
  { nombre: "Defensa", icono: "shield", posiciones: ["Defensa central", "Lateral izquierdo", "Lateral derecho"] },
  { nombre: "Mediocampo", icono: "hub", posiciones: ["Mediocentro defensivo", "Mediocentro", "Mediapunta", "Volante izquierdo", "Volante derecho"] },
  { nombre: "Ataque", icono: "sports_soccer", posiciones: ["Extremo izquierdo", "Extremo derecho", "Segundo delantero", "Delantero centro"] },
];

// Equipos (solo informativo: aparece en el resultado, pero el modelo NO lo usa)
const EQUIPOS = [
  "Sin equipo / No especifica",
  "Águilas Doradas", "Alianza FC", "América de Cali", "Atlético Bucaramanga", "Atlético Nacional",
  "Boyacá Chicó", "Deportes Tolima", "Deportivo Cali", "Deportivo Pasto", "Deportivo Pereira",
  "Envigado FC", "Fortaleza CEIF", "Independiente Medellín", "Independiente Santa Fe", "Junior FC",
  "Llaneros FC", "Millonarios FC", "Once Caldas", "Unión Magdalena",
  "Otro equipo",
];

// Tipos de lesion mas comunes (botones rapidos)
const TIPOS_RAPIDOS = [
  "Lesión de isquiotibiales", "Lesión muscular (sin zona)", "Lesión de aductores / ingle",
  "Esguince de tobillo", "Lesión de rodilla", "Lesión de ligamento cruzado",
];

// Posicion del punto en la silueta para cada zona del cuerpo (coordenadas del SVG)
const ZONAS_SVG = {
  "Cabeza / cuello": [60, 26], "Hombro": [84, 50], "Brazo / mano": [95, 92], "Tronco": [60, 70],
  "Espalda": [60, 92], "Cadera": [47, 112], "Ingle / aductores": [60, 124], "Muslo": [49, 148],
  "Rodilla": [49, 177], "Pierna / pantorrilla": [49, 198], "Tobillo": [49, 215], "Pie": [46, 223],
  "No especificada": null,
};

// Nombres "bonitos" de las variables (para la grafica de importancia)
const NOMBRE_VARIABLE = {
  tipo_lesion: "Tipo de lesión", zona_cuerpo: "Zona del cuerpo", posicion: "Posición",
  pie_habil: "Pie hábil", edad: "Edad", altura_cm: "Altura", mes_lesion: "Mes de la lesión",
  lesiones_previas: "Lesiones previas", dias_baja_previos: "Días de baja acumulados",
  dias_baja_ultimo_anio: "Días de baja último año", lesiones_previas_mismo_tipo: "Recaídas mismo tipo",
  partidos_temporada_anterior: "Partidos temporada anterior",
};

// ---------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function hoyISO() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}
function fechaDesdeISO(iso) {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(a, m - 1, d);
}
function sumarDias(iso, dias) {
  const f = fechaDesdeISO(iso);
  f.setDate(f.getDate() + dias);
  return f;
}
function fechaLarga(f) {
  return f.toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
}
function fechaCorta(f) {
  return f.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
}
function num(n, dec = 0) {
  return Number(n).toLocaleString("es-CO", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}
function crear(tag, clase, html) {
  const el = document.createElement(tag);
  if (clase) el.className = clase;
  if (html !== undefined) el.innerHTML = html;
  return el;
}
function mostrarToast(texto) {
  const t = $("#toast");
  t.textContent = texto;
  t.classList.add("is-visible");
  clearTimeout(mostrarToast.timer);
  mostrarToast.timer = setTimeout(() => t.classList.remove("is-visible"), 4500);
}

// ---------------------------------------------------------------------
// Navegacion entre vistas
// ---------------------------------------------------------------------
const TITULOS = { formulario: "Formulario", resultado: "Resultado ML", modelo: "Modelo & Info" };

function irA(vista) {
  $$(".vista").forEach((v) => v.classList.toggle("is-visible", v.id === "vista-" + vista));
  $$("[data-vista]").forEach((b) => b.classList.toggle("is-active", b.dataset.vista === vista));
  $("#vista-actual").textContent = TITULOS[vista];
  document.body.classList.toggle("vista-ancha", vista !== "formulario");
  window.scrollTo({ top: 0 });
}
$$("[data-vista]").forEach((b) => b.addEventListener("click", () => irA(b.dataset.vista)));

// ---------------------------------------------------------------------
// Construccion del formulario
// ---------------------------------------------------------------------
function armarPosiciones() {
  const cont = $("#posiciones");
  cont.innerHTML = "";
  const disponibles = new Set(INFO.opciones.posicion);
  const usadas = new Set();

  const grupos = GRUPOS_POSICION.map((g) => ({ ...g, posiciones: g.posiciones.filter((p) => disponibles.has(p)) }));
  // si el modelo trae una posicion que no esta en los grupos, va en "Otras"
  const otras = INFO.opciones.posicion.filter((p) => !grupos.some((g) => g.posiciones.includes(p)));
  if (otras.length) grupos.push({ nombre: "Otras", icono: "more_horiz", posiciones: otras });

  grupos.forEach((g) => {
    if (!g.posiciones.length) return;
    const bloque = crear("div", "pos-grupo");
    bloque.appendChild(crear("div", "pos-grupo__tit", `<span class="ms">${g.icono}</span>${g.nombre}`));
    const tiles = crear("div", "pos-tiles");
    g.posiciones.forEach((p) => {
      usadas.add(p);
      const b = crear("button", "tile", p);
      b.type = "button";
      b.dataset.valor = p;
      b.addEventListener("click", () => { estado.posicion = p; pintarSeleccion(); validar(); });
      tiles.appendChild(b);
    });
    bloque.appendChild(tiles);
    cont.appendChild(bloque);
  });
}

function armarSelect(id, opciones) {
  const sel = $("#" + id);
  sel.innerHTML = "";
  opciones.forEach((o) => sel.appendChild(new Option(o, o)));
  sel.addEventListener("change", () => { estado[id] = sel.value; validar(); });
}

function armarPie() {
  const cont = $("#pie_habil");
  INFO.opciones.pie_habil.forEach((p) => {
    const b = crear("button", "", p);
    b.type = "button";
    b.dataset.valor = p;
    b.addEventListener("click", () => { estado.pie_habil = p; pintarSeleccion(); });
    cont.appendChild(b);
  });
}

function armarTipos() {
  // botones rapidos
  const rapidos = $("#tipos-rapidos");
  TIPOS_RAPIDOS.filter((t) => INFO.opciones.tipo_lesion.includes(t)).forEach((t) => {
    const b = crear("button", "chip-tipo", t);
    b.type = "button";
    b.dataset.valor = t;
    b.addEventListener("click", () => elegirTipo(t));
    rapidos.appendChild(b);
  });

  // desplegable con todos los tipos, agrupados
  const sel = $("#tipo_lesion");
  sel.appendChild(new Option("Ver todos los tipos de lesión…", ""));
  Object.entries(INFO.grupos_tipo || { "Tipos de lesión": INFO.opciones.tipo_lesion }).forEach(([grupo, tipos]) => {
    const og = document.createElement("optgroup");
    og.label = grupo;
    tipos.forEach((t) => og.appendChild(new Option(t, t)));
    sel.appendChild(og);
  });
  sel.addEventListener("change", () => { if (sel.value) elegirTipo(sel.value); });
}

function elegirTipo(tipo) {
  estado.tipo_lesion = tipo;
  // al elegir el tipo se sugiere la zona mas comun en los datos (se puede cambiar)
  const zona = (INFO.zona_por_tipo || {})[tipo];
  if (zona && INFO.opciones.zona_cuerpo.includes(zona)) estado.zona_cuerpo = zona;
  pintarSeleccion();
  validar();
}

function armarZonas() {
  const cont = $("#zona_cuerpo");
  // ordenadas de cabeza a pies
  const orden = Object.keys(ZONAS_SVG);
  const zonas = [...INFO.opciones.zona_cuerpo].sort((a, b) => orden.indexOf(a) - orden.indexOf(b));
  zonas.forEach((z) => {
    const b = crear("button", "zona", `<span>${z}</span><span class="ms">check_circle</span>`);
    b.type = "button";
    b.setAttribute("role", "radio");
    b.dataset.valor = z;
    b.addEventListener("click", () => { estado.zona_cuerpo = z; pintarSeleccion(); validar(); });
    cont.appendChild(b);
  });
}

// Steppers (- numero +)
$$(".stepper").forEach((st) => {
  const campo = st.dataset.campo;
  const min = Number(st.dataset.min), max = Number(st.dataset.max);
  st.querySelectorAll(".stepper__btn").forEach((b) => {
    b.addEventListener("click", () => {
      estado[campo] = Math.min(max, Math.max(min, estado[campo] + Number(b.dataset.paso)));
      pintarSeleccion();
      validar();
    });
  });
});

// Sliders
const SLIDERS = {
  altura_cm: (v) => `${v} cm`,
  dias_baja_previos: (v) => (v >= 600 ? "600+ días" : `${v} días`),
  dias_baja_ultimo_anio: (v) => `${v} días`,
  partidos_temporada_anterior: (v) => `${v} partidos`,
};
Object.keys(SLIDERS).forEach((id) => {
  $("#" + id).addEventListener("input", (e) => { estado[id] = Number(e.target.value); pintarSeleccion(); validar(); });
});

// Fecha
$("#fecha").max = hoyISO();
$("#fecha").addEventListener("change", (e) => { estado.fecha = e.target.value; pintarSeleccion(); validar(); });

// ---------------------------------------------------------------------
// Pintar en pantalla lo que esta seleccionado
// ---------------------------------------------------------------------
function pintarSeleccion() {
  $$("#posiciones .tile").forEach((b) => b.classList.toggle("is-sel", b.dataset.valor === estado.posicion));
  $$("#pie_habil button").forEach((b) => b.classList.toggle("is-sel", b.dataset.valor === estado.pie_habil));
  $$("#tipos-rapidos .chip-tipo").forEach((b) => b.classList.toggle("is-sel", b.dataset.valor === estado.tipo_lesion));
  $$("#zona_cuerpo .zona").forEach((b) => {
    const sel = b.dataset.valor === estado.zona_cuerpo;
    b.classList.toggle("is-sel", sel);
    b.setAttribute("aria-checked", sel);
  });
  $("#equipo").value = estado.equipo;
  $("#tipo_lesion").value = estado.tipo_lesion;

  // steppers
  ["edad", "lesiones_previas", "lesiones_previas_mismo_tipo"].forEach((c) => ($("#" + c).textContent = estado[c]));

  // sliders (valor + color de la parte llena)
  Object.entries(SLIDERS).forEach(([id, txt]) => {
    const s = $("#" + id);
    s.value = estado[id];
    s.style.setProperty("--p", ((s.value - s.min) / (s.max - s.min)) * 100 + "%");
    $("#" + (id === "altura_cm" ? "altura-txt" : id + "-txt")).textContent = txt(estado[id]);
  });

  // tarjeta del diagnostico
  const tipo = estado.tipo_lesion;
  $("#diag-nombre").textContent = tipo;
  const mediana = (INFO.mediana_dias_por_tipo || {})[tipo];
  $("#diag-mediana").textContent = mediana !== undefined ? `Mediana histórica: ${mediana} d` : "—";
  const grupo = Object.entries(INFO.grupos_tipo || {}).find(([, ts]) => ts.includes(tipo));
  $("#diag-grupo").textContent = grupo ? "Grupo: " + grupo[0] : "";

  // silueta
  const xy = ZONAS_SVG[estado.zona_cuerpo];
  const punto = $("#zona-punto");
  punto.style.opacity = xy ? 1 : 0;
  if (xy) { punto.setAttribute("cx", xy[0]); punto.setAttribute("cy", xy[1]); }
  $("#zona-tag").textContent = estado.zona_cuerpo === "No especificada" ? "Sin zona" : estado.zona_cuerpo;

  // fecha
  $("#fecha").value = estado.fecha;
  const dias = Math.round((fechaDesdeISO(hoyISO()) - fechaDesdeISO(estado.fecha || hoyISO())) / 86400000);
  $("#fecha-hace").textContent = !estado.fecha ? "Sin fecha" : dias === 0 ? "Ocurrida hoy" : dias > 0 ? `Ocurrida hace ${dias} día${dias === 1 ? "" : "s"}` : "Fecha en el futuro";
}

// ---------------------------------------------------------------------
// RF-04: validacion
// ---------------------------------------------------------------------
function validar() {
  const errores = [];
  if (!INFO.opciones.posicion.includes(estado.posicion)) errores.push("Selecciona la posición del jugador.");
  if (!INFO.opciones.tipo_lesion.includes(estado.tipo_lesion)) errores.push("Selecciona el tipo de lesión.");
  if (!INFO.opciones.zona_cuerpo.includes(estado.zona_cuerpo)) errores.push("Selecciona la zona del cuerpo.");
  if (!estado.fecha) errores.push("Indica la fecha de la lesión.");
  else if (estado.fecha > hoyISO()) errores.push("La fecha de la lesión no puede estar en el futuro.");
  if (estado.lesiones_previas_mismo_tipo > estado.lesiones_previas)
    errores.push("Las recaídas del mismo tipo no pueden ser más que el total de lesiones previas.");
  if (estado.dias_baja_ultimo_anio > estado.dias_baja_previos)
    errores.push("Los días de baja del último año no pueden superar los días acumulados.");
  if (estado.lesiones_previas === 0 && estado.dias_baja_previos > 0)
    errores.push("Si no hay lesiones previas, los días de baja acumulados deben ser 0.");
  if (estado.lesiones_previas > 0 && estado.dias_baja_previos === 0)
    errores.push("Si hubo lesiones previas, indica los días de baja acumulados.");

  const caja = $("#integridad");
  caja.classList.toggle("is-error", errores.length > 0);
  caja.querySelector(".ms").textContent = errores.length ? "error" : "task_alt";
  $("#integridad-txt").textContent = errores.length
    ? `Hay ${errores.length} dato${errores.length > 1 ? "s" : ""} por revisar:`
    : "Todos los campos están completos y dentro de rangos válidos.";
  $("#integridad-errores").innerHTML = errores.map((e) => `<li>${e}</li>`).join("");

  // pasos del encabezado (se marcan cuando su seccion esta bien)
  const okLesion = !errores.some((e) => /lesión|zona|fecha/i.test(e) && !/previas|recaídas|baja/i.test(e));
  const okHist = !errores.some((e) => /previas|recaídas|baja/i.test(e));
  $('[data-paso="jugador"]').classList.add("is-ok");
  $('[data-paso="lesion"]').classList.toggle("is-ok", okLesion);
  $('[data-paso="historial"]').classList.toggle("is-ok", okHist);
  return errores;
}

// ---------------------------------------------------------------------
// Envio del formulario (RF-05)
// ---------------------------------------------------------------------
$("#formulario").addEventListener("submit", async (e) => {
  e.preventDefault();
  const errores = validar();
  if (errores.length) {
    $("#integridad").scrollIntoView({ behavior: "smooth", block: "center" });
    mostrarToast(errores[0]);
    return;
  }

  const datos = {
    posicion: estado.posicion, pie_habil: estado.pie_habil,
    tipo_lesion: estado.tipo_lesion, zona_cuerpo: estado.zona_cuerpo,
    edad: estado.edad, altura_cm: estado.altura_cm, mes_lesion: fechaDesdeISO(estado.fecha).getMonth() + 1,
    lesiones_previas: estado.lesiones_previas, dias_baja_previos: estado.dias_baja_previos,
    dias_baja_ultimo_anio: estado.dias_baja_ultimo_anio,
    lesiones_previas_mismo_tipo: estado.lesiones_previas_mismo_tipo,
    partidos_temporada_anterior: estado.partidos_temporada_anterior,
  };

  const boton = $("#btn-calcular");
  boton.classList.add("is-cargando");
  boton.firstChild.textContent = "Calculando… ";
  try {
    const resp = await fetch("/api/estimar", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(datos),
    });
    const r = await resp.json();
    if (!r.ok) { mostrarToast(r.errores.join(" ")); return; }
    ultimoResultado = r;
    pintarResultado(r);
    $$('[data-vista="resultado"]').forEach((b) => (b.disabled = false));
    irA("resultado");
    animarResultado(r);
  } catch (err) {
    mostrarToast("No se pudo conectar con el servidor. ¿Está corriendo servidor.py?");
  } finally {
    boton.classList.remove("is-cargando");
    boton.firstChild.textContent = "Calcular Estimación ML";
  }
});

// Limpiar / Nueva consulta (RF-09)
function limpiar() {
  Object.assign(estado, ESTADO_INICIAL, { fecha: hoyISO() });
  $("#nombre").value = "";
  pintarSeleccion();
  validar();
}
$("#btn-limpiar").addEventListener("click", limpiar);
$("#btn-nueva").addEventListener("click", () => { limpiar(); irA("formulario"); });
$("#btn-imprimir").addEventListener("click", () => window.print());

// ---------------------------------------------------------------------
// Vista de resultado (RF-06, RF-07, RF-08)
// ---------------------------------------------------------------------
function pintarResultado(r) {
  const nombre = $("#nombre").value.trim();
  $("#r-nombre").textContent = nombre || "Jugador sin identificar";
  $("#r-edad").textContent = `${estado.edad} años`;
  const equipo = estado.equipo === "Sin equipo / No especifica" ? "" : ` · ${estado.equipo}`;
  $("#r-posicion").textContent = estado.posicion + equipo;
  $("#r-diagnostico").textContent = estado.zona_cuerpo === "No especificada"
    ? estado.tipo_lesion : `${estado.tipo_lesion} · ${estado.zona_cuerpo}`;
  $("#r-modelo").textContent = r.modelo;

  const [bajo, alto] = r.rango;
  $("#r-fecha-alta").textContent = fechaLarga(sumarDias(estado.fecha, r.dias));
  $("#r-rango").textContent = `${bajo} – ${alto} días`;
  const mae = INFO.metricas_validacion_por_jugador.MAE;
  $("#r-rango-nota").textContent = `(50% de los casos parecidos · error promedio del modelo ±${num(mae, 1)} días)`;

  // linea de tiempo
  $("#t-lesion").textContent = fechaCorta(fechaDesdeISO(estado.fecha));
  $("#t-min").textContent = fechaCorta(sumarDias(estado.fecha, bajo));
  $("#t-est").textContent = fechaCorta(sumarDias(estado.fecha, r.dias));
  $("#t-max").textContent = fechaCorta(sumarDias(estado.fecha, alto));
  $("#t-min-dia").textContent = `Día ${bajo}`;
  $("#t-est-dia").textContent = `Día ${r.dias}`;
  $("#t-max-dia").textContent = `Día ${alto}`;

  // variables influyentes
  $("#r-base").textContent = ` ${r.base} d`;
  const valores = {
    "Tipo de lesión": estado.tipo_lesion, "Zona del cuerpo": estado.zona_cuerpo, "Posición": estado.posicion,
    "Pie hábil": estado.pie_habil, "Edad": `${estado.edad} años`,
    "Altura": `${estado.altura_cm} cm`, "Mes de la lesión": fechaDesdeISO(estado.fecha).toLocaleDateString("es-CO", { month: "long" }),
    "Lesiones previas": estado.lesiones_previas, "Días de baja acumulados": `${estado.dias_baja_previos} d`,
    "Días de baja en el último año": `${estado.dias_baja_ultimo_anio} d`,
    "Lesiones previas del mismo tipo": estado.lesiones_previas_mismo_tipo,
    "Partidos jugados la temporada anterior": estado.partidos_temporada_anterior,
  };
  const cont = $("#r-influyentes");
  cont.innerHTML = "";
  const lista = r.influyentes.filter((i) => Math.abs(i.efecto) >= 0.5);
  if (!lista.length) {
    cont.appendChild(crear("p", "infl--vacio", "Los datos de este caso son muy parecidos a un caso típico, por eso ninguna variable cambia mucho la estimación."));
  }
  const maximo = Math.max(...lista.map((i) => Math.abs(i.efecto)), 1);
  lista.forEach((i) => {
    const color = i.efecto >= 0 ? "#ff9f8f" : "#4cd7f6";
    const signo = i.efecto >= 0 ? "+" : "−";
    const fila = crear("div", "infl");
    fila.style.setProperty("--c", color);
    fila.innerHTML = `
      <div class="infl__cab"><span>${i.variable} (${valores[i.variable] ?? ""})</span><b>${signo}${num(Math.abs(i.efecto), 1)} días</b></div>
      <div class="infl__barra"><i data-ancho="${(Math.abs(i.efecto) / maximo) * 100}%"></i></div>`;
    cont.appendChild(fila);
  });

  // resumen en palabras
  const top = lista.slice(0, 2).map((i) => `<b>${i.variable.toLowerCase()}</b> (${i.efecto >= 0 ? "+" : "−"}${num(Math.abs(i.efecto))} d)`);
  $("#r-resumen").innerHTML = top.length
    ? `Para un caso típico el modelo estima <b>${r.base} días</b>. En este caso lo que más mueve la estimación es ${top.join(" y ")}, para un total de <b>${r.dias} días</b>. Cada efecto se mide por separado, por eso no suman exactamente el total.`
    : `Para un caso típico el modelo estima <b>${r.base} días</b>; este caso queda en <b>${r.dias} días</b>.`;
}

function animarResultado(r) {
  // anillo: proporcion del anio (365 dias)
  const circ = 2 * Math.PI * 82;
  const anillo = $("#anillo-valor");
  anillo.style.strokeDasharray = circ;
  anillo.style.strokeDashoffset = circ;
  const fraccion = Math.max(0.04, Math.min(r.dias / 365, 1));
  requestAnimationFrame(() => requestAnimationFrame(() => (anillo.style.strokeDashoffset = circ * (1 - fraccion))));

  // numero que sube
  const el = $("#r-dias");
  const inicio = performance.now();
  const paso = (t) => {
    const p = Math.min((t - inicio) / 900, 1);
    el.textContent = Math.round(r.dias * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(paso);
  };
  requestAnimationFrame(paso);

  // barras de variables
  setTimeout(() => $$("#r-influyentes [data-ancho]").forEach((b) => (b.style.width = b.dataset.ancho)), 120);
}

// ---------------------------------------------------------------------
// Vista "Modelo & Info" (RF-10)
// ---------------------------------------------------------------------
function pintarInfo() {
  const m = INFO.metricas_validacion_por_jugador;
  $$(".js-modelo").forEach((e) => (e.textContent = INFO.modelo));
  $("#badge-modelo").textContent = INFO.modelo;
  const temporadas = INFO.temporadas || [];
  const tempTxt = temporadas.length ? `20${temporadas[0]} – 20${temporadas[temporadas.length - 1]}`.replace(/(\d{4})\/(\d{2})/g, "$1/$2") : "";
  $("#i-subtitulo").textContent =
    `Modelo ${INFO.modelo} entrenado con ${num(INFO.n_lesiones_entrenamiento)} lesiones de ${num(INFO.n_jugadores_entrenamiento)} ` +
    `jugadores de las cinco grandes ligas europeas${tempTxt ? ` (temporadas ${tempTxt})` : ""}.`;
  $("#i-mae").textContent = num(m.MAE, 1);
  $("#i-medae").textContent = num(m.MedAE, 1);
  $("#i-r2").textContent = num(m.R2, 2);
  $("#i-casos").textContent = `${num(INFO.n_lesiones_entrenamiento)} casos`;
  $("#i-casos-txt").textContent = `${num(INFO.n_jugadores_entrenamiento)} futbolistas profesionales de élite`;
  $("#i-temporadas").textContent = tempTxt;
  $("#i-n").textContent = `N = ${num(INFO.n_lesiones_entrenamiento)}`;

  // tabla de comparacion
  const filas = {};
  (INFO.comparacion_modelos || []).forEach((f) => {
    filas[f.Modelo] = filas[f.Modelo] || {};
    if (f["Validación"].startsWith("Por jugador")) { filas[f.Modelo].cv = f.MAE; filas[f.Modelo].r2 = f.R2; }
    else filas[f.Modelo].temp = f.MAE;
  });
  $("#i-comparacion tbody").innerHTML = Object.entries(filas).map(([modelo, f]) => `
    <tr class="${modelo === INFO.modelo ? "is-mejor" : ""}">
      <td>${modelo}</td><td>${num(f.cv, 1)} d</td><td>${num(f.temp, 1)} d</td><td>${num(f.r2, 2)}</td>
    </tr>`).join("");

  // distribucion por tipo
  const colores = ["#6bd8cb", "#4cd7f6", "#ffb95f", "#ff9f8f", "#8b97a8"];
  const dist = INFO.distribucion_tipos || [];
  $("#i-dist-barra").innerHTML = dist.map((d, i) => `<i style="width:${d.porcentaje}%;background:${colores[i % colores.length]}" title="${d.grupo}"></i>`).join("");
  $("#i-dist-leyenda").innerHTML = dist.map((d, i) =>
    `<div class="dist-item" style="--c:${colores[i % colores.length]}"><span>${d.grupo}</span><b>${num(d.porcentaje)}%</b></div>`).join("");

  // importancia de variables
  const imp = Object.entries(INFO.importancia_global || {}).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxImp = Math.max(...imp.map(([, v]) => v), 0.0001);
  $("#i-importancia").innerHTML = imp.map(([v, val]) => `
    <div class="imp"><span>${NOMBRE_VARIABLE[v] || v}</span>
      <div class="imp__barra"><i style="width:${(val / maxImp) * 100}%"></i></div>
      <b>${num(val * 100, 1)}%</b></div>`).join("");
}

// ---------------------------------------------------------------------
// Inicio: pedir la informacion del modelo y armar todo
// ---------------------------------------------------------------------
async function iniciar() {
  try {
    INFO = await (await fetch("/api/info")).json();
  } catch (e) {
    mostrarToast("No se pudo cargar el modelo. Abre la página desde servidor.py (http://localhost:5000).");
    return;
  }
  // si alguna opcion por defecto no existe en el modelo, se usa la primera disponible
  ["posicion", "pie_habil", "tipo_lesion", "zona_cuerpo"].forEach((c) => {
    if (!INFO.opciones[c].includes(estado[c])) estado[c] = ESTADO_INICIAL[c] = INFO.opciones[c][0];
  });

  armarPosiciones();
  armarSelect("equipo", EQUIPOS);
  armarPie();
  armarTipos();
  armarZonas();
  pintarSeleccion();
  validar();
  pintarInfo();
}
iniciar();
