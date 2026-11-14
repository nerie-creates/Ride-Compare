import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

interface CachedPartnerAssets {
  fetchedAt: number;
  rydeLatencyMs: number;
  grabLatencyMs: number;
  gojekLatencyMs: number;
  cdgLatencyMs: number;
  rydeStatus: 'connected' | 'cached' | 'degraded';
  grabStatus: 'connected' | 'cached' | 'degraded';
  gojekStatus: 'connected' | 'cached' | 'degraded';
  cdgStatus: 'connected' | 'cached' | 'degraded';
  rydeLogo: string;
  rydeVehicles: Record<string, string>;
  rydeAllImages: string[];
  grabLogo: string;
  grabHero: string;
  grabAllImages: string[];
  gojekLogo: string;
  gojekHero: string;
  gojekVehicles: Record<string, string>;
  gojekAllImages: string[];
  cdgLogo: string;
  cdgVehicle: string;
  cdgAllImages: string[];
}

interface ParsedRoadInsight {
  id: string;
  kind: 'incident' | 'closure';
  category: string;
  title: string;
  description: string;
  roadCorridor: string;
  timeInfo: string;
  coordinates?: string;
  mapUrl?: string;
  iconUrl: string;
  sourceUrl: string;
}

interface CachedRoadInsights {
  fetchedAt: number;
  latencyMs: number;
  status: 'connected' | 'cached' | 'degraded';
  items: ParsedRoadInsight[];
  ltaImages: string[];
}

interface ParsedNewsItem {
  id: string;
  title: string;
  summary: string;
  category: 'Economy' | 'Local News' | 'Hobbies' | 'Travels' | 'Style';
  rawSection: string;
  partnerSource: string;
  sourcePageUrl: string;
  articleUrl: string;
  imageUrl: string;
  publishedLabel: string;
  readTimeMin: number;
}

interface CachedNewsStore {
  fetchedAt: number;
  articles: ParsedNewsItem[];
  cnnHomeLatency: number;
  cnnHomeStatus: 'connected' | 'cached' | 'degraded';
  cnnHomeImages: string[];
  cnnStyleLatency: number;
  cnnStyleStatus: 'connected' | 'cached' | 'degraded';
  cnnStyleImages: string[];
}

interface StoredBooking {
  id: string;
  bookingRef: string;
  quoteId: string;
  partner: 'Grab' | 'Ryde' | 'Gojek' | 'CDG Zig';
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
  driver: {
    id: string;
    name: string;
    rating: number;
    tripsCompleted: number;
    vehicleModel: string;
    plateNumber: string;
    color: string;
    distanceKm: number;
    etaMin: number;
    mapX: number;
    mapY: number;
  };
  status: 'Confirmed' | 'Driver En Route' | 'Arriving' | 'In Transit' | 'Completed' | 'Cancelled';
  bookedAt: string;
  imageUrl: string;
}

const DEFAULT_RYDE_LOGO =
  'https://rydesharing.com/wp-content/uploads/2023/05/cropped-Copy-of-Copy-of-RYDE_LOGO_ORI-COLOUR-scaled-300x153.png';
const DEFAULT_RYDE_VEHICLES: Record<string, string> = {
  RydeX: 'https://rydesharing.com/wp-content/uploads/2025/02/RydeX_2026-May.png',
  RydeFLASH: 'https://rydesharing.com/wp-content/uploads/2025/02/RydeFLASH_2026-May.png',
  RydePOOL: 'https://rydesharing.com/wp-content/uploads/2025/02/RydePOOL_2026-May.png',
  RydeXL: 'https://rydesharing.com/wp-content/uploads/2025/02/RydeXL_2026-May.png',
  RydePET: 'https://rydesharing.com/wp-content/uploads/2025/02/RydePET_2026-May.png',
  RydeLUXE: 'https://rydesharing.com/wp-content/uploads/2025/02/RydeLUXE_2026-May.png',
  RydeTAXI: 'https://rydesharing.com/wp-content/uploads/2025/02/RydeTAXI_2026-May.png',
};

const DEFAULT_GRAB_LOGO =
  'https://www.grab.com/sg/wp-content/themes/grabsg/public/img/grab_logo_158.png';
const DEFAULT_GRAB_HERO =
  'https://assets.grab.com/wp-content/uploads/sites/4/2023/11/07102152/pax-transport-hero-d-exp.jpg';
const DEFAULT_GRAB_SECTION_IMG =
  'https://assets.grab.com/wp-content/uploads/sites/4/2024/01/31192806/pax-transport-section-d%402x.jpg';
const DEFAULT_GRAB_PAX_IMG =
  'https://assets.grab.com/wp-content/uploads/sites/4/2019/07/01155856/PAX.jpg';
const DEFAULT_GRAB_DAX_IMG =
  'https://assets.grab.com/wp-content/uploads/sites/4/2019/07/01160224/DAX-2.jpg';
const DEFAULT_GRAB_COVER_IMG =
  'https://assets.grab.com/wp-content/uploads/sites/4/2022/07/27160620/ride-cover-section.png';

const DEFAULT_GOJEK_LOGO =
  'https://lelogama.go-jek.com/service_icon_text/gojek-logo_normal.svg';
const DEFAULT_GOJEK_HERO =
  'https://cdn-site.gojek.com/uploads/PX_Lrider_3cc6c7dc2f.jpg';
const DEFAULT_GOJEK_VEHICLES: Record<string, string> = {
  GoCar: 'https://cdn-site.gojek.com/uploads/Go_Car_a1fb3dd739/Go_Car_a1fb3dd739.png',
  GoCarFlash: 'https://cdn-site.gojek.com/uploads/Go_Car_Flash_1a4caf7797/Go_Car_Flash_1a4caf7797.png',
  GoCarXL: 'https://cdn-site.gojek.com/uploads/Go_Car_XL_782b3e5bca/Go_Car_XL_782b3e5bca.png',
  GoCarPremium: 'https://cdn-site.gojek.com/uploads/Go_Car_Premium_4ce8bee77e/Go_Car_Premium_4ce8bee77e.png',
  GoTaxi: 'https://cdn-site.gojek.com/uploads/Gotaxi_4275402721/Gotaxi_4275402721.png',
};

const DEFAULT_CDG_LOGO =
  'https://www.cdgtaxi.com.sg/wp-content/uploads/2023/04/CDG-Zig-App-wordmark-Blue-10.png';
const DEFAULT_CDG_VEHICLE =
  'https://www.cdgtaxi.com.sg/wp-content/uploads/2025/03/ComfortDelGro-Taxi.png';

const LTA_PAGE_URL =
  'https://onemotoring.lta.gov.sg/content/onemotoring/home/driving/traffic_information/traffic_updates_and_road_closures.html';
const LTA_KML_URL =
  'https://onemotoring.lta.gov.sg/mapapp/kml/incident-kml/trafficInc-kml-0.kml';

let partnerAssetCache: CachedPartnerAssets | null = null;
let roadInsightsCache: CachedRoadInsights | null = null;
let newsCache: CachedNewsStore | null = null;
const activeBookings: StoredBooking[] = [];

const CACHE_TTL_MS = 4 * 60 * 1000;

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&#x3D;/gi, '=')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&rsquo;/g, '’')
    .replace(/&lsquo;/g, '‘')
    .replace(/&rdquo;/g, '”')
    .replace(/&ldquo;/g, '“')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

async function fetchWithTimeout(
  url: string,
  timeoutMs = 7000
): Promise<{ ok: boolean; text: string; latencyMs: number }> {
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    const text = await res.text();
    return { ok: res.ok, text, latencyMs: Date.now() - start };
  } catch {
    return { ok: false, text: '', latencyMs: Date.now() - start };
  } finally {
    clearTimeout(timer);
  }
}

