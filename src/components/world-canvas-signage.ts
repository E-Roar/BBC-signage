import * as ecs from '@8thwall/ecs';
import * as THREE from 'three';

// -----------------------------------------------------------------------------
// BRAVEN BUSINESS CENTER - 6 SECTOR SLIDESHOW DATA (from index.original.html)
// -----------------------------------------------------------------------------
export interface SignageCardData {
  badge: string;
  title: string;
  sub: string;
}

export interface SignageSlideData {
  sector: string;
  metric: string;
  cards: [SignageCardData, SignageCardData, SignageCardData, SignageCardData];
}

export const SIGNAGE_SLIDES: SignageSlideData[] = [
  {
    sector: 'SECTOR 01 // 06',
    metric: 'READY IN 24H',
    cards: [
      { badge: '01 // EXECUTIVE SUITES', title: 'TURNKEY LUXURY OFFICES', sub: 'ZERO SETUP DELAY • FULL PRESTIGE' },
      { badge: '02 // SECURITY & ACCESS', title: '24/7 BIOMETRIC ACCESS', sub: 'PRIVATE VIP ELEVATOR & SECURITY' },
      { badge: '03 // ARCHITECTURE', title: 'PENTHOUSE SKYLINE VIEWS', sub: 'FLOOR-TO-CEILING ACOUSTIC GLASS' },
      { badge: '04 // INSTANT DEPLOYMENT', title: '100% MOVE-IN READY', sub: 'BESPOKE EXECUTIVE FURNITURE' },
    ],
  },
  {
    sector: 'SECTOR 02 // 06',
    metric: 'TIER 4 SECURITY',
    cards: [
      { badge: '01 // ACCESS CONTROL', title: 'RETINAL & PALM SCANNERS', sub: 'MULTI-FACTOR ENCRYPTED ENTRY' },
      { badge: '02 // SURVEILLANCE', title: 'AI PERIMETER MONITORING', sub: '360° LIDAR & THERMAL DETECTION' },
      { badge: '03 // SECURE PARKING', title: 'ARMORED VEHICLE BAY', sub: 'SUB-LEVEL DIPLOMATIC ACCESS' },
      { badge: '04 // EMERGENCY VAULT', title: 'INDEPENDENT LIFE SUPPORT', sub: '72H AUTONOMOUS GENERATOR' },
    ],
  },
  {
    sector: 'SECTOR 03 // 06',
    metric: '94.8% OCCUPIED',
    cards: [
      { badge: '01 // SKYLINE LOUNGE', title: '360° HARBOR PANORAMA', sub: 'EXCLUSIVE C-LEVEL HOSPITALITY' },
      { badge: '02 // ROOFTOP HELIPAD', title: 'DIRECT AIR TRANSFER', sub: 'SCHEDULED VIP FLIGHT ACCESS' },
      { badge: '03 // SOUND ISOLATION', title: 'ACOUSTIC GLASS RATING 52', sub: 'WHISPER-QUIET PRIVACY' },
      { badge: '04 // BOARDROOMS', title: 'CALACATTA MARBLE FINISH', sub: 'INTEGRATED 8K TELEPRESENCE' },
    ],
  },
  {
    sector: 'SECTOR 04 // 06',
    metric: 'LEASING NOW',
    cards: [
      { badge: '01 // HIGH SPEED 5G', title: 'ULTRA MMWAVE NETWORK', sub: 'ZERO LATENCY TRADING SPEEDS' },
      { badge: '02 // CONCIERGE', title: 'WHITE-GLOVE RECEPTION', sub: 'BESPOKE HOSPITALITY STAFF' },
      { badge: '03 // VIP ELEVATORS', title: 'DIRECT PRIVATE LIFTS', sub: 'DESTINATION DISPATCH SYSTEM' },
      { badge: '04 // SMART SUITES', title: 'IOT AUTOMATED OFFICES', sub: 'APP-CONTROLLED LIGHTS & CLIMATE' },
    ],
  },
  {
    sector: 'SECTOR 05 // 06',
    metric: '99.999% UPTIME',
    cards: [
      { badge: '01 // DARK FIBER', title: 'DUAL REDUNDANT TRUNKS', sub: 'TIER-1 BACKBONE CONNECTION' },
      { badge: '02 // ENCRYPTION', title: 'QUANTUM-SAFE SECURITY', sub: 'ON-PREMISE HARDWARE HSM' },
      { badge: '03 // BANDWIDTH', title: '10GBPS SYMMETRIC PIPES', sub: 'UNCONGESTED CARRIER NEUTRAL' },
      { badge: '04 // EDGE COMPUTE', title: 'LOCAL SERVER PODS', sub: 'MICROSECOND DATA ROUTING' },
    ],
  },
  {
    sector: 'SECTOR 06 // 06',
    metric: 'LEED PLATINUM',
    cards: [
      { badge: '01 // CLIMATE TECH', title: 'MICRO-ZONE AIR PURITY', sub: 'HEPA-14 & IONIC FILTRATION' },
      { badge: '02 // LIGHTING', title: 'CIRCADIAN LED MATRIX', sub: 'BIOLOGICALLY OPTIMIZED SPECTRUM' },
      { badge: '03 // SUSTAINABLE', title: 'ENERGY HARVESTING', sub: 'SOLAR FAÇADE INTEGRATION' },
      { badge: '04 // AI DISPATCH', title: 'SMART LOBBY FLOW', sub: 'ZERO-WAIT ELEVATOR ROUTING' },
    ],
  },
];

