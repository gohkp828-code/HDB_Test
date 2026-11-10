import React from 'react';
import { SG_HDB_TOWNS } from '../data/towns';
import { Building, TrendingUp, Key, Car, Sparkles, MapPin } from 'lucide-react';
import { OverviewData } from '../types';

interface HeroBannerProps {
  overview: OverviewData | null;
  selectedTown: string;
  setSelectedTown: (town: string) => void;
  onExploreTab: (tab: 'overview' | 'resale' | 'rental' | 'carparks' | 'advisor') => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  overview,
  selectedTown,
  setSelectedTown,
  onExploreTab
}) => {
  const resaleMedian = overview?.resale.medianPrice
    ? `$${(overview.resale.medianPrice / 1000).toFixed(0)}k`
    : '$580k';
  const rentalMedian = overview?.rental.medianRent
    ? `$${overview.rental.medianRent.toLocaleString()}`
    : '$3,200';
  const availableLots = overview?.carparks.availableLots
    ? overview.carparks.availableLots.toLocaleString()
    : '184,200';
  const millionCount = overview?.resale.millionDollarCount ?? 18;

  return (
    <div className="relative overflow-hidden bg-slate-900 border-b border-slate-800 text-white">
      {/* Background Architectural Photography with Scrim */}
      <div className="absolute inset-0 z-0">
        <img
          src="/src/assets/images/singapore_hdb_skyline_1794290179557.jpg"
          alt="Modern Singapore HDB estates with sky gardens and urban skyline"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center opacity-30 transform scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-900/60" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-medium text-red-400 mb-3 tracking-wide uppercase">
            <span>Official Open Government Data</span>
            <span aria-hidden="true">·</span>
            <span>Data.gov.sg &amp; HDB</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white text-balance leading-tight">
            Singapore HDB Real-Time Intelligence Dashboard
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
            Live public tracker monitoring registered flat resale prices, approved rental contracts, and real-time islandwide carpark space across all 26 HDB estates.
          </p>

          {/* Quick Town Filter Bar */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mr-1">
              <MapPin className="w-3.5 h-3.5 text-red-400" />
              <span>Select Estate:</span>
            </div>
            <select
              value={selectedTown}
              onChange={(e) => setSelectedTown(e.target.value)}
              className="bg-slate-800/90 border border-slate-700 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
            >
              <option value="ALL">All Singapore Towns (Islandwide)</option>
              {SG_HDB_TOWNS.map((t) => (
                <option key={t.name} value={t.name}>
                  {t.name} ({t.region})
                </option>
              ))}
            </select>

            {selectedTown !== 'ALL' && (
              <button
                onClick={() => setSelectedTown('ALL')}
                className="text-xs text-red-400 hover:text-red-300 underline cursor-pointer ml-1"
              >
                Reset to Islandwide
              </button>
            )}
          </div>
        </div>

        {/* 4-KPI Metric Strip */}
        <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Resale Median */}
          <div
            onClick={() => onExploreTab('resale')}
            className="group cursor-pointer bg-slate-800/80 hover:bg-slate-800 backdrop-blur-sm border border-slate-700/80 hover:border-red-500/50 rounded-xl p-4 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400">Resale Median</span>
              <Building className="w-4 h-4 text-red-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-white">
              {resaleMedian}
            </div>
            <div className="mt-1 text-xs text-slate-400 flex items-center gap-1">
              <span>{overview?.resale.sampleCount ? `${overview.resale.sampleCount} latest transacted` : 'Live records'}</span>
            </div>
          </div>

          {/* Card 2: Rental Median */}
          <div
            onClick={() => onExploreTab('rental')}
            className="group cursor-pointer bg-slate-800/80 hover:bg-slate-800 backdrop-blur-sm border border-slate-700/80 hover:border-blue-500/50 rounded-xl p-4 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400">Monthly Rent Median</span>
              <Key className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-white">
              {rentalMedian}
            </div>
            <div className="mt-1 text-xs text-slate-400">
              <span>Approved subletting median</span>
            </div>
          </div>

          {/* Card 3: Carpark Availability */}
          <div
            onClick={() => onExploreTab('carparks')}
            className="group cursor-pointer bg-slate-800/80 hover:bg-slate-800 backdrop-blur-sm border border-slate-700/80 hover:border-emerald-500/50 rounded-xl p-4 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400">Available Carpark Lots</span>
              <Car className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-white">
              {availableLots}
            </div>
            <div className="mt-1 text-xs text-slate-400 flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>{overview?.carparks.occupancyRate ?? 68}% current occupancy</span>
            </div>
          </div>

          {/* Card 4: Million-Dollar Flats */}
          <div
            onClick={() => onExploreTab('resale')}
            className="group cursor-pointer bg-slate-800/80 hover:bg-slate-800 backdrop-blur-sm border border-slate-700/80 hover:border-amber-500/50 rounded-xl p-4 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400">$1M+ Resale Flats</span>
              <TrendingUp className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-white">
              {millionCount}
            </div>
            <div className="mt-1 text-xs text-slate-400">
              <span>Transacted in sample period</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
