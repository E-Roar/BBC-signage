import * as THREE from 'three';
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { appState, notifyStateChange, SIGNAGE_SLIDES } from './state';
import { Braven3DScene } from './braven-3d-scene';

export class WorldCanvasSignage {
  private bravenScene: Braven3DScene;
  private signageRoot: THREE.Group;

  // 3D World Space Meshes (Matched to 8th Wall Studio Scene Hierarchy)
  private topMesh: THREE.Mesh;
  private card0Mesh: THREE.Mesh;
  private card1Mesh: THREE.Mesh;
  private card2Mesh: THREE.Mesh;
  private card3Mesh: THREE.Mesh;
  private bottomMesh: THREE.Mesh;

  // Offscreen Canvas & Textures for WebGL fallback/depth
  private topCanvas: HTMLCanvasElement;
  private topCtx: CanvasRenderingContext2D;
  private topTex: THREE.CanvasTexture;

  private card0Canvas: HTMLCanvasElement;
  private card0Ctx: CanvasRenderingContext2D;
  private card0Tex: THREE.CanvasTexture;

  private card1Canvas: HTMLCanvasElement;
  private card1Ctx: CanvasRenderingContext2D;
  private card1Tex: THREE.CanvasTexture;

  private card2Canvas: HTMLCanvasElement;
  private card2Ctx: CanvasRenderingContext2D;
  private card2Tex: THREE.CanvasTexture;

  private card3Canvas: HTMLCanvasElement;
  private card3Ctx: CanvasRenderingContext2D;
  private card3Tex: THREE.CanvasTexture;

  private bottomCanvas: HTMLCanvasElement;
  private bottomCtx: CanvasRenderingContext2D;
  private bottomTex: THREE.CanvasTexture;

  // 3D HTML5 CSS3D Interactive DOM Layer
  private cssRenderer: CSS3DRenderer;
  private cssScene: THREE.Scene;
  private cssAnchorGroup: THREE.Group;

  // DOM Elements inside 3D CSS Objects
  private domTopSector: HTMLElement | null = null;
  private domMetricText: HTMLElement | null = null;
  private domCardTitles: (HTMLElement | null)[] = [null, null, null, null];
  private domCardBadges: (HTMLElement | null)[] = [null, null, null, null];
  private domCardSubs: (HTMLElement | null)[] = [null, null, null, null];
  private domAutoplayDot: HTMLElement | null = null;
  private domAutoplayLabel: HTMLElement | null = null;
  private domSlideCounter: HTMLElement | null = null;
  private domProgressBar: HTMLElement | null = null;
  private domDotsRow: HTMLElement | null = null;

  // Transition & Animation state
  private elapsedSlideTime = 0;
  private speedSlashAlpha = 0;
  private scrambledSector = '';
  private scrambledMetric = '';
  private scrambledCardTitles = ['', '', '', ''];
  private scrambledCardBadges = ['', '', '', ''];

  // Card Hover Springs
  private cardHovers = [
    { active: false, rotX: 0, rotY: 0, scale: 1 },
    { active: false, rotX: 0, rotY: 0, scale: 1 },
    { active: false, rotX: 0, rotY: 0, scale: 1 },
    { active: false, rotX: 0, rotY: 0, scale: 1 },
  ];

