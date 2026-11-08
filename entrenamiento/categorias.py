# -*- coding: utf-8 -*-
"""
categorias.py
-------------
Reglas para pasar el texto de la lesion (que viene en ingles y con 275 formas
distintas de escribirse) a categorias en espanol mas generales.

Este archivo lo usan:
  - 01_unir_y_preprocesar.py  (para preparar los datos)
  - prediccion.py / app.py    (para que el formulario de la web use las mismas categorias)
"""

import re

# ---------------------------------------------------------------------------
# 1) Registros que NO son lesiones (enfermedades, covid, descanso, etc.)
#    Se sacan del entrenamiento porque el proyecto trata de lesiones.
# ---------------------------------------------------------------------------
PATRON_NO_LESION = re.compile(
    r"corona|covid|quarantine|^ill$|illness|flu|influenza|\bcold\b|fever|virus|"
    r"infection|tonsil|stomach|sick|pneumonia|bronch|append|gastro|depress|cancer|tumou?r|"
    r"angina|mononucle|circulat|blood|pneumothorax|accident|"
    r"^rest$|fitness|unknown|personal|suspen|vaccin|dental|tooth|malaria|"
    r"mumps|measles|chickenpox|pfeiffer|kidney|heart|cardiac|food poison"
)


def es_lesion(texto):
    """Devuelve True si el registro es una lesion fisica y False si es enfermedad u otro motivo."""
    return not PATRON_NO_LESION.search(texto)


# ---------------------------------------------------------------------------
# 2) Tipo de lesion: se revisan las reglas EN ORDEN y se usa la primera que coincida.
#    (Por eso las mas especificas, como "ligamento cruzado", van primero.)
# ---------------------------------------------------------------------------
REGLAS_TIPO = [
    (r"cruciate", "Lesión de ligamento cruzado"),
    (r"menisc", "Lesión de menisco"),
    (r"achilles", "Lesión del tendón de Aquiles"),
    (r"metatars|(foot|toe).*(fracture|broken)|(fracture|broken).*(foot|toe)", "Fractura de pie"),
    (r"fracture|broken|fissure", "Fractura (otra zona)"),
    (r"(knee|patell).*(surgery|operation)|(surgery|operation).*knee", "Cirugía de rodilla"),
    (r"surgery|operation", "Cirugía (otra zona)"),
    (r"ankle sprain|sprained ankle|syndesmosis|ankle ligament|ligament.*ankle", "Esguince de tobillo"),
    (r"ankle", "Lesión de tobillo"),
    (r"knee|patell", "Lesión de rodilla"),
    (r"hamstring", "Lesión de isquiotibiales"),
    (r"calf", "Lesión de pantorrilla (gemelo)"),
    (r"adductor|groin|pubalgia|pubic|inguinal|hernia", "Lesión de aductores / ingle"),
    (r"thigh|quadricep|dead leg", "Lesión de muslo"),
    (r"torn|tear|rupture|fiber|fibre|bundle", "Desgarro muscular"),
    (r"fatigue", "Fatiga muscular"),
    (r"muscle|muscular|strain|pulled|contracture|overstretch", "Lesión muscular (sin zona)"),
    (r"foot|toe|heel|plantar|arch", "Lesión de pie"),
    (r"back|lumbago|spine|spinal|vertebra|disc|lumbar|sciatic", "Lesión de espalda"),
    (r"hip|pelvi", "Lesión de cadera"),
    (r"shoulder|collarbone|clavicle|acromioclavicular", "Lesión de hombro"),
    (r"head|concussion|face|facial|nose|eye|jaw|cheek|skull|neck", "Lesión de cabeza / cuello"),
    (r"arm|hand|finger|wrist|elbow|thumb", "Lesión de brazo / mano"),
    (r"rib|abdom|chest|torso", "Lesión de tronco (costillas / abdomen)"),
    (r"knock|bruise|contusion|blow|bump", "Golpe / contusión"),
    (r"inflammation|tendinitis|tendon|irritation|edema|oedema", "Inflamación / tendinitis"),
    (r"ligament|sprain|capsul", "Lesión de ligamentos (otra zona)"),
    (r"leg|shin|tibia|fibula", "Lesión de pierna"),
]
REGLAS_TIPO = [(re.compile(p), nombre) for p, nombre in REGLAS_TIPO]


