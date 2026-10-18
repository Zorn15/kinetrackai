// KineTrack AI - logica de la pagina

let INFO = null;
let ultimoResultado = null;

// Valores del formulario
const estado = {
  edad: 26,
  altura_cm: 182,
  posicion: "Mediocentro",
  pais: "",
  equipo: "",
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

// x, y en % de la cancha; abrev = [es, en]
const POSICIONES_CANCHA = {
  "Portero":               { x: 6,  y: 50, abrev: ["POR", "GK"] },
  "Lateral izquierdo":     { x: 23, y: 15, abrev: ["LI",  "LB"] },
  "Defensa central":       { x: 19, y: 50, abrev: ["DFC", "CB"] },
  "Lateral derecho":       { x: 23, y: 85, abrev: ["LD",  "RB"] },
  "Mediocentro defensivo": { x: 34, y: 50, abrev: ["MCD", "DM"] },
  "Volante izquierdo":     { x: 50, y: 21, abrev: ["VI",  "LM"] },
  "Mediocentro":           { x: 47, y: 50, abrev: ["MC",  "CM"] },
  "Volante derecho":       { x: 50, y: 79, abrev: ["VD",  "RM"] },
  "Mediapunta":            { x: 61, y: 50, abrev: ["MP",  "AM"] },
  "Extremo izquierdo":     { x: 75, y: 14, abrev: ["EI",  "LW"] },
  "Segundo delantero":     { x: 74, y: 50, abrev: ["SD",  "SS"] },
  "Extremo derecho":       { x: 75, y: 86, abrev: ["ED",  "RW"] },
  "Delantero centro":      { x: 87, y: 50, abrev: ["DC",  "ST"] },
};

const CANCHA_SVG = `<svg class="cancha__lineas" viewBox="0 0 105 68" preserveAspectRatio="none" aria-hidden="true">
  <rect x="2" y="2" width="101" height="64"/><line x1="52.5" y1="2" x2="52.5" y2="66"/>
  <circle cx="52.5" cy="34" r="9.15"/><circle cx="52.5" cy="34" r=".6" class="lleno"/>
  <rect x="2" y="13.85" width="16.5" height="40.3"/><rect x="86.5" y="13.85" width="16.5" height="40.3"/>
  <rect x="2" y="24.85" width="5.5" height="18.3"/><rect x="97.5" y="24.85" width="5.5" height="18.3"/>
</svg>`;

const TIPOS_RAPIDOS = [
  "Lesión de isquiotibiales", "Esguince de tobillo", "Lesión de rodilla", "Lesión de ligamento cruzado",
];

// Punto de la silueta para cada zona
const ZONAS_SVG = {
  "Cabeza / cuello": [60, 26], "Hombro": [84, 50], "Brazo / mano": [95, 92], "Tronco": [60, 70],
  "Espalda": [60, 92], "Cadera": [47, 112], "Ingle / aductores": [60, 124], "Muslo": [49, 148],
  "Rodilla": [49, 177], "Pierna / pantorrilla": [49, 198], "Tobillo": [49, 215], "Pie": [46, 223],
  "No especificada": null,
};

const NOMBRE_VARIABLE = {
  tipo_lesion: "Tipo de lesión", zona_cuerpo: "Zona del cuerpo", posicion: "Posición",
  pie_habil: "Pie hábil", edad: "Edad", altura_cm: "Altura", mes_lesion: "Mes de la lesión",
  lesiones_previas: "Lesiones previas", dias_baja_previos: "Días de baja acumulados",
  dias_baja_ultimo_anio: "Días de baja último año", lesiones_previas_mismo_tipo: "Recaídas mismo tipo",
  partidos_temporada_anterior: "Partidos temporada anterior",
};

// Errores por seccion del formulario
const ERRORES_LESION = ["err.tipo", "err.zona", "err.fecha", "err.futuro"];
const ERRORES_HISTORIAL = ["err.recaidas", "err.ultimo", "err.sinprevias", "err.previas"];

// ---------- Utilidades ----------
const $ = (sel, raiz = document) => raiz.querySelector(sel);
const $$ = (sel, raiz = document) => raiz.querySelectorAll(sel);
const raiz = document.documentElement;

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
  return f.toLocaleDateString(localeActual(), { day: "numeric", month: "long", year: "numeric" });
}
function fechaCorta(f) {
  return f.toLocaleDateString(localeActual(), { day: "numeric", month: "short", year: "numeric" });
}
function num(n, dec = 0) {
  return Number(n).toLocaleString(localeActual(), { minimumFractionDigits: dec, maximumFractionDigits: dec });
}
function plural(n) { return n === 1 ? "" : "s"; }
function crear(tag, clase, html) {
  const el = document.createElement(tag);
  if (clase) el.className = clase;
  if (html !== undefined) el.innerHTML = html;
  return el;
}
function guardar(clave, valor) {
  try {
    if (valor === null) localStorage.removeItem(clave);
    else localStorage.setItem(clave, valor);
  } catch (e) {}
}
// Toast de error: se cierra solo a los 8 s
function ocultarToast() { $("#toast").classList.remove("is-visible"); }
function programarCierreToast() {
  clearTimeout(mostrarToast.timer);
  mostrarToast.timer = setTimeout(ocultarToast, 8000);
}
function mostrarToast(texto) {
  $("#toast-txt").textContent = texto;
  $("#toast").classList.add("is-visible");
  programarCierreToast();
}
$("#toast-cerrar").addEventListener("click", ocultarToast);
["mouseenter", "focusin"].forEach((ev) => $("#toast").addEventListener(ev, () => clearTimeout(mostrarToast.timer)));
["mouseleave", "focusout"].forEach((ev) => $("#toast").addEventListener(ev, programarCierreToast));

const menosMovimiento = matchMedia("(prefers-reduced-motion: reduce)");
function sinMovimiento() { return menosMovimiento.matches || raiz.dataset.movimiento === "reducido"; }
const hayVT = typeof document.startViewTransition === "function";
if (hayVT) raiz.classList.add("con-vt");

// ---------- Modo dia / noche ----------
const metaTema = $('meta[name="color-scheme"]');
const sistemaOscuro = matchMedia("(prefers-color-scheme: dark)");
const COLOR_BARRA = { light: "#f6f8fa", dark: "#0e141c" };