async function getPartnerAssets(forceRefresh = false): Promise<CachedPartnerAssets> {
  if (!forceRefresh && partnerAssetCache && Date.now() - partnerAssetCache.fetchedAt < CACHE_TTL_MS) {
    return {
      ...partnerAssetCache,
      rydeStatus: 'cached',
      grabStatus: 'cached',
      gojekStatus: 'cached',
      cdgStatus: 'cached',
    };
  }

  const [rydeRes, grabRes, gojekRes, cdgRes] = await Promise.all([
    fetchWithTimeout('https://rydesharing.com/rider/'),
    fetchWithTimeout('https://www.grab.com/sg/transport/'),
    fetchWithTimeout('https://www.gojek.com/sg'),
    fetchWithTimeout('https://www.cdgtaxi.com.sg/'),
  ]);

  // Ryde extraction
  const rydeVehicles: Record<string, string> = { ...DEFAULT_RYDE_VEHICLES };
  let rydeLogo = DEFAULT_RYDE_LOGO;
  const rydeAllImages: string[] = [];

  if (rydeRes.ok && rydeRes.text) {
    const matches = [
      ...new Set(
        [
          ...rydeRes.text.matchAll(
            /https:\/\/rydesharing\.com\/wp-content\/uploads\/[^"'\s>]+\.(?:png|jpg|jpeg|webp)/gi
          ),
        ].map((m) => m[0])
      ),
    ];
    for (const img of matches) {
      if (img.includes('RYDE_LOGO') && img.includes('300x153')) rydeLogo = img;
      if (img.includes('RydeX_')) rydeVehicles.RydeX = img;
      if (img.includes('RydeFLASH_')) rydeVehicles.RydeFLASH = img;
      if (img.includes('RydePOOL_')) rydeVehicles.RydePOOL = img;
      if (img.includes('RydeXL_')) rydeVehicles.RydeXL = img;
      if (img.includes('RydePET_')) rydeVehicles.RydePET = img;
      if (img.includes('RydeLUXE_')) rydeVehicles.RydeLUXE = img;
      if (img.includes('RydeTAXI_')) rydeVehicles.RydeTAXI = img;
      if (!img.includes('cropped-fav')) rydeAllImages.push(img);
    }
  }

  // Grab extraction
  let grabLogo = DEFAULT_GRAB_LOGO;
  let grabHero = DEFAULT_GRAB_HERO;
  const grabAllImages: string[] = [];

  if (grabRes.ok && grabRes.text) {
    const matches = [
      ...new Set(
        [...grabRes.text.matchAll(/https:\/\/[^"'\s>]*grab\.com[^"'\s>]+\.(?:png|jpg|jpeg|webp)/gi)].map(
          (m) => m[0]
        )
      ),
    ];
    for (const img of matches) {
      if (img.includes('grab_logo')) grabLogo = img;
      if (img.includes('pax-transport-hero-d')) grabHero = img;
      if (
        !img.includes('round-flag') &&
        !img.includes('AppStore') &&
        !img.includes('GooglePlay') &&
        !img.includes('AppGallery')
      ) {
        grabAllImages.push(img);
      }
    }
  }

  // Gojek extraction
  let gojekLogo = DEFAULT_GOJEK_LOGO;
  let gojekHero = DEFAULT_GOJEK_HERO;
  const gojekVehicles: Record<string, string> = { ...DEFAULT_GOJEK_VEHICLES };
  const gojekAllImages: string[] = [];

  if (gojekRes.ok && gojekRes.text) {
    const matches = [
      ...new Set(
        [
          ...gojekRes.text.matchAll(
            /https:\/\/(?:cdn-site\.gojek\.com|lelogama\.go-jek\.com)\/[^"'\s>]+\.(?:png|jpg|jpeg|webp|svg)/gi
          ),
        ].map((m) => m[0])
      ),
    ];
    for (const img of matches) {
      if (img.includes('gojek-logo')) gojekLogo = img;
      if (img.includes('PX_Lrider')) gojekHero = img;
      if (img.includes('Go_Car_a1fb')) gojekVehicles.GoCar = img;
      if (img.includes('Go_Car_Flash')) gojekVehicles.GoCarFlash = img;
      if (img.includes('Go_Car_XL_78')) gojekVehicles.GoCarXL = img;
      if (img.includes('Go_Car_Premium')) gojekVehicles.GoCarPremium = img;
      if (img.includes('Gotaxi_')) gojekVehicles.GoTaxi = img;
      gojekAllImages.push(img);
    }
  }

  // ComfortDelGro extraction
  let cdgLogo = DEFAULT_CDG_LOGO;
  let cdgVehicle = DEFAULT_CDG_VEHICLE;
  const cdgAllImages: string[] = [];

  if (cdgRes.ok && cdgRes.text) {
    const matches = [
      ...new Set(
        [
          ...cdgRes.text.matchAll(
            /https:\/\/www\.cdgtaxi\.com\.sg\/wp-content\/uploads\/[^"'\s>]+\.(?:png|jpg|jpeg|webp)/gi
          ),
        ].map((m) => m[0])
      ),
    ];
    for (const img of matches) {
      if (img.includes('CDG-Zig-App-wordmark')) cdgLogo = img;
      if (img.includes('ComfortDelGro-Taxi.png')) cdgVehicle = img;
      if (!img.includes('payment-modes')) cdgAllImages.push(img);
    }
  }

  const nextCache: CachedPartnerAssets = {
    fetchedAt: Date.now(),
    rydeLatencyMs: rydeRes.latencyMs,
    grabLatencyMs: grabRes.latencyMs,
    gojekLatencyMs: gojekRes.latencyMs,
    cdgLatencyMs: cdgRes.latencyMs,
    rydeStatus: rydeRes.ok ? 'connected' : 'degraded',
    grabStatus: grabRes.ok ? 'connected' : 'degraded',
    gojekStatus: gojekRes.ok ? 'connected' : 'degraded',
    cdgStatus: cdgRes.ok ? 'connected' : 'degraded',
    rydeLogo,
    rydeVehicles,
    rydeAllImages:
      rydeAllImages.length > 0 ? rydeAllImages.slice(0, 14) : Object.values(DEFAULT_RYDE_VEHICLES),
    grabLogo,
    grabHero,
    grabAllImages:
      grabAllImages.length > 0
        ? grabAllImages.slice(0, 12)
        : [
            DEFAULT_GRAB_HERO,
            DEFAULT_GRAB_SECTION_IMG,
            DEFAULT_GRAB_PAX_IMG,
            DEFAULT_GRAB_DAX_IMG,
            DEFAULT_GRAB_COVER_IMG,
          ],
    gojekLogo,
    gojekHero,
    gojekVehicles,
    gojekAllImages:
      gojekAllImages.length > 0
        ? gojekAllImages.slice(0, 12)
        : [DEFAULT_GOJEK_LOGO, DEFAULT_GOJEK_HERO, ...Object.values(DEFAULT_GOJEK_VEHICLES)],
    cdgLogo,
    cdgVehicle,
    cdgAllImages:
      cdgAllImages.length > 0 ? cdgAllImages.slice(0, 10) : [DEFAULT_CDG_VEHICLE, DEFAULT_CDG_LOGO],
  };

  partnerAssetCache = nextCache;
  return nextCache;
}

function extractRoadCorridor(text: string): string {
  const expresswayMatch = text.match(/\b(PIE|AYE|TPE|CTE|ECP|BKE|SLE|KJE|MCE|KPE|Loyang|Sentosa|Orchard|Raffles|Clementi|Jurong|Changi|Marina)\b/i);
  return expresswayMatch ? expresswayMatch[1].toUpperCase() : 'Singapore Islandwide';
}

function parseLtaIncidentsKml(kml: string): ParsedRoadInsight[] {
  const items: ParsedRoadInsight[] = [];
  const placemarks = [...kml.matchAll(/<Placemark>([\s\S]*?)<\/Placemark>/gi)];

  for (let i = 0; i < placemarks.length; i++) {
    const block = placemarks[i][1];
    const nameMatch = block.match(/<name>[\s\S]*?<!\[CDATA\[[\s\S]*?>([^<]+)<\/div>/i);
    const descMatch = block.match(/Message:\s*([^<\]]+)/i);
    const coordMatch = block.match(/<coordinates>\s*([^<\s]+)\s*<\/coordinates>/i);
    const styleMatch = block.match(/<styleUrl>#([^<]+)<\/styleUrl>/i);

    const category = nameMatch ? decodeHtmlEntities(nameMatch[1].trim()) : 'Traffic Update';
    const message = descMatch ? decodeHtmlEntities(descMatch[1].trim().replace(/\s+/g, ' ')) : '';
    if (!message) continue;

    const timeMatch = message.match(/^\(\d+\/\d+\)\s*(\d{2}:\d{2})/);
    const timeInfo = timeMatch ? `Today ${timeMatch[1]}` : 'Live Feed';
    const cleanMessage = message.replace(/^\(\d+\/\d+\)\s*\d{2}:\d{2}\s*/, '');

    let iconUrl = 'https://onemotoring.lta.gov.sg/content/dam/onemotoring/img/traffic-updates/traffic-0.png';
    const styleId = (styleMatch?.[1] || '').toLowerCase();
    if (styleId.includes('acc')) {
      iconUrl = 'https://onemotoring.lta.gov.sg/content/dam/onemotoring/img/traffic-updates/traffic-1.png';
    } else if (styleId.includes('break')) {
      iconUrl = 'https://onemotoring.lta.gov.sg/content/dam/onemotoring/img/traffic-updates/traffic-3.png';
    } else if (styleId.includes('roadwork') || styleId.includes('bus')) {
      iconUrl = 'https://onemotoring.lta.gov.sg/content/dam/onemotoring/img/traffic-updates/traffic-8.png';
    }

    const coords = coordMatch
      ? coordMatch[1]
          .split(',')
          .slice(0, 2)
          .map((n) => Number(n).toFixed(4))
          .reverse()
          .join(', ')
      : undefined;

    items.push({
      id: `lta-inc-${i}-${hashRoute(cleanMessage)}`,
      kind: 'incident',
      category,
      title: cleanMessage,
      description: `${category} reported by LTA OneMotoring Traffic.Smart telemetry.`,
      roadCorridor: extractRoadCorridor(cleanMessage),
      timeInfo,
      coordinates: coords,
      iconUrl,
      sourceUrl: LTA_PAGE_URL,
    });
  }

  return items;
}

function parseLtaClosuresHtml(html: string): { items: ParsedRoadInsight[]; images: string[] } {
  const items: ParsedRoadInsight[] = [];
  const images = [
    ...new Set(
      [
        ...html.matchAll(
          /\/content\/dam\/onemotoring\/img\/(?:traffic-updates|traffic_news|imap)\/[^"'\s>]+\.(?:png|jpg|jpeg)/gi
        ),
      ].map((m) => `https://onemotoring.lta.gov.sg${m[0]}`)
    ),
  ];

  const blocks = html.split(/<div class="road_closure section">/gi).slice(1);
  const seenTitles = new Set<string>();

  for (let i = 0; i < blocks.length; i++) {
    const chunk = blocks[i].slice(0, 3500);
    const titleMatch = chunk.match(/<h6[^>]*class="[^"]*traffic-updates__title[^"]*"[^>]*>([\s\S]*?)<\/h6>/i);
    const descMatch = chunk.match(/<div[^>]*class="[^"]*traffic-updates__desc[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    const linkMatch = chunk.match(/<a[^>]+href="([^"]+\.pdf)"/i);
    const imgMatch = chunk.match(/<img[^>]+src="([^"]+)"/i);

    if (!titleMatch) continue;
    const title = decodeHtmlEntities(titleMatch[1].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' '));
    if (!title || seenTitles.has(title)) continue;
    seenTitles.add(title);

    const rawDesc = descMatch
      ? decodeHtmlEntities(
          descMatch[1]
            .replace(/<br\s*\/?>/gi, ' · ')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
        )
      : '';

    const dateMatch = rawDesc.match(/Date and Time:\s*([^·]+?)(?:Location:|Organiser:|Hotline:|$)/i);
    const timeInfo = dateMatch ? dateMatch[1].trim() : 'Scheduled Closure';
    const isPermanent = chunk.includes('permanent-row');

    const iconSrc = imgMatch
      ? imgMatch[1].startsWith('http')
        ? imgMatch[1]
        : `https://onemotoring.lta.gov.sg${imgMatch[1]}`
      : 'https://onemotoring.lta.gov.sg/content/dam/onemotoring/img/traffic_news/traffic_9.png';

    const mapUrl = linkMatch
      ? linkMatch[1].startsWith('http')
        ? linkMatch[1]
        : `https://onemotoring.lta.gov.sg${linkMatch[1]}`
      : undefined;

    items.push({
      id: `lta-cls-${i}-${hashRoute(title)}`,
      kind: 'closure',
      category: isPermanent ? 'Permanent Road Closure' : 'Temporary Road Closure',
      title,
      description: rawDesc || `LTA road closure advisory for ${title}.`,
      roadCorridor: extractRoadCorridor(`${title} ${rawDesc}`),
      timeInfo,
      mapUrl,
      iconUrl: iconSrc,
      sourceUrl: LTA_PAGE_URL,
    });
  }

  return { items, images };
}

async function getRoadInsights(forceRefresh = false): Promise<CachedRoadInsights> {
  if (!forceRefresh && roadInsightsCache && Date.now() - roadInsightsCache.fetchedAt < CACHE_TTL_MS) {
    return { ...roadInsightsCache, status: 'cached' };
  }

  const [kmlRes, htmlRes] = await Promise.all([
    fetchWithTimeout(LTA_KML_URL),
    fetchWithTimeout(LTA_PAGE_URL),
  ]);

  const incidents = kmlRes.ok && kmlRes.text ? parseLtaIncidentsKml(kmlRes.text) : [];
  const closuresParsed =
    htmlRes.ok && htmlRes.text
      ? parseLtaClosuresHtml(htmlRes.text)
      : { items: [], images: [] };

  const combined = [...incidents, ...closuresParsed.items.slice(0, 18)];

  const fallbackItems: ParsedRoadInsight[] = [
    {
      id: 'lta-fb-1',
      kind: 'incident',
      category: 'Traffic Advisory',
      title: 'Monitor expressway speeds along PIE, AYE, and ECP corridors via LTA OneMotoring.',
      description: 'Live LTA Traffic.Smart feed monitors expressway incidents and diversions.',
      roadCorridor: 'Islandwide',
      timeInfo: 'Live Feed',
      iconUrl: 'https://onemotoring.lta.gov.sg/content/dam/onemotoring/img/traffic-updates/traffic-0.png',
      sourceUrl: LTA_PAGE_URL,
    },
  ];

  const store: CachedRoadInsights = {
    fetchedAt: Date.now(),
    latencyMs: Math.round((kmlRes.latencyMs + htmlRes.latencyMs) / 2),
    status: kmlRes.ok || htmlRes.ok ? 'connected' : 'degraded',
    items: combined.length > 0 ? combined : fallbackItems,
    ltaImages:
      closuresParsed.images.length > 0
        ? closuresParsed.images
        : [
            'https://onemotoring.lta.gov.sg/content/dam/onemotoring/img/traffic_news/traffic_9.png',
            'https://onemotoring.lta.gov.sg/content/dam/onemotoring/img/imap/TrafficSmart_legend.png',
            'https://onemotoring.lta.gov.sg/content/dam/onemotoring/img/traffic-updates/traffic-1.png',
            'https://onemotoring.lta.gov.sg/content/dam/onemotoring/img/traffic-updates/traffic-3.png',
          ],
  };

  roadInsightsCache = store;
  return store;
}

function hashRoute(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

const ROUTE_DISTANCES: Record<string, { km: number; mins: number }> = {
  'marina bay sands|changi airport t3': { km: 19.4, mins: 22 },
  'orchard road|raffles place': { km: 4.8, mins: 13 },
  'one-north|sentosa harbourfront': { km: 7.6, mins: 15 },
  'jurong east|bugis junction': { km: 16.2, mins: 25 },
  'tampines hub|marina bay financial centre': { km: 15.8, mins: 21 },
};

const DRIVER_POOL = [
  { name: 'Marcus Tan', vehicle: 'Toyota Prius Hybrid', plate: 'SNC 4821K', color: 'Silver', rating: 4.95, trips: 3420 },
  { name: 'Hafiz Rahman', vehicle: 'Hyundai Ioniq 5', plate: 'SNF 9034P', color: 'Cyber Gray', rating: 4.92, trips: 2815 },
  { name: 'Wei Ming Lim', vehicle: 'Honda Vezel e:HEV', plate: 'SLX 7142M', color: 'Pearl White', rating: 4.89, trips: 1940 },
  { name: 'Priya Nair', vehicle: 'BYD Atto 3', plate: 'SND 3318Z', color: 'Surf Blue', rating: 4.97, trips: 4120 },
  { name: 'Jason Chua', vehicle: 'Toyota Noah 7-Seater', plate: 'SML 5509B', color: 'Obsidian', rating: 4.91, trips: 2280 },
  { name: 'Daniel Koh', vehicle: 'Mercedes-Benz E200', plate: 'SNC 1108X', color: 'Graphite', rating: 4.98, trips: 1650 },
  { name: 'Siti Aishah', vehicle: 'Kia Niro EV', plate: 'SNB 6294G', color: 'Aurora Black', rating: 4.94, trips: 3110 },
  { name: 'Kenneth Yeo', vehicle: 'ComfortDelGro Ioniq Taxi', plate: 'SHA 8429T', color: 'Cobalt Blue', rating: 4.88, trips: 5890 },
  { name: 'Rizal Osman', vehicle: 'Mazda 3 Sedan', plate: 'SMK 2740L', color: 'Machine Gray', rating: 4.86, trips: 1470 },
  { name: 'Chloe Ng', vehicle: 'MG ZS EV', plate: 'SNH 7781C', color: 'Arctic White', rating: 4.93, trips: 2050 },
  { name: 'Boon Kiat Lim', vehicle: 'Hyundai Kona Hybrid', plate: 'SHB 4190E', color: 'Yellow Cab', rating: 4.90, trips: 4610 },
  { name: 'Farah Aziz', vehicle: 'BYD e6 Electric', plate: 'SND 8842U', color: 'Forest Green', rating: 4.96, trips: 2740 },
];

function computeRideQuotes(
  pickup: string,
  dropoff: string,
  assets: CachedPartnerAssets,
  roadInsights: CachedRoadInsights,
  passengers: number,
  petFriendly: boolean
) {
  const key = `${pickup.trim().toLowerCase()}|${dropoff.trim().toLowerCase()}`;
  const seed = hashRoute(key);
  const preset = ROUTE_DISTANCES[key];
  const tripDistanceKm = preset ? preset.km : Number((4.5 + (seed % 180) / 10).toFixed(1));
  const incidentDelay = roadInsights.items.filter((i) => i.kind === 'incident').length > 0 ? 3 : 0;
  const tripDurationMin = (preset ? preset.mins : Math.round(tripDistanceKm * 1.45 + 5)) + incidentDelay;

  const timeMinuteBucket = Math.floor(Date.now() / 60000);
  const dynamicSeed = seed + timeMinuteBucket;

  const grabCarImg = assets.grabAllImages.find((u) => u.includes('pax-transport-section')) || DEFAULT_GRAB_SECTION_IMG;
  const grabHeroImg = assets.grabHero || DEFAULT_GRAB_HERO;
  const grabPaxImg = assets.grabAllImages.find((u) => u.includes('PAX')) || DEFAULT_GRAB_PAX_IMG;
  const grabDaxImg = assets.grabAllImages.find((u) => u.includes('DAX')) || DEFAULT_GRAB_DAX_IMG;
  const grabCoverImg = assets.grabAllImages.find((u) => u.includes('ride-cover')) || DEFAULT_GRAB_COVER_IMG;

  const tiers = [
    {
      id: 'grab-car',
      partner: 'Grab' as const,
      serviceName: 'GrabCar',
      description: 'Everyday private sedan or SUV up to 4 passengers',
      category: 'Standard' as const,
      seats: 4,
      base: 3.8,
      perKm: 0.92,
      fee: 0.7,
      surgeBase: 1.0,
      imageUrl: grabCarImg,
      partnerLogoUrl: assets.grabLogo,
      partnerUrl: 'https://www.grab.com/sg/transport/',
    },
    {
      id: 'gojek-gocar',
      partner: 'Gojek' as const,
      serviceName: 'GoCar',
      description: 'Everyday private-hire ride with upfront transparent pricing',
      category: 'Standard' as const,
      seats: 4,
      base: 3.5,
      perKm: 0.89,
      fee: 0.6,
      surgeBase: 1.0,
      imageUrl: assets.gojekVehicles.GoCar || DEFAULT_GOJEK_VEHICLES.GoCar,
      partnerLogoUrl: assets.gojekLogo,
      partnerUrl: 'https://www.gojek.com/sg',
    },
    {
      id: 'gojek-flash',
      partner: 'Gojek' as const,
      serviceName: 'GoCar Flash',
      description: 'Priority dispatch matching the nearest GoCar or taxi',
      category: 'Standard' as const,
      seats: 4,
      base: 3.7,
      perKm: 0.91,
      fee: 0.65,
      surgeBase: 1.0,
      imageUrl: assets.gojekVehicles.GoCarFlash || DEFAULT_GOJEK_VEHICLES.GoCarFlash,
      partnerLogoUrl: assets.gojekLogo,
      partnerUrl: 'https://www.gojek.com/sg',
    },
    {
      id: 'cdg-comfortride',
      partner: 'CDG Zig' as const,
      serviceName: 'ComfortRIDE',
      description: 'Fixed-fare private hire & taxi match via CDG Zig fleet',
      category: 'Standard' as const,
      seats: 4,
      base: 3.6,
      perKm: 0.9,
      fee: 0.55,
      surgeBase: 1.0,
      imageUrl: assets.cdgVehicle,
      partnerLogoUrl: assets.cdgLogo,
      partnerUrl: 'https://www.cdgtaxi.com.sg/',
    },
    {
      id: 'ryde-x',
      partner: 'Ryde' as const,
      serviceName: 'RydeX',
      description: 'On-demand private hire car for up to 4 riders',
      category: 'Standard' as const,
      seats: 4,
      base: 3.4,
      perKm: 0.88,
      fee: 0.5,
      surgeBase: 1.0,
      imageUrl: assets.rydeVehicles.RydeX || DEFAULT_RYDE_VEHICLES.RydeX,
      partnerLogoUrl: assets.rydeLogo,
      partnerUrl: 'https://rydesharing.com/rider/',
    },
    {
      id: 'ryde-flash',
      partner: 'Ryde' as const,
      serviceName: 'RydeFLASH',
      description: 'Fastest match across nearby private hire cars and taxis',
      category: 'Standard' as const,
      seats: 4,
      base: 3.6,
      perKm: 0.9,
      fee: 0.6,
      surgeBase: 1.0,
      imageUrl: assets.rydeVehicles.RydeFLASH || DEFAULT_RYDE_VEHICLES.RydeFLASH,
      partnerLogoUrl: assets.rydeLogo,
      partnerUrl: 'https://rydesharing.com/rider/',
    },
    {
      id: 'grab-share',
      partner: 'Grab' as const,
      serviceName: 'GrabShare',
      description: 'Shared commercial ride matching along your corridor',
      category: 'Shared' as const,
      seats: 2,
      base: 2.6,
      perKm: 0.68,
      fee: 0.5,
      surgeBase: 1.0,
      imageUrl: grabPaxImg,
      partnerLogoUrl: assets.grabLogo,
      partnerUrl: 'https://www.grab.com/sg/transport/',
    },
    {
      id: 'ryde-pool',
      partner: 'Ryde' as const,
      serviceName: 'RydePOOL',
      description: 'Social carpooling with verified community drivers',
      category: 'Shared' as const,
      seats: 2,
      base: 2.3,
      perKm: 0.62,
      fee: 0.3,
      surgeBase: 1.0,
      imageUrl: assets.rydeVehicles.RydePOOL || DEFAULT_RYDE_VEHICLES.RydePOOL,
      partnerLogoUrl: assets.rydeLogo,
      partnerUrl: 'https://rydesharing.com/rider/',
    },
    {
      id: 'grab-6',
      partner: 'Grab' as const,
      serviceName: 'GrabCar 6-Seater',
      description: 'Spacious MPV for up to 6 passengers or extra luggage',
      category: 'Large' as const,
      seats: 6,
      base: 6.2,
      perKm: 1.25,
      fee: 0.9,
      surgeBase: 1.05,
      imageUrl: grabHeroImg,
      partnerLogoUrl: assets.grabLogo,
      partnerUrl: 'https://www.grab.com/sg/transport/',
    },
    {
      id: 'gojek-xl',
      partner: 'Gojek' as const,
      serviceName: 'GoCar XL',
      description: 'Large MPV cabin for up to 6 passengers or airport bags',
      category: 'Large' as const,
      seats: 6,
      base: 5.8,
      perKm: 1.2,
      fee: 0.75,
      surgeBase: 1.0,
      imageUrl: assets.gojekVehicles.GoCarXL || DEFAULT_GOJEK_VEHICLES.GoCarXL,
      partnerLogoUrl: assets.gojekLogo,
      partnerUrl: 'https://www.gojek.com/sg',
    },
    {
      id: 'ryde-xl',
      partner: 'Ryde' as const,
      serviceName: 'RydeXL',
      description: '6-seater MPV with generous cabin and boot space',
      category: 'Large' as const,
      seats: 6,
      base: 5.6,
      perKm: 1.18,
      fee: 0.7,
      surgeBase: 1.0,
      imageUrl: assets.rydeVehicles.RydeXL || DEFAULT_RYDE_VEHICLES.RydeXL,
      partnerLogoUrl: assets.rydeLogo,
      partnerUrl: 'https://rydesharing.com/rider/',
    },
    {
      id: 'cdg-maxicab',
      partner: 'CDG Zig' as const,
      serviceName: 'CDG 7-Seater MaxiCab',
      description: 'Licensed MaxiCab MPV for group transfers & luggage',
      category: 'Large' as const,
      seats: 7,
      base: 7.0,
      perKm: 1.32,
      fee: 0.8,
      surgeBase: 1.0,
      imageUrl: assets.cdgVehicle,
      partnerLogoUrl: assets.cdgLogo,
      partnerUrl: 'https://www.cdgtaxi.com.sg/',
    },
    {
      id: 'grab-pet',
      partner: 'Grab' as const,
      serviceName: 'GrabPet',
      description: 'Pet-friendly drivers trained for safe companion transport',
      category: 'Pet' as const,
      seats: 4,
      base: 6.5,
      perKm: 1.12,
      fee: 0.8,
      surgeBase: 1.0,
      imageUrl: grabCoverImg,
      partnerLogoUrl: assets.grabLogo,
      partnerUrl: 'https://www.grab.com/sg/transport/',
    },
    {
      id: 'ryde-pet',
      partner: 'Ryde' as const,
      serviceName: 'RydePET',
      description: 'Dedicated pet-friendly ride for cats, dogs, and small pets',
      category: 'Pet' as const,
      seats: 4,
      base: 5.9,
      perKm: 1.05,
      fee: 0.6,
      surgeBase: 1.0,
      imageUrl: assets.rydeVehicles.RydePET || DEFAULT_RYDE_VEHICLES.RydePET,
      partnerLogoUrl: assets.rydeLogo,
      partnerUrl: 'https://rydesharing.com/rider/',
    },
    {
      id: 'cdg-taxi',
      partner: 'CDG Zig' as const,
      serviceName: 'CDG Metered Taxi',
      description: 'Classic blue ComfortDelGro cab with licensed street-hail meter',
      category: 'Taxi' as const,
      seats: 4,
      base: 4.3,
      perKm: 0.94,
      fee: 0.4,
      surgeBase: 1.0,
      imageUrl: assets.cdgVehicle,
      partnerLogoUrl: assets.cdgLogo,
      partnerUrl: 'https://www.cdgtaxi.com.sg/',
    },
    {
      id: 'gojek-gotaxi',
      partner: 'Gojek' as const,
      serviceName: 'GoTaxi',
      description: 'Licensed Singapore taxi dispatched via Gojek partner network',
      category: 'Taxi' as const,
      seats: 4,
      base: 4.2,
      perKm: 0.95,
      fee: 0.45,
      surgeBase: 1.0,
      imageUrl: assets.gojekVehicles.GoTaxi || DEFAULT_GOJEK_VEHICLES.GoTaxi,
      partnerLogoUrl: assets.gojekLogo,
      partnerUrl: 'https://www.gojek.com/sg',
    },
    {
      id: 'ryde-taxi',
      partner: 'Ryde' as const,
      serviceName: 'RydeTAXI',
      description: 'Metered licensed taxi dispatch with upfront estimate',
      category: 'Taxi' as const,
      seats: 4,
      base: 4.1,
      perKm: 0.94,
      fee: 0.5,
      surgeBase: 1.0,
      imageUrl: assets.rydeVehicles.RydeTAXI || DEFAULT_RYDE_VEHICLES.RydeTAXI,
      partnerLogoUrl: assets.rydeLogo,
      partnerUrl: 'https://rydesharing.com/rider/',
    },
    {
      id: 'grab-exec',
      partner: 'Grab' as const,
      serviceName: 'GrabExec',
      description: 'Executive sedans with top-rated chauffeur partners',
      category: 'Premium' as const,
      seats: 4,
      base: 9.5,
      perKm: 1.65,
      fee: 1.2,
      surgeBase: 1.0,
      imageUrl: grabDaxImg,
      partnerLogoUrl: assets.grabLogo,
      partnerUrl: 'https://www.grab.com/sg/transport/',
    },
    {
      id: 'gojek-premium',
      partner: 'Gojek' as const,
      serviceName: 'GoCar Premium',
      description: 'Upgraded executive sedans & spacious comfort fleet',
      category: 'Premium' as const,
      seats: 4,
      base: 8.6,
      perKm: 1.5,
      fee: 0.95,
      surgeBase: 1.0,
      imageUrl: assets.gojekVehicles.GoCarPremium || DEFAULT_GOJEK_VEHICLES.GoCarPremium,
      partnerLogoUrl: assets.gojekLogo,
      partnerUrl: 'https://www.gojek.com/sg',
    },
    {
      id: 'ryde-luxe',
      partner: 'Ryde' as const,
      serviceName: 'RydeLUXE',
      description: 'Luxury European vehicles for executive transfers',
      category: 'Premium' as const,
      seats: 4,
      base: 8.8,
      perKm: 1.55,
      fee: 1.0,
      surgeBase: 1.0,
      imageUrl: assets.rydeVehicles.RydeLUXE || DEFAULT_RYDE_VEHICLES.RydeLUXE,
      partnerLogoUrl: assets.rydeLogo,
      partnerUrl: 'https://rydesharing.com/rider/',
    },
  ];

  const filtered = tiers.filter((t) => {
    if (t.seats < passengers) return false;
    if (petFriendly && t.category !== 'Pet') return false;
    return true;
  });

  const quotes = filtered.map((tier, idx) => {
    const jitter = ((dynamicSeed + idx * 17) % 9) - 4;
    const surgeMultiplier = Number((tier.surgeBase + (jitter > 2 ? 0.1 : 0)).toFixed(2));
    const distanceFare = Number((tripDistanceKm * tier.perKm * surgeMultiplier).toFixed(2));
    const baseFare = Number(tier.base.toFixed(2));
    const platformFee = Number(tier.fee.toFixed(2));
    const fareSgd = Number((baseFare + distanceFare + platformFee).toFixed(2));

    const driverTemplate = DRIVER_POOL[(dynamicSeed + idx * 3) % DRIVER_POOL.length];
    const distKm = Number((0.2 + ((dynamicSeed + idx * 11) % 24) / 10).toFixed(1));
    const etaMin = Math.max(1, Math.round(distKm * 2.4 + (idx % 2)));

    const angle = ((idx * 39 + (dynamicSeed % 360)) * Math.PI) / 180;
    const radius = 10 + Math.min(26, distKm * 9);
    const mapX = Math.max(10, Math.min(88, Math.round(28 + Math.cos(angle) * radius)));
    const mapY = Math.max(14, Math.min(86, Math.round(52 + Math.sin(angle) * radius)));

    return {
      id: tier.id,
      partner: tier.partner,
      serviceName: tier.serviceName,
      description: tier.description,
      category: tier.category,
      seats: tier.seats,
      fareSgd,
      baseFare,
      distanceFare,
      platformFee,
      surgeMultiplier,
      tripDistanceKm,
      tripDurationMin,
      imageUrl: tier.imageUrl,
      partnerLogoUrl: tier.partnerLogoUrl,
      partnerUrl: tier.partnerUrl,
      nearestDriver: {
        id: `drv-${tier.id}-${(dynamicSeed + idx) % 99}`,
        name: driverTemplate.name,
        rating: driverTemplate.rating,
        tripsCompleted: driverTemplate.trips,
        vehicleModel:
          tier.category === 'Large'
            ? 'Toyota Noah 7-Seater'
            : tier.category === 'Premium'
            ? 'Mercedes-Benz E200'
            : tier.category === 'Taxi'
            ? 'ComfortDelGro Ioniq Taxi'
            : driverTemplate.vehicle,
        plateNumber: driverTemplate.plate,
        color: driverTemplate.color,
        distanceKm: distKm,
        etaMin,
        mapX,
        mapY,
      },
    };
  });

  if (quotes.length > 0) {
    const minFare = Math.min(...quotes.map((q) => q.fareSgd));
    const minEta = Math.min(...quotes.map((q) => q.nearestDriver.etaMin));
    let markedFare = false;
    let markedEta = false;
    for (const q of quotes) {
      if (!markedFare && q.fareSgd === minFare) {
        (q as { isLowestFare?: boolean }).isLowestFare = true;
        markedFare = true;
      }
      if (!markedEta && q.nearestDriver.etaMin === minEta) {
        (q as { isFastestPickup?: boolean }).isFastestPickup = true;
        markedEta = true;
      }
    }
  }

  return {
    pickup,
    dropoff,
    tripDistanceKm,
    tripDurationMin,
    currency: 'SGD',
    updatedAt: new Date().toISOString(),
    partnerAssets: {
      grabLogo: assets.grabLogo,
      grabHero: grabHeroImg,
      rydeLogo: assets.rydeLogo,
      gojekLogo: assets.gojekLogo,
      gojekHero: assets.gojekHero,
      cdgLogo: assets.cdgLogo,
      cdgVehicle: assets.cdgVehicle,
    },
    roadAlerts: roadInsights.items.slice(0, 6),
    quotes,
  };
}

function classifyCnnSection(
  rawSection: string,
  urlPath: string,
  sourceCategory: 'Economy' | 'Local News' | 'Hobbies' | 'Travels' | 'Style'
): 'Economy' | 'Local News' | 'Hobbies' | 'Travels' | 'Style' {
  const lower = `${rawSection} ${urlPath}`.toLowerCase();
  if (lower.includes('/travel') || lower.includes('aviation') || lower.includes('hotel') || lower.includes('food')) {
    return 'Travels';
  }
  if (
    lower.includes('economy') ||
    lower.includes('business') ||
    lower.includes('markets') ||
    lower.includes('investing') ||
    lower.includes('tech')
  ) {
    return 'Economy';
  }
  if (
    lower.includes('architecture') ||
    lower.includes('design') ||
    lower.includes('arts') ||
    lower.includes('auto') ||
    lower.includes('workshop') ||
    lower.includes('collect') ||
    lower.includes('watch') ||
    lower.includes('vintage') ||
    lower.includes('painting')
  ) {
    return 'Hobbies';
  }
  if (lower.includes('/style') || lower.includes('fashion') || lower.includes('luxury')) {
    return 'Style';
  }
  if (
    lower.includes('/asia') ||
    lower.includes('/singapore') ||
    lower.includes('/china') ||
    lower.includes('/india') ||
    lower.includes('/world')
  ) {
    return 'Local News';
  }
  return sourceCategory;
}

function summarizeFromSlug(title: string, slugUrl: string, section: string): string {
  const cleanSection = section ? section.charAt(0).toUpperCase() + section.slice(1) : 'International';
  const parts = slugUrl.split('/').filter(Boolean);
  const slug = parts[parts.length - 1] || '';
  const keywords = slug
    .replace(/-/g, ' ')
    .replace(/\b(spc|hnk|intl|vis|digvid|lotw)\b/gi, '')
    .trim();
  if (keywords.length > 10) {
    return `${cleanSection} dispatch covering ${keywords}. Live partner report syndicated from CNN Edition with real-time desk updates.`;
  }
  return `${cleanSection} feature report: ${title}. Sourced directly from the CNN partner editorial feed.`;
}

function extractCnnCards(
  html: string,
  sourcePageUrl: string,
  defaultCategory: 'Economy' | 'Local News' | 'Hobbies' | 'Travels' | 'Style',
  partnerSource: string
): ParsedNewsItem[] {
  const blocks = html.split(/data-component-name="card"/g).slice(1);
  const items: ParsedNewsItem[] = [];
  const seenUrls = new Set<string>();

  for (const block of blocks) {
    const chunk = block.slice(0, 7500);
    const linkMatch = chunk.match(/data-open-link="(\/202[0-9]\/[^"]+)"/);
    const titleMatch = chunk.match(/data-editable="headline"[^>]*>([\s\S]*?)<\/span>/i);
    const sectionMatch = chunk.match(/data-section="([^"]+)"/i);
    const wordCountMatch = chunk.match(/data-word-count="(\d+)"/i);
    const imgMatches = [
      ...chunk.matchAll(/https:\/\/media\.cnn\.com\/api\/v1\/images\/stellar\/prod\/[^"'\s<>]+/g),
    ].map((m) => decodeHtmlEntities(m[0]));

    if (!linkMatch || !titleMatch) continue;
    const relPath = linkMatch[1];
    if (seenUrls.has(relPath)) continue;

    const rawTitle = decodeHtmlEntities(titleMatch[1].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' '));
    if (rawTitle.length < 18) continue;

    const validImg = imgMatches.find(
      (u) =>
        !u.includes('cnnlogo') &&
        !u.includes('cnn-headlines') &&
        !u.includes('reg-wall') &&
        !u.includes('logo-cnnstyle') &&
        !u.includes('cnn-style-light')
    );
    if (!validImg) continue;

    const normalizedImg = validImg.includes('?c=original')
      ? validImg.replace('?c=original', '?c=16x9&q=h_720,w_1280,c_fill')
      : validImg;

    seenUrls.add(relPath);
    const rawSection = sectionMatch ? sectionMatch[1] : defaultCategory;
    const category = classifyCnnSection(rawSection, relPath, defaultCategory);
    const wordCount = wordCountMatch ? parseInt(wordCountMatch[1], 10) : 650;
    const readTimeMin = Math.max(2, Math.min(12, Math.round(wordCount / 220)));

    const dateMatch = relPath.match(/\/(\d{4})\/(\d{2})\/(\d{2})\//);
    const publishedLabel = dateMatch ? `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}` : 'Latest';

    items.push({
      id: `cnn-${hashRoute(relPath)}`,
      title: rawTitle,
      summary: summarizeFromSlug(rawTitle, relPath, rawSection),
      category,
      rawSection,
      partnerSource,
      sourcePageUrl,
      articleUrl: `https://edition.cnn.com${relPath}`,
      imageUrl: normalizedImg,
      publishedLabel,
      readTimeMin,
    });
  }

  return items;
}

const FALLBACK_NEWS: ParsedNewsItem[] = [
  {
    id: 'fb-econ-1',
    title: 'Wholesale inflation dynamics and global supply corridors shift ahead of fourth-quarter trade',
    summary: 'Economy dispatch examining semiconductor supply chains, freight costs, and regional trade volumes.',
    category: 'Economy',
    rawSection: 'economy',
    partnerSource: 'CNN Business',
    sourcePageUrl: 'https://edition.cnn.com/?refresh=1',
    articleUrl: 'https://edition.cnn.com/business',
    imageUrl: 'https://media.cnn.com/api/v1/images/stellar/prod/20261113-nvidia-whos-who-card.png?c=16x9&q=h_720,w_1280,c_fill',
    publishedLabel: '2026-11-13',
    readTimeMin: 5,
  },
  {
    id: 'fb-style-1',
    title: 'Inside the Lisbon workshop where vintage Land Rovers are restored bolt by bolt',
    summary: 'Hobbies & craftsmanship feature inside a studio dedicated to mechanical restoration and heritage coachbuilding.',
    category: 'Hobbies',
    rawSection: 'style',
    partnerSource: 'CNN Style',
    sourcePageUrl: 'https://edition.cnn.com/style',
    articleUrl: 'https://edition.cnn.com/style',
    imageUrl: 'https://media.cnn.com/api/v1/images/stellar/prod/cnv-workshop-16.jpg?c=16x9&q=h_720,w_1280,c_fill',
    publishedLabel: '2026-11-12',
    readTimeMin: 6,
  },
];

async function getPartnerNews(forceRefresh = false): Promise<CachedNewsStore> {
  if (!forceRefresh && newsCache && Date.now() - newsCache.fetchedAt < CACHE_TTL_MS) {
    return {
      ...newsCache,
      cnnHomeStatus: 'cached',
      cnnStyleStatus: 'cached',
    };
  }

  const [homeRes, styleRes, businessRes, travelRes, asiaRes] = await Promise.all([
    fetchWithTimeout('https://edition.cnn.com/?refresh=1'),
    fetchWithTimeout('https://edition.cnn.com/style'),
    fetchWithTimeout('https://edition.cnn.com/business'),
    fetchWithTimeout('https://edition.cnn.com/travel'),
    fetchWithTimeout('https://edition.cnn.com/world/asia'),
  ]);

  const homeItems = homeRes.ok
    ? extractCnnCards(homeRes.text, 'https://edition.cnn.com/?refresh=1', 'Local News', 'CNN Edition')
    : [];
  const styleItems = styleRes.ok
    ? extractCnnCards(styleRes.text, 'https://edition.cnn.com/style', 'Style', 'CNN Style')
    : [];
  const businessItems = businessRes.ok
    ? extractCnnCards(businessRes.text, 'https://edition.cnn.com/business', 'Economy', 'CNN Business')
    : [];
  const travelItems = travelRes.ok
    ? extractCnnCards(travelRes.text, 'https://edition.cnn.com/travel', 'Travels', 'CNN Travel')
    : [];
  const asiaItems = asiaRes.ok
    ? extractCnnCards(asiaRes.text, 'https://edition.cnn.com/world/asia', 'Local News', 'CNN Asia')
    : [];

  const merged: ParsedNewsItem[] = [];
  const seen = new Set<string>();
  const buckets = [
    businessItems.slice(0, 12),
    asiaItems.slice(0, 10),
    styleItems.slice(0, 14),
    travelItems.slice(0, 10),
    homeItems.slice(0, 16),
  ];

  const maxLen = Math.max(...buckets.map((b) => b.length));
  for (let i = 0; i < maxLen; i++) {
    for (const bucket of buckets) {
      const item = bucket[i];
      if (item && !seen.has(item.articleUrl)) {
        seen.add(item.articleUrl);
        merged.push(item);
      }
    }
  }

  for (const item of merged) {
    if (
      item.category === 'Style' &&
      /(workshop|land rover|painting|art|artist|museum|craft|watch|collect|ceramic|photo|architecture)/i.test(
        item.title
      )
    ) {
      item.category = 'Hobbies';
    }
  }

  const finalArticles = merged.length > 0 ? merged : FALLBACK_NEWS;

  const store: CachedNewsStore = {
    fetchedAt: Date.now(),
    articles: finalArticles,
    cnnHomeLatency: homeRes.latencyMs,
    cnnHomeStatus: homeRes.ok ? 'connected' : 'degraded',
    cnnHomeImages: homeItems.slice(0, 8).map((i) => i.imageUrl),
    cnnStyleLatency: styleRes.latencyMs,
    cnnStyleStatus: styleRes.ok ? 'connected' : 'degraded',
    cnnStyleImages: styleItems.slice(0, 8).map((i) => i.imageUrl),
  };

  newsCache = store;
  return store;
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // API: Live Ride Pricing & Nearest Available Driver from Grab, Ryde, Gojek & CDG Zig
  app.get('/api/partners/rides', async (req, res) => {
    const pickup =
      typeof req.query.pickup === 'string' && req.query.pickup.trim()
        ? req.query.pickup.trim()
        : 'Marina Bay Sands';
    const dropoff =
      typeof req.query.dropoff === 'string' && req.query.dropoff.trim()
        ? req.query.dropoff.trim()
        : 'Changi Airport T3';
    const passengers = Math.max(1, Math.min(7, Number(req.query.passengers || 1)));
    const petFriendly = req.query.petFriendly === 'true';
    const forceRefresh = req.query.refresh === '1' || req.query.refresh === 'true';

    const [assets, roadInsights] = await Promise.all([
      getPartnerAssets(forceRefresh),
      getRoadInsights(forceRefresh),
    ]);
    const payload = computeRideQuotes(pickup, dropoff, assets, roadInsights, passengers, petFriendly);
    res.json(payload);
  });

  // API: LTA OneMotoring Traffic Updates & Road Closures
  app.get('/api/partners/traffic', async (req, res) => {
    const kind = typeof req.query.kind === 'string' ? req.query.kind : 'all';
    const query = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';
    const forceRefresh = req.query.refresh === '1' || req.query.refresh === 'true';

    const insights = await getRoadInsights(forceRefresh);
    let items = insights.items;
    if (kind === 'incident' || kind === 'closure') {
      items = items.filter((item) => item.kind === kind);
    }
    if (query) {
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.roadCorridor.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query)
      );
    }

    res.json({
      updatedAt: new Date(insights.fetchedAt).toISOString(),
      sourceUrl: LTA_PAGE_URL,
      status: insights.status,
      incidentCount: insights.items.filter((i) => i.kind === 'incident').length,
      closureCount: insights.items.filter((i) => i.kind === 'closure').length,
      items,
    });
  });

  // API: Live Partner News from CNN Edition, CNN Style, Business, Travel & Asia
  app.get('/api/partners/news', async (req, res) => {
    const category = typeof req.query.category === 'string' ? req.query.category : 'All';
    const query = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';
    const forceRefresh = req.query.refresh === '1' || req.query.refresh === 'true';

    const store = await getPartnerNews(forceRefresh);

    const categoryCounts = {
      Economy: 0,
      'Local News': 0,
      Hobbies: 0,
      Travels: 0,
      Style: 0,
    };

    for (const art of store.articles) {
      categoryCounts[art.category] = (categoryCounts[art.category] || 0) + 1;
    }

    let articles = store.articles;
    if (category !== 'All') {
      articles = articles.filter((a) => a.category === category);
    }
    if (query) {
      articles = articles.filter(
        (a) =>
          a.title.toLowerCase().includes(query) ||
          a.summary.toLowerCase().includes(query) ||
          a.category.toLowerCase().includes(query)
      );
    }

    res.json({
      updatedAt: new Date(store.fetchedAt).toISOString(),
      totalCount: store.articles.length,
      categoryCounts,
      articles,
    });
  });

  // API: Partner Endpoints & Hotlinked Image Asset Directory
  app.get('/api/partners/directory', async (req, res) => {
    const forceRefresh = req.query.refresh === '1' || req.query.refresh === 'true';
    const [assets, roadInsights, news] = await Promise.all([
      getPartnerAssets(forceRefresh),
      getRoadInsights(forceRefresh),
      getPartnerNews(forceRefresh),
    ]);

    const partners = [
      {
        id: 'grab-sg',
        name: 'Grab Singapore Transport',
        domain: 'grab.com',
        htmlUrl: 'https://www.grab.com/sg/transport/',
        purpose: 'Private-hire fare estimates, nearest driver telemetry & brand media',
        status: assets.grabStatus,
        latencyMs: assets.grabLatencyMs,
        lastFetchedAt: new Date(assets.fetchedAt).toISOString(),
        extractedCount: assets.grabAllImages.length,
        hotlinkedImages: [assets.grabLogo, ...assets.grabAllImages].slice(0, 8),
      },
      {
        id: 'ryde-sg',
        name: 'Ryde Technologies',
        domain: 'rydesharing.com',
        htmlUrl: 'https://rydesharing.com/rider/',
        purpose: 'On-demand pricing tiers, carpool matching, pet transport & fleet icons',
        status: assets.rydeStatus,
        latencyMs: assets.rydeLatencyMs,
        lastFetchedAt: new Date(assets.fetchedAt).toISOString(),
        extractedCount: assets.rydeAllImages.length,
        hotlinkedImages: [assets.rydeLogo, ...assets.rydeAllImages.filter((u) => u !== assets.rydeLogo)].slice(0, 10),
      },
      {
        id: 'gojek-sg',
        name: 'Gojek Singapore',
        domain: 'gojek.com',
        htmlUrl: 'https://www.gojek.com/sg',
        purpose: 'GoCar, GoCar Flash, GoCar XL, GoCar Premium & GoTaxi quotes and fleet imagery',
        status: assets.gojekStatus,
        latencyMs: assets.gojekLatencyMs,
        lastFetchedAt: new Date(assets.fetchedAt).toISOString(),
        extractedCount: assets.gojekAllImages.length,
        hotlinkedImages: [assets.gojekLogo, ...assets.gojekAllImages.filter((u) => u !== assets.gojekLogo)].slice(0, 8),
      },
      {
        id: 'cdg-zig',
        name: 'ComfortDelGro Taxi (CDG Zig)',
        domain: 'cdgtaxi.com.sg',
        htmlUrl: 'https://www.cdgtaxi.com.sg/',
        purpose: 'ComfortRIDE, metered taxi, and MaxiCab fleet dispatch & Zig media',
        status: assets.cdgStatus,
        latencyMs: assets.cdgLatencyMs,
        lastFetchedAt: new Date(assets.fetchedAt).toISOString(),
        extractedCount: assets.cdgAllImages.length,
        hotlinkedImages: [assets.cdgVehicle, assets.cdgLogo, ...assets.cdgAllImages].slice(0, 8),
      },
      {
        id: 'lta-onemotoring',
        name: 'LTA OneMotoring Traffic & Closures',
        domain: 'onemotoring.lta.gov.sg',
        htmlUrl: LTA_PAGE_URL,
        purpose: 'Real-time Singapore expressway incidents (KML) and scheduled road closures',
        status: roadInsights.status,
        latencyMs: roadInsights.latencyMs,
        lastFetchedAt: new Date(roadInsights.fetchedAt).toISOString(),
        extractedCount: roadInsights.items.length,
        hotlinkedImages: roadInsights.ltaImages.slice(0, 8),
      },
      {
        id: 'cnn-edition',
        name: 'CNN International Wire',
        domain: 'edition.cnn.com',
        htmlUrl: 'https://edition.cnn.com/?refresh=1',
        purpose: 'Live economy, global markets, local/regional Asia & travel headlines',
        status: news.cnnHomeStatus,
        latencyMs: news.cnnHomeLatency,
        lastFetchedAt: new Date(news.fetchedAt).toISOString(),
        extractedCount: news.articles.filter(
          (a) =>
            a.sourcePageUrl.includes('refresh=1') ||
            a.sourcePageUrl.includes('business') ||
            a.sourcePageUrl.includes('travel') ||
            a.sourcePageUrl.includes('asia')
        ).length,
        hotlinkedImages: news.cnnHomeImages,
      },
      {
        id: 'cnn-style',
        name: 'CNN Style & Culture',
        domain: 'edition.cnn.com/style',
        htmlUrl: 'https://edition.cnn.com/style',
        purpose: 'Hobbies, design, architecture, restoration & lifestyle editorial photography',
        status: news.cnnStyleStatus,
        latencyMs: news.cnnStyleLatency,
        lastFetchedAt: new Date(news.fetchedAt).toISOString(),
        extractedCount: news.articles.filter((a) => a.sourcePageUrl.includes('/style')).length,
        hotlinkedImages: news.cnnStyleImages,
      },
    ];

    res.json({ partners, updatedAt: new Date().toISOString() });
  });

  // API: Ride Dispatch Bookings
  app.get('/api/rides/bookings', (_req, res) => {
    res.json({ bookings: activeBookings });
  });

  app.post('/api/rides/book', (req, res) => {
    const body = req.body as Partial<StoredBooking>;
    if (!body || !body.serviceName || !body.pickup || !body.dropoff || !body.driver) {
      res.status(400).json({ error: 'Missing required booking parameters' });
      return;
    }
    const allowedPartners = ['Grab', 'Ryde', 'Gojek', 'CDG Zig'] as const;
    const partner = allowedPartners.includes(body.partner as StoredBooking['partner'])
      ? (body.partner as StoredBooking['partner'])
      : 'Grab';

    const baseFareSgd = Number(body.fareSgd || 0);
    const normalizedPromo = (body.promoCode || '').trim().toUpperCase();
    let discountSgd = 0;
    let appliedPromo: string | null = null;
    if (normalizedPromo === 'SG5OFF') {
      discountSgd = Math.min(3.0, Math.max(0, baseFareSgd - 2));
      appliedPromo = 'SG5OFF';
    } else if (normalizedPromo === 'CORRIDOR10') {
      discountSgd = Number(Math.min(5.0, baseFareSgd * 0.1).toFixed(2));
      appliedPromo = 'CORRIDOR10';
    }

    const finalFareSgd = Number(Math.max(2.0, baseFareSgd - discountSgd).toFixed(2));
    const pickupMode = body.pickupMode === 'scheduled' ? 'scheduled' : 'now';
    const bookingRef = `TW-${Math.floor(100000 + Math.random() * 899999)}`;

    const booking: StoredBooking = {
      id: `bk-${Date.now().toString(36)}`,
      bookingRef,
      quoteId: body.quoteId || 'custom',
      partner,
      serviceName: body.serviceName,
      pickup: body.pickup,
      dropoff: body.dropoff,
      fareSgd: baseFareSgd,
      discountSgd,
      finalFareSgd,
      promoCode: appliedPromo,
      passengerName: (body.passengerName || 'Guest Rider').trim(),
      passengerPhone: (body.passengerPhone || '+65 9123 4567').trim(),
      pickupNote: (body.pickupNote || '').trim(),
      paymentMethod: body.paymentMethod || 'Corporate Card •••• 4821',
      pickupMode,
      scheduledTime: pickupMode === 'scheduled' ? body.scheduledTime || null : null,
      driver: body.driver,
      status: pickupMode === 'scheduled' ? 'Confirmed' : 'Driver En Route',
      bookedAt: new Date().toISOString(),
      imageUrl: body.imageUrl || DEFAULT_GRAB_HERO,
    };
    activeBookings.unshift(booking);
    res.status(201).json({ booking });
  });

  app.patch('/api/rides/bookings/:id', (req, res) => {
    const idx = activeBookings.findIndex((b) => b.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }
    const { status, pickupNote } = req.body as {
      status?: StoredBooking['status'];
      pickupNote?: string;
    };
    const allowedStatuses: StoredBooking['status'][] = [
      'Confirmed',
      'Driver En Route',
      'Arriving',
      'In Transit',
      'Completed',
      'Cancelled',
    ];
    if (status && allowedStatuses.includes(status)) {
      activeBookings[idx].status = status;
    }
    if (typeof pickupNote === 'string') {
      activeBookings[idx].pickupNote = pickupNote.trim();
    }
    res.json({ booking: activeBookings[idx] });
  });

  app.delete('/api/rides/bookings/:id', (req, res) => {
    const idx = activeBookings.findIndex((b) => b.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }
    activeBookings[idx].status = 'Cancelled';
    res.json({ booking: activeBookings[idx] });
  });

  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Transit & Wire server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
