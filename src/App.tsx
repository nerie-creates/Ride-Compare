import { useCallback, useEffect, useMemo, useState } from 'react';
import { Menu, RefreshCw } from 'lucide-react';
import {
  BookingStatus,
  NewsArticle,
  NewsCategory,
  NewsResponse,
  PartnerEndpointInfo,
  RideBooking,
  RideBookingPayload,
  RidesResponse,
  RoadInsightsResponse,
  ScreenId,
} from './types';
import { SidebarMenu } from './components/SidebarMenu';
import { RideDispatchScreen } from './components/RideDispatchScreen';
import { RoadInsightsScreen } from './components/RoadInsightsScreen';
import { PartnerNewsScreen } from './components/PartnerNewsScreen';
import { PartnersDirectoryScreen } from './components/PartnersDirectoryScreen';
import { SavedBookingsScreen } from './components/SavedBookingsScreen';

const SAVED_ARTICLES_KEY = 'transit_wire_saved_articles_v1';

const SCREEN_META: Record<ScreenId, { title: string; subtitle: string }> = {
  dispatch: {
    title: 'Ride & Driver Dispatch',
    subtitle: 'Live fare quotes and nearest available drivers across Grab, Ryde, Gojek & CDG Zig',
  },
  traffic: {
    title: 'Road Insights & Closures',
    subtitle: 'Real-time LTA OneMotoring expressway incidents, roadworks, and road closures',
  },
  news: {
    title: 'Partner News Wire',
    subtitle: 'Latest headlines on economy, local news, hobbies, style, and travels',
  },
  partners: {
    title: 'Partner Feeds & Media',
    subtitle: 'Direct HTML source integrations and hotlinked image assets',
  },
  bookings: {
    title: 'Saved & Dispatches',
    subtitle: 'Active driver dispatches and bookmarked partner reading list',
  },
};

