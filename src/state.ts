export interface SignageCard {
  badge: string;
  title: string;
  sub: string;
}

export interface SignageSlide {
  sector: string;
  metric: string;
  choreo: { x: number; y: number; z: number };
  cards: [SignageCard, SignageCard, SignageCard, SignageCard];
}

export const SIGNAGE_SLIDES: SignageSlide[] = [
  {
    sector: 'SECTOR 01 // 06',
    metric: 'READY IN 24H',
    choreo: { x: 4, y: -12, z: 0 },
    cards: [
      { badge: '01 // EXECUTIVE SUITES', title: 'TURNKEY LUXURY OFFICES', sub: 'ZERO SETUP DELAY • FULL PRESTIGE' },
      { badge: '02 // SECURITY & ACCESS', title: '24/7 BIOMETRIC ACCESS', sub: 'PRIVATE VIP ELEVATOR & SECURITY' },
      { badge: '03 // ARCHITECTURE', title: 'PENTHOUSE SKYLINE VIEWS', sub: 'FLOOR-TO-CEILING ACOUSTIC GLASS' },
      { badge: '04 // INSTANT DEPLOYMENT', title: '100% MOVE-IN READY', sub: 'BESPOKE EXECUTIVE FURNITURE' }
    ]
  },
  {
    sector: 'SECTOR 02 // 06',
    metric: '4K LASER AV',
    choreo: { x: -4, y: 14, z: 1 },
    cards: [
      { badge: '01 // SMART BOARDROOMS', title: 'HIGH-IMPACT MEETINGS', sub: 'COMMAND EVERY NEGOTIATION' },
      { badge: '02 // VISUAL TELEMETRY', title: '4K LASER VIDEO WALLS', sub: 'WIRELESS INSTANT SCREENCAST' },
      { badge: '03 // SOUND ENGINEERING', title: 'STUDIO ACOUSTIC SEAL', sub: '100% CONFIDENTIAL BOARDROOMS' },
      { badge: '04 // HOSPITALITY', title: 'VIP CATERING SERVICE', sub: 'DEDICATED BARISTA & STEWARD' }
    ]
  },
  {
    sector: 'SECTOR 03 // 06',
    metric: 'PRIME LEGAL HQ',
    choreo: { x: 5, y: -10, z: -1 },
    cards: [
      { badge: '01 // VIRTUAL HQ', title: 'PRESTIGE ADDRESS', sub: 'INSTANT CORPORATE AUTHORITY' },
      { badge: '02 // DOMICILIATION', title: 'FAST LEGAL REGISTRATION', sub: 'COMPLIANT COMMERCIAL DOMICILE' },
      { badge: '03 // LOGISTICS DESK', title: 'VIP MAIL & COURIER', sub: 'DIGITAL SCAN & GLOBAL FORWARDING' },
      { badge: '04 // FRONT DESK', title: 'LIVE MULTILINGUAL RECEPTION', sub: 'DEDICATED EXECUTIVE CALL HANDLING' }
    ]
  },
  {
    sector: 'SECTOR 04 // 06',
    metric: '10 GBPS FIBER',
    choreo: { x: -3, y: -15, z: 1 },
    cards: [
      { badge: '01 // COWORKING LOUNGE', title: 'ELITE NETWORKING HUB', sub: 'BUILT FOR HIGH-GROWTH FOUNDERS' },
      { badge: '02 // CONNECTIVITY', title: '10 GBPS DUAL-FIBER', sub: 'ZERO-LATENCY REDUNDANT BACKBONE' },
      { badge: '03 // FOCUS ZONES', title: 'PRIVATE SOUND PODS', sub: 'CRYSTAL-CLEAR EXECUTIVE CALLS' },
      { badge: '04 // SKY CLUB', title: 'ARTISAN ESPRESSO BAR', sub: 'CURATED MEMBER DEAL-FLOW EVENTS' }
    ]
  },
  {
    sector: 'SECTOR 05 // 06',
    metric: '24/7 VIP DESK',
    choreo: { x: 3, y: 12, z: -1 },
    cards: [
      { badge: '01 // PRO CONCIERGE', title: 'ZERO-FRICTION OPS', sub: 'WE RUN THE BACKOFFICE FOR YOU' },
      { badge: '02 // ADVISORY', title: 'LEGAL & TAX DESK', sub: 'CORPORATE LICENSING & COMPLIANCE' },
      { badge: '03 // TECH OPS', title: '24/7 ON-SITE IT CREW', sub: 'DEDICATED CYBER & CLOUD SUPPORT' },
      { badge: '04 // MOBILITY', title: 'VIP CHAUFFEUR PROTOCOL', sub: 'AIRPORT TRANSFER & HOTEL BOOKING' }
    ]
  },
  {
    sector: 'SECTOR 06 // 06',
    metric: '200-SEAT ARENA',
    choreo: { x: 0, y: 0, z: 0 },
    cards: [
      { badge: '01 // SUMMIT ARENA', title: 'CORPORATE LAUNCHPAD', sub: 'STAGE UNFORGETTABLE KEYNOTES' },
      { badge: '02 // CAPACITY', title: '200-SEAT AUDITORIUM', sub: 'DOLBY ATMOS CINEMA ACOUSTICS' },
      { badge: '03 // BROADCAST', title: '4K MULTI-CAM STUDIO', sub: 'GLOBAL LIVE STREAM PRODUCTION' },
      { badge: '04 // GALA LOUNGE', title: 'FIVE-STAR BANQUET HALL', sub: 'PRIVATE ROOFTOP NETWORKING DECK' }
    ]
  }
];

