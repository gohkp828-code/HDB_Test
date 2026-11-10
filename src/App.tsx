import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { OverviewDashboard } from './components/OverviewDashboard';
import { ResaleTracker } from './components/ResaleTracker';
import { RentalTracker } from './components/RentalTracker';
import { CarparkTracker } from './components/CarparkTracker';
import { AiAdvisor } from './components/AiAdvisor';
import { Footer } from './components/Footer';
import {
  OverviewData,
  ResaleRecord,
  ResaleStats,
  RentalRecord,
  RentalStats,
  CarparkItem,
  CarparkSummary,
  TownYield
} from './types';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'resale' | 'rental' | 'carparks' | 'advisor'>('overview');
  const [selectedTown, setSelectedTown] = useState<string>('ALL');

  // Data states
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [resaleRecords, setResaleRecords] = useState<ResaleRecord[]>([]);
  const [resaleStats, setResaleStats] = useState<ResaleStats | null>(null);
  const [rentalRecords, setRentalRecords] = useState<RentalRecord[]>([]);
  const [rentalStats, setRentalStats] = useState<RentalStats | null>(null);
  const [yieldComparison, setYieldComparison] = useState<TownYield[]>([]);
  const [carparks, setCarparks] = useState<CarparkItem[]>([]);
  const [carparkSummary, setCarparkSummary] = useState<CarparkSummary | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch all endpoints
  const loadAllData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setFetchError(null);

    try {
      // 1. Overview
      const overviewRes = await fetch('/api/overview');
      if (overviewRes.ok) {
        const oJson = await overviewRes.json();
        if (oJson.success) {
          setOverview(oJson);
          setYieldComparison(oJson.topYields || []);
          if (oJson.carparks) {
            setCarparkSummary({
              totalCarparks: oJson.carparks.totalCarparks,
              totalLots: oJson.carparks.totalLots,
              availableLots: oJson.carparks.availableLots,
              occupancyRate: oJson.carparks.occupancyRate
            });
          }
        }
      }

      // 2. Resale
      const resaleRes = await fetch('/api/resale');
      if (resaleRes.ok) {
        const rJson = await resaleRes.json();
        if (rJson.success) {
          setResaleRecords(rJson.records || []);
          setResaleStats(rJson.stats || null);
        }
      }

      // 3. Rental
      const rentalRes = await fetch('/api/rental');
      if (rentalRes.ok) {
        const rtJson = await rentalRes.json();
        if (rtJson.success) {
          setRentalRecords(rtJson.records || []);
          setRentalStats(rtJson.stats || null);
          if (rtJson.yieldComparison) {
            setYieldComparison(rtJson.yieldComparison);
          }
        }
      }

      // 4. Carparks
      const carparkRes = await fetch(`/api/carparks${isManualRefresh ? '?refresh=true' : ''}`);
      if (carparkRes.ok) {
        const cpJson = await carparkRes.json();
        if (cpJson.success) {
          setCarparks(cpJson.carparks || []);
          if (cpJson.summary) {
            setCarparkSummary(cpJson.summary);
          }
        }
      }

      const now = new Date();
      setLastUpdated(
        now.toLocaleTimeString('en-SG', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      );
    } catch (err: any) {
      console.error('Failed to load HDB data:', err);
      setFetchError('Unable to connect to Government API server. Retrying...');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Refresh live carpark availability only
  const refreshCarparks = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/carparks?refresh=true');
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setCarparks(json.carparks || []);
          if (json.summary) setCarparkSummary(json.summary);
          const now = new Date();
          setLastUpdated(
            now.toLocaleTimeString('en-SG', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })
          );
        }
      }
    } catch (err) {
      console.error('Error refreshing carparks:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col text-slate-900 dark:text-slate-100">
      {/* Top Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedTown={selectedTown}
        setSelectedTown={setSelectedTown}
        onRefresh={() => loadAllData(true)}
        isRefreshing={isRefreshing}
        lastUpdated={lastUpdated}
      />

      {/* Hero Banner with Key Metrics & Town Quick Switch */}
      <HeroBanner
        overview={overview}
        selectedTown={selectedTown}
        setSelectedTown={setSelectedTown}
        onExploreTab={setActiveTab}
      />

      {/* Global Error Banner if API failed */}
      {fetchError && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg flex items-center justify-between text-xs text-red-700 dark:text-red-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span>{fetchError}</span>
            </div>
            <button
              onClick={() => loadAllData(true)}
              className="font-medium underline cursor-pointer hover:text-red-900"
            >
              Retry Connection
            </button>
          </div>
        </div>
      )}

      {/* Main Content Body */}
      <main className="flex-1">
        {activeTab === 'overview' && (
          <OverviewDashboard
            overview={overview}
            selectedTown={selectedTown}
            setSelectedTown={setSelectedTown}
            setActiveTab={setActiveTab}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'resale' && (
          <ResaleTracker
            records={resaleRecords}
            stats={resaleStats}
            selectedTown={selectedTown}
            setSelectedTown={setSelectedTown}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'rental' && (
          <RentalTracker
            records={rentalRecords}
            stats={rentalStats}
            yieldComparison={yieldComparison}
            selectedTown={selectedTown}
            setSelectedTown={setSelectedTown}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'carparks' && (
          <CarparkTracker
            carparks={carparks}
            summary={carparkSummary}
            lastUpdated={lastUpdated}
            selectedTown={selectedTown}
            setSelectedTown={setSelectedTown}
            onRefresh={refreshCarparks}
            isRefreshing={isRefreshing}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'advisor' && (
          <AiAdvisor
            selectedTown={selectedTown}
            setSelectedTown={setSelectedTown}
          />
        )}
      </main>

      {/* Footer */}
      <Footer setActiveTab={setActiveTab} />
    </div>
  );
}