// -----------------------------------------------------------------------------
// SIGNAGE STATE & CENTRAL ORCHESTRATOR FOR 8TH WALL STUDIO
// -----------------------------------------------------------------------------
class SignageEngine {
  currentSlide = 0;
  slideDuration = 7.0;
  elapsedTime = 0;
  autoplay = true;
  isTransitioning = false;

  // Scrambled texts for matrix cipher animation
  scrambledSector = '';
  scrambledMetric = '';
  scrambledBadges = ['', '', '', ''];
  scrambledTitles = ['', '', '', ''];

  // Registered panel instances
  panels: Map<string, PanelRenderer> = new Map();
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();
  attachedDomEvents = false;

  constructor() {
    this.updateScrambledTexts(0, true);
  }

  registerPanel(panelType: string, renderer: PanelRenderer) {
    this.panels.set(panelType, renderer);
    renderer.render(this.currentSlide, this.getProgress());
  }

  unregisterPanel(panelType: string) {
    this.panels.delete(panelType);
  }

  getProgress(): number {
    return Math.min(this.elapsedTime / this.slideDuration, 1.0);
  }

  goToSlide(idx: number) {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    this.elapsedTime = 0;

    const count = SIGNAGE_SLIDES.length;
    this.currentSlide = ((idx % count) + count) % count;

    // Trigger matrix cipher text scramble
    let scrambleTicks = 0;
    const interval = setInterval(() => {
      scrambleTicks++;
      this.updateScrambledTexts(this.currentSlide, scrambleTicks >= 6);
      this.renderAll();
      if (scrambleTicks >= 6) {
        clearInterval(interval);
        this.isTransitioning = false;
      }
    }, 45);
  }

  toggleAutoplay() {
    this.autoplay = !this.autoplay;
    this.renderPanel('bottom-nav');
  }

  private updateScrambledTexts(slideIdx: number, done = false) {
    const slide = SIGNAGE_SLIDES[slideIdx];
    const glyphs = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ//⚡';
    const scramble = (str: string) => {
      if (done) return str;
      return str.split('').map(ch => (ch === ' ' ? ' ' : (Math.random() > 0.45 ? glyphs[Math.floor(Math.random() * glyphs.length)] : ch))).join('');
    };

    this.scrambledSector = scramble(slide.sector);
    this.scrambledMetric = scramble(slide.metric);
    this.scrambledBadges = slide.cards.map(c => scramble(c.badge));
    this.scrambledTitles = slide.cards.map(c => scramble(c.title));
  }

