import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

// Initialize Gemini API
const geminiApiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (geminiApiKey) {
  aiClient = new GoogleGenAI({ apiKey: geminiApiKey });
}

// -----------------------------------------------------------------------------
// SVY21 to WGS84 Coordinate Conversion
// -----------------------------------------------------------------------------
function svy21ToWgs84(x: number, y: number): { latitude: number; longitude: number } {
  const a = 6378137;
  const f = 1 / 298.257223563;
  const oLat = 1.366666;
  const oLon = 103.833333;
  const No = 38744.572;
  const Eo = 28001.642;
  const k = 1.0;

  const b = a * (1 - f);
  const e2 = (2 * f) - (f * f);
  const e4 = e2 * e2;
  const e6 = e4 * e2;
  const A0 = 1 - (e2 / 4) - (3 * e4 / 64) - (5 * e6 / 256);
  const A2 = (3 / 8) * (e2 + (e4 / 4) + (15 * e6 / 128));
  const A4 = (15 / 256) * (e4 + (3 * e6 / 4));
  const A6 = 35 * e6 / 3072;

  const Nprime = y - No;
  const Mo = a * ((A0 * oLat * Math.PI / 180) - (A2 * Math.sin(2 * oLat * Math.PI / 180)) + (A4 * Math.sin(4 * oLat * Math.PI / 180)) - (A6 * Math.sin(6 * oLat * Math.PI / 180)));
  const Mprime = Mo + (Nprime / k);
  const n = (a - b) / (a + b);
  const G = a * (1 - n) * (1 - n * n) * (1 + (9 / 4) * n * n + (225 / 64) * Math.pow(n, 4)) * (Math.PI / 180);
  const sigma = (Mprime * Math.PI / 180) / G;

  const latPrime = sigma + ((3 * n / 2) - (27 * Math.pow(n, 3) / 32)) * Math.sin(2 * sigma) + ((21 * n * n / 16) - (55 * Math.pow(n, 4) / 32)) * Math.sin(4 * sigma) + (151 * Math.pow(n, 3) / 96) * Math.sin(6 * sigma);

  const sinLat = Math.sin(latPrime);
  const cosLat = Math.cos(latPrime);
  const tanLat = Math.tan(latPrime);

  const rho = a * (1 - e2) / Math.pow(1 - e2 * sinLat * sinLat, 1.5);
  const v = a / Math.sqrt(1 - e2 * sinLat * sinLat);
  const psi = v / rho;
  const t = tanLat;
  const Eprime = x - Eo;

  const lat = latPrime - (t / (k * rho)) * ((Eprime * Eprime) / (2 * v * k) - Math.pow(Eprime, 4) / (24 * Math.pow(v, 3) * Math.pow(k, 3)) * (5 + 3 * t * t + 10 * psi - 4 * psi * psi - 9 * (1 - e2)) + Math.pow(Eprime, 6) / (720 * Math.pow(v, 5) * Math.pow(k, 5)) * (61 + 90 * t * t + 45 * Math.pow(t, 4) + 107 * psi - 162 * psi * t * t));
  const lon = (oLon * Math.PI / 180) + (Eprime / (k * v * cosLat)) - Math.pow(Eprime, 3) / (6 * Math.pow(v, 3) * Math.pow(k, 3) * cosLat) * (psi + 2 * t * t) + Math.pow(Eprime, 5) / (120 * Math.pow(v, 5) * Math.pow(k, 5) * cosLat) * (5 + 28 * t * t + 24 * Math.pow(t, 4) + 6 * psi + 8 * psi * t * t);

  return {
    latitude: Number((lat * 180 / Math.PI).toFixed(6)),
    longitude: Number((lon * 180 / Math.PI).toFixed(6))
  };
}

// -----------------------------------------------------------------------------
// In-Memory Caches & Pre-loaded Data
// -----------------------------------------------------------------------------
interface CarparkMeta {
  car_park_no: string;
  address: string;
  x_coord: number;
  y_coord: number;
  latitude: number;
  longitude: number;
  car_park_type: string;
  type_of_parking_system: string;
  short_term_parking: string;
  free_parking: string;
  night_parking: string;
  car_park_decks: string;
  gantry_height: string;
  car_park_basement: string;
  town?: string;
}

let carparkMetaMap: Map<string, CarparkMeta> = new Map();
let carparkMetaLoaded = false;

