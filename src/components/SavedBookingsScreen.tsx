import { BookmarkCheck, CarFront, CheckCircle2, ExternalLink, Trash2, XCircle } from 'lucide-react';
import { BookingStatus, NewsArticle, RideBooking, ScreenId } from '../types';
import { SafeImage } from './SafeImage';

interface SavedBookingsScreenProps {
  bookings: RideBooking[];
  savedArticles: NewsArticle[];
  onUpdateBookingStatus: (id: string, status: BookingStatus) => Promise<void>;
  onCancelBooking: (id: string) => Promise<void>;
  onRemoveArticle: (article: NewsArticle) => void;
  onNavigate: (screen: ScreenId) => void;
}

const NEXT_STAGE: Partial<Record<BookingStatus, { status: BookingStatus; label: string }>> = {
  Confirmed: { status: 'Driver En Route', label: 'Dispatch Driver' },
  'Driver En Route': { status: 'Arriving', label: 'Mark Arriving' },
  Arriving: { status: 'In Transit', label: 'Start Ride' },
  'In Transit': { status: 'Completed', label: 'Complete Trip' },
};

export function SavedBookingsScreen({
  bookings,
  savedArticles,
  onUpdateBookingStatus,
  onCancelBooking,
  onRemoveArticle,
  onNavigate,
}: SavedBookingsScreenProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left: Booked & Active Rides */}
      <section className="lg:col-span-6 bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Ride Bookings &amp; Trips
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Confirmed, scheduled, and completed rides across all partners
            </p>
          </div>
          <span className="text-xs font-mono tabular-nums text-slate-500">
            {bookings.length} total
          </span>
        </div>

        {bookings.length === 0 ? (
          <div className="p-10 text-center">
            <CarFront className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-800">No rides booked yet</p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              Compare live Grab, Ryde, Gojek, and CDG Zig fares on the Ride Dispatch screen and click Book on any vehicle tier.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('dispatch')}
              className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors whitespace-nowrap"
            >
              Browse &amp; Book Rides
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {bookings.map((booking) => {
              const nextAction = NEXT_STAGE[booking.status];
              const isFinal = booking.status === 'Cancelled' || booking.status === 'Completed';
              return (
                <div key={booking.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-14 h-10 bg-slate-50 border border-slate-200 rounded-lg overflow-hidden shrink-0 p-0.5">
                        <SafeImage
                          src={booking.imageUrl}
                          alt={booking.serviceName}
                          objectFit={booking.partner === 'Grab' ? 'cover' : 'contain'}
                          className="w-full h-full rounded"
                          fallbackLabel={booking.serviceName}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-xs flex-wrap">
                          <span className="font-mono font-semibold text-slate-500">
                            {booking.bookingRef}
                          </span>
                          <span className="text-slate-400" aria-hidden="true">·</span>
                          <span className="font-bold text-slate-900">
                            {booking.partner} {booking.serviceName}
                          </span>
                          <span className="text-slate-400" aria-hidden="true">·</span>
                          <span
                            className={`inline-flex items-center gap-1 font-semibold ${
                              booking.status === 'Cancelled'
                                ? 'text-red-700'
                                : booking.status === 'Completed'
                                ? 'text-slate-700'
                                : 'text-emerald-700'
                            }`}
                          >
                            {booking.status === 'Completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                            <span>{booking.status}</span>
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 mt-0.5 truncate">
                          {booking.pickup} → {booking.dropoff}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-bold text-slate-900 font-mono tabular-nums block">
                        ${booking.finalFareSgd.toFixed(2)}
                      </span>
                      {booking.discountSgd > 0 && (
                        <span className="text-[11px] text-teal-700 font-mono tabular-nums block">
                          Saved ${booking.discountSgd.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-lg p-2.5">
                    <span>
                      Driver: <strong className="text-slate-900">{booking.driver.name}</strong> ({booking.driver.plateNumber})
                    </span>
                    <span>
                      Rider: <strong className="text-slate-900">{booking.passengerName}</strong>
                    </span>
                    <span>
                      Payment: <span className="text-slate-800">{booking.paymentMethod}</span>
                    </span>
                    <span>
                      Timing:{' '}
                      <span className="text-slate-800 font-mono tabular-nums">
                        {booking.pickupMode === 'scheduled' && booking.scheduledTime
                          ? booking.scheduledTime.replace('T', ' ')
                          : `Immediate (${booking.driver.etaMin} min ETA)`}
                      </span>
                    </span>
                    {booking.pickupNote && (
                      <span className="sm:col-span-2 text-slate-700">
                        Pickup Note: &ldquo;{booking.pickupNote}&rdquo;
                      </span>
                    )}
                  </div>

                  {!isFinal && (
                    <div className="flex items-center justify-between gap-3 pt-1">
                      {nextAction ? (
                        <button
                          type="button"
                          onClick={() => onUpdateBookingStatus(booking.id, nextAction.status)}
                          className="px-3 py-1.5 text-xs font-semibold text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors whitespace-nowrap"
                        >
                          {nextAction.label}
                        </button>
                      ) : (
                        <span />
                      )}
                      <button
                        type="button"
                        onClick={() => onCancelBooking(booking.id)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-red-700 hover:text-red-800 whitespace-nowrap shrink-0"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Cancel Booking</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Right: Bookmarked Partner Stories */}
      <section className="lg:col-span-6 bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Saved News Reading List
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Bookmarked economy, local, hobby, style, and travel dispatches
            </p>
          </div>
          <span className="text-xs font-mono tabular-nums text-slate-500">
            {savedArticles.length} saved
          </span>
        </div>

        {savedArticles.length === 0 ? (
          <div className="p-10 text-center">
            <BookmarkCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-800">Your reading list is empty</p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              Bookmark stories from the Partner News Wire to revisit them here anytime.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('news')}
              className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap"
            >
              Explore News Wire
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {savedArticles.map((article) => (
              <div key={article.id} className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-20 h-14 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                    <SafeImage
                      src={article.imageUrl}
                      alt={article.title}
                      className="w-full h-full"
                      fallbackLabel={article.category}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-semibold text-teal-700">{article.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{article.partnerSource}</span>
                    </div>
                    <a
                      href={article.articleUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 text-sm font-semibold text-slate-900 hover:text-teal-800 line-clamp-2 block"
                    >
                      {article.title}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={article.articleUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Read on CNN"
                    className="p-2 text-slate-500 hover:text-slate-900 rounded-lg"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => onRemoveArticle(article)}
                    aria-label="Remove saved story"
                    className="p-2 text-slate-400 hover:text-red-700 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
