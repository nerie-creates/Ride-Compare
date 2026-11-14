import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpDown,
  CarFront,
  Check,
  Clock,
  ExternalLink,
  MapPin,
  Navigation,
  PawPrint,
  RefreshCw,
  Star,
  Users,
} from 'lucide-react';
import { BookingStatus, RideBooking, RideBookingPayload, RidePartner, RideQuote, RidesResponse } from '../types';
import { SafeImage } from './SafeImage';
import { RideBookingModal } from './RideBookingModal';

interface RideDispatchScreenProps {
  data: RidesResponse | null;
  loading: boolean;
  error: string | null;
  pickup: string;
  dropoff: string;
  passengers: number;
  petFriendly: boolean;
  onChangeRoute: (next: {
    pickup: string;
    dropoff: string;
    passengers: number;
    petFriendly: boolean;
  }) => void;
  onRefresh: () => void;
  onBookRide: (payload: RideBookingPayload) => Promise<RideBooking>;
  onUpdateBookingStatus: (id: string, status: BookingStatus) => Promise<void>;
  onNavigateToBookings: () => void;
  onNavigateToTraffic: () => void;
}

const PRESET_ROUTES = [
  { pickup: 'Marina Bay Sands', dropoff: 'Changi Airport T3' },
  { pickup: 'Orchard Road', dropoff: 'Raffles Place' },
  { pickup: 'One-North', dropoff: 'Sentosa HarbourFront' },
  { pickup: 'Jurong East', dropoff: 'Bugis Junction' },
];

type PartnerFilter = 'All' | RidePartner;
type SortMode = 'fare' | 'eta' | 'partner';

