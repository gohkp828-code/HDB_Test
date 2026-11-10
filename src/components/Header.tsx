import React from 'react';
import { RefreshCw, Building2, MapPin } from 'lucide-react';

interface HeaderProps {
  activeTab: 'overview' | 'resale' | 'rental' | 'carparks' | 'advisor';
  setActiveTab: (tab: 'overview' | 'resale' | 'rental' | 'carparks' | 'advisor') => void;
  selectedTown: string;
  setSelectedTown: (town: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  lastUpdated: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onRefresh,
  isRefreshing,
  lastUpdated
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-sm">
            <Building2 className="w-5 h-5" />
          </div>
          <button
            onClick={() => setActiveTab('overview')}
            className="text-left cursor-pointer group"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 group-hover:text-red-600 transition-colors whitespace-nowrap">
                SG HDB Pulse
              </span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-600"></span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links (Single-line, unboxed, whitespace-nowrap) */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 rounded-md cursor-pointer ${
              activeTab === 'overview'
                ? 'text-red-600 dark:text-red-400 font-semibold bg-red-50/60 dark:bg-red-950/30'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('resale')}
            className={`px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 rounded-md cursor-pointer ${
              activeTab === 'resale'
                ? 'text-red-600 dark:text-red-400 font-semibold bg-red-50/60 dark:bg-red-950/30'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Resale Prices
          </button>
          <button
            onClick={() => setActiveTab('rental')}
            className={`px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 rounded-md cursor-pointer ${
              activeTab === 'rental'
                ? 'text-red-600 dark:text-red-400 font-semibold bg-red-50/60 dark:bg-red-950/30'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Rental Prices
          </button>
          <button
            onClick={() => setActiveTab('carparks')}
            className={`px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 rounded-md cursor-pointer ${
              activeTab === 'carparks'
                ? 'text-red-600 dark:text-red-400 font-semibold bg-red-50/60 dark:bg-red-950/30'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Carpark Availability
          </button>
          <button
            onClick={() => setActiveTab('advisor')}
            className={`px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 rounded-md cursor-pointer ${
              activeTab === 'advisor'
                ? 'text-red-600 dark:text-red-400 font-semibold bg-red-50/60 dark:bg-red-950/30'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            AI Advisor
          </button>
        </nav>

        {/* Zone 3: Primary Action & Live Indicator */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden xl:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Gov.sg Live</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{lastUpdated || 'Synced'}</span>
          </div>
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
            title="Refresh latest data from Government API"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-red-600' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation bar for responsive access */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-100 dark:border-slate-800 px-2 py-1.5 bg-white dark:bg-slate-900 text-xs">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-1 px-2 font-medium ${activeTab === 'overview' ? 'text-red-600 font-semibold' : 'text-slate-600 dark:text-slate-400'}`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('resale')}
          className={`py-1 px-2 font-medium ${activeTab === 'resale' ? 'text-red-600 font-semibold' : 'text-slate-600 dark:text-slate-400'}`}
        >
          Resale
        </button>
        <button
          onClick={() => setActiveTab('rental')}
          className={`py-1 px-2 font-medium ${activeTab === 'rental' ? 'text-red-600 font-semibold' : 'text-slate-600 dark:text-slate-400'}`}
        >
          Rental
        </button>
        <button
          onClick={() => setActiveTab('carparks')}
          className={`py-1 px-2 font-medium ${activeTab === 'carparks' ? 'text-red-600 font-semibold' : 'text-slate-600 dark:text-slate-400'}`}
        >
          Carparks
        </button>
        <button
          onClick={() => setActiveTab('advisor')}
          className={`py-1 px-2 font-medium ${activeTab === 'advisor' ? 'text-red-600 font-semibold' : 'text-slate-600 dark:text-slate-400'}`}
        >
          AI Advisor
        </button>
      </div>
    </header>
  );
};
