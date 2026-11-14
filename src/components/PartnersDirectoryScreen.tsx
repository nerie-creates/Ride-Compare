import { CheckCircle2, AlertTriangle, ExternalLink, RefreshCw, Globe } from 'lucide-react';
import { PartnerEndpointInfo } from '../types';
import { SafeImage } from './SafeImage';

interface PartnersDirectoryScreenProps {
  partners: PartnerEndpointInfo[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export function PartnersDirectoryScreen({
  partners,
  loading,
  error,
  onRefresh,
}: PartnersDirectoryScreenProps) {
  return (
    <div className="space-y-6">
      <section className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Key Partner HTML &amp; Media Integrations
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Live extraction endpoints pulling pricing imagery, transport logos, and editorial photography from partner URLs.
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Re-sync Partner URLs</span>
        </button>
      </section>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between gap-4">
          <p className="text-sm text-red-800">{error}</p>
          <button
            type="button"
            onClick={onRefresh}
            className="px-3 py-1.5 text-xs font-semibold text-red-900 bg-white border border-red-300 rounded-lg hover:bg-red-100 whitespace-nowrap"
          >
            Retry
          </button>
        </div>
      )}

      {loading && partners.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 h-64 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {partners.map((partner) => {
            const isHealthy = partner.status === 'connected' || partner.status === 'cached';
            return (
              <section
                key={partner.id}
                className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                        <h3 className="text-base font-bold text-slate-900">{partner.name}</h3>
                      </div>
                      <a
                        href={partner.htmlUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs font-mono text-teal-700 hover:underline break-all"
                      >
                        <span>{partner.htmlUrl}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </div>

                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold shrink-0">
                      {isHealthy ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span className="text-emerald-700">
                            {partner.status === 'connected' ? 'Live Connected' : 'Cached Ready'}
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          <span className="text-amber-700">Fallback Active</span>
                        </>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{partner.purpose}</p>

                  <div className="flex items-center gap-3 text-xs text-slate-500 border-t border-b border-slate-100 py-2.5">
                    <span className="font-mono tabular-nums">
                      Response: {partner.latencyMs} ms
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      Hotlinked Assets: {partner.extractedCount}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      Synced: {new Date(partner.lastFetchedAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-500 mb-2">
                    Hotlinked Media Extracted from Partner HTML
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {partner.hotlinkedImages.slice(0, 8).map((imgUrl, idx) => (
                      <a
                        key={`${partner.id}-img-${idx}`}
                        href={imgUrl}
                        target="_blank"
                        rel="noreferrer"
                        title={imgUrl}
                        className="aspect-video bg-slate-50 border border-slate-200 rounded-md overflow-hidden block hover:border-teal-600 transition-colors"
                      >
                        <SafeImage
                          src={imgUrl}
                          alt={`${partner.name} extracted media ${idx + 1}`}
                          objectFit={
                            partner.id.startsWith('cnn-') || (partner.id === 'grab-sg' && idx > 0)
                              ? 'cover'
                              : 'contain'
                          }
                          className="w-full h-full p-0.5"
                          fallbackLabel={partner.domain}
                        />
                      </a>
                    ))}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