  constructor(bravenScene: Braven3DScene) {
    this.bravenScene = bravenScene;
    this.signageRoot = new THREE.Group();
    this.signageRoot.name = "WorldCanvasSignage";
    this.bravenScene.markerAnchorGroup.add(this.signageRoot);

    // 1. Initialize High-DPI Canvases for 3D Meshes
    const t = this.createCanvas(1400, 260);
    this.topCanvas = t.canvas; this.topCtx = t.ctx; this.topTex = t.tex;

    const c0 = this.createCanvas(1024, 560);
    this.card0Canvas = c0.canvas; this.card0Ctx = c0.ctx; this.card0Tex = c0.tex;

    const c1 = this.createCanvas(1024, 560);
    this.card1Canvas = c1.canvas; this.card1Ctx = c1.ctx; this.card1Tex = c1.tex;

    const c2 = this.createCanvas(1024, 560);
    this.card2Canvas = c2.canvas; this.card2Ctx = c2.ctx; this.card2Tex = c2.tex;

    const c3 = this.createCanvas(1024, 560);
    this.card3Canvas = c3.canvas; this.card3Ctx = c3.ctx; this.card3Tex = c3.tex;

    const b = this.createCanvas(1600, 260);
    this.bottomCanvas = b.canvas; this.bottomCtx = b.ctx; this.bottomTex = b.tex;

    // 2. Build 3D World Space Meshes (Exact 8th Wall Studio Positioning)
    const planeMat = (tex: THREE.Texture) => new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    // Top Telemetry Ribbon Panel (6.4 x 1.15)
    this.topMesh = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 1.15), planeMat(this.topTex));
    this.topMesh.position.set(0, 3.4, 0.3);
    this.topMesh.name = "TopTelemetryRibbonMesh";
    this.signageRoot.add(this.topMesh);

    // Left Column: Card 01 (Executive Suites) - angled 13° inward
    this.card0Mesh = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 2.0), planeMat(this.card0Tex));
    this.card0Mesh.position.set(-4.5, 1.15, 0.2);
    this.card0Mesh.rotation.y = THREE.MathUtils.degToRad(13);
    this.card0Mesh.name = "Card01Mesh";
    this.signageRoot.add(this.card0Mesh);

    // Left Column: Card 02 (Security & Access) - angled 13° inward
    this.card1Mesh = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 2.0), planeMat(this.card1Tex));
    this.card1Mesh.position.set(-4.5, -1.05, 0.2);
    this.card1Mesh.rotation.y = THREE.MathUtils.degToRad(13);
    this.card1Mesh.name = "Card02Mesh";
    this.signageRoot.add(this.card1Mesh);

    // Right Column: Card 03 (Architecture) - angled -13° inward
    this.card2Mesh = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 2.0), planeMat(this.card2Tex));
    this.card2Mesh.position.set(4.5, 1.15, 0.2);
    this.card2Mesh.rotation.y = THREE.MathUtils.degToRad(-13);
    this.card2Mesh.name = "Card03Mesh";
    this.signageRoot.add(this.card2Mesh);

    // Right Column: Card 04 (Instant Deployment) - angled -13° inward
    this.card3Mesh = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 2.0), planeMat(this.card3Tex));
    this.card3Mesh.position.set(4.5, -1.05, 0.2);
    this.card3Mesh.rotation.y = THREE.MathUtils.degToRad(-13);
    this.card3Mesh.name = "Card04Mesh";
    this.signageRoot.add(this.card3Mesh);

    // Bottom Navigation Deck Panel (7.2 x 1.15)
    this.bottomMesh = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 1.15), planeMat(this.bottomTex));
    this.bottomMesh.position.set(0, -3.3, 0.3);
    this.bottomMesh.name = "BottomNavigationDeckMesh";
    this.signageRoot.add(this.bottomMesh);

    // 3. Initialize Interactive CSS3D HTML5 DOM Layer in 3D World Space
    this.cssRenderer = new CSS3DRenderer();
    const w = this.bravenScene.container.clientWidth || window.innerWidth;
    const h = this.bravenScene.container.clientHeight || window.innerHeight;
    this.cssRenderer.setSize(w, h);
    this.cssRenderer.domElement.style.position = 'absolute';
    this.cssRenderer.domElement.style.top = '0';
    this.cssRenderer.domElement.style.left = '0';
    this.cssRenderer.domElement.style.width = '100%';
    this.cssRenderer.domElement.style.height = '100%';
    this.cssRenderer.domElement.style.pointerEvents = 'none';
    this.cssRenderer.domElement.style.overflow = 'hidden';
    this.cssRenderer.domElement.style.zIndex = '10';
    this.bravenScene.container.appendChild(this.cssRenderer.domElement);

    this.cssScene = new THREE.Scene();
    this.cssAnchorGroup = new THREE.Group();
    this.cssScene.add(this.cssAnchorGroup);

    this.buildHTML3DPanels();

    // Initial render
    this.updateScrambledTexts(appState.currentSlide, true);
    this.renderAllCanvases();
  }

  private createCanvas(w: number, h: number) {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = this.bravenScene.renderer.capabilities.getMaxAnisotropy() || 8;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = true;
    return { canvas, ctx, tex };
  }

  // ---------------------------------------------------------------------------
  // Build Native HTML5 DOM Elements inside 3D CSS Objects from index.original.html
  // ---------------------------------------------------------------------------
  private buildHTML3DPanels() {
    const scaleFactor = 0.009; // Scales CSS pixel widths (e.g. 400px) to Three.js world units (~3.6)

    // A. Top Telemetry Status Ribbon (HTML5 from lines 582-614 of index.original.html)
    const topDiv = document.createElement('div');
    topDiv.style.width = '710px';
    topDiv.style.pointerEvents = 'auto';
    topDiv.className = 'w-full flex items-center justify-between gap-4 p-2';
    topDiv.innerHTML = `
      <div class="flex items-center gap-3 px-4 py-2 bg-black/85 border-l-4 border-amber-400 backdrop-blur-md racing-skew-left shadow-lg">
        <div class="racing-unskew-left flex items-center gap-3">
          <span class="inline-block w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_12px_#fbbf24] animate-ping"></span>
          <span id="signage-top-sector" class="font-racing-hud font-bold tracking-[0.22em] text-xs sm:text-sm text-amber-300 uppercase">
            SECTOR 01 // 06
          </span>
          <div class="h-3.5 w-[1px] bg-amber-500/40"></div>
          <div id="rpm-bars-container" class="flex items-center gap-1">
            <span class="w-2.5 h-3 bg-amber-400 shadow-[0_0_8px_#fbbf24]"></span>
            <span class="w-2.5 h-3 bg-amber-400 shadow-[0_0_8px_#fbbf24]"></span>
            <span class="w-2.5 h-3 bg-amber-400 shadow-[0_0_8px_#fbbf24]"></span>
            <span class="w-2.5 h-3 bg-amber-400 shadow-[0_0_8px_#fbbf24]"></span>
            <span class="w-2.5 h-3 bg-amber-400 shadow-[0_0_8px_#fbbf24]"></span>
            <span class="w-2.5 h-3 bg-amber-300 shadow-[0_0_10px_#fde047]"></span>
            <span class="w-2.5 h-3 bg-amber-200 shadow-[0_0_12px_#fef08a]"></span>
            <span class="w-2.5 h-3 bg-white shadow-[0_0_14px_#ffffff]"></span>
          </div>
        </div>
      </div>
      <div id="signage-metric-pill" class="ml-auto flex items-center gap-2.5 px-4 py-2 gold-pbr-panel racing-skew-left cursor-pointer">
        <div class="racing-unskew-left flex items-center gap-2.5 relative z-10">
          <span class="text-[11px] font-racing-hud uppercase tracking-[0.2em] text-amber-200/80">SECTOR STATUS</span>
          <span id="signage-metric-text" class="font-racing-title font-extrabold text-sm sm:text-base tracking-wider text-yellow-300 drop-shadow-[0_0_10px_rgba(253,224,71,0.8)]">
            READY IN 24H
          </span>
        </div>
      </div>
    `;
    const topCSS = new CSS3DObject(topDiv);
    topCSS.scale.setScalar(scaleFactor);
    topCSS.position.set(0, 3.4, 0.32);
    this.cssAnchorGroup.add(topCSS);

    this.domTopSector = topDiv.querySelector('#signage-top-sector');
    this.domMetricText = topDiv.querySelector('#signage-metric-text');

    // B. Left Column - Card 01 (Executive Suites)
    const card0Div = document.createElement('div');
    card0Div.style.width = '400px';
    card0Div.style.pointerEvents = 'auto';
    card0Div.className = 'gold-pbr-panel signage-sym-card racing-skew-left p-5 cursor-pointer cascade-in-left';
    card0Div.innerHTML = `
      <span class="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-yellow-300 opacity-85"></span>
      <span class="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-yellow-300 opacity-85"></span>
      <span class="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-yellow-300 opacity-85"></span>
      <span class="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-yellow-300 opacity-85"></span>
      <div class="racing-unskew-left relative z-10 flex flex-col h-full justify-between">
        <div class="flex items-center justify-between gap-2">
          <div class="inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/20 border border-yellow-400/60">
            <span class="w-2 h-2 bg-yellow-300 rotate-45 shadow-[0_0_8px_#fde047]"></span>
            <span id="card-badge-0" class="font-racing-hud font-bold text-xs tracking-[0.22em] text-yellow-200 uppercase">
              01 // EXECUTIVE SUITES
            </span>
          </div>
          <div class="flex items-center gap-0.5 text-yellow-300 font-racing-title text-sm font-black">
            <span class="animate-[nitroPulse_1s_infinite]">»</span>
            <span class="animate-[nitroPulse_1s_infinite_0.15s]">»</span>
            <span class="animate-[nitroPulse_1s_infinite_0.3s]">»</span>
          </div>
        </div>
        <h2 id="card-title-0" class="font-racing-title font-black uppercase tracking-tight leading-[1.05] text-xl pbr-gold-big-title my-2">
          TURNKEY LUXURY OFFICES
        </h2>
        <div class="flex items-center gap-3 pt-1">
          <div class="h-5 w-1.5 bg-gradient-to-b from-yellow-200 via-yellow-400 to-amber-600 shadow-[0_0_10px_#facc15]"></div>
          <p id="card-sub-0" class="font-racing-hud font-bold text-xs tracking-[0.14em] text-amber-50 uppercase">
            ZERO SETUP DELAY • FULL PRESTIGE
          </p>
        </div>
      </div>
    `;
    card0Div.addEventListener('click', () => this.goToSlide(appState.currentSlide + 1));
    const card0CSS = new CSS3DObject(card0Div);
    card0CSS.scale.setScalar(scaleFactor);
    card0CSS.position.set(-4.5, 1.15, 0.22);
    card0CSS.rotation.y = THREE.MathUtils.degToRad(13);
    this.cssAnchorGroup.add(card0CSS);

    this.domCardBadges[0] = card0Div.querySelector('#card-badge-0');
    this.domCardTitles[0] = card0Div.querySelector('#card-title-0');
    this.domCardSubs[0] = card0Div.querySelector('#card-sub-0');

    // C. Left Column - Card 02 (Security & Access)
    const card1Div = document.createElement('div');
    card1Div.style.width = '400px';
    card1Div.style.pointerEvents = 'auto';
    card1Div.className = 'gold-pbr-panel signage-sym-card racing-skew-left p-5 cursor-pointer cascade-in-left';
    card1Div.innerHTML = `
      <span class="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-yellow-300 opacity-85"></span>
      <span class="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-yellow-300 opacity-85"></span>
      <span class="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-yellow-300 opacity-85"></span>
      <span class="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-yellow-300 opacity-85"></span>
      <div class="racing-unskew-left relative z-10 flex flex-col h-full justify-between">
        <div class="flex items-center justify-between gap-2">
          <div class="inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/20 border border-yellow-400/60">
            <span class="w-2 h-2 bg-yellow-300 rotate-45 shadow-[0_0_8px_#fde047]"></span>
            <span id="card-badge-1" class="font-racing-hud font-bold text-xs tracking-[0.22em] text-yellow-200 uppercase">
              02 // SECURITY & ACCESS
            </span>
          </div>
          <span class="text-yellow-300 font-racing-title font-bold text-base">◢</span>
        </div>
        <h2 id="card-title-1" class="font-racing-title font-black uppercase tracking-tight leading-[1.05] text-xl pbr-gold-big-title my-2">
          24/7 BIOMETRIC ACCESS
        </h2>
        <div class="flex items-center gap-3 pt-1">
          <div class="h-5 w-1.5 bg-gradient-to-b from-yellow-200 via-yellow-400 to-amber-600 shadow-[0_0_10px_#facc15]"></div>
          <p id="card-sub-1" class="font-racing-hud font-bold text-xs tracking-[0.14em] text-amber-50 uppercase">
            PRIVATE VIP ELEVATOR & SECURITY
          </p>
        </div>
      </div>
    `;
    card1Div.addEventListener('click', () => this.goToSlide(appState.currentSlide + 1));
    const card1CSS = new CSS3DObject(card1Div);
    card1CSS.scale.setScalar(scaleFactor);
    card1CSS.position.set(-4.5, -1.05, 0.22);
    card1CSS.rotation.y = THREE.MathUtils.degToRad(13);
    this.cssAnchorGroup.add(card1CSS);

    this.domCardBadges[1] = card1Div.querySelector('#card-badge-1');
    this.domCardTitles[1] = card1Div.querySelector('#card-title-1');
    this.domCardSubs[1] = card1Div.querySelector('#card-sub-1');

    // D. Right Column - Card 03 (Architecture)
    const card2Div = document.createElement('div');
    card2Div.style.width = '400px';
    card2Div.style.pointerEvents = 'auto';
    card2Div.className = 'gold-pbr-panel signage-sym-card racing-skew-right p-5 cursor-pointer cascade-in-right';
    card2Div.innerHTML = `
      <span class="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-yellow-300 opacity-85"></span>
      <span class="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-yellow-300 opacity-85"></span>
      <span class="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-yellow-300 opacity-85"></span>
      <span class="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-yellow-300 opacity-85"></span>
      <div class="racing-unskew-right relative z-10 flex flex-col h-full justify-between">
        <div class="flex items-center justify-between gap-2">
          <div class="inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/20 border border-yellow-400/60">
            <span class="w-2 h-2 bg-yellow-300 rotate-45 shadow-[0_0_8px_#fde047]"></span>
            <span id="card-badge-2" class="font-racing-hud font-bold text-xs tracking-[0.22em] text-yellow-200 uppercase">
              03 // ARCHITECTURE
            </span>
          </div>
          <div class="flex items-center gap-0.5 text-yellow-300 font-racing-title text-sm font-black">
            <span class="animate-[nitroPulse_1s_infinite]">»</span>
            <span class="animate-[nitroPulse_1s_infinite_0.15s]">»</span>
            <span class="animate-[nitroPulse_1s_infinite_0.3s]">»</span>
          </div>
        </div>
        <h2 id="card-title-2" class="font-racing-title font-black uppercase tracking-tight leading-[1.05] text-xl pbr-gold-big-title my-2">
          PENTHOUSE SKYLINE VIEWS
        </h2>
        <div class="flex items-center gap-3 pt-1">
          <div class="h-5 w-1.5 bg-gradient-to-b from-yellow-200 via-yellow-400 to-amber-600 shadow-[0_0_10px_#facc15]"></div>
          <p id="card-sub-2" class="font-racing-hud font-bold text-xs tracking-[0.14em] text-amber-50 uppercase">
            FLOOR-TO-CEILING ACOUSTIC GLASS
          </p>
        </div>
      </div>
    `;
    card2Div.addEventListener('click', () => this.goToSlide(appState.currentSlide + 1));
    const card2CSS = new CSS3DObject(card2Div);
    card2CSS.scale.setScalar(scaleFactor);
    card2CSS.position.set(4.5, 1.15, 0.22);
    card2CSS.rotation.y = THREE.MathUtils.degToRad(-13);
    this.cssAnchorGroup.add(card2CSS);

    this.domCardBadges[2] = card2Div.querySelector('#card-badge-2');
    this.domCardTitles[2] = card2Div.querySelector('#card-title-2');
    this.domCardSubs[2] = card2Div.querySelector('#card-sub-2');

    // E. Right Column - Card 04 (Instant Deployment)
    const card3Div = document.createElement('div');
    card3Div.style.width = '400px';
    card3Div.style.pointerEvents = 'auto';
    card3Div.className = 'gold-pbr-panel signage-sym-card racing-skew-right p-5 cursor-pointer cascade-in-right';
    card3Div.innerHTML = `
      <span class="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-yellow-300 opacity-85"></span>
      <span class="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-yellow-300 opacity-85"></span>
      <span class="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-yellow-300 opacity-85"></span>
      <span class="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-yellow-300 opacity-85"></span>
      <div class="racing-unskew-right relative z-10 flex flex-col h-full justify-between">
        <div class="flex items-center justify-between gap-2">
          <div class="inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/20 border border-yellow-400/60">
            <span class="w-2 h-2 bg-yellow-300 rotate-45 shadow-[0_0_8px_#fde047]"></span>
            <span id="card-badge-3" class="font-racing-hud font-bold text-xs tracking-[0.22em] text-yellow-200 uppercase">
              04 // INSTANT DEPLOYMENT
            </span>
          </div>
          <span class="text-yellow-300 font-racing-title font-bold text-base">◢</span>
        </div>
        <h2 id="card-title-3" class="font-racing-title font-black uppercase tracking-tight leading-[1.05] text-xl pbr-gold-big-title my-2">
          100% MOVE-IN READY
        </h2>
        <div class="flex items-center gap-3 pt-1">
          <div class="h-5 w-1.5 bg-gradient-to-b from-yellow-200 via-yellow-400 to-amber-600 shadow-[0_0_10px_#facc15]"></div>
          <p id="card-sub-3" class="font-racing-hud font-bold text-xs tracking-[0.14em] text-amber-50 uppercase">
            BESPOKE EXECUTIVE FURNITURE
          </p>
        </div>
      </div>
    `;
    card3Div.addEventListener('click', () => this.goToSlide(appState.currentSlide + 1));
    const card3CSS = new CSS3DObject(card3Div);
    card3CSS.scale.setScalar(scaleFactor);
    card3CSS.position.set(4.5, -1.05, 0.22);
    card3CSS.rotation.y = THREE.MathUtils.degToRad(-13);
    this.cssAnchorGroup.add(card3CSS);

    this.domCardBadges[3] = card3Div.querySelector('#card-badge-3');
    this.domCardTitles[3] = card3Div.querySelector('#card-title-3');
    this.domCardSubs[3] = card3Div.querySelector('#card-sub-3');

    // F. Bottom Navigation Deck Panel (Lines 758-790 of index.original.html)
    const bottomDiv = document.createElement('div');
    bottomDiv.style.width = '800px';
    bottomDiv.style.pointerEvents = 'auto';
    bottomDiv.className = 'flex items-center justify-center gap-4 px-6 py-3 bg-black/90 border border-amber-500/50 backdrop-blur-xl shadow-[0_10px_35px_rgba(0,0,0,0.95)]';
    bottomDiv.innerHTML = `
      <!-- PREV BUTTON -->
      <button id="btn-prev-slide" type="button" class="gold-nav-btn px-6 py-2.5 text-amber-200 font-racing-title font-black text-xs tracking-[0.2em] uppercase">
        <span class="inline-block skew-x-[14deg]">◄ PREV</span>
      </button>

      <!-- CENTER SLIDE DOTS + AUTOPLAY TACHOMETER BAR -->
      <div class="flex flex-col items-center gap-1.5 min-w-[260px]">
        <div class="w-full flex items-center justify-between text-[11px] font-racing-hud tracking-[0.2em] text-amber-300/90 uppercase">
          <button id="btn-toggle-autoplay" type="button" class="flex items-center gap-1.5 hover:text-white transition cursor-pointer">
            <span id="autoplay-dot" class="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]"></span>
            <span id="autoplay-label">AUTOPLAY: ON</span>
          </button>
          <span id="slide-counter-readout" class="font-bold text-amber-200">01 / 06</span>
        </div>

        <!-- Progress Track -->
        <div class="w-full h-2.5 bg-amber-950/80 border border-amber-500/40 overflow-hidden p-[1px] rounded-full">
          <div id="autoplay-progress-bar" class="h-full bg-gradient-to-r from-amber-500 via-yellow-300 to-white shadow-[0_0_12px_#fde047] transition-none rounded-full" style="width: 0%;"></div>
        </div>

        <!-- 6 Quick Sector Indicators -->
        <div id="slide-dots-row" class="flex items-center gap-2 pt-1"></div>
      </div>

      <!-- NEXT BUTTON -->
      <button id="btn-next-slide" type="button" class="gold-nav-btn px-6 py-2.5 text-amber-200 font-racing-title font-black text-xs tracking-[0.2em] uppercase">
        <span class="inline-block skew-x-[14deg]">NEXT ►</span>
      </button>
    `;

    // Connect Nav Button Clicks
    const btnPrev = bottomDiv.querySelector('#btn-prev-slide');
    const btnNext = bottomDiv.querySelector('#btn-next-slide');
    const btnAutoplay = bottomDiv.querySelector('#btn-toggle-autoplay');
    this.domAutoplayDot = bottomDiv.querySelector('#autoplay-dot');
    this.domAutoplayLabel = bottomDiv.querySelector('#autoplay-label');
    this.domSlideCounter = bottomDiv.querySelector('#slide-counter-readout');
    this.domProgressBar = bottomDiv.querySelector('#autoplay-progress-bar');
    this.domDotsRow = bottomDiv.querySelector('#slide-dots-row');

    btnPrev?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.goToSlide(appState.currentSlide - 1);
    });

    btnNext?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.goToSlide(appState.currentSlide + 1);
    });

    btnAutoplay?.addEventListener('click', (e) => {
      e.stopPropagation();
      appState.autoplay = !appState.autoplay;
      notifyStateChange();
    });

    this.renderSectorDots();

    const bottomCSS = new CSS3DObject(bottomDiv);
    bottomCSS.scale.setScalar(scaleFactor);
    bottomCSS.position.set(0, -3.3, 0.32);
    this.cssAnchorGroup.add(bottomCSS);

    // Direct 3D Mesh Interaction via Raycasting
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let downX = 0;
    let downY = 0;

    this.bravenScene.renderer.domElement.addEventListener('pointerdown', (e) => {
      downX = e.clientX;
      downY = e.clientY;
    });

    this.bravenScene.renderer.domElement.addEventListener('pointerup', (e) => {
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 8) return; // Orbit drag ignored

      const rect = this.bravenScene.renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, this.bravenScene.camera);
      const meshes = [this.topMesh, this.card0Mesh, this.card1Mesh, this.card2Mesh, this.card3Mesh, this.bottomMesh];
      const hits = raycaster.intersectObjects(meshes, false);

      if (hits.length > 0) {
        const hit = hits[0];
        if (hit.object === this.bottomMesh && hit.uv) {
          const u = hit.uv.x;
          const v = hit.uv.y;
          if (u < 0.22) {
            this.goToSlide(appState.currentSlide - 1);
          } else if (u > 0.78) {
            this.goToSlide(appState.currentSlide + 1);
          } else if (u >= 0.25 && u <= 0.75 && v > 0.55) {
            appState.autoplay = !appState.autoplay;
            notifyStateChange();
          } else if (u >= 0.30 && u <= 0.70 && v <= 0.45) {
            const dotFrac = (u - 0.30) / 0.40;
            const dotIdx = Math.floor(dotFrac * 6);
            if (dotIdx >= 0 && dotIdx < 6) {
              this.goToSlide(dotIdx);
            }
          }
        } else if (
          hit.object === this.card0Mesh ||
          hit.object === this.card1Mesh ||
          hit.object === this.card2Mesh ||
          hit.object === this.card3Mesh
        ) {
          this.goToSlide(appState.currentSlide + 1);
        }
      }
    });
  }

  private renderSectorDots() {
    if (!this.domDotsRow) return;
    this.domDotsRow.innerHTML = '';
    for (let i = 0; i < 6; i++) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = `w-3 h-3 rounded-full transition-all duration-300 cursor-pointer ${
        i === appState.currentSlide
          ? 'bg-yellow-300 scale-125 shadow-[0_0_10px_#fde047]'
          : 'bg-amber-600/40 hover:bg-yellow-400/60'
      }`;
      dot.title = `Jump to Sector 0${i + 1}`;
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        this.goToSlide(i);
      });
      this.domDotsRow.appendChild(dot);
    }
  }

  // ---------------------------------------------------------------------------
  // Playable Slideshow Controller with Scramble Text & Cascade Animations
  // ---------------------------------------------------------------------------
  goToSlide(idx: number) {
    if (appState.isTransitioning) return;
    appState.isTransitioning = true;
    this.elapsedSlideTime = 0;

    const normalized = (idx + SIGNAGE_SLIDES.length) % SIGNAGE_SLIDES.length;
    appState.currentSlide = normalized;
    const slide = SIGNAGE_SLIDES[normalized];

    // Nitro burst & Speed Slash
    appState.nitroSpinBoost = 3.6;
    appState.choreoPose = { ...slide.choreo };
    this.speedSlashAlpha = 1.0;

    // Trigger Matrix Cipher Scramble on 3D HTML Panels & Canvas
    this.scrambleDOMText(this.domTopSector, slide.sector, 280);
    this.scrambleDOMText(this.domMetricText, slide.metric, 300);

    for (let i = 0; i < 4; i++) {
      const c = slide.cards[i];
      this.scrambleDOMText(this.domCardBadges[i], c.badge, 220);
      this.scrambleDOMText(this.domCardTitles[i], c.title, 280);
      if (this.domCardSubs[i]) this.domCardSubs[i]!.textContent = c.sub;
    }

    if (this.domSlideCounter) {
      this.domSlideCounter.textContent = `0${normalized + 1} / 06`;
    }
    this.renderSectorDots();

    this.updateScrambledTexts(normalized);
    this.renderAllCanvases();
    notifyStateChange();

    setTimeout(() => {
      appState.isTransitioning = false;
      this.updateScrambledTexts(normalized, true);
      this.renderAllCanvases();
      notifyStateChange();
    }, 320);
  }

  private scrambleDOMText(el: HTMLElement | null, targetText: string, durationMs: number) {
    if (!el) return;
    const glyphs = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ//⚡';
    const original = targetText;
    const startTime = performance.now();

    const interval = setInterval(() => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / durationMs, 1.0);
      const charsSolved = Math.floor(progress * original.length);

      let str = '';
      for (let i = 0; i < original.length; i++) {
        if (original[i] === ' ') {
          str += ' ';
        } else if (i < charsSolved) {
          str += original[i];
        } else {
          str += glyphs[Math.floor(Math.random() * glyphs.length)];
        }
      }
      el.textContent = str;

      if (progress >= 1.0) {
        clearInterval(interval);
        el.textContent = original;
      }
    }, 28);
  }

  private updateScrambledTexts(slideIdx: number, done = false) {
    const slide = SIGNAGE_SLIDES[slideIdx];
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ//⚡';
    const scramble = (str: string) => {
      if (done) return str;
      return str.split('').map(ch => (ch === ' ' ? ' ' : (Math.random() > 0.4 ? chars[Math.floor(Math.random() * chars.length)] : ch))).join('');
    };

    this.scrambledSector = scramble(slide.sector);
    this.scrambledMetric = scramble(slide.metric);
    this.scrambledCardBadges = slide.cards.map(c => scramble(c.badge));
    this.scrambledCardTitles = slide.cards.map(c => scramble(c.title));
  }

  // ---------------------------------------------------------------------------
  // Canvas Rendering Logic for 3D Mesh Textures
  // ---------------------------------------------------------------------------
  private drawIndividualCard(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    badge: string,
    title: string,
    sub: string,
    nitro: boolean
  ) {
    ctx.clearRect(0, 0, w, h);

    // Dark Obsidian Card Background
    const cardGrad = ctx.createLinearGradient(0, 0, w, h);
    cardGrad.addColorStop(0.0, 'rgba(24, 19, 11, 0.94)');
    cardGrad.addColorStop(0.5, 'rgba(10, 8, 5, 0.92)');
    cardGrad.addColorStop(1.0, 'rgba(32, 26, 12, 0.94)');
    ctx.fillStyle = cardGrad;

    // Chamfered 45° Racing Corner Path
    const c = 26;
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

    // Metallic Gold PBR Stroke Border
    const borderGrad = ctx.createLinearGradient(0, 0, w, h);
    borderGrad.addColorStop(0.0, '#FFFBE0');
    borderGrad.addColorStop(0.28, '#E5B842');
    borderGrad.addColorStop(0.52, '#8C640F');
    borderGrad.addColorStop(0.78, '#FFE484');
    borderGrad.addColorStop(1.0, '#FFF9D6');
    ctx.strokeStyle = borderGrad;
    ctx.lineWidth = 4;
    ctx.stroke();

    // Badge Pill
    ctx.fillStyle = 'rgba(229, 184, 66, 0.18)';
    ctx.strokeStyle = '#E5B842';
    ctx.lineWidth = 2;
    const bW = 380;
    const bH = 46;
    ctx.beginPath();
    ctx.roundRect(40, 40, bW, bH, 8);
    ctx.fill();
    ctx.stroke();

    // Badge Status LED
    ctx.fillStyle = '#34D399';
    ctx.beginPath();
    ctx.arc(62, 40 + bH / 2, 6, 0, Math.PI * 2);
    ctx.fill();

    // Badge Text
    ctx.font = '700 20px "Chakra Petch", "Rajdhani", sans-serif';
    ctx.fillStyle = '#FDE047';
    ctx.fillText(badge, 84, 40 + 30);

    if (nitro) {
      ctx.fillStyle = '#FDE047';
      ctx.font = '900 24px "Orbitron", sans-serif';
      ctx.fillText('» » »', w - 100, 72);
    }

    // Main Card Title (3D Gold Typography)
    ctx.font = '900 36px "Orbitron", "Chakra Petch", sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(235, 190, 70, 0.45)';
    ctx.shadowBlur = 14;
    ctx.fillText(title, 40, 160);
    ctx.shadowBlur = 0;

    // Subtitle Text
    ctx.font = '600 20px "Inter", sans-serif';
    ctx.fillStyle = '#E5B84B';
    ctx.fillText(sub, 40, 220);

    // Racing Telemetry Grid Accent at Bottom
    ctx.fillStyle = 'rgba(229, 184, 66, 0.55)';
    ctx.font = '700 15px "Courier New", monospace';
    ctx.fillText('STATUS // OPTIMAL • 99.8% READY', 40, h - 36);
  }

  renderCardCanvases() {
    const slide = SIGNAGE_SLIDES[appState.currentSlide];
    const w = 1024;
    const h = 560;

    // Card 01
    this.drawIndividualCard(this.card0Ctx, w, h, this.scrambledCardBadges[0], this.scrambledCardTitles[0], slide.cards[0].sub, true);
    this.card0Tex.needsUpdate = true;

    // Card 02
    this.drawIndividualCard(this.card1Ctx, w, h, this.scrambledCardBadges[1], this.scrambledCardTitles[1], slide.cards[1].sub, false);
    this.card1Tex.needsUpdate = true;

    // Card 03
    this.drawIndividualCard(this.card2Ctx, w, h, this.scrambledCardBadges[2], this.scrambledCardTitles[2], slide.cards[2].sub, true);
    this.card2Tex.needsUpdate = true;

    // Card 04
    this.drawIndividualCard(this.card3Ctx, w, h, this.scrambledCardBadges[3], this.scrambledCardTitles[3], slide.cards[3].sub, false);
    this.card3Tex.needsUpdate = true;
  }

  renderTopCanvas() {
    const ctx = this.topCtx;
    const w = this.topCanvas.width;
    const h = this.topCanvas.height;
    ctx.clearRect(0, 0, w, h);

    // Top Chamfered Telemetry Banner
    ctx.fillStyle = 'rgba(16, 12, 7, 0.92)';
    ctx.beginPath();
    ctx.roundRect(40, 20, w - 80, h - 40, 20);
    ctx.fill();

    const borderGrad = ctx.createLinearGradient(0, 0, w, 0);
    borderGrad.addColorStop(0.0, '#E5B842');
    borderGrad.addColorStop(0.5, '#FFF9D6');
    borderGrad.addColorStop(1.0, '#E5B842');
    ctx.strokeStyle = borderGrad;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Speed Slash Flash Effect
    if (this.speedSlashAlpha > 0.01) {
      ctx.save();
      ctx.fillStyle = `rgba(255, 235, 140, ${this.speedSlashAlpha * 0.4})`;
      ctx.fillRect(40, 20, w - 80, h - 40);
      ctx.restore();
    }

    ctx.font = '900 34px "Orbitron", sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('BRAVEN BUSINESS CENTER', 80, 105);

    ctx.font = '700 24px "Chakra Petch", monospace';
    ctx.fillStyle = '#FDE047';
    ctx.fillText(`⚡ ${this.scrambledSector}`, 80, 160);

    // Metric Pill on Right
    const pW = 340;
    const pH = 70;
    const pX = w - 80 - pW;
    const pY = 50;

    ctx.fillStyle = 'rgba(229, 184, 66, 0.22)';
    ctx.strokeStyle = '#FDE047';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(pX, pY, pW, pH, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FDE047';
    ctx.font = '900 30px "Orbitron", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(this.scrambledMetric, pX + pW / 2, pY + 46);
    ctx.textAlign = 'left';

    this.topTex.needsUpdate = true;
  }

  renderBottomCanvas() {
    const ctx = this.bottomCtx;
    const w = this.bottomCanvas.width;
    const h = this.bottomCanvas.height;
    ctx.clearRect(0, 0, w, h);

    // Bottom Tachometer Control Frame
    ctx.fillStyle = 'rgba(16, 12, 7, 0.92)';
    ctx.beginPath();
    ctx.roundRect(40, 20, w - 80, h - 40, 20);
    ctx.fill();

    ctx.strokeStyle = 'rgba(229, 184, 66, 0.6)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 1. PREV Button
    ctx.fillStyle = 'rgba(229, 184, 66, 0.2)';
    ctx.strokeStyle = '#E5B842';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(80, 55, 180, 80, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 26px "Orbitron", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('◀ PREV', 170, 105);

    // 2. Autoplay Status Toggle
    ctx.fillStyle = appState.autoplay ? 'rgba(52, 211, 153, 0.2)' : 'rgba(251, 191, 36, 0.2)';
    ctx.strokeStyle = appState.autoplay ? '#34D399' : '#FBBF24';
    ctx.beginPath();
    ctx.roundRect(290, 55, 260, 80, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = appState.autoplay ? '#6EE7B7' : '#FDE047';
    ctx.font = '700 22px "Chakra Petch", sans-serif';
    ctx.fillText(appState.autoplay ? '● AUTOPLAY: ON' : '⏸ AUTOPLAY: PAUSED', 420, 104);

    // 3. Tachometer RPM Progress Bar & 6 Sector Dots (Center)
    const centerX = 800;
    const barW = 340;
    const barH = 14;
    const barX = centerX - barW / 2;
    const barY = 60;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 7);
    ctx.fill();

    const pct = Math.min((this.elapsedSlideTime / appState.slideDuration), 1.0);
    ctx.fillStyle = '#FDE047';
    ctx.beginPath();
    ctx.roundRect(barX, barY, Math.max(barW * pct, 10), barH, 7);
    ctx.fill();

    // 6 Sector Navigation Dots
    for (let i = 0; i < 6; i++) {
      const dotX = barX + (barW / 5) * i;
      const dotY = 110;
      const isActive = i === appState.currentSlide;

      ctx.fillStyle = isActive ? '#FDE047' : 'rgba(229, 184, 66, 0.35)';
      ctx.beginPath();
      ctx.arc(dotX, dotY, isActive ? 9 : 5, 0, Math.PI * 2);
      ctx.fill();
      if (isActive) {
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    // 4. Slide Counter Readout
    ctx.fillStyle = '#E5B84B';
    ctx.font = '700 24px "Orbitron", monospace';
    ctx.fillText(`0${appState.currentSlide + 1} / 06`, 1140, 105);

    // 5. NEXT Button
    ctx.fillStyle = 'rgba(229, 184, 66, 0.2)';
    ctx.strokeStyle = '#E5B842';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(1320, 55, 180, 80, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 26px "Orbitron", sans-serif';
    ctx.fillText('NEXT ►', 1410, 105);
    ctx.textAlign = 'left';

    this.bottomTex.needsUpdate = true;
  }

  renderAllCanvases() {
    this.renderCardCanvases();
    this.renderTopCanvas();
    this.renderBottomCanvas();
  }

  update(dt: number) {
    if (!appState.signageVisible) {
      this.signageRoot.visible = false;
      this.cssAnchorGroup.visible = false;
      return;
    }
    this.signageRoot.visible = true;
    this.cssAnchorGroup.visible = true;

    // Autoplay Timer Progression
    if (appState.autoplay && !appState.isTransitioning) {
      this.elapsedSlideTime += dt;
      appState.slideProgress = Math.min((this.elapsedSlideTime / appState.slideDuration), 1.0);

      // Update HTML5 Progress Bar
      if (this.domProgressBar) {
        this.domProgressBar.style.width = `${appState.slideProgress * 100}%`;
      }

      if (this.elapsedSlideTime >= appState.slideDuration) {
        this.goToSlide(appState.currentSlide + 1);
      }
    }

    // Update Autoplay label in DOM
    if (this.domAutoplayLabel && this.domAutoplayDot) {
      this.domAutoplayLabel.textContent = appState.autoplay ? 'AUTOPLAY: ON' : 'AUTOPLAY: PAUSED';
      this.domAutoplayDot.className = `w-2 h-2 rounded-full ${
        appState.autoplay ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-amber-400'
      }`;
    }

    // Decay Speed Slash
    if (this.speedSlashAlpha > 0) {
      this.speedSlashAlpha = Math.max(0, this.speedSlashAlpha - dt * 3.5);
      this.renderTopCanvas();
    }

    // Sync CSS3D HTML5 Overlay with Three.js Marker Anchor
    this.cssAnchorGroup.position.copy(this.bravenScene.markerAnchorGroup.position);
    this.cssAnchorGroup.quaternion.copy(this.bravenScene.markerAnchorGroup.quaternion);
    this.cssAnchorGroup.scale.copy(this.bravenScene.markerAnchorGroup.scale);
    this.cssAnchorGroup.visible = this.bravenScene.markerAnchorGroup.visible;

    this.cssRenderer.render(this.cssScene, this.bravenScene.camera);

    // Continuous Bottom Progress Bar Refresh on Canvas
    this.renderBottomCanvas();
  }

  handleResize(w: number, h: number) {
    this.cssRenderer.setSize(w, h);
  }
}
