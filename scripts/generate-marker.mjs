import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const sharp = require('/home/glitcher/.local/opt/8th-wall/app/node_modules/sharp');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const targetsDir = path.join(rootDir, 'image-targets');
const publicDir = path.join(rootDir, 'public');

if (!fs.existsSync(targetsDir)) fs.mkdirSync(targetsDir, { recursive: true });
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

// Highly discernible, asymmetric, multi-frequency AR Tracking Marker SVG
const svgMarker = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bgGrad" cx="50%" cy="50%" r="55%">
      <stop offset="0%" stop-color="#18130a" />
      <stop offset="60%" stop-color="#0a0805" />
      <stop offset="100%" stop-color="#020201" />
    </radialGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFF4B8" />
      <stop offset="25%" stop-color="#E5B84B" />
      <stop offset="60%" stop-color="#B2821E" />
      <stop offset="85%" stop-color="#FCE185" />
      <stop offset="100%" stop-color="#FFFFFF" />
    </linearGradient>
    <pattern id="dotGrid" width="32" height="32" patternUnits="userSpaceOnUse">
      <circle cx="16" cy="16" r="1.5" fill="#E5B84B" opacity="0.3" />
    </pattern>
  </defs>

  <!-- Deep Obsidian Background -->
  <rect width="1024" height="1024" fill="url(#bgGrad)" />
  <rect width="1024" height="1024" fill="url(#dotGrid)" />

  <!-- Outer Tracking Border with Corner Hashes -->
  <rect x="36" y="36" width="952" height="952" rx="24" fill="none" stroke="url(#goldGrad)" stroke-width="8" />
  <rect x="52" y="52" width="920" height="920" fill="none" stroke="#E5B84B" stroke-dasharray="16, 12" stroke-width="2" opacity="0.6" />

  <!-- 4 High-Contrast Optical Alignment Target Rings -->
  <g stroke="url(#goldGrad)" stroke-width="4" fill="none">
    <!-- Top-Left Target -->
    <circle cx="110" cy="110" r="44" stroke-width="6" fill="#000" />
    <circle cx="110" cy="110" r="28" fill="#E5B84B" />
    <line x1="110" y1="52" x2="110" y2="168" stroke="#000" stroke-width="4" />
    <line x1="52" y1="110" x2="168" y2="110" stroke="#000" stroke-width="4" />

    <!-- Top-Right Target -->
    <circle cx="914" cy="110" r="44" stroke-width="6" fill="#000" />
    <circle cx="914" cy="110" r="28" fill="#E5B84B" />
    <line x1="914" y1="52" x2="914" y2="168" stroke="#000" stroke-width="4" />
    <line x1="856" y1="110" x2="972" y2="110" stroke="#000" stroke-width="4" />

    <!-- Bottom-Left Target -->
    <circle cx="110" cy="914" r="44" stroke-width="6" fill="#000" />
    <circle cx="110" cy="914" r="28" fill="#E5B84B" />
    <line x1="110" y1="856" x2="110" y2="972" stroke="#000" stroke-width="4" />
    <line x1="52" y1="914" x2="168" y2="914" stroke="#000" stroke-width="4" />

    <!-- Bottom-Right Target -->
    <circle cx="914" cy="914" r="44" stroke-width="6" fill="#000" />
    <circle cx="914" cy="914" r="28" fill="#E5B84B" />
    <line x1="914" y1="856" x2="914" y2="972" stroke="#000" stroke-width="4" />
    <line x1="856" y1="914" x2="972" y2="914" stroke="#000" stroke-width="4" />
  </g>

  <!-- Concentric Telemetry Rings -->
  <circle cx="512" cy="512" r="380" fill="none" stroke="#E5B84B" stroke-width="2" opacity="0.35" stroke-dasharray="12, 18" />
  <circle cx="512" cy="512" r="320" fill="none" stroke="url(#goldGrad)" stroke-width="3" opacity="0.6" />
  <circle cx="512" cy="512" r="260" fill="none" stroke="#E5B84B" stroke-width="1.5" opacity="0.4" stroke-dasharray="8, 8" />

  <!-- Asymmetric Corner Features for Zero Ambiguity Orientation -->
  <polygon points="180,72 260,72 240,102 180,102" fill="url(#goldGrad)" />
  <text x="280" y="94" font-family="'Courier New', monospace" font-size="20" font-weight="bold" fill="#E5B84B" letter-spacing="4">BBC-AR-TRK-01 // ANCHOR</text>

  <polygon points="764,952 844,952 824,922 764,922" fill="url(#goldGrad)" />
  <text x="560" y="942" font-family="'Courier New', monospace" font-size="16" font-weight="bold" fill="#E5B84B" letter-spacing="3">LATENCY: OPTIMAL • 106 BPM</text>

  <!-- Central BRAVEN Metallic Emblem Graphic (Upright Matching 3D Model & Typography) -->
  <g transform="translate(512, 515) scale(122, -122)">
    <!-- Inner Left Pillar (Slopes down from center peak 1.98 to 1.60) -->
    <polygon points="-0.44,-0.04 -0.075,-0.02 -0.075,1.98 -0.44,1.60" fill="url(#goldGrad)" />
    <!-- Inner Right Pillar (Slopes down from center peak 1.98 to 1.60) -->
    <polygon points="0.075,-0.02 0.44,-0.04 0.44,1.60 0.075,1.98" fill="url(#goldGrad)" />
    <!-- Outer Left Wing (Horizontal base at bottom, outer pillar tapering up to 1.44) -->
    <path d="M -2.55,-0.17 Q -1.45,-0.07 -0.58,-0.045 L -0.58,1.44 L -0.94,1.08 L -0.94,0.08 L -2.55,-0.155 Z" fill="url(#goldGrad)" />
    <!-- Outer Right Wing (Horizontal base at bottom, outer pillar tapering up to 1.44) -->
    <path d="M 0.58,-0.045 Q 1.45,-0.07 2.55,-0.17 L 2.55,-0.155 L 0.94,0.08 L 0.94,1.08 L 0.58,1.44 Z" fill="url(#goldGrad)" />
  </g>

  <!-- Typography (Positioned below the emblem, perfectly upright) -->
  <text x="512" y="700" text-anchor="middle" font-family="'Orbitron', 'Inter', sans-serif" font-size="74" font-weight="900" fill="url(#goldGrad)" letter-spacing="20">BRAVEN</text>
  <text x="512" y="756" text-anchor="middle" font-family="'Chakra Petch', 'Rajdhani', sans-serif" font-size="28" font-weight="700" fill="#FFF4B8" letter-spacing="14">BUSINESS CENTER</text>
  <text x="512" y="800" text-anchor="middle" font-family="'Inter', sans-serif" font-size="16" font-weight="600" fill="#E5B84B" opacity="0.85" letter-spacing="6">8TH WALL AR IMAGE TRACKING TARGET</text>

  <!-- Corner Notch Crosshairs -->
  <path d="M 500,48 L 524,48 M 512,36 L 512,60" stroke="#E5B84B" stroke-width="3" />
  <path d="M 500,976 L 524,976 M 512,964 L 512,988" stroke="#E5B84B" stroke-width="3" />
  <path d="M 48,500 L 48,524 M 36,512 L 60,512" stroke="#E5B84B" stroke-width="3" />
  <path d="M 976,500 L 976,524 M 964,512 L 988,512" stroke="#E5B84B" stroke-width="3" />
