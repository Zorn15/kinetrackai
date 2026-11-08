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

// Banderas simplificadas por pais (viewBox 30 x 20). Son decorativas.
const BANDERAS = {
  "Colombia": '<path fill="#fcd116" d="M0 0h30v10H0z"/><path fill="#003893" d="M0 10h30v5H0z"/><path fill="#ce1126" d="M0 15h30v5H0z"/>',
  "Alemania": '<path d="M0 0h30v7H0z"/><path fill="#d00" d="M0 7h30v6H0z"/><path fill="#ffce00" d="M0 13h30v7H0z"/>',
  "Argentina": '<path fill="#74acdf" d="M0 0h30v20H0z"/><path fill="#fff" d="M0 7h30v6H0z"/><circle cx="15" cy="10" r="2" fill="#f6b40e"/>',
  "Brasil": '<path fill="#009b3a" d="M0 0h30v20H0z"/><path fill="#fedf00" d="M15 2l13 8-13 8L2 10z"/><circle cx="15" cy="10" r="4" fill="#002776"/>',
  "Chile": '<path fill="#fff" d="M0 0h30v10H0z"/><path fill="#d52b1e" d="M0 10h30v10H0z"/><path fill="#0039a6" d="M0 0h10v10H0z"/><path fill="#fff" d="M5 2l.7 2h2.2L6.1 5.3l.7 2.1L5 6.1 3.2 7.4l.7-2.1L2.1 4h2.2z"/>',
  "Ecuador": '<path fill="#fd0" d="M0 0h30v10H0z"/><path fill="#034ea2" d="M0 10h30v5H0z"/><path fill="#ed1c24" d="M0 15h30v5H0z"/><circle cx="15" cy="10" r="2.5" fill="#7a5c2e"/>',
  "España": '<path fill="#aa151b" d="M0 0h30v20H0z"/><path fill="#f1bf00" d="M0 5h30v10H0z"/>',
  "Francia": '<path fill="#fff" d="M0 0h30v20H0z"/><path fill="#0055a4" d="M0 0h10v20H0z"/><path fill="#ef4135" d="M20 0h10v20H20z"/>',
  "Inglaterra": '<path fill="#fff" d="M0 0h30v20H0z"/><path fill="#ce1124" d="M13 0h4v20h-4zM0 8h30v4H0z"/>',
  "Italia": '<path fill="#fff" d="M0 0h30v20H0z"/><path fill="#008c45" d="M0 0h10v20H0z"/><path fill="#cd212a" d="M20 0h10v20H20z"/>',
  "México": '<path fill="#fff" d="M0 0h30v20H0z"/><path fill="#006847" d="M0 0h10v20H0z"/><path fill="#ce1126" d="M20 0h10v20H20z"/><circle cx="15" cy="10" r="2.5" fill="#8a5a2b"/>',
  "Perú": '<path fill="#d91023" d="M0 0h30v20H0z"/><path fill="#fff" d="M10 0h10v20H10z"/>',
  "Portugal": '<path fill="#f00" d="M0 0h30v20H0z"/><path fill="#060" d="M0 0h12v20H0z"/><circle cx="12" cy="10" r="3.5" fill="#fc0"/>',
  "Uruguay": '<path fill="#fff" d="M0 0h30v20H0z"/><path fill="#0038a8" d="M0 2.2h30v2.2H0zM0 6.7h30v2.2H0zM0 11.1h30v2.2H0zM0 15.6h30v2.2H0z"/><path fill="#fff" d="M0 0h11.1v11.1H0z"/><circle cx="5.5" cy="5.5" r="3" fill="#fcd116"/>',
};
