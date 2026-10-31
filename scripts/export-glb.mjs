import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Node FileReader polyfill for GLTFExporter
globalThis.FileReader = class FileReader {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then(buf => {
      this.result = buf;
      if (this.onloadend) this.onloadend();
    });
  }
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const assetsDir = path.join(rootDir, 'src', 'assets');
const publicDir = path.join(rootDir, 'public');

if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

async function exportModel() {
  const THREE = await import('three');
  const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js');

  const root = new THREE.Group();
  root.name = "BravenLogoScene";

  // Gold PBR Metallic Material matching Poliigon 7253 24K Champagne Gold
  const goldMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#E5B84B'),
    metalness: 1.0,
    roughness: 0.18,
    name: 'PBR_24K_Gold'
  });

  const goldAccentMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#FFF0A6'),
    metalness: 1.0,
    roughness: 0.06,
    name: 'PBR_24K_Gold_Mirror_Accent'
  });

  const emblemExtrudeSettings = {
    depth: 0.34,
    bevelEnabled: true,
    bevelSegments: 5,
    steps: 1,
    bevelSize: 0.038,
    bevelThickness: 0.045,
    curveSegments: 32
  };

  // Build Emblem
  const emblemGroup = new THREE.Group();
  emblemGroup.name = "BravenEmblem";

  const shapes = [];

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

  shapes.forEach((sh, idx) => {
    const geom = new THREE.ExtrudeGeometry(sh, emblemExtrudeSettings);
    geom.translate(0, 0, -emblemExtrudeSettings.depth * 0.5);
    const mesh = new THREE.Mesh(geom, goldMaterial);
    mesh.name = `EmblemPart_${idx + 1}`;
    emblemGroup.add(mesh);
  });
  emblemGroup.position.y = 0.25;
  root.add(emblemGroup);

  // Helper for text glyph shapes
  function createGlyphShapes(char) {
    const s = [];
    const t = 0.19;
    const rectShape = (x, y, w, h) => {
      const sh = new THREE.Shape();
      sh.moveTo(x, y);
      sh.lineTo(x + w, y);
      sh.lineTo(x + w, y + h);
      sh.lineTo(x, y + h);
      sh.closePath();
      return sh;
    };
    const polyShape = (pts) => {
      const sh = new THREE.Shape();
      sh.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) sh.lineTo(pts[i][0], pts[i][1]);
      sh.closePath();
      return sh;
    };

    switch (char) {
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
      case 'V': {
        s.push(polyShape([
          [0.0, 1.0], [0.22, 1.0], [0.5, 0.25],
          [0.78, 1.0], [1.0, 1.0], [0.6, 0.0], [0.4, 0.0]
        ]));
        break;
      }
      case 'E': {
        s.push(polyShape([
          [0, 0], [0.92, 0], [0.92, t * 0.9], [t, t * 0.9],
          [t, 0.42], [0.78, 0.42], [0.78, 0.58], [t, 0.58],
          [t, 1.0 - t * 0.9], [0.92, 1.0 - t * 0.9], [0.92, 1.0], [0, 1.0]
        ]));
        break;
      }
      case 'N': {
        s.push(polyShape([
          [0, 0], [t, 0], [t, 0.68], [0.76, 0],
          [0.96, 0], [0.96, 1.0], [0.96 - t, 1.0], [0.96 - t, 0.32],
          [0.2, 1.0], [0, 1.0]
        ]));
        break;
      }
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
      case 'S': {
        s.push(polyShape([
          [0.04, 0.0], [0.88, 0.0], [0.96, 0.12], [0.96, 0.46],
          [0.84, 0.57], [0.22, 0.57], [0.22, 0.82], [0.92, 0.82],
          [0.92, 1.0], [0.12, 1.0], [0.02, 0.88], [0.02, 0.52],
          [0.14, 0.41], [0.76, 0.41], [0.76, 0.18], [0.04, 0.18]
        ]));
        break;
      }
      case 'I': {
        s.push(rectShape(0.36, 0, 0.24, 1.0));
        break;
      }
      case 'C': {
        s.push(polyShape([
          [0.92, 0.0], [0.92, 0.19], [0.24, 0.19], [0.2, 0.25],
          [0.2, 0.75], [0.24, 0.81], [0.92, 0.81], [0.92, 1.0],
          [0.16, 1.0], [0.0, 0.84], [0.0, 0.16], [0.16, 0.0]
        ]));
        break;
      }
      case 'T': {
        s.push(polyShape([
          [0.0, 1.0], [0.96, 1.0], [0.96, 1.0 - t],
          [0.48 + t * 0.5, 1.0 - t], [0.48 + t * 0.5, 0],
          [0.48 - t * 0.5, 0], [0.48 - t * 0.5, 1.0 - t], [0.0, 1.0 - t]
        ]));
        break;
      }
    }
    return s;
  }

  function build3DWordMesh(text, letterWidth, letterHeight, tracking, depth, bevel) {
    const group = new THREE.Group();
    group.name = `Word_${text.replace(/\s+/g, '_')}`;
    const chars = text.split('');
    let cursorX = 0;

    const extrudeOpts = {
      depth,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: bevel,
      bevelThickness: bevel,
      curveSegments: 20
    };

    chars.forEach((ch, idx) => {
      if (ch === ' ') {
        cursorX += letterWidth * 0.65 + tracking;
        return;
      }
      const rawShapes = createGlyphShapes(ch);
      rawShapes.forEach((sh, shIdx) => {
        const geom = new THREE.ExtrudeGeometry(sh, extrudeOpts);
        geom.scale(letterWidth, letterHeight, 1);
        geom.translate(cursorX, 0, -depth * 0.5);
        const mesh = new THREE.Mesh(geom, goldMaterial);
        mesh.name = `Char_${ch}_${idx}_${shIdx}`;
        group.add(mesh);
      });
      const charAdvance = ch === 'I' ? letterWidth * 0.65 : letterWidth;
      cursorX += charAdvance + tracking;
    });

    const totalWidth = cursorX - tracking;
    group.position.x = -totalWidth * 0.5;
    return group;
  }

  const bravenTitleGroup = build3DWordMesh('BRAVEN', 0.54, 0.56, 0.24, 0.28, 0.026);
  bravenTitleGroup.position.y = -0.68;
  root.add(bravenTitleGroup);

  const subtitleGroup = build3DWordMesh('BUSINESS CENTER', 0.19, 0.22, 0.11, 0.18, 0.014);
  subtitleGroup.position.y = -1.18;
  root.add(subtitleGroup);

  // 3 Perpendicular Golden Rings
  const ringsGroup = new THREE.Group();
  ringsGroup.name = "OrthogonalRings";
  const radii = [3.55, 4.05, 4.55];
  const ringRotations = [
    new THREE.Euler(0, 0, 0),
    new THREE.Euler(Math.PI / 2, 0, 0),
    new THREE.Euler(0, Math.PI / 2, 0)
  ];

  radii.forEach((radius, idx) => {
    const ringMount = new THREE.Group();
    ringMount.name = `RingMount_${idx + 1}`;
    ringMount.rotation.copy(ringRotations[idx]);

    const tubeRadius = 0.054 + idx * 0.006;
    const mainTorus = new THREE.Mesh(
      new THREE.TorusGeometry(radius, tubeRadius, 24, 120),
      goldMaterial
    );
    mainTorus.name = `MainRing_${idx + 1}`;
    ringMount.add(mainTorus);

    const innerTorus = new THREE.Mesh(
      new THREE.TorusGeometry(radius - 0.11, 0.016, 16, 90),
      goldAccentMaterial
    );
    innerTorus.name = `InnerRing_${idx + 1}`;
    ringMount.add(innerTorus);

    const nodeGeom = new THREE.OctahedronGeometry(tubeRadius * 2.2, 0);
    for (let n = 0; n < 4; n++) {
      const angle = (n * Math.PI) / 2;
      const node = new THREE.Mesh(nodeGeom, goldAccentMaterial);
      node.name = `DiamondNode_${idx + 1}_${n + 1}`;
      node.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
      node.rotation.z = angle;
      ringMount.add(node);
    }

    ringsGroup.add(ringMount);
  });
  root.add(ringsGroup);

  console.log('Exporting GLTF Binary (GLB)...');
  const exporter = new GLTFExporter();
  const glbBuffer = await new Promise((resolve, reject) => {
    exporter.parse(
      root,
      (glb) => resolve(glb),
      (err) => reject(err),
      { binary: true }
    );
  });

  const destAssets = path.join(assetsDir, 'braven-logo.glb');
  const destPublic = path.join(publicDir, 'braven-logo.glb');

  fs.writeFileSync(destAssets, Buffer.from(glbBuffer));
  fs.writeFileSync(destPublic, Buffer.from(glbBuffer));

  console.log(`✓ Successfully exported 3D GLB model to:
  - ${destAssets} (${(glbBuffer.byteLength / 1024).toFixed(1)} KB)
  - ${destPublic} (${(glbBuffer.byteLength / 1024).toFixed(1)} KB)`);
}

exportModel().catch(err => {
  console.error('Export model error:', err);
  process.exit(1);
});