function temaSistema() { return sistemaOscuro.matches ? "dark" : "light"; }
function temaVisible() { return metaTema.content === "light dark" ? temaSistema() : metaTema.content; }

function aplicarTema(valor) {
  metaTema.content = valor || "light dark";
  $$('meta[name="theme-color"]').forEach((m) => (m.content = COLOR_BARRA[temaVisible()]));
}

// valor: null = sistema, "light" o "dark"
function elegirTema(valor, evento) {
  const antes = temaVisible();
  guardar("color-scheme", valor);
  const cambiaColor = (valor || temaSistema()) !== antes;
  if (!cambiaColor || !hayVT || sinMovimiento()) { aplicarTema(valor); pintarAjustes(); return; }

  // Circulo que se expande desde el boton
  const caja = evento.currentTarget.getBoundingClientRect();
  const x = caja.left + caja.width / 2, y = caja.top + caja.height / 2;
  const radio = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  raiz.classList.add("vt-tema");
  const transicion = document.startViewTransition(() => { aplicarTema(valor); pintarAjustes(); });
  transicion.ready.then(() => {
    raiz.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radio}px at ${x}px ${y}px)`] },
      { duration: 600, easing: "cubic-bezier(.4, 0, .2, 1)", pseudoElement: "::view-transition-new(root)" });
  }).catch(() => {});
  transicion.finished.finally(() => raiz.classList.remove("vt-tema"));
}

$$("[data-tema]").forEach((b) => b.addEventListener("click", (e) => elegirTema(b.dataset.tema || null, e)));
sistemaOscuro.addEventListener("change", () => aplicarTema(metaTema.content === "light dark" ? null : metaTema.content));
aplicarTema(metaTema.content === "light dark" ? null : metaTema.content);

// ---------- Panel de accesibilidad ----------
// CC4: el texto se puede ampliar hasta 200 %
const ESCALAS = [0.875, 1, 1.125, 1.25, 1.5, 1.75, 2];
const masContraste = matchMedia("(prefers-contrast: more)");

function leerAccesibilidad() {
  try { return JSON.parse(localStorage.getItem("kt-accesibilidad") || "{}"); } catch (e) { return {}; }
}
let acc = leerAccesibilidad();

function aplicarAccesibilidad() {
  const escala = acc.escala || 1;
  if (escala === 1) raiz.style.removeProperty("--escala-texto");
  else raiz.style.setProperty("--escala-texto", escala);
  // Sin preferencia guardada, sigue al sistema
  const contraste = acc.contraste || (masContraste.matches ? "alto" : "normal");
  if (contraste === "alto") raiz.dataset.contraste = "alto"; else delete raiz.dataset.contraste;
  if (acc.movimiento === "reducido") raiz.dataset.movimiento = "reducido"; else delete raiz.dataset.movimiento;

  const i = ESCALAS.indexOf(escala);
  $("#acc-letra-valor").textContent = `${Math.round(escala * 100)}%`;
  $("#btn-letra-menos").disabled = i <= 0;
  $("#btn-letra-mas").disabled = i >= ESCALAS.length - 1;
  $("#sw-contraste").checked = contraste === "alto";
  const movSistema = menosMovimiento.matches;
  $("#sw-movimiento").checked = movSistema || acc.movimiento === "reducido";
  $("#sw-movimiento").disabled = movSistema;
  $("#acc-movimiento-ayuda").innerHTML = movSistema ? t("acc.movimiento.sistema") : t("acc.movimiento.ayuda");
}

function cambiarAccesibilidad(cambios) {
  acc = { ...acc, ...cambios };
  Object.keys(acc).forEach((k) => acc[k] === undefined && delete acc[k]);
  guardar("kt-accesibilidad", Object.keys(acc).length ? JSON.stringify(acc) : null);
  aplicarAccesibilidad();
}

function pasoLetra(direccion) {
  const i = ESCALAS.indexOf(acc.escala || 1);
  const nueva = ESCALAS[Math.min(ESCALAS.length - 1, Math.max(0, i + direccion))];
  cambiarAccesibilidad({ escala: nueva === 1 ? undefined : nueva });
}
$("#btn-letra-menos").addEventListener("click", () => pasoLetra(-1));
$("#btn-letra-mas").addEventListener("click", () => pasoLetra(1));
$("#sw-contraste").addEventListener("change", (e) => cambiarAccesibilidad({ contraste: e.target.checked ? "alto" : "normal" }));
$("#sw-movimiento").addEventListener("change", (e) => cambiarAccesibilidad({ movimiento: e.target.checked ? "reducido" : undefined }));
$("#btn-acc-restablecer").addEventListener("click", () => { acc = {}; guardar("kt-accesibilidad", null); aplicarAccesibilidad(); });
masContraste.addEventListener("change", aplicarAccesibilidad);
menosMovimiento.addEventListener("change", aplicarAccesibilidad);

// ---------- Idioma ----------
function pintarAjustes() {
  $$("[data-idioma]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.idioma === IDIOMA));
  $$("[data-idioma]").forEach((b) => b.classList.toggle("is-sel", b.dataset.idioma === IDIOMA));
  const tema = metaTema.content === "light dark" ? "" : metaTema.content;
  $$("[data-tema]").forEach((b) => {
    b.setAttribute("aria-pressed", b.dataset.tema === tema);
    b.classList.toggle("is-sel", b.dataset.tema === tema);
  });
}

function aplicarIdioma() {
  traducirTextosFijos();
  pintarAjustes();
  aplicarAccesibilidad();
  const vista = $(".vista.is-visible").id.replace("vista-", "");
  actualizarTitulo(vista);
  if (!INFO) return;
  $(".btn__txt", $("#btn-calcular")).textContent = t("btn.calcular");
  traducirOpciones();
  pintarSeleccion();
  validar();
  pintarInfo();
  if (ultimoResultado) { pintarResultado(ultimoResultado); mostrarResultadoFinal(ultimoResultado); }
}

function elegirIdioma(idioma) {
  if (idioma === IDIOMA) return;
  IDIOMA = idioma;
  guardar("kt-idioma", IDIOMA === "en" ? "en" : null);
  if (!hayVT || sinMovimiento()) { aplicarIdioma(); return; }
  raiz.classList.add("vt-idioma");
  document.startViewTransition(aplicarIdioma).finished.finally(() => raiz.classList.remove("vt-idioma"));
}
$$("[data-idioma]").forEach((b) => b.addEventListener("click", () => elegirIdioma(b.dataset.idioma)));

// Sincroniza los cambios hechos en otra pestana
addEventListener("storage", (e) => {
  if (e.key === "color-scheme") { aplicarTema(e.newValue); pintarAjustes(); }
  if (e.key === "kt-accesibilidad") { acc = leerAccesibilidad(); aplicarAccesibilidad(); }
  if (e.key === "kt-idioma") { IDIOMA = e.newValue === "en" ? "en" : "es"; aplicarIdioma(); }
});

// ---------- Navegacion entre vistas ----------
function mostrarVista(vista) {
  $$(".vista").forEach((v) => v.classList.toggle("is-visible", v.id === "vista-" + vista));
  $$("[data-vista]").forEach((b) => {
    const activo = b.dataset.vista === vista;
    b.classList.toggle("is-active", activo);
    if (activo) b.setAttribute("aria-current", "page");
    else b.removeAttribute("aria-current");
  });
  document.body.classList.toggle("vista-ancha", vista !== "formulario");
  actualizarTitulo(vista);
  const enSeccionDelFormulario = vista === "formulario" && location.hash.startsWith("#sec-");
  if (location.hash !== "#" + vista && !enSeccionDelFormulario) history.pushState(null, "", "#" + vista);
  window.scrollTo({ top: 0, behavior: "instant" });
}

function actualizarTitulo(vista) {
  const tmp = document.createElement("span");
  tmp.innerHTML = t("nav." + vista);
  document.title = `${tmp.textContent} – KineTrack AI`;
}

function aplicarRuta() {
  const destino = location.hash.slice(1);
  let vista = ["formulario", "resultado", "modelo"].includes(destino) ? destino
    : destino.startsWith("sec-") || destino === "" ? "formulario" : null;
  if (!vista || !INFO) return;
  if (vista === "resultado" && !ultimoResultado) { mostrarToast(t("ruta.sinresultado")); vista = "formulario"; }
  const actual = $(".vista.is-visible").id.replace("vista-", "");
  if (actual === vista) return;
  irA(vista).then(() => { if (destino.startsWith("sec-")) document.getElementById(destino)?.scrollIntoView(); });
}
addEventListener("hashchange", aplicarRuta);

function irA(vista) {
  const actual = $(".vista.is-visible");
  if (actual && actual.id === "vista-" + vista) { window.scrollTo({ top: 0 }); return Promise.resolve(); }
  // El foco pasa al titulo de la vista
  const enfocar = () => $(`#vista-${vista} h1`)?.focus({ preventScroll: true });
  if (!hayVT || sinMovimiento()) { mostrarVista(vista); enfocar(); return Promise.resolve(); }
  const transicion = document.startViewTransition(() => mostrarVista(vista));
  transicion.finished.finally(enfocar);
  return transicion.updateCallbackDone.catch(() => {});
}
$$("[data-vista]").forEach((b) => b.addEventListener("click", () => irA(b.dataset.vista)));