// Infer Singapore HDB Town from Carpark address
function inferTownFromAddress(addr: string): string {
  const a = addr.toUpperCase();
  if (a.includes('ANG MO KIO') || a.includes('AMK')) return 'ANG MO KIO';
  if (a.includes('BEDOK') || a.includes('CHAI CHEE')) return 'BEDOK';
  if (a.includes('BISHAN') || a.includes('SIN MING')) return 'BISHAN';
  if (a.includes('BUKIT BATOK') || a.includes('BT BATOK')) return 'BUKIT BATOK';
  if (a.includes('BUKIT MERAH') || a.includes('BT MERAH') || a.includes('TELOK BLANGAH') || a.includes('TIONG BAHRU') || a.includes('REDHILL')) return 'BUKIT MERAH';
  if (a.includes('BUKIT PANJANG') || a.includes('BT PANJANG')) return 'BUKIT PANJANG';
  if (a.includes('CHOA CHU KANG') || a.includes('CCK') || a.includes('YEW TEE')) return 'CHOA CHU KANG';
  if (a.includes('CLEMENTI') || a.includes('WEST COAST')) return 'CLEMENTI';
  if (a.includes('GEYLANG') || a.includes('EUNOS') || a.includes('ALJUNIED') || a.includes('MACPHERSON')) return 'GEYLANG';
  if (a.includes('HOUGANG')) return 'HOUGANG';
  if (a.includes('JURONG EAST')) return 'JURONG EAST';
  if (a.includes('JURONG WEST') || a.includes('BOON LAY') || a.includes('TAMAN JURONG')) return 'JURONG WEST';
  if (a.includes('KALLANG') || a.includes('WHAMPOA') || a.includes('BOON KENG') || a.includes('BENDEMEER')) return 'KALLANG/WHAMPOA';
  if (a.includes('MARINE PARADE')) return 'MARINE PARADE';
  if (a.includes('PASIR RIS')) return 'PASIR RIS';
  if (a.includes('PUNGGOL')) return 'PUNGGOL';
  if (a.includes('QUEENSTOWN') || a.includes('COMMONWEALTH') || a.includes('STRATHMORE')) return 'QUEENSTOWN';
  if (a.includes('SEMBAWANG') || a.includes('CANBERRA')) return 'SEMBAWANG';
  if (a.includes('SENGKANG') || a.includes('FERNVALE') || a.includes('COMPASSVALE')) return 'SENGKANG';
  if (a.includes('SERANGOON')) return 'SERANGOON';
  if (a.includes('TAMPINES')) return 'TAMPINES';
  if (a.includes('TOA PAYOH')) return 'TOA PAYOH';
  if (a.includes('WOODLANDS')) return 'WOODLANDS';
  if (a.includes('YISHUN') || a.includes('KHATIB')) return 'YISHUN';
  if (a.includes('CENTRAL') || a.includes('CHINATOWN') || a.includes('CANTONMENT') || a.includes('BRAS BASAH') || a.includes('ALBERT')) return 'CENTRAL AREA';
  return 'OTHER';
}