def tipo_lesion(texto):
    """Convierte el texto original (en ingles) a una categoria en espanol."""
    for patron, nombre in REGLAS_TIPO:
        if patron.search(texto):
            return nombre
    return "Otra lesión"


# ---------------------------------------------------------------------------
# 3) Zona del cuerpo afectada (se saca del mismo texto)
# ---------------------------------------------------------------------------
REGLAS_ZONA = [
    (r"cruciate|menisc|knee|patell", "Rodilla"),
    (r"ankle|syndesmosis|achilles", "Tobillo"),
    (r"hamstring|thigh|quadricep|dead leg", "Muslo"),
    (r"adductor|groin|pubalgia|pubic|inguinal|hernia", "Ingle / aductores"),
    (r"calf|shin|tibia|fibula|leg", "Pierna / pantorrilla"),
    (r"metatars|foot|toe|heel|plantar|arch", "Pie"),
    (r"hip|pelvi", "Cadera"),
    (r"back|lumbago|spine|spinal|vertebra|disc|lumbar|sciatic", "Espalda"),
    (r"shoulder|collarbone|clavicle|acromioclavicular", "Hombro"),
    (r"head|concussion|face|facial|nose|eye|jaw|cheek|skull|neck", "Cabeza / cuello"),
    (r"arm|hand|finger|wrist|elbow|thumb", "Brazo / mano"),
    (r"rib|abdom|chest|torso", "Tronco"),
]
REGLAS_ZONA = [(re.compile(p), nombre) for p, nombre in REGLAS_ZONA]


def zona_cuerpo(texto):
    for patron, nombre in REGLAS_ZONA:
        if patron.search(texto):
            return nombre
    return "No especificada"


# ---------------------------------------------------------------------------
# 4) Traducciones de posicion y pie habil
# ---------------------------------------------------------------------------
POSICIONES = {
    "Goalkeeper": "Portero",
    "Centre-Back": "Defensa central",
    "Left-Back": "Lateral izquierdo",
    "Right-Back": "Lateral derecho",
    "Defensive Midfield": "Mediocentro defensivo",
    "Central Midfield": "Mediocentro",
    "Midfielder": "Mediocentro",
    "Attacking Midfield": "Mediapunta",
    "Left Midfield": "Volante izquierdo",
    "Right Midfield": "Volante derecho",
    "Left Winger": "Extremo izquierdo",
    "Right Winger": "Extremo derecho",
    "Second Striker": "Segundo delantero",
    "Forward": "Delantero centro",
}

PIE = {"right": "Derecho", "left": "Izquierdo", "both": "Ambos"}


# ---------------------------------------------------------------------------
# 5) Grupos grandes de lesion (solo para la grafica de distribucion en la web)
# ---------------------------------------------------------------------------
GRUPOS_TIPO = {
    "Musculares": [
        "Lesión de isquiotibiales", "Lesión de pantorrilla (gemelo)", "Lesión de aductores / ingle",
        "Lesión de muslo", "Desgarro muscular", "Fatiga muscular", "Lesión muscular (sin zona)",
    ],
    "Ligamentos y tendones": [
        "Lesión de ligamento cruzado", "Lesión de menisco", "Esguince de tobillo",
        "Lesión de ligamentos (otra zona)", "Lesión del tendón de Aquiles", "Inflamación / tendinitis",
    ],
    "Articulares y otras zonas": [
        "Lesión de rodilla", "Lesión de tobillo", "Lesión de cadera", "Lesión de hombro",
        "Lesión de espalda", "Lesión de pie", "Lesión de pierna",
    ],
    "Óseas y quirúrgicas": [
        "Fractura de pie", "Fractura (otra zona)", "Cirugía de rodilla", "Cirugía (otra zona)",
    ],
    "Golpes y otras": [
        "Golpe / contusión", "Lesión de cabeza / cuello", "Lesión de brazo / mano",
        "Lesión de tronco (costillas / abdomen)", "Otra lesión",
    ],
}