// ---------- Formulario ----------
function armarPosiciones() {
  const cont = $("#posiciones");
  cont.innerHTML = "";
  const elegir = (p) => { estado.posicion = p; pintarSeleccion(); validar(); };

  const campo = crear("div", "cancha__campo", CANCHA_SVG + `<span class="cancha__marca" aria-hidden="true"></span>`);
  Object.entries(POSICIONES_CANCHA).forEach(([p, { x, y }]) => {
    if (!INFO.opciones.posicion.includes(p)) return;
    const b = crear("button", "pos",
      `<span class="pos__punto" aria-hidden="true"></span><span class="pos__abrev" aria-hidden="true"></span><span class="lbl sr-only"></span>`);
    b.type = "button";
    b.dataset.valor = p;
    b.style.setProperty("--x", x + "%");
    b.style.setProperty("--y", y + "%");
    b.addEventListener("click", () => elegir(p));
    campo.appendChild(b);
  });
  cont.appendChild(campo);

  // Posiciones que no estan en la cancha
  const otras = INFO.opciones.posicion.filter((p) => !POSICIONES_CANCHA[p]);
  if (otras.length) {
    const lista = crear("div", "pos-tiles cancha__otras");
    otras.forEach((p) => {
      const b = crear("button", "tile", `<span class="lbl"></span>`);
      b.type = "button";
      b.dataset.valor = p;
      b.addEventListener("click", () => elegir(p));
      lista.appendChild(b);
    });
    cont.appendChild(lista);
  }
}

function pintarCancha() {
  const pos = POSICIONES_CANCHA[estado.posicion];
  const marca = $(".cancha__marca");
  if (!marca) return;
  marca.hidden = !pos;
  if (pos) {
    // La duracion crece con la distancia
    const antes = { x: parseFloat(marca.style.getPropertyValue("--x")), y: parseFloat(marca.style.getPropertyValue("--y")) };
    const distancia = Number.isNaN(antes.x) ? 0 : Math.hypot(pos.x - antes.x, pos.y - antes.y);
    marca.style.setProperty("--dur", (0.35 + Math.min(distancia, 100) / 100 * 0.55).toFixed(2) + "s");
    marca.style.setProperty("--x", pos.x + "%");
    marca.style.setProperty("--y", pos.y + "%");
  }
  $("#pos-elegida").textContent = etiqueta(estado.posicion);
}

function armarPaises() {
  const sel = $("#pais");
  sel.appendChild(new Option("", ""));
  Object.keys(EQUIPOS_POR_PAIS).forEach((p) => sel.appendChild(new Option(p, p)));
  sel.appendChild(new Option("", "__otro"));
  sel.addEventListener("change", () => {
    estado.pais = sel.value;
    estado.equipo = "";
    armarEquipos();
    pintarSeleccion();
  });
  $("#equipo").addEventListener("change", (e) => { estado.equipo = e.target.value; });
}

