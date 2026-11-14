import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Construction,
  ExternalLink,
  FileText,
  MapPin,
  RefreshCw,
  Search,
} from 'lucide-react';
import { RoadInsightsResponse } from '../types';
import { SafeImage } from './SafeImage';

interface RoadInsightsScreenProps {
  data: RoadInsightsResponse | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

type InsightFilter = 'all' | 'incident' | 'closure';

export function RoadInsightsScreen({
  data,
  loading,
  error,
  onRefresh,
}: RoadInsightsScreenProps) {
  const [kindFilter, setKindFilter] = useState<InsightFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = useMemo(() => {
    if (!data?.items) return [];
    const q = searchQuery.trim().toLowerCase();
    return data.items.filter((item) => {
      if (kindFilter !== 'all' && item.kind !== kindFilter) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.roadCorridor.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });
  }, [data, kindFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* 3-Column LTA Summary Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-3 bg-white border border-slate-200 rounded-xl divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
        <div className="p-4">
          <p className="text-xs font-medium text-slate-500">Live Expressway Incidents</p>
          <p className="mt-1 text-2xl font-bold text-amber-700 font-mono tabular-nums">
            {data ? data.incidentCount : '—'}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Breakdowns, accidents &amp; active roadworks via LTA KML
          </p>
        </div>

        <div className="p-4">
          <p className="text-xs font-medium text-slate-500">Road Closures &amp; Diversions</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {data ? data.closureCount : '—'}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Temporary event &amp; permanent infrastructure closures
          </p>
        </div>

        <div className="p-4 flex flex-col justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Official Data Source</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              LTA OneMotoring Traffic.Smart
            </p>
          </div>
          <a
            href="https://onemotoring.lta.gov.sg/content/onemotoring/home/driving/traffic_information/traffic_updates_and_road_closures.html"
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:underline w-fit"
          >
            <span>Open LTA OneMotoring</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </section>

      {/* Filter & Search Bar */}
      <section className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit">
          {(
            [
              { id: 'all', label: 'All Road Updates' },
              { id: 'incident', label: 'Live Incidents' },
              { id: 'closure', label: 'Road Closures' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setKindFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                kindFilter === tab.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search expressway or road (e.g. AYE, TPE, Loyang)..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white"
            />
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync LTA Feed</span>
          </button>
        </div>
      </section>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between gap-4">
          <p className="text-sm text-red-800">{error}</p>
          <button
            type="button"
            onClick={onRefresh}
            className="px-3 py-1.5 text-xs font-semibold text-red-900 bg-white border border-red-300 rounded-lg hover:bg-red-100 whitespace-nowrap"
          >
            Retry LTA Sync
          </button>
        </div>
      )}

      {/* Road Insights List */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">
            Active Traffic Advisories &amp; Road Closures
          </h2>
          <span className="text-xs text-slate-500 font-mono tabular-nums">
            {filteredItems.length} advisories
          </span>
        </div>

        {loading && !data ? (
          <div className="divide-y divide-slate-100">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 flex items-center gap-4 animate-pulse">
                <div className="w-10 h-10 bg-slate-100 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="w-48 h-4 bg-slate-100 rounded" />
                  <div className="w-full h-3 bg-slate-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-10 text-center">
            <Construction className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-800">No road advisories match your filter</p>
            <p className="text-xs text-slate-500 mt-1">
              Clear the search query or switch to All Road Updates.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredItems.map((item) => {
              const isIncident = item.kind === 'incident';
              return (
                <div
                  key={item.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center p-1.5 shrink-0">
                      <SafeImage
                        src={item.iconUrl}
                        alt={item.category}
                        objectFit="contain"
                        className="w-full h-full"
                        fallbackLabel={item.roadCorridor}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1 font-semibold ${
                            isIncident ? 'text-amber-700' : 'text-teal-700'
                          }`}
                        >
                          {isIncident ? (
                            <AlertTriangle className="w-3.5 h-3.5" />
                          ) : (
                            <Construction className="w-3.5 h-3.5" />
                          )}
                          <span>{item.category}</span>
                        </span>
                        <span className="text-slate-400" aria-hidden="true">·</span>
                        <span className="font-mono font-semibold text-slate-800">
                          {item.roadCorridor}
                        </span>
                        <span className="text-slate-400" aria-hidden="true">·</span>
                        <span className="text-slate-500 font-mono tabular-nums">{item.timeInfo}</span>
                      </div>

                      <h3 className="mt-1 text-sm font-semibold text-slate-900 leading-snug">
                        {item.title}
                      </h3>

                      <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                        {item.description}
                      </p>

                      {item.coordinates && (
                        <p className="mt-1.5 inline-flex items-center gap-1 text-xs text-slate-500 font-mono tabular-nums">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>GPS: {item.coordinates}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 sm:pt-1">
                    {item.mapUrl ? (
                      <a
                        href={item.mapUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors whitespace-nowrap"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Closure Map PDF</span>
                      </a>
                    ) : (
                      <a
                        href={item.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors whitespace-nowrap"
                      >
                        <span>LTA Details</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
