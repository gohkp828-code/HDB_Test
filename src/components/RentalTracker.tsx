import React, { useState, useMemo } from 'react';
import { RentalRecord, RentalStats, TownYield } from '../types';
import { SG_HDB_TOWNS, FLAT_TYPES } from '../data/towns';
import {
  Search,
  Filter,
  Download,
  ArrowUpDown,
  Key,
  Calculator,
  Percent,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Info
} from 'lucide-react';

interface RentalTrackerProps {
  records: RentalRecord[];
  stats: RentalStats | null;
  yieldComparison: TownYield[];
  selectedTown: string;
  setSelectedTown: (town: string) => void;
  isLoading: boolean;
}

export const RentalTracker: React.FC<RentalTrackerProps> = ({
  records,
  stats,
  yieldComparison,
  selectedTown,
  setSelectedTown,
  isLoading
}) => {
  const [selectedFlatType, setSelectedFlatType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [minRent, setMinRent] = useState<string>('');
  const [maxRent, setMaxRent] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'rent' | 'town'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState<number>(1);
  const pageSize = 25;

  // Custom Yield Calculator state
  const [calcFlatPrice, setCalcFlatPrice] = useState<number>(550000);
  const [calcMonthlyRent, setCalcMonthlyRent] = useState<number>(3200);

  const customAnnualRent = calcMonthlyRent * 12;
  const customGrossYield = calcFlatPrice > 0 ? (customAnnualRent / calcFlatPrice) * 100 : 0;

  // Filter & Sort
  const filteredRecords = useMemo(() => {
    let result = records || [];

    if (selectedTown !== 'ALL') {
      result = result.filter(
        (r) => r.town.toUpperCase() === selectedTown.toUpperCase()
      );
    }

    if (selectedFlatType !== 'ALL') {
      result = result.filter((r) =>
        r.flat_type.toUpperCase().includes(selectedFlatType.toUpperCase())
      );
    }

    if (minRent) {
      const min = parseFloat(minRent);
      if (!isNaN(min)) result = result.filter((r) => r.monthly_rent >= min);
    }

    if (maxRent) {
      const max = parseFloat(maxRent);
      if (!isNaN(max)) result = result.filter((r) => r.monthly_rent <= max);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.street_name.toLowerCase().includes(q) ||
          r.block.toLowerCase().includes(q) ||
          r.town.toLowerCase().includes(q)
      );
    }

    return result.sort((a, b) => {
      let comp = 0;
      if (sortBy === 'rent') comp = a.monthly_rent - b.monthly_rent;
      else if (sortBy === 'town') comp = a.town.localeCompare(b.town);
      else comp = a.rent_approval_date.localeCompare(b.rent_approval_date);
      return sortDir === 'asc' ? comp : -comp;
    });
  }, [
    records,
    selectedTown,
    selectedFlatType,
    minRent,
    maxRent,
    searchQuery,
    sortBy,
    sortDir
  ]);

  const paginatedRecords = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, page]);

  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;

  const exportCSV = () => {
    const headers = [
      'Rent Approval Date',
      'Town',
      'Block',
      'Street Name',
      'Flat Type',
      'Monthly Rent (SGD)'
    ];
    const rows = filteredRecords.map((r) => [
      r.rent_approval_date,
      r.town,
      r.block,
      `"${r.street_name}"`,
      r.flat_type,
      r.monthly_rent
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `hdb_rental_${selectedTown.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleSort = (field: 'date' | 'rent' | 'town') => {
    if (sortBy === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
            Data.gov.sg Official Registry
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            HDB Rental Prices &amp; Subletting Intelligence
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Approved applications for renting out HDB flats across Singapore from the official HDB subletting register.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV ({filteredRecords.length})</span>
          </button>
        </div>
      </div>

      {/* Yield Calculator & Town Yield Matrix Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Custom Rental Yield Calculator */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <Calculator className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Gross Rental Yield Calculator
                </h3>
                <p className="text-xs text-slate-500">Calculate yield for any flat price and rent</p>
              </div>
            </div>

            <div className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Flat Price / Valuation (SGD): <span className="font-mono font-semibold">${calcFlatPrice.toLocaleString()}</span>
                </label>
                <input
                  type="range"
                  min={300000}
                  max={1300000}
                  step={10000}
                  value={calcFlatPrice}
                  onChange={(e) => setCalcFlatPrice(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Monthly Rent (SGD): <span className="font-mono font-semibold">${calcMonthlyRent.toLocaleString()}/mo</span>
                </label>
                <input
                  type="range"
                  min={1500}
                  max={6000}
                  step={50}
                  value={calcMonthlyRent}
                  onChange={(e) => setCalcMonthlyRent(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-lg bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/40">
            <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-400">
              <span>Annual Rental Income:</span>
              <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                ${customAnnualRent.toLocaleString()}
              </span>
            </div>
            <div className="mt-2 flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Gross Rental Yield:</span>
              <span className="text-2xl font-bold font-mono tabular-nums text-blue-600 dark:text-blue-400">
                {customGrossYield.toFixed(2)}%
              </span>
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              Formula: (Annual Rent ÷ Resale Price) × 100
            </div>
          </div>
        </div>

        {/* Town Gross Yield Ranking */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Town Gross Rental Yield Benchmark
              </h3>
              <p className="text-xs text-slate-500">
                Calculated by pairing official approved median rents with resale transaction medians.
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-medium">
              National Avg: ~4.3%
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-3">
            {yieldComparison.slice(0, 9).map((y) => (
              <div
                key={y.town}
                onClick={() => setSelectedTown(y.town)}
                className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-blue-400 transition-colors cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {y.town}
                  </span>
                  <span className="text-xs font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                    {y.grossYieldPct}%
                  </span>
                </div>
                <div className="mt-2 text-[11px] text-slate-500 flex justify-between font-mono tabular-nums">
                  <span>Rent: ${y.rentalMedian}</span>
                  <span>Price: ${(y.resaleMedian / 1000).toFixed(0)}k</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Town Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Estate / Town</label>
            <select
              value={selectedTown}
              onChange={(e) => {
                setSelectedTown(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="ALL">All Singapore Towns</option>
              {SG_HDB_TOWNS.map((t) => (
                <option key={t.name} value={t.name}>
                  {t.name} ({t.region})
                </option>
              ))}
            </select>
          </div>

          {/* Flat Type Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Flat Type</label>
            <select
              value={selectedFlatType}
              onChange={(e) => {
                setSelectedFlatType(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="ALL">All Flat Types</option>
              <option value="2-ROOM">2-ROOM</option>
              <option value="3-ROOM">3-ROOM</option>
              <option value="4-ROOM">4-ROOM</option>
              <option value="5-ROOM">5-ROOM</option>
              <option value="EXECUTIVE">EXECUTIVE</option>
            </select>
          </div>

          {/* Search by Street / Block */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Search Street / Block</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="e.g. Yishun Ring Rd, 657"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Rent Range */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Monthly Rent Range (SGD)</label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                placeholder="Min ($)"
                value={minRent}
                onChange={(e) => {
                  setMinRent(e.target.value);
                  setPage(1);
                }}
                className="w-1/2 px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono tabular-nums"
              />
              <span className="text-slate-400 text-xs">-</span>
              <input
                type="number"
                placeholder="Max ($)"
                value={maxRent}
                onChange={(e) => {
                  setMaxRent(e.target.value);
                  setPage(1);
                }}
                className="w-1/2 px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono tabular-nums"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 font-mono tabular-nums pt-2 border-t border-slate-100 dark:border-slate-800">
          <span>Matching Approved Records: {filteredRecords.length}</span>
          {selectedTown !== 'ALL' && (
            <button
              onClick={() => {
                setSelectedTown('ALL');
                setSelectedFlatType('ALL');
                setSearchQuery('');
                setMinRent('');
                setMaxRent('');
              }}
              className="text-xs text-blue-600 hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Official Approved Subletting Ledger Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            HDB Approved Subletting Contracts
          </h2>
          <span className="text-xs text-slate-500 font-mono tabular-nums">
            Page {page} of {totalPages}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-xs font-semibold text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th
                  onClick={() => toggleSort('date')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Approval Month</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('town')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Town &amp; Address</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Flat Type</th>
                <th
                  onClick={() => toggleSort('rent')}
                  className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Monthly Rent (SGD)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-500">
                    No rental records found matching your filters.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {r.rent_approval_date}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {r.town}
                      </div>
                      <div className="text-xs text-slate-500">
                        Blk {r.block} {r.street_name}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                      {r.flat_type}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 text-sm">
                        ${r.monthly_rent.toLocaleString()}
                        <span className="text-xs font-normal text-slate-500 ml-1">/mo</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 cursor-pointer hover:bg-slate-50"
            >
              Previous
            </button>
            <span className="text-slate-500 font-mono tabular-nums">
              Showing {(page - 1) * pageSize + 1} -{' '}
              {Math.min(page * pageSize, filteredRecords.length)} of {filteredRecords.length}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 cursor-pointer hover:bg-slate-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Public Friendly Policy Explainer */}
      <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-600" />
          <span>Singapore HDB Renting Out of Whole Flat Regulations</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600 dark:text-slate-400">
          <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200/80 dark:border-slate-700">
            <div className="font-semibold text-slate-800 dark:text-slate-200 mb-1">5-Year MOP Eligibility</div>
            <p>Flat owners must fulfill the 5-year Minimum Occupation Period before renting out the whole flat. Singapore PRs cannot rent out their entire flat.</p>
          </div>
          <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200/80 dark:border-slate-700">
            <div className="font-semibold text-slate-800 dark:text-slate-200 mb-1">Non-Citizen (NC) Subletting Quota</div>
            <p>Maximum 8% non-citizen subtenants per neighborhood and 11% per block (excluding Malaysians). Check quota status with HDB before signing leases.</p>
          </div>
          <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200/80 dark:border-slate-700">
            <div className="font-semibold text-slate-800 dark:text-slate-200 mb-1">Tenancy Durations &amp; Minimums</div>
            <p>Minimum rental period is 6 consecutive months. Short-term rentals (such as Airbnb or daily stays) are strictly illegal in HDB flats.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
