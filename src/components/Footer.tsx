import React from 'react';
import { Building2, ExternalLink, ShieldAlert } from 'lucide-react';

interface FooterProps {
  setActiveTab: (tab: 'overview' | 'resale' | 'rental' | 'carparks' | 'advisor') => void;
}

export const Footer: React.FC<FooterProps> = ({ setActiveTab }) => {
  return (
    <footer className="mt-16 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand & Purpose */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold text-sm">
              <div className="w-6 h-6 rounded bg-red-600 text-white flex items-center justify-center">
                <Building2 className="w-3.5 h-3.5" />
              </div>
              <span>SG HDB Pulse</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
              Holistic public intelligence portal for Singapore public housing. Streamed directly from official Singapore Government open data APIs to deliver transparency on resale transactions, approved rental rates, and live carpark space.
            </p>
          </div>

          {/* Quick Dashboard Links */}
          <div>
            <div className="font-semibold text-slate-900 dark:text-slate-100 mb-3">
              Dashboard Modules
            </div>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => setActiveTab('overview')}
                  className="hover:text-red-600 transition-colors cursor-pointer"
                >
                  Overview &amp; Town Leaderboard
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('resale')}
                  className="hover:text-red-600 transition-colors cursor-pointer"
                >
                  Resale Flat Prices ($/sqm &amp; $1M+)
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('rental')}
                  className="hover:text-red-600 transition-colors cursor-pointer"
                >
                  HDB Rental Rates &amp; Gross Yields
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('carparks')}
                  className="hover:text-red-600 transition-colors cursor-pointer"
                >
                  Live Carpark Availability &amp; Map
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('advisor')}
                  className="hover:text-red-600 transition-colors cursor-pointer"
                >
                  AI Advisor &amp; CPF Grant Calculator
                </button>
              </li>
            </ul>
          </div>

          {/* Official Singapore Gov Data Sources */}
          <div>
            <div className="font-semibold text-slate-900 dark:text-slate-100 mb-3">
              Open Government Datasets
            </div>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://data.gov.sg/datasets/d_8b84c4ee58e3cfc0ece0d773c8ca6abc/view"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-red-600 transition-colors"
                >
                  <span>HDB Resale Prices (Data.gov.sg)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://data.gov.sg/datasets/d_c9f57187485a850908655db0e8cfe651/view"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-red-600 transition-colors"
                >
                  <span>Renting Out of Flats (HDB)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://data.gov.sg/datasets/d_23f946fa557947f93a8043bbef41dd09/view"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-red-600 transition-colors"
                >
                  <span>HDB Carpark Information</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://api.data.gov.sg/v1/transport/carpark-availability"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-red-600 transition-colors"
                >
                  <span>Real-Time Carpark Availability API</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Disclaimer & Copyright */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <div>
            Data provided under the Singapore Open Data Licence. Not affiliated with or endorsed by the Housing &amp; Development Board (HDB) or Singapore Government.
          </div>
          <div>
            &copy; {new Date().getFullYear()} SG HDB Pulse · Built for Singapore Residents
          </div>
        </div>
      </div>
    </footer>
  );
};