function armarEquipos() {
  const sel = $("#equipo");
  sel.innerHTML = "";
  const equipos = EQUIPOS_POR_PAIS[estado.pais] || [];
  sel.appendChild(new Option("", ""));
  equipos.forEach((e) => sel.appendChild(new Option(e, e)));
  if (estado.pais) sel.appendChild(new Option("", "__otro"));
  sel.disabled = !estado.pais;
  traducirEquipos();
}

function traducirEquipos() {
  $$("#pais option").forEach((o) => {
    o.textContent = o.value === "" ? t("pais.sin") : o.value === "__otro" ? t("pais.otro") : etiqueta(o.value);
  });
  $$("#equipo option").forEach((o) => {
    o.textContent = o.value === "" ? (estado.pais ? t("equipo.sin") : t("equipo.elige"))
      : o.value === "__otro" ? t("equipo.otro") : etiqueta(o.value);
  });
}

function armarPie() {
  const cont = $("#pie_habil");
  INFO.opciones.pie_habil.forEach((p) => {
    const b = crear("button", "", `<span class="lbl"></span>`);
    b.type = "button";
    b.dataset.valor = p;
    b.addEventListener("click", () => { estado.pie_habil = p; pintarSeleccion(); });
    cont.appendChild(b);
  });
}

function armarTipos() {
  const rapidos = $("#tipos-rapidos");
  TIPOS_RAPIDOS.filter((tipo) => INFO.opciones.tipo_lesion.includes(tipo)).forEach((tipo) => {
    const b = crear("button", "chip-tipo", `<span class="lbl"></span>`);
    b.type = "button";
    b.dataset.valor = tipo;
    b.addEventListener("click", () => elegirTipo(tipo));
    rapidos.appendChild(b);
  });

  const sel = $("#tipo_lesion");
  sel.appendChild(new Option("", ""));
  Object.entries(INFO.grupos_tipo || { "Tipos de lesión": INFO.opciones.tipo_lesion }).forEach(([grupo, tipos]) => {
    const og = document.createElement("optgroup");
    og.dataset.grupo = grupo;
    tipos.forEach((tipo) => og.appendChild(new Option(tipo, tipo)));
    sel.appendChild(og);
  });
  sel.addEventListener("change", () => { if (sel.value) elegirTipo(sel.value); });
}

let zonaSugerida = null;

function elegirTipo(tipo) {
  estado.tipo_lesion = tipo;
  // Sugiere la zona mas comun para ese tipo
  const zona = (INFO.zona_por_tipo || {})[tipo];
  if (zona && INFO.opciones.zona_cuerpo.includes(zona) && zona !== estado.zona_cuerpo) {
    estado.zona_cuerpo = zona;
    zonaSugerida = zona;
  }
  pintarSeleccion();
  validar();
}

function elegirZona(zona) {
  estado.zona_cuerpo = zona;
  zonaSugerida = null;
  pintarSeleccion();
  validar();
}

function armarZonas() {
  const cont = $("#zona_cuerpo");
  const orden = Object.keys(ZONAS_SVG);
  const zonas = [...INFO.opciones.zona_cuerpo].sort((a, b) => orden.indexOf(a) - orden.indexOf(b));
  zonas.forEach((z) => {
    const b = crear("button", "zona", `<span class="lbl"></span><span class="ms" aria-hidden="true">check_circle</span>`);
    b.type = "button";
    b.dataset.valor = z;
    b.addEventListener("click", () => elegirZona(z));
    cont.appendChild(b);
  });
}

function traducirOpciones() {
  $$("#formulario [data-valor] > .lbl").forEach((lbl) => (lbl.textContent = etiqueta(lbl.parentElement.dataset.valor)));
  $$("#posiciones .pos").forEach((b) => {
    $(".pos__abrev", b).textContent = POSICIONES_CANCHA[b.dataset.valor].abrev[IDIOMA === "en" ? 1 : 0];
    b.title = etiqueta(b.dataset.valor);
  });
  $$("#tipo_lesion option").forEach((o) => (o.textContent = o.value ? etiqueta(o.value) : t("tipos.todos")));
  $$("#tipo_lesion optgroup").forEach((og) => (og.label = etiqueta(og.dataset.grupo)));
  traducirEquipos();
}

// Steppers
$$(".stepper").forEach((st) => {
  const campo = st.dataset.campo;
  const min = Number(st.dataset.min), max = Number(st.dataset.max);
  st.querySelectorAll(".stepper__btn").forEach((b) => {
    b.addEventListener("click", () => {
      const antes = estado[campo];
      estado[campo] = Math.min(max, Math.max(min, estado[campo] + Number(b.dataset.paso)));
      pintarSeleccion();
      validar();
      if (estado[campo] !== antes && !sinMovimiento()) {
        st.querySelector(".stepper__valor").animate(
          [{ scale: 1.3, translate: `0 ${Number(b.dataset.paso) > 0 ? -3 : 3}px` }, { scale: 1, translate: "0 0" }],
          { duration: 220, easing: "ease-out" });
      }
    });
  });
});

// Sliders
const SLIDERS = {
  altura_cm: (v) => t("u.cm", { n: v }),
  dias_baja_previos: (v) => (v >= 600 ? t("u.dias600") : t("u.dias", { n: v })),
  dias_baja_ultimo_anio: (v) => t("u.dias", { n: v }),
  partidos_temporada_anterior: (v) => t("u.partidos", { n: v }),
};
Object.keys(SLIDERS).forEach((id) => {
  $("#" + id).addEventListener("input", (e) => { estado[id] = Number(e.target.value); pintarSeleccion(); validar(); });
});

// Fecha
$("#fecha").max = hoyISO();
$("#fecha").addEventListener("change", (e) => { estado.fecha = e.target.value; pintarSeleccion(); validar(); });

// ---------- Pintar la seleccion ----------
function marcar(selector, valor) {
  $$(selector).forEach((b) => {
    const sel = b.dataset.valor === valor;
    b.classList.toggle("is-sel", sel);
    b.setAttribute("aria-pressed", sel);
  });
}

