import { CarFront, Newspaper, Globe, BookmarkCheck, X, ArrowRight, Route } from 'lucide-react';
import { ScreenId } from '../types';

interface SidebarMenuProps {
  activeScreen: ScreenId;
  onSelectScreen: (screen: ScreenId) => void;
  bookingsCount: number;
  savedArticlesCount: number;
  roadAlertCount: number;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const MENU_ITEMS: Array<{
  id: ScreenId;
  label: string;
  subtitle: string;
  icon: typeof CarFront;
}> = [
  {
    id: 'dispatch',
    label: 'Ride Dispatch',
    subtitle: 'Grab, Ryde, Gojek & CDG Zig',
    icon: CarFront,
  },
  {
    id: 'traffic',
    label: 'Road Insights',
    subtitle: 'LTA traffic & road closures',
    icon: Route,
  },
  {
    id: 'news',
    label: 'Partner News',
    subtitle: 'Economy, local, hobbies, travel',
    icon: Newspaper,
  },
  {
    id: 'partners',
    label: 'Partner Feeds',
    subtitle: 'Source URLs & hotlink media',
    icon: Globe,
  },
  {
    id: 'bookings',
    label: 'Saved & Trips',
    subtitle: 'Active dispatches & reading list',
    icon: BookmarkCheck,
  },
];

export function SidebarMenu({
  activeScreen,
  onSelectScreen,
  bookingsCount,
  savedArticlesCount,
  roadAlertCount,
  mobileOpen,
  onCloseMobile,
}: SidebarMenuProps) {
  const totalSaved = bookingsCount + savedArticlesCount;

  const navContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 w-64">
      <div className="flex items-center justify-between px-5 h-16 border-b border-slate-200">
        <button
          type="button"
          onClick={() => {
            onSelectScreen('dispatch');
            onCloseMobile();
          }}
          className="text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 rounded"
        >
          <span className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
            Transit &amp; Wire
          </span>
        </button>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation menu"
          className="lg:hidden p-2 text-slate-500 hover:text-slate-900 rounded-md"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto" aria-label="Main navigation">
        <p className="px-3 pb-2 text-xs font-medium text-slate-400">
          Workspace Screens
        </p>
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeScreen === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelectScreen(item.id);
                onCloseMobile();
              }}
              className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 ${
                isActive
                  ? 'bg-teal-50 text-teal-900'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon
                className={`w-4 h-4 mt-0.5 shrink-0 ${
                  isActive ? 'text-teal-700' : 'text-slate-400'
                }`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold whitespace-nowrap truncate">
                    {item.label}
                  </span>
                  {item.id === 'bookings' && totalSaved > 0 && (
                    <span className="text-xs font-mono tabular-nums text-teal-700 font-semibold">
                      {totalSaved}
                    </span>
                  )}
                  {item.id === 'traffic' && roadAlertCount > 0 && (
                    <span className="text-xs font-mono tabular-nums text-amber-700 font-semibold">
                      {roadAlertCount}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {item.subtitle}
                </p>
              </div>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200 space-y-3">
        <div>
          <p className="text-xs font-semibold text-slate-700">Connected Partners</p>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Grab · Ryde · Gojek · CDG Zig · LTA OneMotoring · CNN
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            onSelectScreen('partners');
            onCloseMobile();
          }}
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors whitespace-nowrap"
        >
          <span>Inspect 7 Partner Feeds</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block shrink-0">{navContent}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 flex h-full">{navContent}</div>
        </div>
      )}
    </>
  );
}
