import { useMemo, useState } from 'react';
import {
  Bookmark,
  ExternalLink,
  Newspaper,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { NewsArticle, NewsCategory, NewsResponse } from '../types';
import { SafeImage } from './SafeImage';

interface PartnerNewsScreenProps {
  data: NewsResponse | null;
  loading: boolean;
  error: string | null;
  activeCategory: NewsCategory;
  searchQuery: string;
  savedIds: Set<string>;
  onChangeCategory: (cat: NewsCategory) => void;
  onChangeSearch: (q: string) => void;
  onRefresh: () => void;
  onToggleSave: (article: NewsArticle) => void;
}

const CATEGORIES: NewsCategory[] = [
  'All',
  'Economy',
  'Local News',
  'Hobbies',
  'Travels',
  'Style',
];

export function PartnerNewsScreen({
  data,
  loading,
  error,
  activeCategory,
  searchQuery,
  savedIds,
  onChangeCategory,
  onChangeSearch,
  onRefresh,
  onToggleSave,
}: PartnerNewsScreenProps) {
  const [activeArticle, setActiveArticle] = useState<NewsArticle | null>(null);

  const articles = data?.articles || [];
  const leadStory = articles[0] || null;
  const secondaryStories = useMemo(() => articles.slice(1, 4), [articles]);
  const wireIndexStories = useMemo(() => articles.slice(4), [articles]);

  const getCountLabel = (cat: NewsCategory) => {
    if (!data) return '';
    if (cat === 'All') return ` (${data.totalCount})`;
    const count = data.categoryCounts[cat] ?? 0;
    return ` (${count})`;
  };

  return (
    <div className="space-y-6">
      {/* Topic Filter & Search Toolbar */}
      <section className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => onChangeCategory(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeCategory === cat
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat}
              <span className="text-slate-400 font-normal tabular-nums">
                {getCountLabel(cat)}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 lg:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onChangeSearch(e.target.value)}
              placeholder="Filter headlines..."
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
            <span>Sync Wire</span>
          </button>
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
            Retry Feed
          </button>
        </div>
      )}

      {loading && !data ? (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 h-72 bg-slate-100 rounded-lg" />
            <div className="lg:col-span-5 space-y-4 py-4">
              <div className="w-32 h-3 bg-slate-100 rounded" />
              <div className="w-full h-8 bg-slate-100 rounded" />
              <div className="w-4/5 h-8 bg-slate-100 rounded" />
              <div className="w-full h-16 bg-slate-100 rounded" />
            </div>
          </div>
        </div>
      ) : articles.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <Newspaper className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-800">No articles match your filter</p>
          <p className="text-xs text-slate-500 mt-1">
            Try clearing the search query or selecting All categories.
          </p>
        </div>
      ) : (
        <>
          {/* Tier 1: Lead Editorial Story */}
          {leadStory && (
            <article className="bg-white border border-slate-200 rounded-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
              <div
                className="lg:col-span-7 aspect-video lg:aspect-auto lg:min-h-[340px] bg-slate-100 cursor-pointer overflow-hidden"
                onClick={() => setActiveArticle(leadStory)}
              >
                <SafeImage
                  src={leadStory.imageUrl}
                  alt={leadStory.title}
                  className="w-full h-full hover:scale-[1.01] transition-transform duration-300"
                  fallbackLabel={leadStory.category}
                />
              </div>

              <div className="lg:col-span-5 p-6 lg:p-8 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                    <span className="font-semibold text-teal-700">{leadStory.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{leadStory.partnerSource}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{leadStory.publishedLabel}</span>
                    <span aria-hidden="true">·</span>
                    <span>{leadStory.readTimeMin} min read</span>
                  </div>

                  <h2
                    onClick={() => setActiveArticle(leadStory)}
                    className="mt-3 text-2xl lg:text-3xl font-serif font-semibold text-slate-900 leading-tight cursor-pointer hover:text-teal-800 transition-colors"
                  >
                    {leadStory.title}
                  </h2>

                  <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                    {leadStory.summary}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveArticle(leadStory)}
                    className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap"
                  >
                    Read Dispatch
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleSave(leadStory)}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
                      savedIds.has(leadStory.id)
                        ? 'bg-teal-50 border-teal-700 text-teal-900'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${savedIds.has(leadStory.id) ? 'fill-teal-700 text-teal-700' : ''}`} />
                    <span>{savedIds.has(leadStory.id) ? 'Saved' : 'Save'}</span>
                  </button>
                </div>
              </div>
            </article>
          )}

          {/* Tier 2: Secondary Features Grid */}
          {secondaryStories.length > 0 && (
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {secondaryStories.map((story) => {
                const isSaved = savedIds.has(story.id);
                return (
                  <article
                    key={story.id}
                    className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      <div
                        className="aspect-video bg-slate-100 cursor-pointer overflow-hidden"
                        onClick={() => setActiveArticle(story)}
                      >
                        <SafeImage
                          src={story.imageUrl}
                          alt={story.title}
                          className="w-full h-full hover:scale-[1.02] transition-transform duration-300"
                          fallbackLabel={story.category}
                        />
                      </div>

                      <div className="p-5">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="font-semibold text-teal-700">{story.category}</span>
                          <span aria-hidden="true">·</span>
                          <span>{story.partnerSource}</span>
                          <span aria-hidden="true">·</span>
                          <span>{story.readTimeMin} min</span>
                        </div>

                        <h3
                          onClick={() => setActiveArticle(story)}
                          className="mt-2 text-lg font-serif font-semibold text-slate-900 leading-snug cursor-pointer hover:text-teal-800 transition-colors"
                        >
                          {story.title}
                        </h3>

                        <p className="mt-2 text-xs text-slate-600 leading-relaxed line-clamp-2">
                          {story.summary}
                        </p>
                      </div>
                    </div>

                    <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setActiveArticle(story)}
                        className="text-xs font-semibold text-slate-800 hover:text-teal-700"
                      >
                        Open Story
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleSave(story)}
                        aria-label={isSaved ? 'Remove bookmark' : 'Save story'}
                        className="p-1.5 text-slate-500 hover:text-teal-700 rounded"
                      >
                        <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-teal-700 text-teal-700' : ''}`} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </section>
          )}

          {/* Tier 3: Wire Index List */}
          {wireIndexStories.length > 0 && (
            <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">
                  Partner Wire Index
                </h3>
                <span className="text-xs text-slate-500 tabular-nums">
                  {wireIndexStories.length} additional dispatches
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {wireIndexStories.map((story) => {
                  const isSaved = savedIds.has(story.id);
                  return (
                    <div
                      key={story.id}
                      className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                    >
                      <div
                        className="flex items-center gap-4 min-w-0 flex-1 cursor-pointer"
                        onClick={() => setActiveArticle(story)}
                      >
                        <div className="w-24 h-16 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                          <SafeImage
                            src={story.imageUrl}
                            alt={story.title}
                            className="w-full h-full"
                            fallbackLabel={story.category}
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="font-semibold text-teal-700">{story.category}</span>
                            <span aria-hidden="true">·</span>
                            <span>{story.partnerSource}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums">{story.publishedLabel}</span>
                          </div>
                          <h4 className="mt-1 text-sm font-semibold text-slate-900 line-clamp-1 hover:text-teal-800">
                            {story.title}
                          </h4>
                          <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">
                            {story.summary}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => onToggleSave(story)}
                          aria-label={isSaved ? 'Remove bookmark' : 'Bookmark article'}
                          className="p-2 text-slate-400 hover:text-teal-700 rounded-lg"
                        >
                          <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-teal-700 text-teal-700' : ''}`} />
                        </button>
                        <a
                          href={story.articleUrl}
                          target="_blank"
                          rel="noreferrer"
                          aria-label="Open on CNN"
                          className="p-2 text-slate-400 hover:text-slate-800 rounded-lg"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}

      {/* Editorial Reader Slide-Over */}
      {activeArticle && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-slate-900/45"
            onClick={() => setActiveArticle(null)}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-full max-w-2xl bg-white h-full overflow-y-auto shadow-xl border-l border-slate-200 flex flex-col">
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-semibold text-teal-700">{activeArticle.category}</span>
                <span aria-hidden="true">·</span>
                <span>{activeArticle.partnerSource}</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveArticle(null)}
                aria-label="Close reader"
                className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 lg:p-8 space-y-6 flex-1">
              <h2 className="text-2xl lg:text-3xl font-serif font-semibold text-slate-900 leading-tight">
                {activeArticle.title}
              </h2>

              <figure>
                <div className="aspect-video rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                  <SafeImage
                    src={activeArticle.imageUrl}
                    alt={activeArticle.title}
                    className="w-full h-full"
                    fallbackLabel={activeArticle.category}
                  />
                </div>
                <figcaption className="mt-2 text-xs font-serif italic text-slate-500">
                  Fig. 1 — Syndicated partner photography via {activeArticle.sourcePageUrl}
                </figcaption>
              </figure>

              <p className="text-base font-serif text-slate-800 leading-relaxed first-letter:text-4xl first-letter:font-serif first-letter:font-semibold first-letter:float-left first-letter:mr-2.5 first-letter:mt-0.5">
                {activeArticle.summary}
              </p>

              <dl className="border-t border-slate-200 pt-4 divide-y divide-slate-100 text-xs">
                <div className="py-2.5 flex justify-between gap-4">
                  <dt className="text-slate-500">Category</dt>
                  <dd className="font-medium text-slate-900">{activeArticle.category}</dd>
                </div>
                <div className="py-2.5 flex justify-between gap-4">
                  <dt className="text-slate-500">Partner Source</dt>
                  <dd className="font-medium text-slate-900">{activeArticle.partnerSource}</dd>
                </div>
                <div className="py-2.5 flex justify-between gap-4">
                  <dt className="text-slate-500">Published Date</dt>
                  <dd className="font-mono tabular-nums text-slate-900">{activeArticle.publishedLabel}</dd>
                </div>
                <div className="py-2.5 flex justify-between gap-4">
                  <dt className="text-slate-500">Estimated Reading Time</dt>
                  <dd className="font-medium text-slate-900">{activeArticle.readTimeMin} minutes</dd>
                </div>
              </dl>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => onToggleSave(activeArticle)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap ${
                  savedIds.has(activeArticle.id)
                    ? 'bg-teal-50 border-teal-700 text-teal-900'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${savedIds.has(activeArticle.id) ? 'fill-teal-700 text-teal-700' : ''}`} />
                <span>{savedIds.has(activeArticle.id) ? 'Saved in Reading List' : 'Save Story'}</span>
              </button>

              <a
                href={activeArticle.articleUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors whitespace-nowrap"
              >
                <span>Open Full Article on CNN</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
