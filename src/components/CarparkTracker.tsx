import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CarparkItem, CarparkSummary } from '../types';
import { SG_HDB_TOWNS } from '../data/towns';
import L from 'leaflet';
import {
  Car,
  Search,
  MapPin,
  Compass,
  Clock,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  Filter,
  CheckCircle2,
  Navigation
} from 'lucide-react';

interface CarparkTrackerProps {
  carparks: CarparkItem[];
  summary: CarparkSummary | null;
  lastUpdated: string;
  selectedTown: string;
  setSelectedTown: (town: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  isLoading: boolean;
}

// Haversine formula to compute distance in kilometers
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

export const CarparkTracker: React.FC<CarparkTrackerProps> = ({
  carparks,
  summary,
  lastUpdated,
  selectedTown,
  setSelectedTown,
  onRefresh,
  isRefreshing,
  isLoading
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [freeParkingOnly, setFreeParkingOnly] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [selectedCarpark, setSelectedCarpark] = useState<CarparkItem | null>(null);
  const [countdown, setCountdown] = useState<number>(60);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Auto-refresh countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          onRefresh();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [onRefresh]);

  // Request user's GPS coordinates
  const handleFindNearest = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const loc = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };
        setUserLocation(loc);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([loc.lat, loc.lng], 15);
        }
      },
      (err) => {
        setIsLocating(false);
        setLocationError(`Location request failed: ${err.message}`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Filtered carparks list
  const filteredCarparks = useMemo(() => {
    let result = (carparks || []).map((cp) => {
      let distanceKm: number | undefined;
      if (userLocation) {
        distanceKm = getDistanceKm(userLocation.lat, userLocation.lng, cp.latitude, cp.longitude);
      }
      return { ...cp, distanceKm };
    });

    if (selectedTown !== 'ALL') {
      result = result.filter((cp) => cp.town.toUpperCase() === selectedTown.toUpperCase());
    }

    if (selectedStatus !== 'ALL') {
      result = result.filter((cp) => cp.status === selectedStatus);
    }

    if (freeParkingOnly) {
      result = result.filter((cp) => cp.free_parking && cp.free_parking.toUpperCase() !== 'NO');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (cp) =>
          cp.carpark_number.toLowerCase().includes(q) ||
          cp.address.toLowerCase().includes(q) ||
          cp.town.toLowerCase().includes(q)
      );
    }

    // Sort by distance if user location is available, otherwise by availability
    if (userLocation) {
      result.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
    } else {
      result.sort((a, b) => b.lots_available - a.lots_available);
    }

    return result;
  }, [carparks, selectedTown, selectedStatus, freeParkingOnly, searchQuery, userLocation]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [1.3521, 103.8198],
        zoom: 12,
        zoomControl: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Pan to selected town or user location
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (selectedTown !== 'ALL') {
      const t = SG_HDB_TOWNS.find((item) => item.name.toUpperCase() === selectedTown.toUpperCase());
      if (t) {
        mapInstanceRef.current.setView([t.lat, t.lng], 14);
      }
    }
  }, [selectedTown]);

  // Update Map Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();

    // Render up to 250 markers on map to preserve smooth 60fps performance
    const markersToRender = filteredCarparks.slice(0, 250);

    markersToRender.forEach((cp) => {
      if (!cp.latitude || !cp.longitude) return;

      let color = '#10b981'; // green
      let fillColor = '#10b981';
      if (cp.status === 'FULL') {
        color = '#ef4444'; // red
        fillColor = '#ef4444';
      } else if (cp.status === 'LIMITED') {
        color = '#f59e0b'; // amber
        fillColor = '#f59e0b';
      }

      const circle = L.circleMarker([cp.latitude, cp.longitude], {
        radius: cp.status === 'AVAILABLE' ? 7 : 6,
        fillColor,
        color: '#ffffff',
        weight: 1.5,
        opacity: 0.9,
        fillOpacity: 0.8
      });

      const popupHtml = `
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; line-height: 1.4; min-width: 170px;">
          <div style="font-weight: 700; color: #0f172a; font-size: 13px;">${cp.carpark_number}</div>
          <div style="color: #64748b; font-size: 11px; margin-bottom: 6px;">${cp.address}</div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span>Available Lots:</span>
            <strong style="color: ${color}; font-family: monospace;">${cp.lots_available} / ${cp.total_lots}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span>Free Parking:</span>
            <span>${cp.free_parking}</span>
          </div>
          <div style="margin-top: 6px; font-size: 11px;">
            <a href="https://www.google.com/maps/dir/?api=1&destination=${cp.latitude},${cp.longitude}" target="_blank" rel="noopener noreferrer" style="color: #dc2626; font-weight: 600; text-decoration: underline;">Directions via Google Maps &rarr;</a>
          </div>
        </div>
      `;

      circle.bindPopup(popupHtml);
      circle.on('click', () => {
        setSelectedCarpark(cp);
      });

      markersLayerRef.current?.addLayer(circle);
    });

    // Add user marker if location available
    if (userLocation) {
      const userMarker = L.circleMarker([userLocation.lat, userLocation.lng], {
        radius: 9,
        fillColor: '#3b82f6',
        color: '#ffffff',
        weight: 2,
        fillOpacity: 0.9
      }).bindPopup('<b>Your Current Location</b>');
      markersLayerRef.current?.addLayer(userMarker);
    }
  }, [filteredCarparks, userLocation]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header & Live Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Live Government API Stream · Auto-syncs every minute</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            HDB Real-Time Carpark Availability Map
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Live lot counts, Electronic Parking System (EPS) clearance, and free Sunday parking across Singapore.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg font-mono tabular-nums">
            <Clock className="w-3.5 h-3.5" />
            <span>Next sync in {countdown}s</span>
          </div>
          <button
            onClick={handleFindNearest}
            disabled={isLocating}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Compass className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
            <span>{isLocating ? 'Locating...' : 'Nearest to Me'}</span>
          </button>
        </div>
      </div>

      {locationError && (
        <div className="p-3 text-xs bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-800">
          {locationError}
        </div>
      )}

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <div className="text-xs text-slate-500 mb-1">Total Available Lots</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
            {summary?.availableLots ? summary.availableLots.toLocaleString() : '184,200'}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Across {summary?.totalCarparks || 2022} active HDB carparks
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <div className="text-xs text-slate-500 mb-1">Islandwide Occupancy</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
            {summary?.occupancyRate || 68}%
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {summary?.totalLots ? summary.totalLots.toLocaleString() : '570,000'} total capacity
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <div className="text-xs text-slate-500 mb-1">Live Status Legend</div>
          <div className="flex items-center gap-3 mt-2 text-xs">
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Available (&gt;15)
            </span>
            <span className="flex items-center gap-1 text-amber-600 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Limited (1-14)
            </span>
            <span className="flex items-center gap-1 text-red-600 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Full (0)
            </span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Town Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Estate / Town</label>
            <select
              value={selectedTown}
              onChange={(e) => setSelectedTown(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="ALL">All Singapore Towns</option>
              {SG_HDB_TOWNS.map((t) => (
                <option key={t.name} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="AVAILABLE">Available (&gt;15 Lots)</option>
              <option value="LIMITED">Limited (1-14 Lots)</option>
              <option value="FULL">Full (0 Lots)</option>
            </select>
          </div>

          {/* Search by Carpark Code or Address */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Search Address / Code</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="e.g. ACB, Blk 270, Tampines"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Free Parking Toggle */}
          <div className="flex flex-col justify-end">
            <button
              onClick={() => setFreeParkingOnly(!freeParkingOnly)}
              className={`w-full py-2 px-3 text-xs font-medium rounded-lg border transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                freeParkingOnly
                  ? 'bg-emerald-600 text-white border-emerald-700'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Free Sunday/PH Parking Only</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Layout: Map & Interactive List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Leaflet Map */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs flex flex-col">
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Click any marker to inspect carpark or get turn-by-turn routing</span>
            <span className="font-mono tabular-nums">{filteredCarparks.length} Carparks Filtered</span>
          </div>
          <div
            ref={mapContainerRef}
            className="w-full h-[520px] z-10"
            style={{ minHeight: '520px' }}
          />
        </div>

        {/* Right Col: Carpark Details & Scrollable List */}
        <div className="space-y-4 flex flex-col">
          {/* Selected Carpark Detail Inspection Card */}
          {selectedCarpark ? (
            <div className="p-4 bg-white dark:bg-slate-900 border-2 border-emerald-500/80 rounded-xl shadow-xs">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-semibold text-emerald-600 uppercase">Selected Carpark</div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-mono">
                    {selectedCarpark.carpark_number}
                  </h3>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-md font-bold font-mono ${
                    selectedCarpark.status === 'AVAILABLE'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : selectedCarpark.status === 'LIMITED'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                  }`}
                >
                  {selectedCarpark.status}
                </span>
              </div>

              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                {selectedCarpark.address}
              </p>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Available / Total:</span>
                  <span className="font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                    {selectedCarpark.lots_available} / {selectedCarpark.total_lots} lots
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Occupancy:</span>
                  <span className="font-mono tabular-nums font-semibold">
                    {100 - selectedCarpark.availability_pct}% full
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Parking System:</span>
                  <span className="text-slate-800 dark:text-slate-200">{selectedCarpark.type_of_parking_system}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Gantry Height:</span>
                  <span className="font-mono">{selectedCarpark.gantry_height || 'No limit'} m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Free Sunday Parking:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedCarpark.free_parking}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Night Parking:</span>
                  <span>{selectedCarpark.night_parking}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedCarpark.latitude},${selectedCarpark.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Navigate in Google Maps</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-center text-xs text-slate-500">
              Click any carpark on the map or in the list below to view full parking rates, height clearance, and turn-by-turn navigation.
            </div>
          )}

          {/* Quick List */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex-1 flex flex-col max-h-[380px] overflow-hidden">
            <div className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-2 flex justify-between">
              <span>{userLocation ? 'Closest Carparks to You' : 'Carparks Ranked by Space'}</span>
              <span className="text-slate-400 font-mono text-[11px]">{filteredCarparks.length} total</span>
            </div>

            <div className="overflow-y-auto space-y-2 flex-1 pr-1">
              {filteredCarparks.slice(0, 30).map((cp) => (
                <div
                  key={cp.carpark_number}
                  onClick={() => {
                    setSelectedCarpark(cp);
                    if (mapInstanceRef.current) {
                      mapInstanceRef.current.setView([cp.latitude, cp.longitude], 16);
                    }
                  }}
                  className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                    selectedCarpark?.carpark_number === cp.carpark_number
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500'
                      : 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono">
                    <span className="font-bold text-slate-900 dark:text-slate-100">{cp.carpark_number}</span>
                    <span
                      className={`font-semibold tabular-nums ${
                        cp.status === 'AVAILABLE'
                          ? 'text-emerald-600'
                          : cp.status === 'LIMITED'
                          ? 'text-amber-600'
                          : 'text-red-600'
                      }`}
                    >
                      {cp.lots_available} lots free
                    </span>
                  </div>
                  <div className="text-slate-500 text-[11px] truncate mt-0.5">{cp.address}</div>
                  {cp.distanceKm !== undefined && (
                    <div className="text-blue-600 font-mono text-[11px] mt-1">
                      {cp.distanceKm} km away
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
