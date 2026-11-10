import React, { useState, useMemo } from 'react';
import { ResaleRecord, ResaleStats } from '../types';
import { SG_HDB_TOWNS, FLAT_TYPES } from '../data/towns';
import {
  Search,
  Filter,
  Download,
  ArrowUpDown,
  Building,
  Sparkles,
  Info,
  ChevronDown
} from 'lucide-react';

interface ResaleTrackerProps {
  records: ResaleRecord[];
  stats: ResaleStats | null;
  selectedTown: string;
  setSelectedTown: (town: string) => void;
  isLoading: boolean;
}

export const ResaleTracker: React.FC<ResaleTrackerProps> = ({
  records,
  stats,
  selectedTown,
  setSelectedTown,
  isLoading
}) => {
  const [selectedFlatType, setSelectedFlatType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [millionOnly, setMillionOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'date' | 'price' | 'sqm' | 'area'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const pageSize = 25;

  // Filter & Sort Logic
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

    if (millionOnly) {
      result = result.filter((r) => r.is_million_dollar);
    }

    if (minPrice) {
      const min = parseFloat(minPrice);
      if (!isNaN(min)) result = result.filter((r) => r.resale_price >= min);
    }

    if (maxPrice) {
      const max = parseFloat(maxPrice);
      if (!isNaN(max)) result = result.filter((r) => r.resale_price <= max);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.street_name.toLowerCase().includes(q) ||
          r.block.toLowerCase().includes(q) ||
          r.town.toLowerCase().includes(q) ||
          r.flat_model.toLowerCase().includes(q)
      );
    }

    return result.sort((a, b) => {
      let comp = 0;
      if (sortBy === 'price') comp = a.resale_price - b.resale_price;
      else if (sortBy === 'sqm') comp = a.price_per_sqm - b.price_per_sqm;
      else if (sortBy === 'area') comp = a.floor_area_sqm - b.floor_area_sqm;
      else comp = a.month.localeCompare(b.month);
      return sortDir === 'asc' ? comp : -comp;
    });
  }, [
    records,
    selectedTown,
    selectedFlatType,
    millionOnly,
    minPrice,
    maxPrice,
    searchQuery,
    sortBy,
    sortDir
  ]);

  const paginatedRecords = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, page]);

  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;

  // Export current records as CSV
  const exportToCSV = () => {
    const headers = [
      'Month',
      'Town',
      'Flat Type',
      'Block',
      'Street Name',
      'Storey Range',
      'Floor Area (sqm)',
      'Flat Model',
      'Lease Commence',
      'Remaining Lease',
      'Resale Price (SGD)',
      'Price Per SQM (SGD)'
    ];
    const rows = filteredRecords.map((r) => [
      r.month,
      r.town,
      r.flat_type,
      r.block,
      `"${r.street_name}"`,
      r.storey_range,
      r.floor_area_sqm,
      r.flat_model,
      r.lease_commence_date,
      `"${r.remaining_lease}"`,
      r.resale_price,
      r.price_per_sqm
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `hdb_resale_${selectedTown.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleSort = (field: 'date' | 'price' | 'sqm' | 'area') => {
    if (sortBy === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider mb-1">
            Data.gov.sg Official Registry
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            HDB Resale Flat Price Intelligence
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Official records registered with HDB from latest monthly batches across Singapore estates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV ({filteredRecords.length})</span>
          </button>
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
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:outline-none"
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
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:outline-none"
            >
              {FLAT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Search by Street / Block */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Search Street / Block</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="e.g. Tampines Ave 4, 128"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Price Range (SGD)</label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                placeholder="Min ($)"
                value={minPrice}
                onChange={(e) => {
                  setMinPrice(e.target.value);
                  setPage(1);
                }}
                className="w-1/2 px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none font-mono tabular-nums"
              />
              <span className="text-slate-400 text-xs">-</span>
              <input
                type="number"
                placeholder="Max ($)"
                value={maxPrice}
                onChange={(e) => {
                  setMaxPrice(e.target.value);
                  setPage(1);
                }}
                className="w-1/2 px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none font-mono tabular-nums"
              />
            </div>
          </div>
        </div>

        {/* Million Dollar Toggle & Fast Chips */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setMillionOnly(!millionOnly);
                setPage(1);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer border ${
                millionOnly
                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Million-Dollar Flats Only ($1M+)</span>
            </button>

            {(selectedTown !== 'ALL' || selectedFlatType !== 'ALL' || millionOnly || searchQuery || minPrice || maxPrice) && (
              <button
                onClick={() => {
                  setSelectedTown('ALL');
                  setSelectedFlatType('ALL');
                  setMillionOnly(false);
                  setSearchQuery('');
                  setMinPrice('');
                  setMaxPrice('');
                  setPage(1);
                }}
                className="text-xs text-slate-500 hover:text-red-600 underline cursor-pointer"
              >
                Clear all filters
              </button>
            )}
          </div>

          <div className="text-xs text-slate-500 font-mono tabular-nums">
            Showing {filteredRecords.length} records matching criteria
          </div>
        </div>
      </div>

      {/* Million-Dollar Spotlight Banner (if active or records exist) */}
      {stats?.millionDollarCount && stats.millionDollarCount > 0 && !millionOnly && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 via-amber-50/50 to-transparent dark:from-amber-950/30 dark:via-amber-950/10 dark:to-transparent border border-amber-200/80 dark:border-amber-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                Singapore Million-Dollar Flat Tracker
              </div>
              <div className="text-sm text-slate-700 dark:text-slate-300">
                <span className="font-bold font-mono tabular-nums">{stats.millionDollarCount}</span> flats sold for $1,000,000 or more in the recent batch (including Pinnacle@Duxton, Bishan, Queenstown, and Toa Payoh).
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setMillionOnly(true);
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs font-medium text-amber-800 dark:text-amber-300 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/50 rounded-lg transition-colors whitespace-nowrap self-start sm:self-auto cursor-pointer"
          >
            View $1M+ Flats Only
          </button>
        </div>
      )}

      {/* Transaction Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Registered Transactions Ledger
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
                    <span>Month</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Town &amp; Address</th>
                <th className="py-3 px-4">Flat Type &amp; Model</th>
                <th className="py-3 px-4">Storey</th>
                <th
                  onClick={() => toggleSort('area')}
                  className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Floor Area</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right">Lease Left</th>
                <th
                  onClick={() => toggleSort('sqm')}
                  className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Price / sqm</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('price')}
                  className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Resale Price</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No transactions match your current search filters. Try resetting the town or price filters.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {r.month}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {r.town}
                      </div>
                      <div className="text-xs text-slate-500">
                        Blk {r.block} {r.street_name}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {r.flat_type}
                      </div>
                      <div className="text-xs text-slate-400">{r.flat_model}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-mono text-xs">
                      {r.storey_range}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      <div>{r.floor_area_sqm} sqm</div>
                      <div className="text-[11px] text-slate-400">
                        {Math.round(r.floor_area_sqm * 10.764)} sqft
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs text-slate-500">
                      {r.remaining_lease}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      ${r.price_per_sqm.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div
                        className={`font-bold font-mono tabular-nums ${
                          r.is_million_dollar
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        ${r.resale_price.toLocaleString()}
                      </div>
                      {r.is_million_dollar && (
                        <div className="text-[11px] font-medium text-amber-600">
                          $1M+ Club
                        </div>
                      )}
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
    </div>
  );
};
