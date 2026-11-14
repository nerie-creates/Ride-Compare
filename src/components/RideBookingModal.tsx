import { useMemo, useState } from 'react';
import { Calendar, Check, Clock, CreditCard, MapPin, Navigation, Tag, User, X } from 'lucide-react';
import { RideBookingPayload, RideQuote } from '../types';
import { SafeImage } from './SafeImage';

interface RideBookingModalProps {
  quote: RideQuote;
  pickup: string;
  dropoff: string;
  onClose: () => void;
  onConfirmBooking: (payload: RideBookingPayload) => Promise<void>;
}

const PAYMENT_METHODS = [
  'Corporate Card •••• 4821',
  'PayNow QR / GrabPay',
  'Apple Pay',
  'Cash to Driver',
];

export function RideBookingModal({
  quote,
  pickup,
  dropoff,
  onClose,
  onConfirmBooking,
}: RideBookingModalProps) {
  const [pickupMode, setPickupMode] = useState<'now' | 'scheduled'>('now');
  const [scheduledTime, setScheduledTime] = useState(() => {
    const d = new Date(Date.now() + 60 * 60 * 1000);
    return d.toISOString().slice(0, 16);
  });
  const [passengerName, setPassengerName] = useState('Nerisa Guillermo');
  const [passengerPhone, setPassengerPhone] = useState('+65 9123 4567');
  const [pickupNote, setPickupNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoFeedback, setPromoFeedback] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const discountSgd = useMemo(() => {
    if (appliedPromo === 'SG5OFF') {
      return Math.min(3.0, Math.max(0, quote.fareSgd - 2));
    }
    if (appliedPromo === 'CORRIDOR10') {
      return Number(Math.min(5.0, quote.fareSgd * 0.1).toFixed(2));
    }
    return 0;
  }, [appliedPromo, quote.fareSgd]);

  const finalFareSgd = useMemo(
    () => Number(Math.max(2.0, quote.fareSgd - discountSgd).toFixed(2)),
    [quote.fareSgd, discountSgd]
  );

  const handleApplyPromo = () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) {
      setAppliedPromo(null);
      setPromoFeedback(null);
      return;
    }
    if (code === 'SG5OFF') {
      setAppliedPromo('SG5OFF');
      setPromoFeedback('Applied $3.00 ride voucher.');
    } else if (code === 'CORRIDOR10') {
      setAppliedPromo('CORRIDOR10');
      setPromoFeedback('Applied 10% corridor discount (up to $5.00).');
    } else {
      setAppliedPromo(null);
      setPromoFeedback('Invalid code. Try SG5OFF or CORRIDOR10.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passengerName.trim()) {
      setErrorMsg('Please enter a passenger name for driver verification.');
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await onConfirmBooking({
        quoteId: quote.id,
        partner: quote.partner,
        serviceName: quote.serviceName,
        pickup,
        dropoff,
        fareSgd: quote.fareSgd,
        driver: quote.nearestDriver,
        imageUrl: quote.imageUrl,
        passengerName: passengerName.trim(),
        passengerPhone: passengerPhone.trim() || '+65 9123 4567',
        pickupNote: pickupNote.trim(),
        paymentMethod,
        pickupMode,
        scheduledTime: pickupMode === 'scheduled' ? scheduledTime : null,
        promoCode: appliedPromo,
      });
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to confirm ride booking.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-modal-title"
        className="relative z-10 w-full max-w-xl bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-8 bg-slate-50 border border-slate-200 rounded flex items-center justify-center p-1 shrink-0">
              <SafeImage
                src={quote.partnerLogoUrl}
                alt={quote.partner}
                objectFit="contain"
                className="w-full h-full"
                fallbackLabel={quote.partner}
              />
            </div>
            <div>
              <h2 id="booking-modal-title" className="text-base font-bold text-slate-900">
                Book {quote.serviceName}
              </h2>
              <p className="text-xs text-slate-500">
                {quote.partner} · {quote.seats} seats · {quote.nearestDriver.name} ({quote.nearestDriver.plateNumber})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close booking dialog"
            className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5">
          {/* Route Summary */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-slate-800">
              <MapPin className="w-3.5 h-3.5 text-teal-700 shrink-0" />
              <span className="font-semibold">Pickup:</span>
              <span className="truncate">{pickup}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-800">
              <Navigation className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="font-semibold">Dropoff:</span>
              <span className="truncate">{dropoff}</span>
            </div>
            <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-slate-500 font-mono tabular-nums">
              <span>{quote.tripDistanceKm.toFixed(1)} km · ~{quote.tripDurationMin} min trip</span>
              <span>Driver ETA: {quote.nearestDriver.etaMin} min</span>
            </div>
          </div>

          {/* Pickup Timing */}
          <div>
            <span className="block text-xs font-semibold text-slate-700 mb-2">
              Pickup Timing
            </span>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setPickupMode('now')}
                className={`inline-flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                  pickupMode === 'now'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Pick up now ({quote.nearestDriver.etaMin} min)</span>
              </button>
              <button
                type="button"
                onClick={() => setPickupMode('scheduled')}
                className={`inline-flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                  pickupMode === 'scheduled'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Schedule later</span>
              </button>
            </div>

            {pickupMode === 'scheduled' && (
              <div className="mt-2.5">
                <label htmlFor="scheduled-time" className="block text-xs text-slate-600 mb-1">
                  Scheduled Date &amp; Time
                </label>
                <input
                  id="scheduled-time"
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-teal-700"
                />
              </div>
            )}
          </div>

          {/* Passenger Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="rider-name" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Passenger Name
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="rider-name"
                  type="text"
                  required
                  value={passengerName}
                  onChange={(e) => setPassengerName(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label htmlFor="rider-phone" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Contact Number
              </label>
              <input
                id="rider-phone"
                type="tel"
                value={passengerPhone}
                onChange={(e) => setPassengerPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white"
              />
            </div>
          </div>

          {/* Pickup Note */}
          <div>
            <label htmlFor="pickup-note" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Driver Pickup Note (optional)
            </label>
            <input
              id="pickup-note"
              type="text"
              value={pickupNote}
              onChange={(e) => setPickupNote(e.target.value)}
              placeholder="e.g., Waiting at Hotel Lobby Tower 2, Taxi Stand C14"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white"
            />
          </div>

          {/* Payment & Promo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="payment-method" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Payment Method
              </label>
              <div className="relative">
                <CreditCard className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  id="payment-method"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700"
                >
                  {PAYMENT_METHODS.map((pm) => (
                    <option key={pm} value={pm}>
                      {pm}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="promo-code" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Promo Code (try SG5OFF or CORRIDOR10)
              </label>
              <div className="flex gap-1.5">
                <div className="relative flex-1">
                  <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="promo-code"
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    placeholder="Enter code"
                    className="w-full pl-8 pr-2 py-2 text-xs uppercase bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-teal-700"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg whitespace-nowrap shrink-0"
                >
                  Apply
                </button>
              </div>
              {promoFeedback && (
                <p className={`mt-1 text-[11px] ${appliedPromo ? 'text-teal-700 font-medium' : 'text-amber-700'}`}>
                  {promoFeedback}
                </p>
              )}
            </div>
          </div>

          {/* Fare Summary */}
          <div className="border-t border-slate-200 pt-4 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>{quote.serviceName} Quoted Fare</span>
              <span className="font-mono tabular-nums">${quote.fareSgd.toFixed(2)}</span>
            </div>
            {discountSgd > 0 && (
              <div className="flex justify-between text-teal-700 font-medium">
                <span>Promo Discount ({appliedPromo})</span>
                <span className="font-mono tabular-nums">-${discountSgd.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-slate-900 pt-1.5 border-t border-slate-100">
              <span>Total Payable (SGD)</span>
              <span className="font-mono tabular-nums">${finalFareSgd.toFixed(2)}</span>
            </div>
          </div>

          {errorMsg && (
            <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {errorMsg}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap"
            >
              <Check className="w-4 h-4" />
              <span>
                {submitting
                  ? 'Confirming Booking...'
                  : `Confirm & Book Ride ($${finalFareSgd.toFixed(2)})`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
