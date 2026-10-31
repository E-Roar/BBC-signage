import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { appState } from './state';

export class Braven3DScene {
  container: HTMLElement;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  composer: EffectComposer;
  bloomPass: UnrealBloomPass;
  controls: OrbitControls;

  // Hierarchies
  worldRoot: THREE.Group;
  markerAnchorGroup: THREE.Group;
  logoFloatGroup: THREE.Group;
  logoPoseGroup: THREE.Group;
  ringsRootGroup: THREE.Group;
  ringMounts: THREE.Group[] = [];
  ringTumblers: THREE.Group[] = [];

  // Lighting
  glintLight1: THREE.PointLight;
  glintLight2: THREE.PointLight;
  goldParticles: THREE.Points;

  // Materials
  goldPBRMaterial: THREE.MeshPhysicalMaterial;
  goldMirrorAccentMaterial: THREE.MeshPhysicalMaterial;

  private clock = new THREE.Clock();
  private animId: number | null = null;
  private resizeHandler: () => void;

  constructor(container: HTMLElement) {
    this.container = container;
    this.scene = new THREE.Scene();

    const w = this.getWidth();
    const h = this.getHeight();
    const pr = Math.min(window.devicePixelRatio || 1, 2);

    this.camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 100);
    this.camera.position.set(0, 0.15, 13.8);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(pr);
    this.renderer.setSize(w, h);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.18;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.container.appendChild(this.renderer.domElement);

    // Studio Environment Reflection Map
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    pmremGenerator.compileEquirectangularShader();
    const roomEnv = new RoomEnvironment();
    this.scene.environment = pmremGenerator.fromScene(roomEnv, 0.035).texture;

    // High-DPI Multi-Sampled RenderTarget
    const msaaRenderTarget = new THREE.WebGLRenderTarget(w * pr, h * pr, {
      samples: 4,
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat
    });