  renderAll() {
    const progress = this.getProgress();
    for (const renderer of this.panels.values()) {
      renderer.render(this.currentSlide, progress);
    }
  }

  renderPanel(type: string) {
    const p = this.panels.get(type);
    if (p) p.render(this.currentSlide, this.getProgress());
  }

  tick(dt: number) {
    if (this.autoplay && !this.isTransitioning) {
      this.elapsedTime += dt;
      if (this.elapsedTime >= this.slideDuration) {
        this.goToSlide(this.currentSlide + 1);
      } else {
        // Continuous tachometer bar update
        const bottom = this.panels.get('bottom-nav');
        if (bottom) {
          bottom.render(this.currentSlide, this.getProgress());
        }
      }
    }
  }

  setupGlobalRaycasting(world: ecs.World) {
    if (this.attachedDomEvents) return;
    const dom = world.three?.renderer?.domElement;
    if (!dom) return;
    this.attachedDomEvents = true;

    const handlePointer = (e: MouseEvent | TouchEvent) => {
      const rect = dom.getBoundingClientRect();
      const clientX = 'touches' in e && e.touches.length > 0 ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e && e.touches.length > 0 ? e.touches[0].clientY : (e as MouseEvent).clientY;
      if (clientX === undefined || clientY === undefined) return;

      this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      const camera = world.three.activeCamera as THREE.Camera;
      if (!camera) return;

      this.raycaster.setFromCamera(this.mouse, camera);

      // Collect panel meshes
      const meshes: THREE.Mesh[] = [];
      const meshToType: Map<THREE.Mesh, string> = new Map();
      for (const [type, renderer] of this.panels.entries()) {
        if (renderer.mesh) {
          meshes.push(renderer.mesh);
          meshToType.set(renderer.mesh, type);
        }
      }

      const intersects = this.raycaster.intersectObjects(meshes, false);
      if (intersects.length > 0) {
        const hit = intersects[0];
        const panelType = meshToType.get(hit.object as THREE.Mesh);

        if (panelType === 'bottom-nav' && hit.uv) {
          // Bottom Navigation Deck interactive hit regions
          const u = hit.uv.x;
          const v = hit.uv.y;

          if (u < 0.22) {
            // PREV BUTTON
            this.goToSlide(this.currentSlide - 1);
          } else if (u > 0.78) {
            // NEXT BUTTON
            this.goToSlide(this.currentSlide + 1);
          } else if (u >= 0.25 && u <= 0.75 && v > 0.55) {
            // AUTOPLAY TOGGLE
            this.toggleAutoplay();
          } else if (u >= 0.30 && u <= 0.70 && v <= 0.45) {
            // 6 SECTOR DOTS
            const dotFrac = (u - 0.30) / 0.40;
            const dotIdx = Math.floor(dotFrac * 6);
            if (dotIdx >= 0 && dotIdx < 6) {
              this.goToSlide(dotIdx);
            }
          }
        } else if (panelType?.startsWith('card-')) {
          // Clicking any card advances slide
          this.goToSlide(this.currentSlide + 1);
        } else if (panelType === 'btn-prev') {
          this.goToSlide(this.currentSlide - 1);
        } else if (panelType === 'btn-next') {
          this.goToSlide(this.currentSlide + 1);
        } else if (panelType === 'btn-autoplay') {
          this.toggleAutoplay();
        }
      }
    };

    dom.addEventListener('click', handlePointer);
  }
}

const engine = new SignageEngine();