function pintarSeleccion() {
  marcar("#posiciones [data-valor]", estado.posicion);
  pintarCancha();
  marcar("#pie_habil button", estado.pie_habil);
  marcar("#tipos-rapidos .chip-tipo", estado.tipo_lesion);
  marcar("#zona_cuerpo .zona", estado.zona_cuerpo);
  const nota = zonaSugerida ? t("zona.sugerida", { z: etiqueta(zonaSugerida) }) : "";
  if ($("#zona-sugerida").textContent !== nota) $("#zona-sugerida").textContent = nota;
  $("#pais").value = estado.pais;
  $("#equipo").value = estado.equipo;
  $("#tipo_lesion").value = estado.tipo_lesion;

  ["edad", "lesiones_previas", "lesiones_previas_mismo_tipo"].forEach((c) => ($("#" + c).textContent = estado[c]));

  Object.entries(SLIDERS).forEach(([id, txt]) => {
    const s = $("#" + id);
    s.value = estado[id];
    s.style.setProperty("--p", ((s.value - s.min) / (s.max - s.min)) * 100 + "%");
    $("#" + (id === "altura_cm" ? "altura-txt" : id + "-txt")).textContent = txt(estado[id]);
  });

  const tipo = estado.tipo_lesion;
  $("#diag-nombre").textContent = etiqueta(tipo);
  const mediana = (INFO.mediana_dias_por_tipo || {})[tipo];
  $("#diag-mediana").textContent = mediana !== undefined ? t("diag.mediana", { d: mediana }) : "—";
  const grupo = Object.entries(INFO.grupos_tipo || {}).find(([, ts]) => ts.includes(tipo));
  $("#diag-grupo").textContent = grupo ? t("diag.grupo", { g: etiqueta(grupo[0]) }) : "";

  const xy = ZONAS_SVG[estado.zona_cuerpo];
  const punto = $("#zona-punto");
  punto.style.opacity = xy ? 1 : 0;
  if (xy) { punto.setAttribute("cx", xy[0]); punto.setAttribute("cy", xy[1]); }
  $("#zona-tag").textContent = estado.zona_cuerpo === "No especificada" ? t("zona.sin") : etiqueta(estado.zona_cuerpo);

  $("#fecha").value = estado.fecha;
  const dias = Math.round((fechaDesdeISO(hoyISO()) - fechaDesdeISO(estado.fecha || hoyISO())) / 86400000);
  $("#fecha-hace").textContent = !estado.fecha ? t("fecha.sin") : dias === 0 ? t("fecha.hoy")
    : dias > 0 ? t("fecha.hace", { n: dias, s: plural(dias) }) : t("fecha.futuro");
}

// ---------- RF-04 Validacion ----------
function validar() {
  const errores = [];
  if (!INFO.opciones.posicion.includes(estado.posicion)) errores.push("err.posicion");
  if (!INFO.opciones.tipo_lesion.includes(estado.tipo_lesion)) errores.push("err.tipo");
  if (!INFO.opciones.zona_cuerpo.includes(estado.zona_cuerpo)) errores.push("err.zona");
  if (!estado.fecha) errores.push("err.fecha");
  else if (estado.fecha > hoyISO()) errores.push("err.futuro");
  if (estado.lesiones_previas_mismo_tipo > estado.lesiones_previas) errores.push("err.recaidas");
  if (estado.dias_baja_ultimo_anio > estado.dias_baja_previos) errores.push("err.ultimo");
  if (estado.lesiones_previas === 0 && estado.dias_baja_previos > 0) errores.push("err.sinprevias");
  if (estado.lesiones_previas > 0 && estado.dias_baja_previos === 0) errores.push("err.previas");

  const caja = $("#integridad");
  caja.classList.toggle("is-error", errores.length > 0);
  caja.querySelector(".ms").textContent = errores.length ? "error" : "task_alt";
  // Solo se reescribe si cambia, para no repetirlo en lectores de pantalla
  const resumen = errores.length ? t("int.errores", { n: errores.length, s: plural(errores.length) }) : t("int.ok");
  const lista = errores.map((e) => `<li>${t(e)}</li>`).join("");
  if ($("#integridad-txt").textContent !== resumen) $("#integridad-txt").textContent = resumen;
  if ($("#integridad-errores").innerHTML !== lista) $("#integridad-errores").innerHTML = lista;

  $('[data-paso="jugador"]').classList.toggle("is-ok", !errores.includes("err.posicion"));
  $('[data-paso="lesion"]').classList.toggle("is-ok", !errores.some((e) => ERRORES_LESION.includes(e)));
  $('[data-paso="historial"]').classList.toggle("is-ok", !errores.some((e) => ERRORES_HISTORIAL.includes(e)));
  return errores;
}

// ---------- RF-05 Envio del formulario ----------
$("#formulario").addEventListener("submit", async (e) => {
  e.preventDefault();
  const errores = validar();
  if (errores.length) {
    $("#integridad").scrollIntoView({ behavior: sinMovimiento() ? "auto" : "smooth", block: "center" });
    mostrarToast(t(errores[0]));
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
  boton.setAttribute("aria-busy", "true");
  $(".btn__txt", boton).textContent = t("btn.calculando");
  $(".btn__ic", boton).textContent = "progress_activity";
  try {
    const resp = await fetch("/api/estimar", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(datos),
    });
    const r = await resp.json();
    if (!r.ok) { mostrarToast(r.errores.join(" ")); return; }
    ultimoResultado = r;
    pintarResultado(r);
    $$('[data-vista="resultado"]').forEach((b) => (b.disabled = false));
    await irA("resultado");
    animarResultado(r);
  } catch (err) {
    mostrarToast(t("toast.conexion"));
  } finally {
    boton.classList.remove("is-cargando");
    boton.removeAttribute("aria-busy");
    $(".btn__txt", boton).textContent = t("btn.calcular");
    $(".btn__ic", boton).textContent = "arrow_forward";
  }
});

// RF-09 Limpiar y nueva consulta
function limpiar() {
  Object.assign(estado, ESTADO_INICIAL, { fecha: hoyISO() });
  zonaSugerida = null;
  $("#nombre").value = "";
  $("#apellido").value = "";
  armarEquipos();
  pintarSeleccion();
  validar();
}
$("#btn-limpiar").addEventListener("click", limpiar);
$("#btn-nueva").addEventListener("click", () => { limpiar(); irA("formulario"); });
$("#btn-imprimir").addEventListener("click", () => window.print());