    this.composer = new EffectComposer(this.renderer, msaaRenderTarget);
    this.composer.setPixelRatio(pr);
    this.composer.setSize(w, h);

    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(w * pr, h * pr),
      appState.bloomStrength,
      appState.bloomRadius,
      0.78
    );
    this.composer.addPass(this.bloomPass);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxDistance = 26;
    this.controls.minDistance = 4.5;
    this.controls.target.set(0, 0, 0);

    // Build PBR Materials
    const { pbrMat, accentMat } = this.createPBRMaterials();
    this.goldPBRMaterial = pbrMat;
    this.goldMirrorAccentMaterial = accentMat;

    // Studio Lighting
    this.setupLighting();

    // Grouping
    this.worldRoot = new THREE.Group();
    this.scene.add(this.worldRoot);

    this.markerAnchorGroup = new THREE.Group();
    this.markerAnchorGroup.name = "BravenMarkerAnchor";
    this.worldRoot.add(this.markerAnchorGroup);

    this.logoFloatGroup = new THREE.Group();
    this.logoPoseGroup = new THREE.Group();
    this.logoFloatGroup.add(this.logoPoseGroup);
    this.markerAnchorGroup.add(this.logoFloatGroup);

    // Build 3D Models
    this.build3DLogo();
    this.buildOrthogonalRings();
    this.buildParticles();

    this.resizeHandler = () => this.handleResize();
    window.addEventListener('resize', this.resizeHandler);
    this.startLoop();
  }

  private getWidth() {
    return Math.max(this.container.clientWidth || window.innerWidth || 1280, 320);
  }

  private getHeight() {
    return Math.max(this.container.clientHeight || window.innerHeight || 720, 240);
  }

  private createPBRMaterials() {
    const size = 1024;
    const maxAniso = this.renderer.capabilities.getMaxAnisotropy() || 8;

    const baseCanvas = document.createElement('canvas');
    baseCanvas.width = size;
    baseCanvas.height = size;
    const bCtx = baseCanvas.getContext('2d')!;

    const grad = bCtx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0.0, '#E8C15A');
    grad.addColorStop(0.5, '#DFB444');
    grad.addColorStop(1.0, '#EACA66');
    bCtx.fillStyle = grad;
    bCtx.fillRect(0, 0, size, size);

    const baseImg = bCtx.getImageData(0, 0, size, size);
    const bData = baseImg.data;

    const roughCanvas = document.createElement('canvas');
    roughCanvas.width = size;
    roughCanvas.height = size;
    const rCtx = roughCanvas.getContext('2d')!;
    const roughImg = rCtx.createImageData(size, size);
    const rData = roughImg.data;

    const normCanvas = document.createElement('canvas');
    normCanvas.width = size;
    normCanvas.height = size;
    const nCtx = normCanvas.getContext('2d')!;
    const normImg = nCtx.createImageData(size, size);
    const nData = normImg.data;

    const rawNoise = new Float32Array(size * size);
    let seed = 7253;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    for (let i = 0; i < size * size; i++) rawNoise[i] = (rand() - 0.5) * 2.0;

    const heights = new Float32Array(size * size);
    for (let y = 0; y < size; y++) {
      const y0 = (y - 1 + size) % size;
      const y1 = y;
      const y2 = (y + 1) % size;
      for (let x = 0; x < size; x++) {
        const x0 = (x - 1 + size) % size;
        const x1 = x;
        const x2 = (x + 1) % size;
        const sum =
          rawNoise[y0 * size + x0] + rawNoise[y0 * size + x1] + rawNoise[y0 * size + x2] +
          rawNoise[y1 * size + x0] + rawNoise[y1 * size + x1] * 2.0 + rawNoise[y1 * size + x2] +
          rawNoise[y2 * size + x0] + rawNoise[y2 * size + x1] + rawNoise[y2 * size + x2];
        const n = sum / 10.0;
        heights[y * size + x] = n;

        const idx = (y * size + x) * 4;
        bData[idx] = Math.min(255, Math.max(0, Math.round(232 + n * 6)));
        bData[idx + 1] = Math.min(255, Math.max(0, Math.round(190 + n * 5)));
        bData[idx + 2] = Math.min(255, Math.max(0, Math.round(78 + n * 4)));
        bData[idx + 3] = 255;

        const rVal = Math.min(255, Math.max(20, Math.round(46 + n * 6)));
        rData[idx] = rVal;
        rData[idx + 1] = rVal;
        rData[idx + 2] = rVal;
        rData[idx + 3] = 255;
      }
    }

    for (let y = 0; y < size; y++) {
      const yNext = (y + 1) % size;
      for (let x = 0; x < size; x++) {
        const xNext = (x + 1) % size;
        const dx = (heights[y * size + xNext] - heights[y * size + x]) * 0.08;
        const dy = (heights[yNext * size + x] - heights[y * size + x]) * 0.08;
        const idx = (y * size + x) * 4;
        nData[idx] = Math.min(255, Math.max(0, Math.round((dx * 0.5 + 0.5) * 255)));
        nData[idx + 1] = Math.min(255, Math.max(0, Math.round((dy * 0.5 + 0.5) * 255)));
        nData[idx + 2] = 254;
        nData[idx + 3] = 255;
      }
    }

    bCtx.putImageData(baseImg, 0, 0);
    rCtx.putImageData(roughImg, 0, 0);
    nCtx.putImageData(normImg, 0, 0);

    const wrapAndTile = (canvas: HTMLCanvasElement, isSRGB = false) => {
      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(3, 3);
      tex.anisotropy = maxAniso;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = true;
      if (isSRGB) tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;
      return tex;
    };

    const baseColorMap = wrapAndTile(baseCanvas, true);
    const roughnessMap = wrapAndTile(roughCanvas, false);
    const normalMap = wrapAndTile(normCanvas, false);

    const pbrMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0xffffff),
      map: baseColorMap,
      metalness: 1.0,
      roughness: 0.18,
      roughnessMap: roughnessMap,
      normalMap: normalMap,
      normalScale: new THREE.Vector2(appState.normalScale * 0.12, appState.normalScale * 0.12),
      clearcoat: 0.35,
      clearcoatRoughness: 0.08,
      ior: 1.5,
      reflectivity: 1.0,
      envMapIntensity: 2.5
    });

    const accentMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#FFF0A6'),
      metalness: 1.0,
      roughness: 0.06,
      clearcoat: 0.65,
      clearcoatRoughness: 0.04,
      envMapIntensity: 3.2
    });

    return { pbrMat, accentMat };
  }

  private setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xfffdf5, 1.05);
    this.scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfffef8, 3.8);
    keyLight.position.set(6, 9, 10);
    this.scene.add(keyLight);

    const rimLightLeft = new THREE.DirectionalLight(0xffe999, 2.9);
    rimLightLeft.position.set(-9, 4, -6);
    this.scene.add(rimLightLeft);

    const rimLightBottom = new THREE.DirectionalLight(0xfff3c4, 2.4);
    rimLightBottom.position.set(0, -8, 6);
    this.scene.add(rimLightBottom);

    this.glintLight1 = new THREE.PointLight(0xfff8dc, 18, 20, 1.5);
    this.glintLight2 = new THREE.PointLight(0xffe885, 15, 20, 1.5);
    this.scene.add(this.glintLight1, this.glintLight2);
  }

  private normalizeExtrudeUVs(geometry: THREE.BufferGeometry, uvScale = 0.35) {
    const pos = geometry.attributes.position;
    const normal = geometry.attributes.normal;
    const uv = geometry.attributes.uv;
    if (!pos || !uv) return;
    for (let i = 0; i < pos.count; i++) {
      const nx = Math.abs(normal.getX(i));
      const ny = Math.abs(normal.getY(i));
      const nz = Math.abs(normal.getZ(i));
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      if (nz >= nx && nz >= ny) {
        uv.setXY(i, x * uvScale, y * uvScale);
      } else if (nx >= ny) {
        uv.setXY(i, z * uvScale, y * uvScale);
      } else {
        uv.setXY(i, x * uvScale, z * uvScale);
      }
    }
    uv.needsUpdate = true;
  }

  private build3DLogo() {
    const emblemExtrudeSettings = {
      depth: 0.34,
      bevelEnabled: true,
      bevelSegments: 6,
      steps: 1,
      bevelSize: 0.038,
      bevelThickness: 0.045,
      curveSegments: 32
    };

    const emblemGroup = new THREE.Group();
    const shapes: THREE.Shape[] = [];

    // Inner Left
    const innerLeft = new THREE.Shape();
    innerLeft.moveTo(-0.44, -0.04);
    innerLeft.lineTo(-0.075, -0.02);
    innerLeft.lineTo(-0.075, 1.98);
    innerLeft.lineTo(-0.44, 1.60);
    innerLeft.closePath();
    shapes.push(innerLeft);

    // Inner Right
    const innerRight = new THREE.Shape();
    innerRight.moveTo(0.075, -0.02);
    innerRight.lineTo(0.44, -0.04);
    innerRight.lineTo(0.44, 1.60);
    innerRight.lineTo(0.075, 1.98);
    innerRight.closePath();
    shapes.push(innerRight);

    // Outer Left
    const outerLeft = new THREE.Shape();
    outerLeft.moveTo(-2.55, -0.17);
    outerLeft.quadraticCurveTo(-1.45, -0.07, -0.58, -0.045);
    outerLeft.lineTo(-0.58, 1.44);
    outerLeft.lineTo(-0.94, 1.08);
    outerLeft.lineTo(-0.94, 0.08);
    outerLeft.lineTo(-2.55, -0.155);
    outerLeft.closePath();
    shapes.push(outerLeft);

    // Outer Right
    const outerRight = new THREE.Shape();
    outerRight.moveTo(0.58, -0.045);
    outerRight.quadraticCurveTo(1.45, -0.07, 2.55, -0.17);
    outerRight.lineTo(2.55, -0.155);
    outerRight.lineTo(0.94, 0.08);
    outerRight.lineTo(0.94, 1.08);
    outerRight.lineTo(0.58, 1.44);
    outerRight.closePath();
    shapes.push(outerRight);

    shapes.forEach((sh) => {
      const geom = new THREE.ExtrudeGeometry(sh, emblemExtrudeSettings);
      geom.translate(0, 0, -emblemExtrudeSettings.depth * 0.5);
      this.normalizeExtrudeUVs(geom, 0.32);
      const mesh = new THREE.Mesh(geom, [this.goldPBRMaterial, this.goldMirrorAccentMaterial]);
      emblemGroup.add(mesh);
    });

    emblemGroup.position.y = 0.25;
    this.logoPoseGroup.add(emblemGroup);

    // Helper for 3D words
    const buildWord = (text: string, letterWidth: number, letterHeight: number, tracking: number, depth: number, bevel: number) => {
      const group = new THREE.Group();
      const chars = text.split('');
      let cursorX = 0;

      const extrudeOpts = {
        depth,
        bevelEnabled: true,
        bevelSegments: 5,
        steps: 1,
        bevelSize: bevel,
        bevelThickness: bevel,
        curveSegments: 24
      };

      const createGlyph = (ch: string) => {
        const s: THREE.Shape[] = [];
        const t = 0.19;
        const rectShape = (x: number, y: number, w: number, h: number) => {
          const sh = new THREE.Shape();
          sh.moveTo(x, y);
          sh.lineTo(x + w, y);
          sh.lineTo(x + w, y + h);
          sh.lineTo(x, y + h);
          sh.closePath();
          return sh;
        };
        const polyShape = (pts: number[][]) => {
          const sh = new THREE.Shape();
          sh.moveTo(pts[0][0], pts[0][1]);
          for (let i = 1; i < pts.length; i++) sh.lineTo(pts[i][0], pts[i][1]);
          sh.closePath();
          return sh;
        };

        switch (ch) {
          case 'B': {
            const outer = new THREE.Shape();
            outer.moveTo(0, 0);
            outer.lineTo(0.76, 0);
            outer.quadraticCurveTo(0.96, 0, 0.96, 0.25);
            outer.quadraticCurveTo(0.96, 0.46, 0.78, 0.5);
            outer.quadraticCurveTo(0.94, 0.54, 0.94, 0.75);
            outer.quadraticCurveTo(0.94, 1.0, 0.74, 1.0);
            outer.lineTo(0, 1.0);
            outer.closePath();

            const holeBot = new THREE.Path();
            holeBot.moveTo(t, t * 0.85);
            holeBot.lineTo(0.68, t * 0.85);
            holeBot.quadraticCurveTo(0.76, t * 0.85, 0.76, 0.28);
            holeBot.quadraticCurveTo(0.76, 0.42, 0.68, 0.42);
            holeBot.lineTo(t, 0.42);
            holeBot.closePath();

            const holeTop = new THREE.Path();
            holeTop.moveTo(t, 0.57);
            holeTop.lineTo(0.66, 0.57);
            holeTop.quadraticCurveTo(0.74, 0.57, 0.74, 0.71);
            holeTop.quadraticCurveTo(0.74, 0.84, 0.66, 0.84);
            holeTop.lineTo(t, 0.84);
            holeTop.closePath();

            outer.holes.push(holeBot, holeTop);
            s.push(outer);
            break;
          }
          case 'R': {
            const outer = new THREE.Shape();
            outer.moveTo(0, 0);
            outer.lineTo(t, 0);
            outer.lineTo(t, 0.42);
            outer.lineTo(0.54, 0.42);
            outer.lineTo(0.76, 0);
            outer.lineTo(0.98, 0);
            outer.lineTo(0.73, 0.44);
            outer.quadraticCurveTo(0.95, 0.5, 0.95, 0.72);
            outer.quadraticCurveTo(0.95, 1.0, 0.72, 1.0);
            outer.lineTo(0, 1.0);
            outer.closePath();

            const holeTop = new THREE.Path();
            holeTop.moveTo(t, 0.57);
            holeTop.lineTo(0.66, 0.57);
            holeTop.quadraticCurveTo(0.75, 0.57, 0.75, 0.71);
            holeTop.quadraticCurveTo(0.75, 0.84, 0.66, 0.84);
            holeTop.lineTo(t, 0.84);
            holeTop.closePath();
            outer.holes.push(holeTop);
            s.push(outer);
            break;
          }
          case 'A': {
            const outer = polyShape([
              [0, 0], [0.21, 0], [0.31, 0.24], [0.69, 0.24],
              [0.79, 0], [1.0, 0], [0.59, 1.0], [0.41, 1.0]
            ]);
            const hole = new THREE.Path();
            hole.moveTo(0.37, 0.41);
            hole.lineTo(0.63, 0.41);
            hole.lineTo(0.5, 0.76);
            hole.closePath();
            outer.holes.push(hole);
            s.push(outer);
            break;
          }
          case 'V':
            s.push(polyShape([
              [0.0, 1.0], [0.22, 1.0], [0.5, 0.25],
              [0.78, 1.0], [1.0, 1.0], [0.6, 0.0], [0.4, 0.0]
            ]));
            break;
          case 'E':
            s.push(polyShape([
              [0, 0], [0.92, 0], [0.92, t * 0.9], [t, t * 0.9],
              [t, 0.42], [0.78, 0.42], [0.78, 0.58], [t, 0.58],
              [t, 1.0 - t * 0.9], [0.92, 1.0 - t * 0.9], [0.92, 1.0], [0, 1.0]
            ]));
            break;
          case 'N':
            s.push(polyShape([
              [0, 0], [t, 0], [t, 0.68], [0.76, 0],
              [0.96, 0], [0.96, 1.0], [0.96 - t, 1.0], [0.96 - t, 0.32],
              [0.2, 1.0], [0, 1.0]
            ]));
            break;
          case 'U': {
            const sh = new THREE.Shape();
            sh.moveTo(0, 1.0);
            sh.lineTo(0, 0.32);
            sh.quadraticCurveTo(0, 0, 0.48, 0);
            sh.quadraticCurveTo(0.96, 0, 0.96, 0.32);
            sh.lineTo(0.96, 1.0);
            sh.lineTo(0.96 - t, 1.0);
            sh.lineTo(0.96 - t, 0.34);
            sh.quadraticCurveTo(0.96 - t, t, 0.48, t);
            sh.quadraticCurveTo(t, t, t, 0.34);
            sh.lineTo(t, 1.0);
            sh.closePath();
            s.push(sh);
            break;
          }
          case 'S':
            s.push(polyShape([
              [0.04, 0.0], [0.88, 0.0], [0.96, 0.12], [0.96, 0.46],
              [0.84, 0.57], [0.22, 0.57], [0.22, 0.82], [0.92, 0.82],
              [0.92, 1.0], [0.12, 1.0], [0.02, 0.88], [0.02, 0.52],
              [0.14, 0.41], [0.76, 0.41], [0.76, 0.18], [0.04, 0.18]
            ]));
            break;
          case 'I':
            s.push(rectShape(0.36, 0, 0.24, 1.0));
            break;
          case 'C':
            s.push(polyShape([
              [0.92, 0.0], [0.92, 0.19], [0.24, 0.19], [0.2, 0.25],
              [0.2, 0.75], [0.24, 0.81], [0.92, 0.81], [0.92, 1.0],
              [0.16, 1.0], [0.0, 0.84], [0.0, 0.16], [0.16, 0.0]
            ]));
            break;
          case 'T':
            s.push(polyShape([
              [0.0, 1.0], [0.96, 1.0], [0.96, 1.0 - t],
              [0.48 + t * 0.5, 1.0 - t], [0.48 + t * 0.5, 0],
              [0.48 - t * 0.5, 0], [0.48 - t * 0.5, 1.0 - t], [0.0, 1.0 - t]
            ]));
            break;
        }
        return s;
      };

      chars.forEach((ch) => {
        if (ch === ' ') {
          cursorX += letterWidth * 0.65 + tracking;
          return;
        }
        const rawShapes = createGlyph(ch);
        rawShapes.forEach((sh) => {
          const geom = new THREE.ExtrudeGeometry(sh, extrudeOpts);
          geom.scale(letterWidth, letterHeight, 1);
          geom.translate(cursorX, 0, -depth * 0.5);
          this.normalizeExtrudeUVs(geom, 0.35);
          const mesh = new THREE.Mesh(geom, [this.goldPBRMaterial, this.goldMirrorAccentMaterial]);
          group.add(mesh);
        });
        const charAdvance = ch === 'I' ? letterWidth * 0.65 : letterWidth;
        cursorX += charAdvance + tracking;
      });

      const totalWidth = cursorX - tracking;
      group.position.x = -totalWidth * 0.5;
      return group;
    };

    const bravenTitle = buildWord('BRAVEN', 0.54, 0.56, 0.24, 0.28, 0.026);
    bravenTitle.position.y = -0.68;
    this.logoPoseGroup.add(bravenTitle);

    const subtitle = buildWord('BUSINESS CENTER', 0.19, 0.22, 0.11, 0.18, 0.014);
    subtitle.position.y = -1.18;
    this.logoPoseGroup.add(subtitle);

    this.logoPoseGroup.position.y = 0.08;
  }

  private buildOrthogonalRings() {
    this.ringsRootGroup = new THREE.Group();
    this.markerAnchorGroup.add(this.ringsRootGroup);

    this.ringMounts = [new THREE.Group(), new THREE.Group(), new THREE.Group()];
    this.ringTumblers = [new THREE.Group(), new THREE.Group(), new THREE.Group()];

    // Strictly 90° mutually perpendicular reference planes
    this.ringMounts[0].rotation.set(0, 0, 0);
    this.ringMounts[1].rotation.set(Math.PI / 2, 0, 0);
    this.ringMounts[2].rotation.set(0, Math.PI / 2, 0);

    for (let i = 0; i < 3; i++) {
      this.ringMounts[i].add(this.ringTumblers[i]);
      this.ringsRootGroup.add(this.ringMounts[i]);
      this.rebuildSingleRing(i, appState.ringRadii[i]);
    }
  }

  rebuildSingleRing(index: number, radius: number) {
    const tumbler = this.ringTumblers[index];
    while (tumbler.children.length > 0) {
      const child = tumbler.children[0] as THREE.Mesh;
      if (child.geometry) child.geometry.dispose();
      tumbler.remove(child);
    }

    const tubeRadius = 0.054 + index * 0.006;
    const mainTorusGeom = new THREE.TorusGeometry(radius, tubeRadius, 36, 180);
    const mainTorusMesh = new THREE.Mesh(mainTorusGeom, this.goldPBRMaterial);
    tumbler.add(mainTorusMesh);

    const innerTorusGeom = new THREE.TorusGeometry(radius - 0.11, 0.016, 20, 140);
    const innerTorusMesh = new THREE.Mesh(innerTorusGeom, this.goldMirrorAccentMaterial);
    tumbler.add(innerTorusMesh);

    const nodeGeom = new THREE.OctahedronGeometry(tubeRadius * 2.2, 0);
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const nodeMesh = new THREE.Mesh(nodeGeom, this.goldMirrorAccentMaterial);
      nodeMesh.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
      nodeMesh.rotation.z = angle;
      tumbler.add(nodeMesh);
    }
  }

  private buildParticles() {
    const particleCount = 90;
    const particleGeom = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const r = 3.2 + Math.random() * 4.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      particlePositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      particlePositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      particlePositions[i * 3 + 2] = r * Math.cos(phi);
    }
    particleGeom.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xfff0a8,
      size: 0.055,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending
    });
    this.goldParticles = new THREE.Points(particleGeom, particleMat);
    this.markerAnchorGroup.add(this.goldParticles);
  }

  handleResize() {
    const w = this.getWidth();
    const h = this.getHeight();
    const pr = Math.min(window.devicePixelRatio || 1, 2);

    this.camera.aspect = w / h;
    this.camera.fov = w < 640 ? 48 : 38;
    this.camera.updateProjectionMatrix();

    this.renderer.setPixelRatio(pr);
    this.renderer.setSize(w, h);
    this.composer.setPixelRatio(pr);
    this.composer.setSize(w, h);
    this.bloomPass.resolution.set(w * pr, h * pr);
  }

  /** Called by XR8 on every frame so all animations run under XR8's render loop */
  tickAnimations() {
    const degToRad = THREE.MathUtils.degToRad;
    const dt = Math.min(this.clock.getDelta(), 0.1);
    const elapsed = this.clock.getElapsedTime();

    // Ring Tumbling with Nitrous Surge
    appState.nitroSpinBoost = THREE.MathUtils.lerp(appState.nitroSpinBoost, 0, dt * 3.5);
    const effectiveRingSpeed = appState.ringSpeed + appState.nitroSpinBoost * appState.uiAmp;

    if (this.ringTumblers[0]) {
      this.ringTumblers[0].rotation.x += dt * 0.50 * effectiveRingSpeed;
      this.ringTumblers[0].rotation.y += dt * 0.14 * effectiveRingSpeed;
    }
    if (this.ringTumblers[1]) {
      this.ringTumblers[1].rotation.y += dt * 0.44 * effectiveRingSpeed;
      this.ringTumblers[1].rotation.x += dt * 0.12 * effectiveRingSpeed;
    }
    if (this.ringTumblers[2]) {
      this.ringTumblers[2].rotation.x += dt * 0.38 * effectiveRingSpeed;
      this.ringTumblers[2].rotation.y += dt * 0.16 * effectiveRingSpeed;
    }

    // Continuous Floating Levitation
    const floatY = Math.sin(elapsed * appState.floatSpeed) * appState.floatAmp;
    const breathTiltX = Math.cos(elapsed * appState.floatSpeed * 0.7) * 0.035;
    const breathTiltZ = Math.sin(elapsed * appState.floatSpeed * 0.5) * 0.025;
    this.logoFloatGroup.position.y = floatY;

    // XYZ Pose + Choreography Framing
    const targetRotX = degToRad(appState.poseX + (appState.signageVisible ? appState.choreoPose.x * 0.35 : 0)) + breathTiltX;
    const targetRotY = degToRad(appState.poseY + (appState.signageVisible ? appState.choreoPose.y * 0.35 : 0));
    const targetRotZ = degToRad(appState.poseZ + (appState.signageVisible ? appState.choreoPose.z * 0.35 : 0)) + breathTiltZ;

    this.logoPoseGroup.rotation.x = THREE.MathUtils.lerp(this.logoPoseGroup.rotation.x, targetRotX, dt * 4.5);
    this.logoPoseGroup.rotation.y = THREE.MathUtils.lerp(this.logoPoseGroup.rotation.y, targetRotY, dt * 4.5);
    this.logoPoseGroup.rotation.z = THREE.MathUtils.lerp(this.logoPoseGroup.rotation.z, targetRotZ, dt * 4.5);

    this.logoPoseGroup.scale.setScalar(appState.logoScale);

    // Specular Glint Orbit
    this.glintLight1.position.set(
      Math.cos(elapsed * 0.9) * 6.5,
      Math.sin(elapsed * 1.1) * 4.5,
      4.5 + Math.sin(elapsed * 0.7) * 2.0
    );
    this.glintLight2.position.set(
      Math.sin(elapsed * 0.8) * -6.5,
      Math.cos(elapsed * 0.6) * 5.0,
      3.5 + Math.cos(elapsed * 0.9) * 2.5
    );

    // Particle Drift
    if (this.goldParticles) {
      this.goldParticles.rotation.y = elapsed * 0.04;
      this.goldParticles.rotation.x = Math.sin(elapsed * 0.15) * 0.08;
    }
  }

  /** Start standalone render loop (used when XR8 is NOT active) */
  startLoop() {
    const animate = () => {
      this.animId = requestAnimationFrame(animate);
      this.tickAnimations();
      this.controls.update();
      this.composer.render();
    };
    animate();
  }

  /** Stop the standalone render loop (called before XR8 takes over) */
  stopLoop() {
    if (this.animId !== null) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  dispose() {
    if (this.animId) cancelAnimationFrame(this.animId);
    window.removeEventListener('resize', this.resizeHandler);
    this.renderer.dispose();
  }
}