export interface AppState {
  // 3D Logo & Transform State
  poseX: number;
  poseY: number;
  poseZ: number;
  floatSpeed: number;
  floatAmp: number;
  logoScale: number;
  ringRadii: [number, number, number];
  ringSpeed: number;
  bloomStrength: number;
  bloomRadius: number;
  normalScale: number;
  backdropMode: 'obsidian' | 'marble' | 'grid' | 'alpha';
  
  // Slideshow & World Canvas UI State
  autoplay: boolean;
  slideDuration: number;
  uiAmp: number;
  currentSlide: number;
  nitroSpinBoost: number;
  choreoPose: { x: number; y: number; z: number };
  isTransitioning: boolean;
  slideProgress: number;

  // AR & Image Tracking State
  arMode: boolean; // true = AR Camera Mode, false = 3D Studio Mode
  markerFound: boolean;
  markerConfidence: number;
  trackingStatus: 'IDLE' | 'SEARCHING' | 'TRACKING' | 'LOST' | 'ERROR';

  // Audio State
  audioPlaying: boolean;
  audioEngine: 'synth' | 'youtube' | 'hybrid';
  audioVolume: number;
  audioLoop: boolean;

  // UI Visibility
  signageVisible: boolean;
  studioDrawerOpen: boolean;
  markerModalOpen: boolean;
}

export const appState: AppState = {
  poseX: 0,
  poseY: 0,
  poseZ: 0,
  floatSpeed: 1.4,
  floatAmp: 0.22,
  logoScale: 1.0,
  ringRadii: [3.55, 4.05, 4.55],
  ringSpeed: 1.0,
  bloomStrength: 0.45,
  bloomRadius: 0.60,
  normalScale: 1.0,
  backdropMode: 'obsidian',
  
  autoplay: true,
  slideDuration: 7.0,
  uiAmp: 1.4,
  currentSlide: 0,
  nitroSpinBoost: 0.0,
  choreoPose: { x: 0, y: 0, z: 0 },
  isTransitioning: false,
  slideProgress: 0,

  arMode: false,
  markerFound: false,
  markerConfidence: 0,
  trackingStatus: 'IDLE',

  audioPlaying: false,
  audioEngine: 'synth',
  audioVolume: 0.75,
  audioLoop: true,

  signageVisible: true,
  studioDrawerOpen: false,
  markerModalOpen: false
};

type StateListener = () => void;
const listeners = new Set<StateListener>();

export function subscribeState(listener: StateListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notifyStateChange() {
  listeners.forEach(fn => fn());
}
