export interface ResaleRecord {
  id: number;
  month: string;
  town: string;
  flat_type: string;
  block: string;
  street_name: string;
  address: string;
  storey_range: string;
  floor_area_sqm: number;
  flat_model: string;
  lease_commence_date: string;
  remaining_lease: string;
  resale_price: number;
  price_per_sqm: number;
  price_per_sqft: number;
  is_million_dollar: boolean;
}

export interface TownStat {
  town: string;
  count: number;
  median: number;
  avgPerSqm: number;
  min: number;
  max: number;
}

export interface FlatTypeStat {
  count: number;
  total: number;
  median: number;
  avgPerSqm?: number;
}

export interface ResaleStats {
  totalSampled: number;
  medianPrice: number;
  avgPrice: number;
  millionDollarCount: number;
  millionDollarFlats: ResaleRecord[];
  flatTypeStats: Record<string, FlatTypeStat>;
  townList: TownStat[];
  monthTrend: { month: string; count: number; median: number }[];
}

export interface RentalRecord {
  id: number;
  rent_approval_date: string;
  town: string;
  block: string;
  street_name: string;
  address: string;
  flat_type: string;
  monthly_rent: number;
}

export interface RentalStats {
  totalSampled: number;
  medianRent: number;
  avgRent: number;
  flatTypeStats: Record<string, FlatTypeStat>;
  townList: {
    town: string;
    count: number;
    median: number;
    min: number;
    max: number;
  }[];
}

export interface CarparkItem {
  carpark_number: string;
  update_datetime: string;
  lot_type: string;
  total_lots: number;
  lots_available: number;
  availability_pct: number;
  status: 'AVAILABLE' | 'LIMITED' | 'FULL';
  address: string;
  town: string;
  latitude: number;
  longitude: number;
  car_park_type: string;
  type_of_parking_system: string;
  short_term_parking: string;
  free_parking: string;
  night_parking: string;
  gantry_height: string;
  distanceKm?: number;
}

export interface CarparkSummary {
  totalCarparks: number;
  totalLots: number;
  availableLots: number;
  occupancyRate: number;
}

export interface TownYield {
  town: string;
  resaleMedian: number;
  rentalMedian: number;
  annualRent: number;
  grossYieldPct: number;
}

export interface OverviewData {
  timestamp: string;
  resale: {
    medianPrice: number;
    avgPrice: number;
    millionDollarCount: number;
    sampleCount: number;
    topTowns: TownStat[];
    flatTypes: Record<string, FlatTypeStat>;
  };
  rental: {
    medianRent: number;
    avgRent: number;
    sampleCount: number;
    topTowns: any[];
    flatTypes: Record<string, FlatTypeStat>;
  };
  carparks: CarparkSummary & { timestamp: string };
  topYields: TownYield[];
}
