/**
 * Capítulos del Sistema Armonizado (SA) - 2 dígitos
 * Clasificación internacional de mercancías para aduanas
 */
export const HS_CHAPTERS: Record<string, string> = {
  "01": "Animales vivos",
  "02": "Carnes",
  "03": "Pescados y crustáceos",
  "04": "Lácteos, huevos, miel",
  "05": "Otros productos de origen animal",
  "06": "Plantas vivas y floricultura",
  "07": "Hortalizas y legumbres",
  "08": "Frutas y frutos comestibles",
  "09": "Café, té, yerba mate, especias",
  "10": "Cereales",
  "11": "Productos de molinería, malta, almidón",
  "12": "Semillas oleaginosas, plantas industriales",
  "13": "Gomas, resinas y jugos vegetales",
  "14": "Materias trenzables y otros productos vegetales",
  "15": "Grasas y aceites animales o vegetales",
  "16": "Preparaciones de carne o pescado",
  "17": "Azúcares y artículos de confitería",
  "18": "Cacao y sus preparaciones",
  "19": "Preparaciones a base de cereales",
  "20": "Preparaciones de hortalizas o frutas",
  "21": "Preparaciones alimenticias diversas",
  "22": "Bebidas, líquidos alcohólicos, vinagre",
  "23": "Residuos de industrias alimentarias, alimentos para animales",
  "24": "Tabaco y sucedáneos",
  "25": "Sal, azufre, tierras, piedras, yeso, cal, cemento",
  "26": "Minerales metalíferos, escorias",
  "27": "Combustibles, aceites minerales, ceras",
  "28": "Productos químicos inorgánicos",
  "29": "Productos químicos orgánicos",
  "30": "Productos farmacéuticos",
  "31": "Abonos y fertilizantes",
  "32": "Extractos curtientes, tintas, pinturas",
  "33": "Aceites esenciales, perfumería, cosmética",
  "34": "Jabones, ceras, velas",
  "35": "Materias albuminoideas, colas, enzimas",
  "36": "Pólvoras, explosivos, fósforos",
  "37": "Productos fotográficos o cinematográficos",
  "38": "Productos diversos de industria química",
  "39": "Plásticos y sus manufacturas",
  "40": "Caucho y sus manufacturas",
  "41": "Pieles y cueros",
  "42": "Manufacturas de cuero, marroquinería",
  "43": "Peletería y confecciones de piel",
  "44": "Madera, carbón vegetal",
  "45": "Corcho y sus manufacturas",
  "46": "Manufacturas de espartería o cestería",
  "47": "Pasta de madera, papel reciclado",
  "48": "Papel y cartón, manufacturas",
  "49": "Productos editoriales, prensa, textos",
  "50": "Seda",
  "51": "Lana y pelo fino",
  "52": "Algodón",
  "53": "Otras fibras textiles vegetales",
  "54": "Filamentos sintéticos o artificiales",
  "55": "Fibras sintéticas o artificiales discontinuas",
  "56": "Guata, fieltro, telas sin tejer, cordeles",
  "57": "Alfombras y revestimientos textiles para el suelo",
  "58": "Tejidos especiales, tapicería, bordados",
  "59": "Telas impregnadas, recubiertas",
  "60": "Tejidos de punto",
  "61": "Prendas de vestir de punto",
  "62": "Prendas de vestir (no de punto)",
  "63": "Otros artículos textiles confeccionados",
  "64": "Calzado y sus partes",
  "65": "Sombreros y sus partes",
  "66": "Paraguas, bastones, látigos",
  "67": "Plumas y flores artificiales",
  "68": "Manufacturas de piedra, yeso, cemento",
  "69": "Productos cerámicos",
  "70": "Vidrio y sus manufacturas",
  "71": "Perlas, piedras preciosas, metales preciosos",
  "72": "Fundición, hierro y acero",
  "73": "Manufacturas de fundición, hierro o acero",
  "74": "Cobre y sus manufacturas",
  "75": "Níquel y sus manufacturas",
  "76": "Aluminio y sus manufacturas",
  "78": "Plomo y sus manufacturas",
  "79": "Zinc y sus manufacturas",
  "80": "Estaño y sus manufacturas",
  "81": "Otros metales comunes",
  "82": "Herramientas y cuchillería",
  "83": "Manufacturas diversas de metal común",
  "84": "Máquinas, reactores nucleares, calderas",
  "85": "Máquinas y aparatos eléctricos, electrónica",
  "86": "Vehículos y material ferroviario",
  "87": "Vehículos automóviles, tractores, ciclos",
  "88": "Aeronaves, vehículos espaciales",
  "89": "Barcos y embarcaciones",
  "90": "Instrumentos ópticos, médicos, de medida",
  "91": "Relojería",
  "92": "Instrumentos musicales",
  "93": "Armas y municiones",
  "94": "Muebles, iluminación, construcciones prefabricadas",
  "95": "Juguetes, juegos, artículos de deporte",
  "96": "Manufacturas diversas",
  "97": "Objetos de arte, colección, antigüedades",
};

/**
 * Get chapter code (first 2 digits) from a partida arancelaria
 */
export function getChapterCode(partida: string): string {
  return partida.replace(/\D/g, "").slice(0, 2).padStart(2, "0");
}

/**
 * Get chapter name from a partida arancelaria
 */
export function getChapterName(partida: string): string {
  const code = getChapterCode(partida);
  return HS_CHAPTERS[code] ?? "Desconocido";
}

/**
 * Get sorted list of chapters for dropdown
 */
export function getChapterList(): { code: string; label: string }[] {
  return Object.entries(HS_CHAPTERS)
    .map(([code, name]) => ({ code, label: `${code} - ${name}` }))
    .sort((a, b) => a.code.localeCompare(b.code));
}
