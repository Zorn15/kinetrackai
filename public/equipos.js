// Equipos por pais: solo informativo, el modelo no los usa

const EQUIPOS_POR_PAIS = {
  "Colombia": [
    "Águilas Doradas", "Alianza FC", "América de Cali", "Atlético Bucaramanga", "Atlético Huila",
    "Atlético Nacional", "Boyacá Chicó", "Cúcuta Deportivo", "Deportes Tolima", "Deportivo Cali",
    "Deportivo Pasto", "Deportivo Pereira", "Envigado FC", "Fortaleza CEIF", "Independiente Medellín",
    "Independiente Santa Fe", "Jaguares de Córdoba", "Junior FC", "Llaneros FC", "Millonarios FC",
    "Once Caldas", "Patriotas Boyacá", "Real Cartagena", "Unión Magdalena",
  ],
  "Alemania": [
    "1. FC Heidenheim", "1. FC Köln", "1. FC Union Berlin", "1. FSV Mainz 05", "Bayer Leverkusen",
    "Bayern Múnich", "Borussia Dortmund", "Borussia Mönchengladbach", "Eintracht Frankfurt", "FC Augsburg",
    "FC St. Pauli", "Hamburger SV", "RB Leipzig", "SC Freiburg", "TSG Hoffenheim",
    "VfB Stuttgart", "VfL Wolfsburg", "Werder Bremen",
  ],
  "Argentina": [
    "Aldosivi", "Argentinos Juniors", "Atlético Tucumán", "Banfield", "Barracas Central",
    "Belgrano", "Boca Juniors", "Central Córdoba", "Defensa y Justicia", "Deportivo Riestra",
    "Estudiantes de La Plata", "Gimnasia y Esgrima La Plata", "Godoy Cruz", "Huracán", "Independiente",
    "Independiente Rivadavia", "Instituto", "Lanús", "Newell's Old Boys", "Platense",
    "Racing Club", "River Plate", "Rosario Central", "San Lorenzo", "Sarmiento",
    "Talleres", "Tigre", "Unión de Santa Fe", "Vélez Sarsfield",
  ],
  "Brasil": [
    "Athletico Paranaense", "Atlético Mineiro", "Bahia", "Botafogo", "Ceará",
    "Corinthians", "Cruzeiro", "Flamengo", "Fluminense", "Fortaleza",
    "Grêmio", "Internacional", "Juventude", "Mirassol", "Palmeiras",
    "Red Bull Bragantino", "Santos", "São Paulo", "Sport Recife", "Vasco da Gama", "Vitória",
  ],
  "Chile": [
    "Audax Italiano", "Cobreloa", "Cobresal", "Colo-Colo", "Coquimbo Unido",
    "Deportes Iquique", "Deportes La Serena", "Everton de Viña del Mar", "Huachipato", "Ñublense",
    "O'Higgins", "Palestino", "Unión Española", "Unión La Calera", "Universidad Católica", "Universidad de Chile",
  ],
  "Ecuador": [
    "Aucas", "Barcelona SC", "Delfín SC", "Deportivo Cuenca", "El Nacional",
    "Emelec", "Independiente del Valle", "LDU Quito", "Libertad FC", "Macará",
    "Mushuc Runa", "Orense SC", "Técnico Universitario", "Universidad Católica (Ecuador)",
  ],
  "España": [
    "Athletic Club", "Atlético de Madrid", "CA Osasuna", "Celta de Vigo", "Deportivo Alavés",
    "Elche CF", "FC Barcelona", "Getafe CF", "Girona FC", "Levante UD",
    "Rayo Vallecano", "RCD Espanyol", "RCD Mallorca", "Real Betis", "Real Madrid",
    "Real Oviedo", "Real Sociedad", "Sevilla FC", "UD Las Palmas", "Valencia CF", "Villarreal CF",
  ],
  "Francia": [
    "AJ Auxerre", "Angers SCO", "AS Mónaco", "FC Lorient", "FC Metz",
    "FC Nantes", "Le Havre AC", "LOSC Lille", "OGC Niza", "Olympique de Lyon",
    "Olympique de Marsella", "Paris FC", "Paris Saint-Germain", "RC Estrasburgo", "RC Lens",
    "Stade Brestois", "Stade Rennais", "Toulouse FC",
  ],
  "Inglaterra": [
    "Arsenal", "Aston Villa", "Bournemouth", "Brentford", "Brighton & Hove Albion",
    "Burnley", "Chelsea", "Crystal Palace", "Everton", "Fulham",
    "Leeds United", "Liverpool", "Manchester City", "Manchester United", "Newcastle United",
    "Nottingham Forest", "Sunderland", "Tottenham Hotspur", "West Ham United", "Wolverhampton",
  ],
  "Italia": [
    "AC Milan", "AS Roma", "Atalanta", "Bologna", "Cagliari",
    "Como", "Cremonese", "Fiorentina", "Genoa", "Hellas Verona",
    "Inter de Milán", "Juventus", "Lazio", "Lecce", "Napoli",
    "Parma", "Pisa", "Sassuolo", "Torino", "Udinese",
  ],
  "México": [
    "América", "Atlas", "Atlético San Luis", "Cruz Azul", "FC Juárez",
    "Guadalajara (Chivas)", "León", "Mazatlán FC", "Monterrey", "Necaxa",
    "Pachuca", "Puebla", "Pumas UNAM", "Querétaro", "Santos Laguna",
    "Tigres UANL", "Tijuana", "Toluca",
  ],
  "Perú": [
    "ADT", "Alianza Atlético", "Alianza Lima", "Atlético Grau", "Cienciano",
    "Comerciantes Unidos", "Cusco FC", "Deportivo Garcilaso", "FBC Melgar", "Juan Pablo II College",
    "Los Chankas", "Sport Boys", "Sport Huancayo", "Sporting Cristal", "Universitario", "UTC Cajamarca",
  ],
  "Portugal": [
    "Arouca", "AVS", "Boavista", "Casa Pia", "Estoril Praia",
    "Estrela da Amadora", "FC Porto", "Famalicão", "Gil Vicente", "Moreirense",
    "Nacional (Madeira)", "Rio Ave", "Santa Clara", "SC Braga", "SL Benfica",
    "Sporting CP", "Tondela", "Vitória de Guimarães",
  ],
  "Uruguay": [
    "Boston River", "Cerro", "Cerro Largo", "Danubio", "Defensor Sporting",
    "Juventud de Las Piedras", "Liverpool (Uruguay)", "Miramar Misiones", "Montevideo City Torque", "Montevideo Wanderers",
    "Nacional", "Peñarol", "Plaza Colonia", "Progreso", "Racing (Montevideo)", "River Plate (Uruguay)",
  ],
};
