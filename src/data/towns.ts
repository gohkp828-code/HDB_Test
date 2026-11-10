export interface TownInfo {
  name: string;
  region: 'Central' | 'East' | 'North' | 'North-East' | 'West';
  lat: number;
  lng: number;
  established?: number;
  description: string;
}

export const SG_HDB_TOWNS: TownInfo[] = [
  // Central
  { name: 'BISHAN', region: 'Central', lat: 1.3508, lng: 103.8485, established: 1983, description: 'Mature town renowned for Junction 8, Bishan-AMK Park, and top schools.' },
  { name: 'BUKIT MERAH', region: 'Central', lat: 1.2819, lng: 103.8239, established: 1970, description: 'Historic central estate including Tiong Bahru, Telok Blangah, and Redhill.' },
  { name: 'CENTRAL AREA', region: 'Central', lat: 1.2800, lng: 103.8500, established: 1970, description: 'Iconic civic center flats including The Pinnacle@Duxton and Bras Basah Complex.' },
  { name: 'GEYLANG', region: 'Central', lat: 1.3201, lng: 103.8918, established: 1970, description: 'Rich heritage precinct encompassing Aljunied, MacPherson, and Dakota.' },
  { name: 'KALLANG/WHAMPOA', region: 'Central', lat: 1.3100, lng: 103.8651, established: 1970, description: 'Waterfront town near Singapore Sports Hub and Boon Keng.' },
  { name: 'MARINE PARADE', region: 'Central', lat: 1.3020, lng: 103.9073, established: 1972, description: 'Coastal mature estate alongside East Coast Park and Parkway Parade.' },
  { name: 'QUEENSTOWN', region: 'Central', lat: 1.2942, lng: 103.8060, established: 1952, description: "Singapore's first satellite town featuring modern SkyVille and SkyTerrace @ Dawson." },
  { name: 'TOA PAYOH', region: 'Central', lat: 1.3343, lng: 103.8563, established: 1968, description: 'Pioneering town with modern redevelopment and direct North-South MRT links.' },

  // East
  { name: 'BEDOK', region: 'East', lat: 1.3236, lng: 103.9273, established: 1975, description: 'Largest mature eastern town with Bedok Reservoir, hawker centres, and lifestyle hubs.' },
  { name: 'PASIR RIS', region: 'East', lat: 1.3721, lng: 103.9474, established: 1983, description: 'Coastal family resort town with Pasir Ris Beach Park and Downtown East.' },
  { name: 'TAMPINES', region: 'East', lat: 1.3532, lng: 103.9452, established: 1978, description: 'Major regional commercial center and UN World Habitat Award recipient.' },

  // North
  { name: 'SEMBAWANG', region: 'North', lat: 1.4491, lng: 103.8185, established: 1996, description: 'Maritime heritage town featuring Canberra, Bukit Canberra hub, and natural hot springs.' },
  { name: 'WOODLANDS', region: 'North', lat: 1.4382, lng: 103.7890, established: 1972, description: 'Northern regional gateway to Malaysia with upcoming Johor-Singapore RTS Link.' },
  { name: 'YISHUN', region: 'North', lat: 1.4304, lng: 103.8354, established: 1976, description: 'Vibrant mature town featuring Northpoint City, SAFRA, and Lower Seletar Reservoir.' },

  // North-East
  { name: 'ANG MO KIO', region: 'North-East', lat: 1.3691, lng: 103.8454, established: 1973, description: 'Classic mature residential hub with tree-lined avenues and AMK Hub.' },
  { name: 'HOUGANG', region: 'North-East', lat: 1.3708, lng: 103.8925, established: 1979, description: 'Heartland town rich in Teochew heritage with Hougang Mall and park connectors.' },
  { name: 'PUNGGOL', region: 'North-East', lat: 1.4052, lng: 103.9023, established: 1998, description: "Singapore's Eco-Town with Punggol Waterway, Coney Island, and Digital District." },
  { name: 'SENGKANG', region: 'North-East', lat: 1.3916, lng: 103.8953, established: 1997, description: 'Rapidly growing family town with integrated LRT loops, Compass One, and riverside parks.' },
  { name: 'SERANGOON', region: 'North-East', lat: 1.3554, lng: 103.8679, established: 1982, description: 'Prime interchange junction featuring NEX shopping mall and Serangoon Gardens.' },

  // West
  { name: 'BUKIT BATOK', region: 'West', lat: 1.3590, lng: 103.7519, established: 1981, description: 'Green town nestled beside Bukit Batok Nature Park and Little Guilin.' },
  { name: 'BUKIT PANJANG', region: 'West', lat: 1.3774, lng: 103.7719, established: 1986, description: 'Scenic town connecting Downtown MRT line and Bukit Timah Nature Reserve.' },
  { name: 'CHOA CHU KANG', region: 'West', lat: 1.3840, lng: 103.7470, established: 1985, description: 'Western community hub including Lot One, Keat Hong, and Yew Tee.' },
  { name: 'CLEMENTI', region: 'West', lat: 1.3162, lng: 103.7649, established: 1975, description: 'Educational hub neighboring NUS, Ngee Ann Poly, and Nan Hua High School.' },
  { name: 'JURONG EAST', region: 'West', lat: 1.3329, lng: 103.7436, established: 1979, description: 'Jurong Lake District commercial powerhouse with Jem, Westgate, and IMM.' },
  { name: 'JURONG WEST', region: 'West', lat: 1.3404, lng: 103.7090, established: 1979, description: 'Major manufacturing and university town neighboring NTU and Jurong Eco-Garden.' }
];

export const FLAT_TYPES = [
  'ALL',
  '2 ROOM',
  '3 ROOM',
  '4 ROOM',
  '5 ROOM',
  'EXECUTIVE',
  'MULTI-GENERATION'
];