// ---------- Informe PDF ----------
function esc(texto) {
  const span = document.createElement("span");
  span.textContent = texto;
  return span.innerHTML;
}

function nombreCompleto() {
  return [$("#nombre").value, $("#apellido").value].map((s) => s.trim()).filter(Boolean).join(" ");
}

// "Informe Juan Vanegas - 2026-10-18"
function nombreArchivoPDF() {
  const limpiar = (s) => s.replace(/[\\/:*?"<>|#]+/g, " ").replace(/\s+/g, " ").trim();
  const nombre = limpiar($("#nombre").value), apellido = limpiar($("#apellido").value);
  const quien = apellido ? `${nombre.split(" ")[0]} ${apellido.split(" ")[0]}`.trim() : nombre;
  return `${t("archivo.prefijo")}${quien ? " " + quien : ""} - ${hoyISO()}`;
}

// El navegador usa el titulo de la pagina como nombre del PDF
let tituloAntesDeImprimir = null;
addEventListener("beforeprint", () => {
  if (!ultimoResultado || !$("#informe").innerHTML) return;
  tituloAntesDeImprimir = document.title;
  document.title = nombreArchivoPDF();
});
addEventListener("afterprint", () => {
  if (tituloAntesDeImprimir) document.title = tituloAntesDeImprimir;
  tituloAntesDeImprimir = null;
});

// CIE-10 sugerido; el profesional debe verificarlo
const CIE10_SUGERIDO = {
  "Esguince de tobillo": "S93.4",
  "Lesión de isquiotibiales": "S76.3",
  "Lesión de aductores / ingle": "S76.2",
  "Lesión de ligamento cruzado": "S83.5",
  "Lesión de menisco": "S83.2",
  "Lesión del tendón de Aquiles": "S86.0",
  "Lesión de pantorrilla (gemelo)": "S86.1",
  "Fractura de pie": "S92.9",
};

function fechaNum(f) {
  return f.toLocaleDateString(localeActual(), { day: "2-digit", month: "2-digit", year: "numeric" });
}

function armarInforme(r) {
  const [bajo, alto] = r.rango;
  const ahora = new Date();
  const dosDig = (n) => String(n).padStart(2, "0");
  const numero = `KT-${hoyISO().replaceAll("-", "")}-${dosDig(ahora.getHours())}${dosDig(ahora.getMinutes())}`;
  const hora = ahora.toLocaleTimeString(localeActual(), { hour: "2-digit", minute: "2-digit" });
  const mae = num(INFO.metricas_validacion_por_jugador.MAE, 1);
  const lista = r.influyentes.filter((i) => Math.abs(i.efecto) >= 0.5);
  const maximo = Math.max(...lista.map((i) => Math.abs(i.efecto)), 1);
  const fases = [["res.f1", 0], ["res.f2", bajo], ["res.f3", r.dias], ["res.f4", alto]];
  const par = (clave, valor, clase = "") => `<th scope="row">${t(clave)}</th><td class="${clase}">${valor}</td>`;
  const blanco = `<span class="inf__blanco"></span>`;

  $("#informe").innerHTML = `
    <header class="inf__cab">
      <div class="inf__marca">
        <span class="inf__logo">KT</span>
        <b>KineTrack AI</b>
      </div>
      <table class="inf__meta">
        <tr>${par("inf.numero", numero)}</tr>
        <tr>${par("inf.elaboracion", `${fechaNum(ahora)} ${hora}`)}</tr>
      </table>
    </header>
    <h1 class="inf__titulo">${t("inf.titulo")}</h1>

    <section>
      <h2>1. ${t("inf.paciente")}</h2>
      <table class="inf__rejilla">
        <tr>${par("inf.nombres", esc(nombreCompleto()) || blanco)}${par("inf.documento", blanco)}</tr>
        <tr>${par("inf.edad", t("u.anios", { n: estado.edad }))}${par("inf.estatura", t("u.cm", { n: estado.altura_cm }))}</tr>
        <tr>${par("inf.posicion", etiqueta(estado.posicion))}${par("inf.pie", etiqueta(estado.pie_habil))}</tr>
        <tr>${par("inf.equipo", esc(textoEquipo() || "—"))}${par("inf.aseguradora", blanco)}</tr>
      </table>
    </section>

    <section>
      <h2>2. ${t("inf.lesion")}</h2>
      <table class="inf__rejilla">
        <tr>${par("inf.diagnostico", etiqueta(estado.tipo_lesion))}${par("inf.cie10", CIE10_SUGERIDO[estado.tipo_lesion] || blanco)}</tr>
        <tr>${par("inf.zona", etiqueta(estado.zona_cuerpo))}${par("inf.fecha", fechaNum(fechaDesdeISO(estado.fecha)))}</tr>
      </table>
    </section>

    <section>
      <h2>3. ${t("inf.antecedentes")}</h2>
      <table class="inf__rejilla">
        <tr>${par("inf.previas", estado.lesiones_previas)}${par("inf.recaidas", estado.lesiones_previas_mismo_tipo)}</tr>
        <tr>${par("inf.acumulados", t("u.dias", { n: estado.dias_baja_previos }))}${par("inf.ultimo", t("u.dias", { n: estado.dias_baja_ultimo_anio }))}</tr>
        <tr>${par("inf.partidos", estado.partidos_temporada_anterior)}<th></th><td></td></tr>
      </table>
    </section>

    <section>
      <h2>4. ${t("inf.resultado")}</h2>
      <div class="inf__resultado">
        <div class="inf__dias"><b>${r.dias}</b><span>${t("res.dias")}</span></div>
        <div class="inf__datos">
          <p><span>${t("res.rango")}</span> <b>${t("r.rango", { a: bajo, b: alto })}</b></p>
          <p><span>${t("inf.retorno")}</span> <b>${fechaNum(sumarDias(estado.fecha, r.dias))}</b></p>
          <p class="inf__nota">${t("r.rangonota", { mae })}</p>
        </div>
        <table class="inf__fases">
          <thead><tr><th scope="col">${t("inf.fase")}</th><th scope="col">${t("inf.dia")}</th><th scope="col">${t("inf.fechacol")}</th></tr></thead>
          ${fases.map(([clave, dia]) => `<tr><td>${t(clave)}</td><td>${dia}</td><td>${fechaNum(sumarDias(estado.fecha, dia))}</td></tr>`).join("")}
        </table>
      </div>
    </section>

    <section>
      <h2>5. ${t("inf.factores")}</h2>
      <table class="inf__factores">
        <thead><tr><th scope="col">${t("inf.variable")}</th><th scope="col" class="inf__barra">${t("inf.peso")}</th><th scope="col" class="inf__efecto">${t("inf.efecto")}</th></tr></thead>
        ${lista.length ? lista.map((i) => `<tr>
          <td>${etiqueta(i.variable)}</td>
          <td class="inf__barra"><i class="${i.efecto >= 0 ? "sube" : "baja"}" style="width:${(Math.abs(i.efecto) / maximo) * 100}%"></i></td>
          <td class="inf__efecto">${i.efecto >= 0 ? "+" : "−"}${t("r.diasunidad", { n: num(Math.abs(i.efecto), 1) })}</td>
        </tr>`).join("") : `<tr><td colspan="3">${t("r.vacio")}</td></tr>`}
      </table>
      <p class="inf__nota">${t("inf.base", { base: r.base })}</p>
    </section>

    <section>
      <h2>6. ${t("inf.observaciones")}</h2>
      <div class="inf__lineas"><span></span><span></span><span></span></div>
    </section>

    <section class="inf__firma">
      <div><span class="inf__linea-firma"></span>${t("inf.firma")}</div>
      <table>
        <tr>${par("inf.profesional", blanco)}</tr>
        <tr>${par("inf.registro", blanco)}</tr>
      </table>
    </section>`;
}

// ---------- RF-06 a RF-08 Resultado ----------
function textoEquipo() {
  if (!estado.equipo) return estado.pais && estado.pais !== "__otro" ? etiqueta(estado.pais) : "";
  const equipo = estado.equipo === "__otro" ? t("equipo.otro") : etiqueta(estado.equipo);
  return estado.pais && estado.pais !== "__otro" ? `${equipo} (${etiqueta(estado.pais)})` : equipo;
}

function pintarResultado(r) {
  $("#r-nombre").textContent = nombreCompleto() || t("r.sinnombre");
  $("#r-edad").textContent = t("u.anios", { n: estado.edad });
  const equipo = textoEquipo();
  $("#r-posicion").textContent = etiqueta(estado.posicion) + (equipo ? ` · ${equipo}` : "");
  $("#r-diagnostico").textContent = estado.zona_cuerpo === "No especificada"
    ? etiqueta(estado.tipo_lesion) : `${etiqueta(estado.tipo_lesion)} · ${etiqueta(estado.zona_cuerpo)}`;
  $("#r-titulo").textContent = t("r.titulo", { d: r.dias, a: r.rango[0], b: r.rango[1] });

  const [bajo, alto] = r.rango;
  $("#r-fecha-alta").textContent = fechaLarga(sumarDias(estado.fecha, r.dias));
  $("#r-rango").textContent = t("r.rango", { a: bajo, b: alto });
  const mae = INFO.metricas_validacion_por_jugador.MAE;
  $("#r-rango-nota").textContent = t("r.rangonota", { mae: num(mae, 1) });

  $("#t-lesion").textContent = fechaCorta(fechaDesdeISO(estado.fecha));
  $("#t-min").textContent = fechaCorta(sumarDias(estado.fecha, bajo));
  $("#t-est").textContent = fechaCorta(sumarDias(estado.fecha, r.dias));
  $("#t-max").textContent = fechaCorta(sumarDias(estado.fecha, alto));
  $("#t-lesion-dia").textContent = t("u.dia", { n: 0 });
  $("#t-min-dia").textContent = t("u.dia", { n: bajo });
  $("#t-est-dia").textContent = t("u.dia", { n: r.dias });
  $("#t-max-dia").textContent = t("u.dia", { n: alto });

  // Las claves llegan en espanol desde el servidor
  $("#r-base").textContent = ` ${r.base} d`;
  const valores = {
    "Tipo de lesión": etiqueta(estado.tipo_lesion), "Zona del cuerpo": etiqueta(estado.zona_cuerpo),
    "Posición": etiqueta(estado.posicion), "Pie hábil": etiqueta(estado.pie_habil), "Edad": t("u.anios", { n: estado.edad }),
    "Altura": t("u.cm", { n: estado.altura_cm }),
    "Mes de la lesión": fechaDesdeISO(estado.fecha).toLocaleDateString(localeActual(), { month: "long" }),
    "Lesiones previas": estado.lesiones_previas, "Días de baja acumulados": `${estado.dias_baja_previos} d`,
    "Días de baja en el último año": `${estado.dias_baja_ultimo_anio} d`,
    "Lesiones previas del mismo tipo": estado.lesiones_previas_mismo_tipo,
    "Partidos jugados la temporada anterior": estado.partidos_temporada_anterior,
  };
  const cont = $("#r-influyentes");
  cont.innerHTML = "";
  const lista = r.influyentes.filter((i) => Math.abs(i.efecto) >= 0.5);
  if (!lista.length) cont.appendChild(crear("p", "infl--vacio", t("r.vacio")));
  const maximo = Math.max(...lista.map((i) => Math.abs(i.efecto)), 1);
  lista.forEach((i) => {
    const color = i.efecto >= 0 ? "var(--sube)" : "var(--baja)";
    const signo = i.efecto >= 0 ? "+" : "−";
    const fila = crear("div", "infl");
    fila.style.setProperty("--c", color);
    fila.innerHTML = `
      <div class="infl__cab"><span>${etiqueta(i.variable)} (${valores[i.variable] ?? ""})</span><b>${signo}${t("r.diasunidad", { n: num(Math.abs(i.efecto), 1) })}</b></div>
      <div class="infl__barra"><i data-ancho="${(Math.abs(i.efecto) / maximo) * 100}%"></i></div>`;
    cont.appendChild(fila);
  });

  const top = lista.slice(0, 2).map((i) => `<b>${etiqueta(i.variable).toLowerCase()}</b> (${i.efecto >= 0 ? "+" : "−"}${num(Math.abs(i.efecto))} d)`);
  $("#r-resumen").innerHTML = top.length
    ? t("r.resumen", { base: r.base, top: top.join(t("r.y")), d: r.dias })
    : t("r.resumencorto", { base: r.base, d: r.dias });

  armarInforme(r);
}

function mostrarResultadoFinal(r) {
  const circ = 2 * Math.PI * 82;
  const anillo = $("#anillo-valor");
  anillo.style.strokeDasharray = circ;
  anillo.style.strokeDashoffset = circ * (1 - Math.max(0.04, Math.min(r.dias / 365, 1)));
  $("#r-dias").textContent = r.dias;
  $$("#r-influyentes [data-ancho]").forEach((b) => (b.style.width = b.dataset.ancho));
}

function animarResultado(r) {
  if (sinMovimiento()) { mostrarResultadoFinal(r); return; }
  const circ = 2 * Math.PI * 82;
  const anillo = $("#anillo-valor");
  anillo.style.strokeDasharray = circ;
  anillo.style.strokeDashoffset = circ;
  const fraccion = Math.max(0.04, Math.min(r.dias / 365, 1));
  requestAnimationFrame(() => requestAnimationFrame(() => (anillo.style.strokeDashoffset = circ * (1 - fraccion))));

  const el = $("#r-dias");
  const inicio = performance.now();
  const paso = (tiempo) => {
    const p = Math.min((tiempo - inicio) / 900, 1);
    el.textContent = Math.round(r.dias * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(paso);
  };
  requestAnimationFrame(paso);

  setTimeout(() => $$("#r-influyentes [data-ancho]").forEach((b) => (b.style.width = b.dataset.ancho)), 120);
}

// ---------- RF-10 Modelo e info ----------
function pintarInfo() {
  const m = INFO.metricas_validacion_por_jugador;
  $$(".js-modelo").forEach((e) => (e.textContent = INFO.modelo));
  const temporadas = INFO.temporadas || [];
  const tempTxt = temporadas.length ? `20${temporadas[0]} – 20${temporadas[temporadas.length - 1]}` : "";
  $("#i-subtitulo").textContent = t("i.subtitulo", {
    m: INFO.modelo, n: num(INFO.n_lesiones_entrenamiento), j: num(INFO.n_jugadores_entrenamiento),
    t: tempTxt ? t("i.temporadas", { t: tempTxt }) : "",
  });
  $("#i-mae").textContent = num(m.MAE, 1);
  $("#i-medae").textContent = num(m.MedAE, 1);
  $("#i-r2").textContent = num(m.R2, 2);
  $("#i-casos").textContent = t("i.casos", { n: num(INFO.n_lesiones_entrenamiento) });
  $("#i-casos-txt").textContent = t("i.casostxt", { j: num(INFO.n_jugadores_entrenamiento) });
  $("#i-temporadas").textContent = tempTxt;
  $("#i-n").textContent = `N = ${num(INFO.n_lesiones_entrenamiento)}`;

  const filas = {};
  (INFO.comparacion_modelos || []).forEach((f) => {
    filas[f.Modelo] = filas[f.Modelo] || {};
    if (f["Validación"].startsWith("Por jugador")) { filas[f.Modelo].cv = f.MAE; filas[f.Modelo].r2 = f.R2; }
    else filas[f.Modelo].temp = f.MAE;
  });
  $("#i-comparacion tbody").innerHTML = Object.entries(filas).map(([modelo, f]) => `
    <tr class="${modelo === INFO.modelo ? "is-mejor" : ""}">
      <td data-mejor="${t("i.mejor")}">${etiqueta(modelo)}</td><td>${num(f.cv, 1)} d</td><td>${num(f.temp, 1)} d</td><td>${num(f.r2, 2)}</td>
    </tr>`).join("");

  const colores = [1, 2, 3, 4, 5].map((n) => `var(--serie-${n})`);
  const dist = INFO.distribucion_tipos || [];
  $("#i-dist-barra").innerHTML = dist.map((d, i) => `<i style="width:${d.porcentaje}%;background:${colores[i % colores.length]}" title="${etiqueta(d.grupo)}"></i>`).join("");
  $("#i-dist-leyenda").innerHTML = dist.map((d, i) =>
    `<div class="dist-item" style="--c:${colores[i % colores.length]}"><span>${etiqueta(d.grupo)}</span><b>${num(d.porcentaje)}%</b></div>`).join("");

  const imp = Object.entries(INFO.importancia_global || {}).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxImp = Math.max(...imp.map(([, v]) => v), 0.0001);
  $("#i-importancia").innerHTML = imp.map(([v, val]) => `
    <div class="imp"><span>${etiqueta(NOMBRE_VARIABLE[v] || v)}</span>
      <div class="imp__barra"><i style="width:${(val / maxImp) * 100}%"></i></div>
      <b>${num(val * 100, 1)}%</b></div>`).join("");
}

// ---------- Inicio ----------
capturarTextosES();
traducirTextosFijos();
pintarAjustes();
aplicarAccesibilidad();
$(".btn__txt", $("#btn-calcular")).textContent = t("btn.calcular");

async function iniciar() {
  try {
    const resp = await fetch("/api/info");
    if (!resp.ok) throw new Error(resp.status);
    INFO = await resp.json();
  } catch (e) {
    mostrarToast(t("toast.modelo"));
    return;
  }
  // Si una opcion por defecto no existe en el modelo, se usa la primera
  ["posicion", "pie_habil", "tipo_lesion", "zona_cuerpo"].forEach((c) => {
    if (!INFO.opciones[c].includes(estado[c])) estado[c] = ESTADO_INICIAL[c] = INFO.opciones[c][0];
  });

  armarPosiciones();
  armarPaises();
  armarEquipos();
  armarPie();
  armarTipos();
  armarZonas();
  traducirOpciones();
  pintarSeleccion();
  validar();
  pintarInfo();
  aplicarRuta();
}
iniciar();