export function RideDispatchScreen({
  data,
  loading,
  error,
  pickup,
  dropoff,
  passengers,
  petFriendly,
  onChangeRoute,
  onRefresh,
  onBookRide,
  onUpdateBookingStatus,
  onNavigateToBookings,
  onNavigateToTraffic,
}: RideDispatchScreenProps) {
  const [draftPickup, setDraftPickup] = useState(pickup);
  const [draftDropoff, setDraftDropoff] = useState(dropoff);
  const [partnerFilter, setPartnerFilter] = useState<PartnerFilter>('All');
  const [sortMode, setSortMode] = useState<SortMode>('fare');
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [bookingModalQuote, setBookingModalQuote] = useState<RideQuote | null>(null);
  const [latestBooking, setLatestBooking] = useState<RideBooking | null>(null);

  const visibleQuotes = useMemo(() => {
    if (!data?.quotes) return [];
    let list = [...data.quotes];
    if (partnerFilter !== 'All') {
      list = list.filter((q) => q.partner === partnerFilter);
    }
    list.sort((a, b) => {
      if (sortMode === 'fare') return a.fareSgd - b.fareSgd;
      if (sortMode === 'eta') return a.nearestDriver.etaMin - b.nearestDriver.etaMin;
      return a.partner.localeCompare(b.partner) || a.fareSgd - b.fareSgd;
    });
    return list;
  }, [data, partnerFilter, sortMode]);

  const selectedQuote = useMemo(() => {
    if (visibleQuotes.length === 0) return null;
    const found = visibleQuotes.find((q) => q.id === selectedQuoteId);
    return found || visibleQuotes[0];
  }, [visibleQuotes, selectedQuoteId]);

  const lowestQuote = useMemo(() => {
    if (!data?.quotes.length) return null;
    return data.quotes.reduce((min, q) => (q.fareSgd < min.fareSgd ? q : min), data.quotes[0]);
  }, [data]);

  const fastestQuote = useMemo(() => {
    if (!data?.quotes.length) return null;
    return data.quotes.reduce(
      (min, q) => (q.nearestDriver.etaMin < min.nearestDriver.etaMin ? q : min),
      data.quotes[0]
    );
  }, [data]);

  const handleRouteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onChangeRoute({
      pickup: draftPickup.trim() || 'Marina Bay Sands',
      dropoff: draftDropoff.trim() || 'Changi Airport T3',
      passengers,
      petFriendly,
    });
  };

  const handleSwap = () => {
    const nextPickup = draftDropoff;
    const nextDropoff = draftPickup;
    setDraftPickup(nextPickup);
    setDraftDropoff(nextDropoff);
    onChangeRoute({
      pickup: nextPickup.trim() || 'Changi Airport T3',
      dropoff: nextDropoff.trim() || 'Marina Bay Sands',
      passengers,
      petFriendly,
    });
  };

  const handleApplyPreset = (preset: { pickup: string; dropoff: string }) => {
    setDraftPickup(preset.pickup);
    setDraftDropoff(preset.dropoff);
    onChangeRoute({
      pickup: preset.pickup,
      dropoff: preset.dropoff,
      passengers,
      petFriendly,
    });
  };

  const handleConfirmBooking = async (payload: RideBookingPayload) => {
    const created = await onBookRide(payload);
    setLatestBooking(created);
  };

  const handleAdvanceStatus = async (booking: RideBooking) => {
    const nextMap: Partial<Record<BookingStatus, BookingStatus>> = {
      Confirmed: 'Driver En Route',
      'Driver En Route': 'Arriving',
      Arriving: 'In Transit',
      'In Transit': 'Completed',
    };
    const nextStatus = nextMap[booking.status];
    if (!nextStatus) return;
    await onUpdateBookingStatus(booking.id, nextStatus);
    setLatestBooking((prev) => (prev && prev.id === booking.id ? { ...prev, status: nextStatus } : prev));
  };

  const roadAlerts = data?.roadAlerts || [];

  return (
    <div className="space-y-6">
      {/* Route & Filter Planner Bar */}
      <section className="bg-white border border-slate-200 rounded-xl p-5">
        <form onSubmit={handleRouteSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
          <div className="lg:col-span-4">
            <label htmlFor="pickup-input" className="block text-xs font-medium text-slate-600 mb-1.5">
              Pickup Location
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-teal-700 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="pickup-input"
                type="text"
                value={draftPickup}
                onChange={(e) => setDraftPickup(e.target.value)}
                placeholder="Enter pickup address or landmark"
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white"
              />
            </div>
          </div>

          <div className="lg:col-span-1 flex justify-center">
            <button
              type="button"
              onClick={handleSwap}
              aria-label="Swap pickup and dropoff"
              className="p-2.5 text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>

          <div className="lg:col-span-4">
            <label htmlFor="dropoff-input" className="block text-xs font-medium text-slate-600 mb-1.5">
              Destination
            </label>
            <div className="relative">
              <Navigation className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="dropoff-input"
                type="text"
                value={draftDropoff}
                onChange={(e) => setDraftDropoff(e.target.value)}
                placeholder="Enter destination"
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white"
              />
            </div>
          </div>

          <div className="lg:col-span-3 flex items-center gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Pull Latest Fares</span>
            </button>
          </div>
        </form>

        {/* Corridor Presets + Cabin Filters */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-500 mr-1">Corridors:</span>
            {PRESET_ROUTES.map((preset) => {
              const isCurrent =
                preset.pickup.toLowerCase() === pickup.toLowerCase() &&
                preset.dropoff.toLowerCase() === dropoff.toLowerCase();
              return (
                <button
                  key={`${preset.pickup}-${preset.dropoff}`}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    isCurrent
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {preset.pickup} to {preset.dropoff}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                onChangeRoute({
                  pickup,
                  dropoff,
                  passengers: passengers === 4 ? 6 : 4,
                  petFriendly,
                })
              }
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 ${
                passengers > 4
                  ? 'bg-teal-50 border-teal-700 text-teal-900'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>{passengers > 4 ? '6+ Seats (MPV)' : '1–4 Riders'}</span>
            </button>

            <button
              type="button"
              onClick={() =>
                onChangeRoute({
                  pickup,
                  dropoff,
                  passengers,
                  petFriendly: !petFriendly,
                })
              }
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 ${
                petFriendly
                  ? 'bg-teal-50 border-teal-700 text-teal-900'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <PawPrint className="w-3.5 h-3.5" />
              <span>Pet-Friendly</span>
            </button>
          </div>
        </div>
      </section>

      {/* 4-Column KPI Summary Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 bg-white border border-slate-200 rounded-xl divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
        <div className="p-4">
          <p className="text-xs font-medium text-slate-500">Lowest Partner Fare</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {lowestQuote ? `$${lowestQuote.fareSgd.toFixed(2)}` : '—'}
          </p>
          <p className="mt-1 text-xs text-slate-500 truncate">
            {lowestQuote ? `${lowestQuote.partner} · ${lowestQuote.serviceName}` : 'Loading quotes'}
          </p>
        </div>

        <div className="p-4">
          <p className="text-xs font-medium text-slate-500">Nearest Available Driver</p>
          <p className="mt-1 text-2xl font-bold text-teal-700 font-mono tabular-nums">
            {fastestQuote ? `${fastestQuote.nearestDriver.etaMin} min` : '—'}
          </p>
          <p className="mt-1 text-xs text-slate-500 truncate">
            {fastestQuote
              ? `${fastestQuote.nearestDriver.distanceKm.toFixed(1)} km · ${fastestQuote.nearestDriver.name}`
              : 'Scanning vehicles'}
          </p>
        </div>

        <div className="p-4">
          <p className="text-xs font-medium text-slate-500">Corridor Distance &amp; Time</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {data ? `${data.tripDistanceKm.toFixed(1)} km` : '—'}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {data ? `Approx. ${data.tripDurationMin} min (incl. LTA flow)` : 'Calculating route'}
          </p>
        </div>

        <div className="p-4">
          <p className="text-xs font-medium text-slate-500">Live Partner Tiers</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {data ? data.quotes.length : '—'}
          </p>
          <p className="mt-1 text-xs text-slate-500 truncate">
            Grab · Ryde · Gojek · CDG Zig
          </p>
        </div>
      </section>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between gap-4">
          <p className="text-sm text-red-800">{error}</p>
          <button
            type="button"
            onClick={onRefresh}
            className="px-3 py-1.5 text-xs font-semibold text-red-900 bg-white border border-red-300 rounded-lg hover:bg-red-100 whitespace-nowrap shrink-0"
          >
            Retry Sync
          </button>
        </div>
      )}

      {latestBooking && latestBooking.status !== 'Cancelled' && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Check className="w-4 h-4 text-teal-700 shrink-0" />
              <span className="text-sm font-bold text-teal-950">
                Booking {latestBooking.bookingRef} · {latestBooking.status}
              </span>
              <span className="text-xs text-teal-800 font-mono tabular-nums">
                (${latestBooking.finalFareSgd.toFixed(2)} via {latestBooking.paymentMethod})
              </span>
            </div>
            <p className="text-xs text-teal-900">
              {latestBooking.partner} {latestBooking.serviceName} · Driver{' '}
              <strong>{latestBooking.driver.name}</strong> ({latestBooking.driver.plateNumber},{' '}
              {latestBooking.driver.etaMin} min ETA) · Passenger: {latestBooking.passengerName}
              {latestBooking.pickupNote ? ` · Note: "${latestBooking.pickupNote}"` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {latestBooking.status !== 'Completed' && (
              <button
                type="button"
                onClick={() => handleAdvanceStatus(latestBooking)}
                className="px-3 py-1.5 text-xs font-semibold text-teal-900 bg-white border border-teal-300 rounded-lg hover:bg-teal-100 whitespace-nowrap"
              >
                {latestBooking.status === 'Confirmed'
                  ? 'Dispatch Driver'
                  : latestBooking.status === 'Driver En Route'
                  ? 'Mark Arriving'
                  : latestBooking.status === 'Arriving'
                  ? 'Start Trip'
                  : 'Complete Trip'}
              </button>
            )}
            <button
              type="button"
              onClick={onNavigateToBookings}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg whitespace-nowrap"
            >
              Manage Trips
            </button>
          </div>
        </div>
      )}

      {/* 2-Column Main Dispatch Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Live Pricing & Driver Comparison List */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
              {(['All', 'Grab', 'Ryde', 'Gojek', 'CDG Zig'] as PartnerFilter[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setPartnerFilter(tab)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    partnerFilter === tab
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab === 'All' ? 'All Partners' : tab}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="sort-rides" className="text-xs text-slate-500 whitespace-nowrap">
                Sort by
              </label>
              <select
                id="sort-rides"
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700"
              >
                <option value="fare">Lowest Fare</option>
                <option value="eta">Fastest Pickup</option>
                <option value="partner">Partner Name</option>
              </select>
            </div>
          </div>

          {loading && !data ? (
            <div className="divide-y divide-slate-100">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="p-4 flex items-center justify-between gap-4 animate-pulse">
                  <div className="flex items-center gap-3.5">
                    <div className="w-14 h-12 rounded-lg bg-slate-100" />
                    <div className="space-y-2">
                      <div className="w-32 h-4 bg-slate-100 rounded" />
                      <div className="w-48 h-3 bg-slate-100 rounded" />
                    </div>
                  </div>
                  <div className="w-20 h-6 bg-slate-100 rounded" />
                </div>
              ))}
            </div>
          ) : visibleQuotes.length === 0 ? (
            <div className="p-10 text-center">
              <CarFront className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-800">No ride tiers match these filters</p>
              <p className="text-xs text-slate-500 mt-1">
                Adjust passenger count or disable pet-friendly filtering to view all Grab, Ryde, Gojek, and CDG Zig options.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {visibleQuotes.map((quote) => {
                const isSelected = selectedQuote?.id === quote.id;
                return (
                  <div
                    key={quote.id}
                    onClick={() => setSelectedQuoteId(quote.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedQuoteId(quote.id);
                      }
                    }}
                    className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer transition-colors ${
                      isSelected ? 'bg-teal-50/60' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-16 h-12 rounded-lg bg-slate-50 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center p-1">
                        <SafeImage
                          src={quote.imageUrl}
                          alt={`${quote.partner} ${quote.serviceName}`}
                          objectFit={quote.partner === 'Grab' ? 'cover' : 'contain'}
                          className="w-full h-full rounded"
                          fallbackLabel={quote.serviceName}
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-slate-900">
                            {quote.serviceName}
                          </span>
                          <span className="text-xs text-slate-400" aria-hidden="true">·</span>
                          <span className="text-xs font-medium text-slate-600">
                            {quote.partner}
                          </span>
                          <span className="text-xs text-slate-400" aria-hidden="true">·</span>
                          <span className="text-xs text-slate-500">
                            {quote.seats} seats
                          </span>
                          {quote.isLowestFare && (
                            <>
                              <span className="text-xs text-slate-400" aria-hidden="true">·</span>
                              <span className="text-xs font-semibold text-teal-700">
                                Best price
                              </span>
                            </>
                          )}
                          {quote.isFastestPickup && (
                            <>
                              <span className="text-xs text-slate-400" aria-hidden="true">·</span>
                              <span className="text-xs font-semibold text-slate-700">
                                Closest driver
                              </span>
                            </>
                          )}
                        </div>

                        <div className="mt-1 flex items-center gap-2 text-xs text-slate-600 flex-wrap">
                          <span className="font-medium text-slate-800">
                            {quote.nearestDriver.name}
                          </span>
                          <span className="text-slate-400" aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-0.5 tabular-nums">
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                            {quote.nearestDriver.rating.toFixed(2)}
                          </span>
                          <span className="text-slate-400" aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">
                            {quote.nearestDriver.distanceKm.toFixed(1)} km ({quote.nearestDriver.etaMin} min)
                          </span>
                          <span className="text-slate-400" aria-hidden="true">·</span>
                          <span className="truncate">{quote.nearestDriver.vehicleModel}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-row items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-base font-bold text-slate-900 font-mono tabular-nums">
                          ${quote.fareSgd.toFixed(2)}
                        </p>
                        <p className="text-xs text-slate-500 font-mono tabular-nums">
                          {quote.surgeMultiplier > 1 ? `${quote.surgeMultiplier}x demand` : 'Standard rate'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedQuoteId(quote.id);
                          setBookingModalQuote(quote);
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
                      >
                        Book
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Nearest Driver Radar + Selected Driver Dispatch + LTA Road Insights */}
        <div className="lg:col-span-5 space-y-6">
          {/* Proximity Radar */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Nearest Driver Corridor Radar
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Click any nearby partner vehicle to inspect fare and ETA
                </p>
              </div>
              <button
                type="button"
                onClick={onRefresh}
                className="text-xs font-medium text-teal-700 hover:text-teal-800 whitespace-nowrap shrink-0"
              >
                Refresh GPS
              </button>
            </div>

            <div className="relative bg-slate-50 border border-slate-200 rounded-lg h-56 overflow-hidden">
              <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
                <defs>
                  <pattern id="grid" width="12.5" height="12.5" patternUnits="userSpaceOnUse">
                    <path d="M 12.5 0 L 0 0 0 12.5" fill="none" stroke="#e2e8f0" strokeWidth="0.35" />
                  </pattern>
                </defs>
                <rect width="100" height="100" fill="url(#grid)" />

                <line
                  x1="28"
                  y1="52"
                  x2="82"
                  y2="24"
                  stroke="#0f766e"
                  strokeWidth="0.9"
                  strokeDasharray="2 1.5"
                  opacity="0.7"
                />

                <circle cx="28" cy="52" r="14" fill="none" stroke="#cbd5e1" strokeWidth="0.4" />
                <circle cx="28" cy="52" r="28" fill="none" stroke="#cbd5e1" strokeWidth="0.35" strokeDasharray="1.5 1.5" />

                <circle cx="28" cy="52" r="2.6" fill="#0f766e" />
                <text x="28" y="59" textAnchor="middle" fontSize="3.3" fontWeight="600" fill="#0f172a">
                  Pickup
                </text>

                <rect x="80" y="22" width="4" height="4" rx="0.8" fill="#0f172a" />
                <text x="82" y="19.5" textAnchor="middle" fontSize="3.3" fontWeight="600" fill="#0f172a">
                  Dropoff
                </text>
              </svg>

              {visibleQuotes.slice(0, 10).map((q) => {
                const isActive = selectedQuote?.id === q.id;
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setSelectedQuoteId(q.id)}
                    style={{ left: `${q.nearestDriver.mapX}%`, top: `${q.nearestDriver.mapY}%` }}
                    title={`${q.partner} ${q.serviceName} · ${q.nearestDriver.name} (${q.nearestDriver.etaMin} min)`}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 px-2 py-0.5 rounded text-[11px] font-mono tabular-nums font-semibold transition-transform ${
                      isActive
                        ? 'bg-teal-700 text-white scale-110 z-20 shadow-sm'
                        : 'bg-white text-slate-800 border border-slate-300 hover:border-teal-600 z-10'
                    }`}
                  >
                    {q.nearestDriver.etaMin}m
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span>{pickup}</span>
              <span>→</span>
              <span>{dropoff}</span>
            </div>
          </div>

          {/* Selected Quote & Driver Dispatch Details */}
          {selectedQuote && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-8 bg-slate-50 border border-slate-200 rounded flex items-center justify-center p-1 shrink-0">
                    <SafeImage
                      src={selectedQuote.partnerLogoUrl}
                      alt={`${selectedQuote.partner} logo`}
                      objectFit="contain"
                      className="w-full h-full"
                      fallbackLabel={selectedQuote.partner}
                    />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {selectedQuote.serviceName}
                    </h3>
                    <p className="text-xs text-slate-500">{selectedQuote.description}</p>
                  </div>
                </div>
                <span className="text-xl font-bold text-slate-900 font-mono tabular-nums">
                  ${selectedQuote.fareSgd.toFixed(2)}
                </span>
              </div>

              <div className="border-t border-b border-slate-100 py-3 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Assigned Driver</span>
                  <span className="font-semibold text-slate-900 mt-0.5 block">
                    {selectedQuote.nearestDriver.name} ({selectedQuote.nearestDriver.rating.toFixed(2)} ★)
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Vehicle &amp; Plate</span>
                  <span className="font-semibold text-slate-900 mt-0.5 block font-mono">
                    {selectedQuote.nearestDriver.plateNumber} · {selectedQuote.nearestDriver.color}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Pickup Distance / ETA</span>
                  <span className="font-semibold text-teal-700 mt-0.5 block font-mono tabular-nums">
                    {selectedQuote.nearestDriver.distanceKm.toFixed(1)} km · {selectedQuote.nearestDriver.etaMin} min
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Fare Breakdown</span>
                  <span className="font-medium text-slate-700 mt-0.5 block font-mono tabular-nums">
                    Base ${selectedQuote.baseFare.toFixed(2)} + Dist ${selectedQuote.distanceFare.toFixed(2)} + Fee ${selectedQuote.platformFee.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setBookingModalQuote(selectedQuote)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors whitespace-nowrap"
                >
                  <Clock className="w-4 h-4" />
                  <span>
                    {`Book ${selectedQuote.serviceName} ($${selectedQuote.fareSgd.toFixed(2)})`}
                  </span>
                </button>
                <a
                  href={selectedQuote.partnerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  <span>Partner Site</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* On-The-Road LTA OneMotoring Insights Panel */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Live Road Insights (LTA OneMotoring)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Active expressway incidents &amp; road closures affecting travel
                </p>
              </div>
              <button
                type="button"
                onClick={onNavigateToTraffic}
                className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800 whitespace-nowrap shrink-0"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {roadAlerts.length === 0 ? (
              <p className="text-xs text-slate-500">No active road advisories reported.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {roadAlerts.slice(0, 3).map((alert) => (
                  <div key={alert.id} className="py-2.5 flex items-start gap-2.5">
                    <AlertTriangle
                      className={`w-4 h-4 mt-0.5 shrink-0 ${
                        alert.kind === 'incident' ? 'text-amber-600' : 'text-teal-700'
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <span className="font-semibold text-slate-800">{alert.roadCorridor}</span>
                        <span aria-hidden="true">·</span>
                        <span>{alert.category}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{alert.timeInfo}</span>
                      </div>
                      <p className="text-xs text-slate-700 mt-0.5 line-clamp-2 leading-relaxed">
                        {alert.title}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Hotlinked Partner Showcase Banner */}
          {data?.partnerAssets.gojekHero && (
            <div className="relative rounded-xl overflow-hidden border border-slate-200 h-36">
              <SafeImage
                src={data.partnerAssets.gojekHero}
                alt="Partner transport network visual from Gojek Singapore"
                className="w-full h-full"
                fallbackLabel="Singapore Multi-Partner Transport"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/35 to-transparent flex flex-col justify-end p-4">
                <p className="text-xs font-medium text-slate-200">
                  Grab · Ryde · Gojek · ComfortDelGro Zig
                </p>
                <p className="text-sm font-semibold text-white mt-0.5">
                  Comparing {data.quotes.length} live vehicle classes with LTA road awareness
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {bookingModalQuote && (
        <RideBookingModal
          quote={bookingModalQuote}
          pickup={pickup}
          dropoff={dropoff}
          onClose={() => setBookingModalQuote(null)}
          onConfirmBooking={handleConfirmBooking}
        />
      )}
    </div>
  );
}
