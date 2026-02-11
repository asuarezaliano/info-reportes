// Map country names (as stored in DB, uppercase Spanish) to ISO 3166-1 alpha-2 codes
const COUNTRY_TO_ISO: Record<string, string> = {
  "AFGANISTAN": "AF", "ALBANIA": "AL", "ALEMANIA": "DE", "ANDORRA": "AD",
  "ANGOLA": "AO", "ANTIGUA Y BARBUDA": "AG", "ARABIA SAUDITA": "SA",
  "ARGELIA": "DZ", "ARGENTINA": "AR", "ARMENIA": "AM", "AUSTRALIA": "AU",
  "AUSTRIA": "AT", "AZERBAIYAN": "AZ", "BAHAMAS": "BS", "BANGLADESH": "BD",
  "BARBADOS": "BB", "BAREIN": "BH", "BELGICA": "BE", "BELICE": "BZ",
  "BENIN": "BJ", "BIELORRUSIA": "BY", "BOLIVIA": "BO", "BOSNIA Y HERZEGOVINA": "BA",
  "BOTSUANA": "BW", "BRASIL": "BR", "BRUNEI": "BN", "BULGARIA": "BG",
  "BURKINA FASO": "BF", "BURUNDI": "BI", "CABO VERDE": "CV", "CAMBOYA": "KH",
  "CAMERUN": "CM", "CANADA": "CA", "CHAD": "TD", "CHILE": "CL",
  "CHINA": "CN", "CHIPRE": "CY", "COLOMBIA": "CO", "COREA DEL NORTE": "KP",
  "COREA DEL SUR": "KR", "COREA": "KR", "COSTA DE MARFIL": "CI",
  "COSTA RICA": "CR", "CROACIA": "HR", "CUBA": "CU", "DINAMARCA": "DK",
  "DOMINICA": "DM", "ECUADOR": "EC", "EGIPTO": "EG", "EL SALVADOR": "SV",
  "EMIRATOS ARABES UNIDOS": "AE", "ERITREA": "ER", "ESLOVAQUIA": "SK",
  "ESLOVENIA": "SI", "ESPANA": "ES", "ESPAÑA": "ES",
  "ESTADOS UNIDOS": "US", "ESTADOS UNIDOS DE AMERICA": "US", "EE.UU.": "US", "USA": "US",
  "ESTONIA": "EE", "ETIOPIA": "ET", "FILIPINAS": "PH", "FINLANDIA": "FI",
  "FRANCIA": "FR", "GABON": "GA", "GAMBIA": "GM", "GEORGIA": "GE",
  "GHANA": "GH", "GRECIA": "GR", "GUATEMALA": "GT", "GUINEA": "GN",
  "GUYANA": "GY", "HAITI": "HT", "HONDURAS": "HN", "HONG KONG": "HK",
  "HUNGRIA": "HU", "INDIA": "IN", "INDONESIA": "ID", "IRAK": "IQ",
  "IRAN": "IR", "IRLANDA": "IE", "ISLANDIA": "IS", "ISRAEL": "IL",
  "ITALIA": "IT", "JAMAICA": "JM", "JAPON": "JP", "JORDANIA": "JO",
  "KAZAJISTAN": "KZ", "KENIA": "KE", "KUWAIT": "KW", "LAOS": "LA",
  "LETONIA": "LV", "LIBANO": "LB", "LIBERIA": "LR", "LIBIA": "LY",
  "LIECHTENSTEIN": "LI", "LITUANIA": "LT", "LUXEMBURGO": "LU",
  "MACEDONIA": "MK", "MADAGASCAR": "MG", "MALASIA": "MY", "MALAWI": "MW",
  "MALDIVAS": "MV", "MALI": "ML", "MALTA": "MT", "MARRUECOS": "MA",
  "MAURICIO": "MU", "MAURITANIA": "MR", "MEXICO": "MX", "MOLDAVIA": "MD",
  "MONACO": "MC", "MONGOLIA": "MN", "MONTENEGRO": "ME", "MOZAMBIQUE": "MZ",
  "MYANMAR": "MM", "NAMIBIA": "NA", "NEPAL": "NP", "NICARAGUA": "NI",
  "NIGER": "NE", "NIGERIA": "NG", "NORUEGA": "NO", "NUEVA ZELANDA": "NZ",
  "NUEVA ZELANDIA": "NZ", "OMAN": "OM", "PAISES BAJOS": "NL", "HOLANDA": "NL",
  "PAKISTAN": "PK", "PANAMA": "PA", "PAPUA NUEVA GUINEA": "PG", "PARAGUAY": "PY",
  "PERU": "PE", "POLONIA": "PL", "PORTUGAL": "PT", "QATAR": "QA",
  "REINO UNIDO": "GB", "REPUBLICA CENTROAFRICANA": "CF",
  "REPUBLICA CHECA": "CZ", "REPUBLICA DOMINICANA": "DO",
  "REP. POPULAR CHINA": "CN", "REPUBLICA POPULAR CHINA": "CN",
  "RUANDA": "RW", "RUMANIA": "RO", "RUSIA": "RU",
  "SENEGAL": "SN", "SERBIA": "RS", "SIERRA LEONA": "SL", "SINGAPUR": "SG",
  "SIRIA": "SY", "SOMALIA": "SO", "SRI LANKA": "LK", "SUDAFRICA": "ZA",
  "SUDAN": "SD", "SUECIA": "SE", "SUIZA": "CH", "SURINAM": "SR",
  "TAILANDIA": "TH", "TAIWAN": "TW", "TANZANIA": "TZ", "TOGO": "TG",
  "TRINIDAD Y TOBAGO": "TT", "TUNEZ": "TN", "TURQUIA": "TR",
  "TURKMENISTAN": "TM", "UCRANIA": "UA", "UGANDA": "UG", "URUGUAY": "UY",
  "UZBEKISTAN": "UZ", "VENEZUELA": "VE", "VIETNAM": "VN", "YEMEN": "YE",
  "ZAMBIA": "ZM", "ZIMBABUE": "ZW", "ZIMBABWE": "ZW",
  // Common variations
  "VIET NAM": "VN", "COREA (SUR), REPUBLICA DE": "KR",
  "TAIPEI CHINO": "TW", "ZONA FRANCA": "BO",
};

/**
 * Convert an ISO 3166-1 alpha-2 code to a flag emoji.
 * Works by converting each letter to its regional indicator symbol.
 */
function isoToFlag(iso: string): string {
  if (!iso || iso.length !== 2) return "";
  const upper = iso.toUpperCase();
  return String.fromCodePoint(
    ...Array.from(upper).map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
  );
}

/**
 * Get the flag emoji for a country name.
 * Returns empty string if no match found.
 */
export function getFlag(countryName: string): string {
  if (!countryName) return "";
  const normalized = countryName.trim().toUpperCase();
  const iso = COUNTRY_TO_ISO[normalized];
  if (iso) return isoToFlag(iso);

  // Try partial match
  for (const [key, code] of Object.entries(COUNTRY_TO_ISO)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return isoToFlag(code);
    }
  }
  return "";
}