// -----------------------------------------------------------------------------
// HIGH-DPI CANVAS PANEL RENDERER
// -----------------------------------------------------------------------------
class PanelRenderer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  texture: THREE.CanvasTexture;
  material: THREE.MeshBasicMaterial;
  mesh: THREE.Mesh | null = null;
  panelType: string;

  constructor(panelType: string, width: number, height: number) {
    this.panelType = panelType;
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext('2d')!;

    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.minFilter = THREE.LinearMipmapLinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
    this.texture.generateMipmaps = true;

    this.material = new THREE.MeshBasicMaterial({
      map: this.texture,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
  }

  attachToMesh(mesh: THREE.Mesh) {
    this.mesh = mesh;
    this.mesh.material = this.material;
  }

  render(slideIdx: number, progress: number) {
    const slide = SIGNAGE_SLIDES[slideIdx];
    const w = this.canvas.width;
    const h = this.canvas.height;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, w, h);

    if (this.panelType === 'top-telemetry') {
      this.drawTopTelemetry(slide);
    } else if (this.panelType === 'card-01') {
      this.drawCard(slide.cards[0], engine.scrambledBadges[0], engine.scrambledTitles[0], true);
    } else if (this.panelType === 'card-02') {
      this.drawCard(slide.cards[1], engine.scrambledBadges[1], engine.scrambledTitles[1], false);
    } else if (this.panelType === 'card-03') {
      this.drawCard(slide.cards[2], engine.scrambledBadges[2], engine.scrambledTitles[2], true);
    } else if (this.panelType === 'card-04') {
      this.drawCard(slide.cards[3], engine.scrambledBadges[3], engine.scrambledTitles[3], false);
    } else if (this.panelType === 'bottom-nav') {
      this.drawBottomNav(slideIdx, progress);
    } else if (this.panelType === 'btn-prev') {
      this.drawButton('◄ PREV');
    } else if (this.panelType === 'btn-next') {
      this.drawButton('NEXT ►');
    } else if (this.panelType === 'btn-autoplay') {
      this.drawAutoplayBadge(engine.autoplay);
    }

    this.texture.needsUpdate = true;
  }

  // 1. TOP TELEMETRY RIBBON
  private drawTopTelemetry(slide: SignageSlideData) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Dark glass background
    ctx.fillStyle = 'rgba(6, 5, 3, 0.92)';
    ctx.fillRect(0, 0, w, h);

    // Metallic Gold Top/Bottom Borders
    const borderGrad = ctx.createLinearGradient(0, 0, w, 0);
    borderGrad.addColorStop(0.0, 'transparent');
    borderGrad.addColorStop(0.15, '#FDE047');
    borderGrad.addColorStop(0.5, '#E5B84B');
    borderGrad.addColorStop(0.85, '#FDE047');
    borderGrad.addColorStop(1.0, 'transparent');

    ctx.strokeStyle = borderGrad;
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 2, w, h - 4);

    // Left Amber Status Block
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(30, 30, 8, h - 60);

    // Pulsing indicator dot
    ctx.fillStyle = '#FDE047';
    ctx.beginPath();
    ctx.arc(68, h / 2, 10, 0, Math.PI * 2);
    ctx.fill();

    // Sector Text
    ctx.fillStyle = '#FDE047';
    ctx.font = '800 36px "Orbitron", monospace';
    ctx.fillText(engine.scrambledSector || slide.sector, 95, h / 2 + 12);

    // LED RPM Bars
    const rpmStartX = 490;
    for (let i = 0; i < 9; i++) {
      ctx.fillStyle = i < 6 ? '#F59E0B' : (i < 8 ? '#FDE047' : '#FFFFFF');
      ctx.fillRect(rpmStartX + i * 20, h / 2 - 14, 13, 28);
    }

    // Right Status Metric Pill
    const pillW = 440;
    const pillH = 76;
    const pillX = w - pillW - 40;
    const pillY = (h - pillH) / 2;

    ctx.fillStyle = 'rgba(23, 18, 10, 0.95)';
    ctx.strokeStyle = '#E5B84B';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(253, 224, 71, 0.75)';
    ctx.font = '700 20px "Chakra Petch", sans-serif';
    ctx.fillText('SECTOR STATUS', pillX + 24, pillY + 46);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 28px "Orbitron", sans-serif';
    ctx.fillText(engine.scrambledMetric || slide.metric, pillX + 210, pillY + 48);
  }

  // 2. CARD (01 - 04)
  private drawCard(card: SignageCardData, scrBadge: string, scrTitle: string, chevron: boolean) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Obsidian Luxury Gradient Background
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0.0, 'rgba(22, 17, 9, 0.96)');
    bg.addColorStop(0.5, 'rgba(10, 8, 4, 0.94)');
    bg.addColorStop(1.0, 'rgba(30, 24, 11, 0.96)');
    ctx.fillStyle = bg;

    // 45° Chamfered Corners
    const c = 32;
    ctx.beginPath();
    ctx.moveTo(c, 0);
    ctx.lineTo(w - c, 0);
    ctx.lineTo(w, c);
    ctx.lineTo(w, h - c);
    ctx.lineTo(w - c, h);
    ctx.lineTo(c, h);
    ctx.lineTo(0, h - c);
    ctx.lineTo(0, c);
    ctx.closePath();
    ctx.fill();

    // Metallic Gold Border
    const goldStroke = ctx.createLinearGradient(0, 0, w, h);
    goldStroke.addColorStop(0.0, '#FFFBE0');
    goldStroke.addColorStop(0.28, '#E5B84B');
    goldStroke.addColorStop(0.55, '#8C640F');
    goldStroke.addColorStop(0.82, '#FFE484');
    goldStroke.addColorStop(1.0, '#FFF9D6');
    ctx.strokeStyle = goldStroke;
    ctx.lineWidth = 4;
    ctx.stroke();

    // Gold Corner Brackets
    ctx.strokeStyle = '#FDE047';
    ctx.lineWidth = 3.5;
    const bl = 28;
    // Top-Left
    ctx.beginPath(); ctx.moveTo(18, 18 + bl); ctx.lineTo(18, 18); ctx.lineTo(18 + bl, 18); ctx.stroke();
    // Top-Right
    ctx.beginPath(); ctx.moveTo(w - 18 - bl, 18); ctx.lineTo(w - 18, 18); ctx.lineTo(w - 18, 18 + bl); ctx.stroke();
    // Bottom-Left
    ctx.beginPath(); ctx.moveTo(18, h - 18 - bl); ctx.lineTo(18, h - 18); ctx.lineTo(18 + bl, h - 18); ctx.stroke();
    // Bottom-Right
    ctx.beginPath(); ctx.moveTo(w - 18 - bl, h - 18); ctx.lineTo(w - 18, h - 18); ctx.lineTo(w - 18, h - 18 - bl); ctx.stroke();

    // Top Badge Pill
    const badgeW = 440;
    const badgeH = 54;
    ctx.fillStyle = 'rgba(229, 184, 75, 0.2)';
    ctx.strokeStyle = '#E5B84B';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(45, 45, badgeW, badgeH, 6);
    ctx.fill();
    ctx.stroke();

    // Diamond Icon
    ctx.save();
    ctx.translate(70, 72);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = '#FDE047';
    ctx.fillRect(-7, -7, 14, 14);
    ctx.restore();

    // Badge Text
    ctx.fillStyle = '#FDE047';
    ctx.font = '800 22px "Chakra Petch", monospace';
    ctx.fillText(scrBadge || card.badge, 95, 80);

    // Right Indicator Icon
    if (chevron) {
      ctx.fillStyle = '#FDE047';
      ctx.font = '900 32px "Orbitron", sans-serif';
      ctx.fillText('»»»', w - 120, 82);
    } else {
      ctx.fillStyle = '#FDE047';
      ctx.font = '900 28px sans-serif';
      ctx.fillText('◢', w - 80, 82);
    }

    // Main Card Title (Big Metallic Gold PBR Title)
    const titleGrad = ctx.createLinearGradient(45, 170, w - 45, 230);
    titleGrad.addColorStop(0.0, '#FFFFFF');
    titleGrad.addColorStop(0.3, '#FFF3C4');
    titleGrad.addColorStop(0.6, '#E5B84B');
    titleGrad.addColorStop(1.0, '#92620A');
    ctx.fillStyle = titleGrad;
    ctx.font = '900 48px "Orbitron", sans-serif';
    ctx.fillText(scrTitle || card.title, 45, 210);

    // Accent Bar & Subtitle
    ctx.fillStyle = '#E5B84B';
    ctx.fillRect(45, 255, 6, 40);

    ctx.fillStyle = '#FFF8E1';
    ctx.font = '700 22px "Chakra Petch", sans-serif';
    ctx.fillText(card.sub, 65, 283);
  }

  // 3. BOTTOM NAVIGATION DECK PANEL
  private drawBottomNav(slideIdx: number, progress: number) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Dark Navigation Deck Body
    ctx.fillStyle = 'rgba(6, 5, 3, 0.94)';
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, 20);
    ctx.fill();

    // Metallic Gold Border
    ctx.strokeStyle = '#E5B84B';
    ctx.lineWidth = 3;
    ctx.stroke();

    // PREV BUTTON (Left)
    ctx.fillStyle = 'rgba(229, 184, 75, 0.22)';
    ctx.strokeStyle = '#E5B84B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(40, 45, 210, 85, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 28px "Orbitron", sans-serif';
    ctx.fillText('◄ PREV', 85, 98);

    // AUTOPLAY READOUT & SLIDE COUNTER (Center Top)
    ctx.fillStyle = engine.autoplay ? '#34D399' : '#F59E0B';
    ctx.beginPath();
    ctx.arc(430, 56, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FDE047';
    ctx.font = '700 20px "Chakra Petch", monospace';
    ctx.fillText(engine.autoplay ? 'AUTOPLAY: ON' : 'AUTOPLAY: PAUSED', 450, 63);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 22px "Orbitron", monospace';
    ctx.fillText(`0${slideIdx + 1} / 06`, 1080, 63);

    // TACHOMETER PROGRESS BAR TRACK (Center Middle)
    const trackX = 420;
    const trackY = 82;
    const trackW = 750;
    const trackH = 16;

    ctx.fillStyle = 'rgba(40, 25, 10, 0.9)';
    ctx.strokeStyle = 'rgba(229, 184, 75, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(trackX, trackY, trackW, trackH, 8);
    ctx.fill();
    ctx.stroke();

    // Filled Progress Bar
    const fillW = Math.max(0, trackW * progress);
    if (fillW > 0) {
      const fillGrad = ctx.createLinearGradient(trackX, 0, trackX + fillW, 0);
      fillGrad.addColorStop(0.0, '#E5B84B');
      fillGrad.addColorStop(0.7, '#FDE047');
      fillGrad.addColorStop(1.0, '#FFFFFF');
      ctx.fillStyle = fillGrad;
      ctx.beginPath();
      ctx.roundRect(trackX, trackY, fillW, trackH, 8);
      ctx.fill();
    }

    // 6 QUICK SECTOR DOTS (Center Bottom)
    const dotSpacing = 70;
    const dotsStartX = 620;
    const dotsY = 135;

    for (let i = 0; i < 6; i++) {
      const isCurrent = i === slideIdx;
      const dotX = dotsStartX + i * dotSpacing;

      ctx.fillStyle = isCurrent ? '#FDE047' : 'rgba(229, 184, 75, 0.35)';
      ctx.beginPath();
      ctx.arc(dotX, dotsY, isCurrent ? 11 : 6, 0, Math.PI * 2);
      ctx.fill();

      if (isCurrent) {
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }
    }

    // NEXT BUTTON (Right)
    ctx.fillStyle = 'rgba(229, 184, 75, 0.22)';
    ctx.strokeStyle = '#E5B84B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(w - 250, 45, 210, 85, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 28px "Orbitron", sans-serif';
    ctx.fillText('NEXT ►', w - 200, 98);
  }

  // 4. SUB-BUTTONS
  private drawButton(label: string) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.fillStyle = 'rgba(22, 17, 9, 0.92)';
    ctx.strokeStyle = '#E5B84B';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(4, 4, w - 8, h - 8, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FDE047';
    ctx.font = '900 32px "Orbitron", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, w / 2, h / 2 + 10);
    ctx.textAlign = 'left';
  }

  private drawAutoplayBadge(active: boolean) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.fillStyle = 'rgba(10, 8, 4, 0.9)';
    ctx.strokeStyle = active ? '#34D399' : '#F59E0B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(4, 4, w - 8, h - 8, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = active ? '#34D399' : '#F59E0B';
    ctx.font = '700 24px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(active ? 'AUTOPLAY: ON' : 'AUTOPLAY: PAUSED', w / 2, h / 2 + 8);
    ctx.textAlign = 'left';
  }
}

