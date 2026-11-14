export type ScreenId = 'dispatch' | 'traffic' | 'news' | 'partners' | 'bookings';

export type RidePartner = 'Grab' | 'Ryde' | 'Gojek' | 'CDG Zig';

export type RideCategory = 'Standard' | 'Shared' | 'Large' | 'Pet' | 'Premium' | 'Taxi';

export interface DriverInfo {
  id: string;
  name: string;
  rating: number;
  tripsCompleted: number;
  vehicleModel: string;
  plateNumber: string;
  color: string;
  distanceKm: number;
  etaMin: number;
  mapX: number; // 0-100 percentage on corridor radar
  mapY: number; // 0-100 percentage on corridor radar
}

export interface RideQuote {
  id: string;
  partner: RidePartner;
  serviceName: string;
  description: string;
  category: RideCategory;
  seats: number;
  fareSgd: number;
  baseFare: number;
  distanceFare: number;
  platformFee: number;
  surgeMultiplier: number;
  tripDistanceKm: number;
  tripDurationMin: number;
  imageUrl: string;
  partnerLogoUrl: string;
  partnerUrl: string;
  nearestDriver: DriverInfo;
  isLowestFare?: boolean;
  isFastestPickup?: boolean;
}

export interface RoadInsightItem {
  id: string;
  kind: 'incident' | 'closure';
  category: string; // e.g. 'Vehicle Breakdown' | 'Road Accidents' | 'Road Works' | 'Temporary Closure'
  title: string;
  description: string;
  roadCorridor: string;
  timeInfo: string;
  coordinates?: string;
  mapUrl?: string;
  iconUrl: string;
  sourceUrl: string;
}

export interface RoadInsightsResponse {
  updatedAt: string;
  sourceUrl: string;
  status: 'connected' | 'cached' | 'degraded';
  incidentCount: number;
  closureCount: number;
  items: RoadInsightItem[];
}

export interface RidesResponse {
  pickup: string;
  dropoff: string;
  tripDistanceKm: number;
  tripDurationMin: number;
  currency: string;
  updatedAt: string;
  partnerAssets: {
    grabLogo: string;
    grabHero: string;
    rydeLogo: string;
    gojekLogo: string;
    gojekHero: string;
    cdgLogo: string;
    cdgVehicle: string;
  };
  roadAlerts: RoadInsightItem[];
  quotes: RideQuote[];
}

export type NewsCategory = 'All' | 'Economy' | 'Local News' | 'Hobbies' | 'Travels' | 'Style';

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  category: Exclude<NewsCategory, 'All'>;
  rawSection: string;
  partnerSource: string;
  sourcePageUrl: string;
  articleUrl: string;
  imageUrl: string;
  publishedLabel: string;
  readTimeMin: number;
}

export interface NewsResponse {
  updatedAt: string;
  totalCount: number;
  categoryCounts: Record<Exclude<NewsCategory, 'All'>, number>;
  articles: NewsArticle[];
}

export interface PartnerEndpointInfo {
  id: string;
  name: string;
  domain: string;
  htmlUrl: string;
  purpose: string;
  status: 'connected' | 'cached' | 'degraded';
  latencyMs: number;
  lastFetchedAt: string;
  extractedCount: number;
  hotlinkedImages: string[];
}

export type BookingStatus =
  | 'Confirmed'
  | 'Driver En Route'
  | 'Arriving'
  | 'In Transit'
  | 'Completed'
  | 'Cancelled';

export interface RideBookingPayload {
  quoteId: string;
  partner: RidePartner;
  serviceName: string;
  pickup: string;
  dropoff: string;
  fareSgd: number;
  driver: DriverInfo;
  imageUrl: string;
  passengerName: string;
  passengerPhone: string;
  pickupNote: string;
  paymentMethod: string;
  pickupMode: 'now' | 'scheduled';
  scheduledTime: string | null;
  promoCode: string | null;
}

export interface RideBooking {
  id: string;
  bookingRef: string;
  quoteId: string;
  partner: RidePartner;
  serviceName: string;
  pickup: string;
  dropoff: string;
  fareSgd: number;
  discountSgd: number;
  finalFareSgd: number;
  promoCode: string | null;
  passengerName: string;
  passengerPhone: string;
  pickupNote: string;
  paymentMethod: string;
  pickupMode: 'now' | 'scheduled';
  scheduledTime: string | null;
  driver: DriverInfo;
  status: BookingStatus;
  bookedAt: string;
  imageUrl: string;
}