export function App() {
  const [activeScreen, setActiveScreen] = useState<ScreenId>('dispatch');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Ride dispatch state
  const [pickup, setPickup] = useState('Marina Bay Sands');
  const [dropoff, setDropoff] = useState('Changi Airport T3');
  const [passengers, setPassengers] = useState(4);
  const [petFriendly, setPetFriendly] = useState(false);
  const [ridesData, setRidesData] = useState<RidesResponse | null>(null);
  const [ridesLoading, setRidesLoading] = useState(true);
  const [ridesError, setRidesError] = useState<string | null>(null);

  // Road insights state (LTA OneMotoring)
  const [roadData, setRoadData] = useState<RoadInsightsResponse | null>(null);
  const [roadLoading, setRoadLoading] = useState(true);
  const [roadError, setRoadError] = useState<string | null>(null);

  // Partner news state
  const [newsCategory, setNewsCategory] = useState<NewsCategory>('All');
  const [newsQuery, setNewsQuery] = useState('');
  const [newsData, setNewsData] = useState<NewsResponse | null>(null);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState<string | null>(null);

  // Partners directory state
  const [partners, setPartners] = useState<PartnerEndpointInfo[]>([]);
  const [partnersLoading, setPartnersLoading] = useState(false);
  const [partnersError, setPartnersError] = useState<string | null>(null);

  // Bookings & Saved articles
  const [bookings, setBookings] = useState<RideBooking[]>([]);
  const [savedArticles, setSavedArticles] = useState<NewsArticle[]>(() => {
    try {
      const raw = localStorage.getItem(SAVED_ARTICLES_KEY);
      return raw ? (JSON.parse(raw) as NewsArticle[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(SAVED_ARTICLES_KEY, JSON.stringify(savedArticles));
    } catch {
      // ignore storage quota failures
    }
  }, [savedArticles]);

  const savedArticleIds = useMemo(
    () => new Set(savedArticles.map((a) => a.id)),
    [savedArticles]
  );

  const fetchRides = useCallback(
    async (
      params: { pickup: string; dropoff: string; passengers: number; petFriendly: boolean },
      forceRefresh = false
    ) => {
      setRidesLoading(true);
      setRidesError(null);
      try {
        const sp = new URLSearchParams({
          pickup: params.pickup,
          dropoff: params.dropoff,
          passengers: String(params.passengers),
          petFriendly: String(params.petFriendly),
          ...(forceRefresh ? { refresh: '1' } : {}),
        });
        const res = await fetch(`/api/partners/rides?${sp.toString()}`);
        if (!res.ok) throw new Error(`Partner ride API returned ${res.status}`);
        const json = (await res.json()) as RidesResponse;
        setRidesData(json);
      } catch (err) {
        setRidesError(err instanceof Error ? err.message : 'Unable to reach partner ride pricing API.');
      } finally {
        setRidesLoading(false);
      }
    },
    []
  );

  const fetchRoadInsights = useCallback(async (forceRefresh = false) => {
    setRoadLoading(true);
    setRoadError(null);
    try {
      const res = await fetch(`/api/partners/traffic${forceRefresh ? '?refresh=1' : ''}`);
      if (!res.ok) throw new Error(`LTA traffic API returned ${res.status}`);
      const json = (await res.json()) as RoadInsightsResponse;
      setRoadData(json);
    } catch (err) {
      setRoadError(err instanceof Error ? err.message : 'Unable to load LTA OneMotoring traffic updates.');
    } finally {
      setRoadLoading(false);
    }
  }, []);

  const fetchNews = useCallback(
    async (cat: NewsCategory, q: string, forceRefresh = false) => {
      setNewsLoading(true);
      setNewsError(null);
      try {
        const sp = new URLSearchParams({
          category: cat,
          q,
          ...(forceRefresh ? { refresh: '1' } : {}),
        });
        const res = await fetch(`/api/partners/news?${sp.toString()}`);
        if (!res.ok) throw new Error(`Partner news API returned ${res.status}`);
        const json = (await res.json()) as NewsResponse;
        setNewsData(json);
      } catch (err) {
        setNewsError(err instanceof Error ? err.message : 'Unable to reach partner news feed.');
      } finally {
        setNewsLoading(false);
      }
    },
    []
  );

  const fetchDirectory = useCallback(async (forceRefresh = false) => {
    setPartnersLoading(true);
    setPartnersError(null);
    try {
      const res = await fetch(`/api/partners/directory${forceRefresh ? '?refresh=1' : ''}`);
      if (!res.ok) throw new Error(`Directory API returned ${res.status}`);
      const json = (await res.json()) as { partners: PartnerEndpointInfo[] };
      setPartners(json.partners);
    } catch (err) {
      setPartnersError(err instanceof Error ? err.message : 'Failed to inspect partner feeds.');
    } finally {
      setPartnersLoading(false);
    }
  }, []);

  const fetchBookings = useCallback(async () => {
    try {
      const res = await fetch('/api/rides/bookings');
      if (res.ok) {
        const json = (await res.json()) as { bookings: RideBooking[] };
        setBookings(json.bookings);
      }
    } catch {
      // silent background fetch
    }
  }, []);

  useEffect(() => {
    fetchRides({ pickup, dropoff, passengers, petFriendly });
  }, [fetchRides, pickup, dropoff, passengers, petFriendly]);

  useEffect(() => {
    fetchNews(newsCategory, newsQuery);
  }, [fetchNews, newsCategory, newsQuery]);

  useEffect(() => {
    fetchRoadInsights();
    fetchDirectory();
    fetchBookings();
  }, [fetchRoadInsights, fetchDirectory, fetchBookings]);

  const handleBookRide = async (payload: RideBookingPayload): Promise<RideBooking> => {
    const res = await fetch('/api/rides/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(`Booking failed (${res.status})`);
    }
    const json = (await res.json()) as { booking: RideBooking };
    setBookings((prev) => [json.booking, ...prev]);
    return json.booking;
  };

  const handleUpdateBookingStatus = async (id: string, status: BookingStatus) => {
    const res = await fetch(`/api/rides/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const json = (await res.json()) as { booking: RideBooking };
      setBookings((prev) => prev.map((b) => (b.id === id ? json.booking : b)));
    }
  };

  const handleCancelBooking = async (id: string) => {
    const res = await fetch(`/api/rides/bookings/${id}`, { method: 'DELETE' });
    if (res.ok) {
      const json = (await res.json()) as { booking: RideBooking };
      setBookings((prev) => prev.map((b) => (b.id === id ? json.booking : b)));
    }
  };

  const handleToggleSaveArticle = (article: NewsArticle) => {
    setSavedArticles((prev) => {
      if (prev.some((a) => a.id === article.id)) {
        return prev.filter((a) => a.id !== article.id);
      }
      return [article, ...prev];
    });
  };

  const handleRefreshActiveScreen = () => {
    if (activeScreen === 'dispatch') {
      fetchRides({ pickup, dropoff, passengers, petFriendly }, true);
    } else if (activeScreen === 'traffic') {
      fetchRoadInsights(true);
    } else if (activeScreen === 'news') {
      fetchNews(newsCategory, newsQuery, true);
    } else if (activeScreen === 'partners') {
      fetchDirectory(true);
    } else {
      fetchBookings();
    }
  };

  const meta = SCREEN_META[activeScreen];

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      <SidebarMenu
        activeScreen={activeScreen}
        onSelectScreen={setActiveScreen}
        bookingsCount={bookings.filter((b) => b.status !== 'Cancelled' && b.status !== 'Completed').length}
        savedArticlesCount={savedArticles.length}
        roadAlertCount={roadData?.incidentCount || 0}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Clean Contextual Top Bar */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                {meta.title}
              </h1>
              <p className="hidden sm:block text-xs text-slate-500 truncate">
                {meta.subtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRefreshActiveScreen}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Live Data</span>
          </button>
        </header>

        {/* Main Screen Content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl w-full mx-auto">
          {activeScreen === 'dispatch' && (
            <RideDispatchScreen
              data={ridesData}
              loading={ridesLoading}
              error={ridesError}
              pickup={pickup}
              dropoff={dropoff}
              passengers={passengers}
              petFriendly={petFriendly}
              onChangeRoute={(next) => {
                setPickup(next.pickup);
                setDropoff(next.dropoff);
                setPassengers(next.passengers);
                setPetFriendly(next.petFriendly);
              }}
              onRefresh={() => fetchRides({ pickup, dropoff, passengers, petFriendly }, true)}
              onBookRide={handleBookRide}
              onUpdateBookingStatus={handleUpdateBookingStatus}
              onNavigateToBookings={() => setActiveScreen('bookings')}
              onNavigateToTraffic={() => setActiveScreen('traffic')}
            />
          )}

          {activeScreen === 'traffic' && (
            <RoadInsightsScreen
              data={roadData}
              loading={roadLoading}
              error={roadError}
              onRefresh={() => fetchRoadInsights(true)}
            />
          )}

          {activeScreen === 'news' && (
            <PartnerNewsScreen
              data={newsData}
              loading={newsLoading}
              error={newsError}
              activeCategory={newsCategory}
              searchQuery={newsQuery}
              savedIds={savedArticleIds}
              onChangeCategory={setNewsCategory}
              onChangeSearch={setNewsQuery}
              onRefresh={() => fetchNews(newsCategory, newsQuery, true)}
              onToggleSave={handleToggleSaveArticle}
            />
          )}

          {activeScreen === 'partners' && (
            <PartnersDirectoryScreen
              partners={partners}
              loading={partnersLoading}
              error={partnersError}
              onRefresh={() => fetchDirectory(true)}
            />
          )}

          {activeScreen === 'bookings' && (
            <SavedBookingsScreen
              bookings={bookings}
              savedArticles={savedArticles}
              onUpdateBookingStatus={handleUpdateBookingStatus}
              onCancelBooking={handleCancelBooking}
              onRemoveArticle={handleToggleSaveArticle}
              onNavigate={setActiveScreen}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