// -----------------------------------------------------------------------------
// REGISTER 8TH WALL STUDIO ECS COMPONENT
// -----------------------------------------------------------------------------
ecs.registerComponent({
  name: 'world-canvas-signage',
  schema: {
    panelType: ecs.string,
    slideDuration: ecs.f32,
    uiAmp: ecs.f32,
  },
  schemaDefaults: {
    panelType: 'card-01',
    slideDuration: 7.0,
    uiAmp: 1.4,
  },
  add: (world, component) => {
    const panelType = component.schema.panelType || 'card-01';
    console.log(`[8th Wall Studio ECS] world-canvas-signage adding panel: ${panelType}`);

    // Create high-DPI texture renderer based on panel type
    let renderer: PanelRenderer;
    if (panelType === 'top-telemetry') {
      renderer = new PanelRenderer(panelType, 1600, 260);
    } else if (panelType === 'bottom-nav') {
      renderer = new PanelRenderer(panelType, 1600, 200);
    } else if (panelType === 'btn-prev' || panelType === 'btn-next') {
      renderer = new PanelRenderer(panelType, 400, 160);
    } else if (panelType === 'btn-autoplay' || panelType === 'sector-dots') {
      renderer = new PanelRenderer(panelType, 600, 160);
    } else {
      // Cards 01 - 04
      renderer = new PanelRenderer(panelType, 1024, 560);
    }

    // Attach to Three.js Object3D created by 8th Wall Studio
    const obj = world.three?.entityToObject?.get(component.eid) as THREE.Mesh;
    if (obj) {
      renderer.attachToMesh(obj);
    }

    engine.registerPanel(panelType, renderer);
    engine.setupGlobalRaycasting(world);

    // Also support ECS direct click event if available
    try {
      world.events.addListener(component.eid, 'click', () => {
        if (panelType.startsWith('card-')) {
          engine.goToSlide(engine.currentSlide + 1);
        } else if (panelType === 'btn-prev') {
          engine.goToSlide(engine.currentSlide - 1);
        } else if (panelType === 'btn-next') {
          engine.goToSlide(engine.currentSlide + 1);
        } else if (panelType === 'btn-autoplay') {
          engine.toggleAutoplay();
        }
      });
    } catch (_) {}
  },
  remove: (_world, component) => {
    engine.unregisterPanel(component.schema.panelType);
  },
  tick: (_world, component) => {
    // Only master ticks the clock to avoid duplicate progression
    if (component.schema.panelType === 'top-telemetry' || component.schema.panelType === 'bottom-nav') {
      engine.tick(1 / 60);
    }
  },
});