</svg>
`;

async function generate() {
  console.log('Generating AR Image Tracking Marker Assets...');
  const svgBuf = Buffer.from(svgMarker);

  const baseImage = sharp(svgBuf);

  // 1. Original 1024x1024 PNG
  await baseImage
    .clone()
    .resize(1024, 1024)
    .png()
    .toFile(path.join(targetsDir, 'braven-marker_original.png'));

  // Also write to public/ for the web app UI
  await baseImage
    .clone()
    .resize(1024, 1024)
    .png()
    .toFile(path.join(publicDir, 'braven-marker.png'));

  // 2. Cropped 1024x1024 PNG
  await baseImage
    .clone()
    .resize(1024, 1024)
    .png()
    .toFile(path.join(targetsDir, 'braven-marker_cropped.png'));

  // 3. Thumbnail 350x350 PNG
  await baseImage
    .clone()
    .resize(350, 350)
    .png()
    .toFile(path.join(targetsDir, 'braven-marker_thumbnail.png'));

  // 4. Luminance 640x640 Grayscale PNG (Used by 8th Wall tracker)
  await baseImage
    .clone()
    .resize(640, 640)
    .grayscale()
    .png()
    .toFile(path.join(targetsDir, 'braven-marker_luminance.png'));

  // 5. Image Target JSON metadata for 8th Wall Studio
  const targetMeta = {
    type: "PLANAR",
    properties: {
      top: 0,
      left: 0,
      width: 1024,
      height: 1024,
      isRotated: false,
      originalWidth: 1024,
      originalHeight: 1024
    },
    imagePath: "image-targets/braven-marker_luminance.png",
    metadata: {
      name: "BRAVEN Business Center Tracking Target",
      ratio: 1.0,
      physicalWidthInMeters: 0.20
    },
    name: "braven-marker",
    resources: {
      originalImage: "braven-marker_original.png",
      croppedImage: "braven-marker_cropped.png",
      thumbnailImage: "braven-marker_thumbnail.png",
      luminanceImage: "braven-marker_luminance.png"
    },
    created: Date.now(),
    updated: Date.now()
  };

  fs.writeFileSync(
    path.join(targetsDir, 'braven-marker.json'),
    JSON.stringify(targetMeta, null, 2)
  );

  console.log('✓ Successfully generated all 8th Wall image target files in image-targets/ and public/!');
}

generate().catch(err => {
  console.error('Marker generation error:', err);
  process.exit(1);
});