// Fetch Carpark Metadata (2,273 carparks)
async function loadCarparkMetadata() {
  if (carparkMetaLoaded) return;
  try {
    console.log('Fetching HDB Carpark Metadata from data.gov.sg...');
    const url = 'https://data.gov.sg/api/action/datastore_search?resource_id=d_23f946fa557947f93a8043bbef41dd09&limit=3000';
    const response = await fetch(url, { headers: { 'User-Agent': 'SGHDBTracker/1.0' } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const records = data.result?.records || [];

    for (const r of records) {
      const x = parseFloat(r.x_coord);
      const y = parseFloat(r.y_coord);
      let lat = 1.3521;
      let lon = 103.8198;
      if (!isNaN(x) && !isNaN(y) && x > 0 && y > 0) {
        const coords = svy21ToWgs84(x, y);
        lat = coords.latitude;
        lon = coords.longitude;
      }
      const town = inferTownFromAddress(r.address || '');
      carparkMetaMap.set(r.car_park_no, {
        car_park_no: r.car_park_no,
        address: r.address || 'HDB Carpark',
        x_coord: x,
        y_coord: y,
        latitude: lat,
        longitude: lon,
        car_park_type: r.car_park_type || 'SURFACE CAR PARK',
        type_of_parking_system: r.type_of_parking_system || 'ELECTRONIC PARKING',
        short_term_parking: r.short_term_parking || 'WHOLE DAY',
        free_parking: r.free_parking || 'NO',
        night_parking: r.night_parking || 'YES',
        car_park_decks: r.car_park_decks || '1',
        gantry_height: r.gantry_height || '0',
        car_park_basement: r.car_park_basement || 'N',
        town
      });
    }
    carparkMetaLoaded = true;
    console.log(`Loaded ${carparkMetaMap.size} HDB Carpark metadata entries.`);
  } catch (err: any) {
    console.error('Failed to load carpark metadata from data.gov.sg:', err.message);
  }
}

// Load metadata on startup
loadCarparkMetadata();

// -----------------------------------------------------------------------------
// Live Carpark Availability Cache
// -----------------------------------------------------------------------------
let liveCarparksCache: {
  timestamp: string;
  lastFetched: number;
  data: any[];
  summary: {
    totalCarparks: number;
    totalLots: number;
    availableLots: number;
    occupancyRate: number;
  };
} | null = null;

async function getLiveCarparks(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && liveCarparksCache && now - liveCarparksCache.lastFetched < 45000) {
    return liveCarparksCache;
  }

  await loadCarparkMetadata();

  try {
    const res = await fetch('https://api.data.gov.sg/v1/transport/carpark-availability', {
      headers: { 'User-Agent': 'SGHDBTracker/1.0' }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const item = json.items?.[0];
    const timestamp = item?.timestamp || new Date().toISOString();
    const carparkData = item?.carpark_data || [];

    let totalLotsSum = 0;
    let availableLotsSum = 0;

    const merged = carparkData.map((cp: any) => {
      const meta = carparkMetaMap.get(cp.carpark_number);
      const infoList = cp.carpark_info || [];
      const primaryInfo = infoList[0] || { lot_type: 'C', lots_available: '0', total_lots: '0' };
      const totalLots = parseInt(primaryInfo.total_lots, 10) || 0;
      const lotsAvailable = parseInt(primaryInfo.lots_available, 10) || 0;

      totalLotsSum += totalLots;
      availableLotsSum += lotsAvailable;

      const pct = totalLots > 0 ? Math.round((lotsAvailable / totalLots) * 100) : 0;
      let status: 'AVAILABLE' | 'LIMITED' | 'FULL' = 'AVAILABLE';
      if (lotsAvailable === 0) status = 'FULL';
      else if (lotsAvailable < 15 || pct < 15) status = 'LIMITED';

      return {
        carpark_number: cp.carpark_number,
        update_datetime: cp.update_datetime,
        lot_type: primaryInfo.lot_type,
        total_lots: totalLots,
        lots_available: lotsAvailable,
        availability_pct: pct,
        status,
        address: meta?.address || `HDB Carpark ${cp.carpark_number}`,
        town: meta?.town || 'OTHER',
        latitude: meta?.latitude || 1.3521,
        longitude: meta?.longitude || 103.8198,
        car_park_type: meta?.car_park_type || 'SURFACE CAR PARK',
        type_of_parking_system: meta?.type_of_parking_system || 'ELECTRONIC PARKING',
        short_term_parking: meta?.short_term_parking || 'WHOLE DAY',
        free_parking: meta?.free_parking || 'NO',
        night_parking: meta?.night_parking || 'YES',
        gantry_height: meta?.gantry_height || '0'
      };
    });

    const occupancyRate = totalLotsSum > 0 ? Math.round(((totalLotsSum - availableLotsSum) / totalLotsSum) * 100) : 0;

    liveCarparksCache = {
      timestamp,
      lastFetched: now,
      data: merged,
      summary: {
        totalCarparks: merged.length,
        totalLots: totalLotsSum,
        availableLots: availableLotsSum,
        occupancyRate
      }
    };

    return liveCarparksCache;
  } catch (err: any) {
    console.error('Error fetching live carparks:', err.message);
    if (liveCarparksCache) return liveCarparksCache;
    throw err;
  }
}

// -----------------------------------------------------------------------------
// Resale Flats Cache & Statistics
// -----------------------------------------------------------------------------
let resaleCache: {
  lastFetched: number;
  records: any[];
  stats: any;
} | null = null;

async function getResaleData(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && resaleCache && now - resaleCache.lastFetched < 600000) {
    return resaleCache;
  }

  try {
    console.log('Fetching latest HDB resale transactions...');
    // Retrieve latest 1000 records sorted descending
    const url = 'https://data.gov.sg/api/action/datastore_search?resource_id=d_8b84c4ee58e3cfc0ece0d773c8ca6abc&limit=1000&sort=_id desc';
    const res = await fetch(url, { headers: { 'User-Agent': 'SGHDBTracker/1.0' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const rawRecords = json.result?.records || [];

    const parsedRecords = rawRecords.map((r: any) => {
      const price = parseFloat(r.resale_price) || 0;
      const sqm = parseFloat(r.floor_area_sqm) || 1;
      const pricePerSqm = sqm > 0 ? Math.round(price / sqm) : 0;
      const pricePerSqft = Math.round(pricePerSqm / 10.764);

      return {
        id: r._id,
        month: r.month,
        town: r.town,
        flat_type: r.flat_type,
        block: r.block,
        street_name: r.street_name,
        address: `${r.block} ${r.street_name}`,
        storey_range: r.storey_range,
        floor_area_sqm: sqm,
        flat_model: r.flat_model,
        lease_commence_date: r.lease_commence_date,
        remaining_lease: r.remaining_lease,
        resale_price: price,
        price_per_sqm: pricePerSqm,
        price_per_sqft: pricePerSqft,
        is_million_dollar: price >= 1000000
      };
    });

    // Compute comprehensive statistics
    const prices = parsedRecords.map((r: any) => r.resale_price).sort((a: number, b: number) => a - b);
    const medianPrice = prices.length ? prices[Math.floor(prices.length / 2)] : 0;
    const avgPrice = prices.length ? Math.round(prices.reduce((a: number, b: number) => a + b, 0) / prices.length) : 0;
    const millionDollarFlats = parsedRecords.filter((r: any) => r.is_million_dollar);

    // Group by Flat Type
    const flatTypeStats: Record<string, { count: number; total: number; prices: number[]; median: number; avgPerSqm: number; totalSqmPrice: number }> = {};
    for (const r of parsedRecords) {
      if (!flatTypeStats[r.flat_type]) {
        flatTypeStats[r.flat_type] = { count: 0, total: 0, prices: [], median: 0, avgPerSqm: 0, totalSqmPrice: 0 };
      }
      flatTypeStats[r.flat_type].count += 1;
      flatTypeStats[r.flat_type].total += r.resale_price;
      flatTypeStats[r.flat_type].prices.push(r.resale_price);
      flatTypeStats[r.flat_type].totalSqmPrice += r.price_per_sqm;
    }

    for (const type in flatTypeStats) {
      const item = flatTypeStats[type];
      item.prices.sort((a, b) => a - b);
      item.median = item.prices[Math.floor(item.prices.length / 2)];
      item.avgPerSqm = Math.round(item.totalSqmPrice / item.count);
    }

    // Group by Town
    const townStats: Record<string, { town: string; count: number; prices: number[]; median: number; avgPerSqm: number; totalSqmPrice: number }> = {};
    for (const r of parsedRecords) {
      if (!townStats[r.town]) {
        townStats[r.town] = { town: r.town, count: 0, prices: [], median: 0, avgPerSqm: 0, totalSqmPrice: 0 };
      }
      townStats[r.town].count += 1;
      townStats[r.town].prices.push(r.resale_price);
      townStats[r.town].totalSqmPrice += r.price_per_sqm;
    }

    const townList = Object.values(townStats).map((t) => {
      t.prices.sort((a, b) => a - b);
      t.median = t.prices[Math.floor(t.prices.length / 2)];
      t.avgPerSqm = Math.round(t.totalSqmPrice / t.count);
      return {
        town: t.town,
        count: t.count,
        median: t.median,
        avgPerSqm: t.avgPerSqm,
        min: t.prices[0],
        max: t.prices[t.prices.length - 1]
      };
    }).sort((a, b) => b.median - a.median);

    // Group by Month for trendline
    const monthStats: Record<string, { month: string; count: number; prices: number[]; median: number }> = {};
    for (const r of parsedRecords) {
      if (!monthStats[r.month]) {
        monthStats[r.month] = { month: r.month, count: 0, prices: [], median: 0 };
      }
      monthStats[r.month].count += 1;
      monthStats[r.month].prices.push(r.resale_price);
    }
    const monthTrend = Object.values(monthStats).map((m) => {
      m.prices.sort((a, b) => a - b);
      m.median = m.prices[Math.floor(m.prices.length / 2)];
      return { month: m.month, count: m.count, median: m.median };
    }).sort((a, b) => a.month.localeCompare(b.month));

    resaleCache = {
      lastFetched: now,
      records: parsedRecords,
      stats: {
        totalSampled: parsedRecords.length,
        medianPrice,
        avgPrice,
        millionDollarCount: millionDollarFlats.length,
        millionDollarFlats: millionDollarFlats.slice(0, 15),
        flatTypeStats,
        townList,
        monthTrend
      }
    };

    return resaleCache;
  } catch (err: any) {
    console.error('Error fetching resale data:', err.message);
    if (resaleCache) return resaleCache;
    throw err;
  }
}

// -----------------------------------------------------------------------------
// Rental Transactions Cache & Statistics
// -----------------------------------------------------------------------------
let rentalCache: {
  lastFetched: number;
  records: any[];
  stats: any;
} | null = null;

async function getRentalData(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && rentalCache && now - rentalCache.lastFetched < 600000) {
    return rentalCache;
  }

  try {
    console.log('Fetching latest HDB rental transactions...');
    const url = 'https://data.gov.sg/api/action/datastore_search?resource_id=d_c9f57187485a850908655db0e8cfe651&limit=1000&sort=_id desc';
    const res = await fetch(url, { headers: { 'User-Agent': 'SGHDBTracker/1.0' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const rawRecords = json.result?.records || [];

    const parsedRecords = rawRecords.map((r: any) => {
      const rent = parseFloat(r.monthly_rent) || 0;
      return {
        id: r._id,
        rent_approval_date: r.rent_approval_date,
        town: r.town,
        block: r.block,
        street_name: r.street_name,
        address: `${r.block} ${r.street_name}`,
        flat_type: r.flat_type,
        monthly_rent: rent
      };
    });

    const rents = parsedRecords.map((r: any) => r.monthly_rent).sort((a: number, b: number) => a - b);
    const medianRent = rents.length ? rents[Math.floor(rents.length / 2)] : 0;
    const avgRent = rents.length ? Math.round(rents.reduce((a: number, b: number) => a + b, 0) / rents.length) : 0;

    // Group by Flat Type
    const flatTypeStats: Record<string, { count: number; total: number; rents: number[]; median: number }> = {};
    for (const r of parsedRecords) {
      if (!flatTypeStats[r.flat_type]) {
        flatTypeStats[r.flat_type] = { count: 0, total: 0, rents: [], median: 0 };
      }
      flatTypeStats[r.flat_type].count += 1;
      flatTypeStats[r.flat_type].total += r.monthly_rent;
      flatTypeStats[r.flat_type].rents.push(r.monthly_rent);
    }
    for (const type in flatTypeStats) {
      const item = flatTypeStats[type];
      item.rents.sort((a, b) => a - b);
      item.median = item.rents[Math.floor(item.rents.length / 2)];
    }

    // Group by Town
    const townStats: Record<string, { town: string; count: number; rents: number[]; median: number }> = {};
    for (const r of parsedRecords) {
      if (!townStats[r.town]) {
        townStats[r.town] = { town: r.town, count: 0, rents: [], median: 0 };
      }
      townStats[r.town].count += 1;
      townStats[r.town].rents.push(r.monthly_rent);
    }
    const townList = Object.values(townStats).map((t) => {
      t.rents.sort((a, b) => a - b);
      t.median = t.rents[Math.floor(t.rents.length / 2)];
      return {
        town: t.town,
        count: t.count,
        median: t.median,
        min: t.rents[0],
        max: t.rents[t.rents.length - 1]
      };
    }).sort((a, b) => b.median - a.median);

    rentalCache = {
      lastFetched: now,
      records: parsedRecords,
      stats: {
        totalSampled: parsedRecords.length,
        medianRent,
        avgRent,
        flatTypeStats,
        townList
      }
    };

    return rentalCache;
  } catch (err: any) {
    console.error('Error fetching rental data:', err.message);
    if (rentalCache) return rentalCache;
    throw err;
  }
}

// -----------------------------------------------------------------------------
// Combined Gross Rental Yield Calculation
// -----------------------------------------------------------------------------
function calculateRentalYields(resaleTowns: any[], rentalTowns: any[]) {
  const yieldMap: Record<string, { town: string; resaleMedian: number; rentalMedian: number; annualRent: number; grossYieldPct: number }> = {};
  const rentalLookup = new Map(rentalTowns.map((r) => [r.town.toUpperCase(), r.median]));

  for (const r of resaleTowns) {
    const rentMedian = rentalLookup.get(r.town.toUpperCase());
    if (rentMedian && r.median > 0) {
      const annualRent = rentMedian * 12;
      const yieldPct = Number(((annualRent / r.median) * 100).toFixed(2));
      yieldMap[r.town] = {
        town: r.town,
        resaleMedian: r.median,
        rentalMedian: rentMedian,
        annualRent,
        grossYieldPct: yieldPct
      };
    }
  }

  return Object.values(yieldMap).sort((a, b) => b.grossYieldPct - a.grossYieldPct);
}

// -----------------------------------------------------------------------------
// REST API Endpoints
// -----------------------------------------------------------------------------

// 1. Resale Flat Prices API
app.get('/api/resale', async (req, res) => {
  try {
    const data = await getResaleData();
    const { town, flat_type, max_price, min_price, search, million_only } = req.query;

    let filtered = data.records;
    if (town && town !== 'ALL') {
      filtered = filtered.filter((r: any) => r.town.toUpperCase() === String(town).toUpperCase());
    }
    if (flat_type && flat_type !== 'ALL') {
      filtered = filtered.filter((r: any) => r.flat_type.toUpperCase().includes(String(flat_type).toUpperCase()));
    }
    if (min_price) {
      filtered = filtered.filter((r: any) => r.resale_price >= Number(min_price));
    }
    if (max_price) {
      filtered = filtered.filter((r: any) => r.resale_price <= Number(max_price));
    }
    if (million_only === 'true') {
      filtered = filtered.filter((r: any) => r.is_million_dollar);
    }
    if (search) {
      const q = String(search).toLowerCase();
      filtered = filtered.filter((r: any) =>
        r.town.toLowerCase().includes(q) ||
        r.street_name.toLowerCase().includes(q) ||
        r.block.toLowerCase().includes(q) ||
        r.flat_model.toLowerCase().includes(q)
      );
    }

    res.json({
      success: true,
      stats: data.stats,
      totalMatches: filtered.length,
      records: filtered.slice(0, 150)
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Rental Prices API
app.get('/api/rental', async (req, res) => {
  try {
    const data = await getRentalData();
    const { town, flat_type, search } = req.query;

    let filtered = data.records;
    if (town && town !== 'ALL') {
      filtered = filtered.filter((r: any) => r.town.toUpperCase() === String(town).toUpperCase());
    }
    if (flat_type && flat_type !== 'ALL') {
      filtered = filtered.filter((r: any) => r.flat_type.toUpperCase().includes(String(flat_type).toUpperCase()));
    }
    if (search) {
      const q = String(search).toLowerCase();
      filtered = filtered.filter((r: any) =>
        r.town.toLowerCase().includes(q) ||
        r.street_name.toLowerCase().includes(q) ||
        r.block.toLowerCase().includes(q)
      );
    }

    // Include rental yields computed with resale data if available
    let yieldComparison: any[] = [];
    try {
      const resaleData = await getResaleData();
      yieldComparison = calculateRentalYields(resaleData.stats.townList, data.stats.townList);
    } catch {
      // ignore
    }

    res.json({
      success: true,
      stats: data.stats,
      yieldComparison,
      totalMatches: filtered.length,
      records: filtered.slice(0, 150)
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Live Carpark Availability API
app.get('/api/carparks', async (req, res) => {
  try {
    const refresh = req.query.refresh === 'true';
    const live = await getLiveCarparks(refresh);
    const { town, status, search, free_parking, system } = req.query;

    let filtered = live.data;
    if (town && town !== 'ALL') {
      filtered = filtered.filter((cp) => cp.town === town);
    }
    if (status && status !== 'ALL') {
      filtered = filtered.filter((cp) => cp.status === status);
    }
    if (free_parking === 'true') {
      filtered = filtered.filter((cp) => cp.free_parking && cp.free_parking.toUpperCase() !== 'NO');
    }
    if (system && system !== 'ALL') {
      filtered = filtered.filter((cp) => cp.type_of_parking_system.toUpperCase().includes(String(system).toUpperCase()));
    }
    if (search) {
      const q = String(search).toLowerCase();
      filtered = filtered.filter((cp) =>
        cp.carpark_number.toLowerCase().includes(q) ||
        cp.address.toLowerCase().includes(q) ||
        cp.town.toLowerCase().includes(q)
      );
    }

    res.json({
      success: true,
      timestamp: live.timestamp,
      summary: live.summary,
      totalMatches: filtered.length,
      carparks: filtered.slice(0, 300)
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Combined Overview Dashboard KPI API
app.get('/api/overview', async (_req, res) => {
  try {
    const [resale, rental, carparks] = await Promise.all([
      getResaleData(),
      getRentalData(),
      getLiveCarparks()
    ]);

    const yields = calculateRentalYields(resale.stats.townList, rental.stats.townList);

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      resale: {
        medianPrice: resale.stats.medianPrice,
        avgPrice: resale.stats.avgPrice,
        millionDollarCount: resale.stats.millionDollarCount,
        sampleCount: resale.stats.totalSampled,
        topTowns: resale.stats.townList.slice(0, 5),
        flatTypes: resale.stats.flatTypeStats
      },
      rental: {
        medianRent: rental.stats.medianRent,
        avgRent: rental.stats.avgRent,
        sampleCount: rental.stats.totalSampled,
        topTowns: rental.stats.townList.slice(0, 5),
        flatTypes: rental.stats.flatTypeStats
      },
      carparks: {
        ...carparks.summary,
        timestamp: carparks.timestamp
      },
      topYields: yields.slice(0, 6)
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Gemini AI HDB Advisor & Insights API
app.post('/api/ai-insights', async (req, res) => {
  try {
    const { prompt, town, flatType, budget, scenario } = req.body;

    if (!aiClient) {
      return res.status(503).json({
        success: false,
        error: 'Gemini API key is not configured. Please configure GEMINI_API_KEY in the environment.'
      });
    }

    // Fetch current live context to feed into Gemini prompt
    const [resale, rental, carpark] = await Promise.all([
      getResaleData().catch(() => null),
      getRentalData().catch(() => null),
      getLiveCarparks().catch(() => null)
    ]);

    const contextTown = town || 'General Singapore';
    const contextType = flatType || '4-ROOM';

    const systemPrompt = `You are the Singapore HDB Housing & Urban Mobility Expert Advisor on "SG HDB Pulse".
You provide accurate, practical, empathetic, and data-grounded guidance for Singapore citizens, PRs, expats, homebuyers, tenants, and drivers.
You have real-time access to the Singapore Government HDB APIs.

CURRENT LIVE MARKET SNAPSHOT:
- Overall Median Resale Price: $${resale?.stats?.medianPrice?.toLocaleString() || '580,000'}
- Overall Median Monthly Rent: $${rental?.stats?.medianRent?.toLocaleString() || '3,200'}
- Live HDB Carpark Occupancy: ${carpark?.summary?.occupancyRate || '65'}% with ${carpark?.summary?.availableLots?.toLocaleString() || '180,000'} lots available
- Focus Town: ${contextTown}
- Focus Flat Type: ${contextType}
${budget ? `- User Budget / Income: $${budget}` : ''}
${scenario ? `- User Scenario: ${scenario}` : ''}

Key policies to reference when relevant:
- Minimum Occupation Period (MOP: 5 years for standard, 10 years for Plus/Prime)
- CPF Housing Grants (Enhanced CPF Housing Grant up to $80k, Family Grant up to $80k, Proximity Housing Grant up to $30k)
- Loan-to-Value (LTV) 75% for HDB / Bank loans
- Mortgage Servicing Ratio (MSR) 30% cap for HDB flats
- Electronic Parking System (EPS) & free Sunday parking (7:30am - 10:30pm) where indicated

Provide clear, structured, well-formatted advice with concrete numbers, bullet points, and actionable next steps. Avoid fluffy disclaimers. Always answer with Singapore context (SGD currency).`;

    const userMessage = prompt || `Give me an in-depth market analysis and practical advice for purchasing or renting a ${contextType} in ${contextTown}. Highlight price trends, rental yield, parking availability, and key grants or eligibility considerations.`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\nUSER QUESTION:\n${userMessage}` }]
        }
      ]
    });

    res.json({
      success: true,
      insight: response.text,
      town: contextTown,
      flatType: contextType
    });
  } catch (err: any) {
    console.error('AI Insights error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// Vite Middleware / Static Serving
// -----------------------------------------------------------------------------
async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`SG HDB Pulse server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
