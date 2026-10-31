import React, { useEffect, useRef, useState } from 'react';
import { appState, notifyStateChange, subscribeState, SIGNAGE_SLIDES } from './state';
import { Braven3DScene } from './braven-3d-scene';
import { WorldCanvasSignage } from './world-canvas-signage';
import { ARTrackingController } from './ar-controller';
import { audioEngine } from './audio-engine';

export const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<Braven3DScene | null>(null);
  const signageRef = useRef<WorldCanvasSignage | null>(null);
  const arRef = useRef<ARTrackingController | null>(null);

  const [, setTick] = useState(0);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    // Subscribe to state updates
    const unsubscribe = subscribeState(() => {
      setTick(t => t + 1);
    });

    // PWA Install prompt listener
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Initialize 3D Scene & World Canvas
    if (containerRef.current && !sceneRef.current) {
      const scene = new Braven3DScene(containerRef.current);
      sceneRef.current = scene;

      const signage = new WorldCanvasSignage(scene);
      signageRef.current = signage;

      const ar = new ARTrackingController(scene);
      arRef.current = ar;

      // Tick signage per frame
      let lastTime = performance.now();
      const loop = (now: number) => {
        const dt = Math.min((now - lastTime) / 1000, 0.1);
        lastTime = now;
        signage.update(dt);
        ar.update(dt);
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);

      audioEngine.init();
    }

    return () => {
      unsubscribe();
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      if (sceneRef.current) {
        sceneRef.current.dispose();
      }
    };
  }, []);

  const handleInstallPWA = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setInstallPrompt(null);
      }
    } else {
      alert('To install this PWA, open your browser menu and select "Install" or "Add to Home Screen".');
    }
  };

  const currentSector = SIGNAGE_SLIDES[appState.currentSlide].sector;
  const currentMetric = SIGNAGE_SLIDES[appState.currentSlide].metric;

  return (
    <div className={`relative w-screen h-screen overflow-hidden select-none ${
      appState.backdropMode === 'obsidian' ? 'bg-luxury' :
      appState.backdropMode === 'marble' ? 'bg-white-studio' :
      appState.backdropMode === 'grid' ? 'bg-grid' : 'bg-transparent-grid'
    }`}>
      {/* 3D WebGL Canvas Viewport */}
      <div id="braven-3d-widget" ref={containerRef} />

      {/* Hidden YouTube Audio Bridge Element */}
      <div id="yt-player-container" style={{ position: 'absolute', top: -9999, left: -9999 }} />

      {/* TOP NAVIGATION & TELEMETRY BAR */}
      <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-black/60 backdrop-blur-xl border-b border-amber-500/30">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-yellow-300 via-amber-500 to-amber-700 shadow-[0_0_15px_rgba(230,185,77,0.5)]">
            <span className="font-racing-title font-black text-black text-sm">B</span>
          </div>
          <div>
            <h1 className="font-racing-title text-xs sm:text-sm font-extrabold tracking-wider text-amber-200">
              BRAVEN BUSINESS CENTER
            </h1>
            <div className="flex items-center gap-2 text-[10px] font-mono text-amber-400/80">
              <span>8TH WALL AR</span>
              <span>•</span>
              <span className="text-emerald-400">WORLD CANVAS SIGNAGE</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Interactive AR Toggle & Status Button */}
          <button
            type="button"
            onClick={() => {
              if (appState.arMode) {
                arRef.current?.stopAR();
              } else {
                arRef.current?.startAR();
              }
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-racing-title uppercase tracking-wider flex items-center gap-2 cursor-pointer transition ${
              appState.arMode
                ? (appState.markerFound
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-extrabold shadow-[0_0_15px_rgba(52,211,153,0.5)]'
                    : appState.trackingStatus === 'ERROR'
                      ? 'bg-gradient-to-r from-red-600 to-red-400 text-white font-bold'
                      : 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-black font-extrabold shadow-[0_0_15px_rgba(235,188,70,0.5)] animate-pulse')
                : 'bg-zinc-900 border border-amber-500/40 text-amber-300 hover:bg-amber-500/20'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-current opacity-80" />
            <span>{
              appState.arMode
                ? (appState.markerFound ? '📷 LOCKED ON MARKER' :
                   appState.trackingStatus === 'ERROR' ? '⚠ RETRY CAMERA' :
                   appState.trackingStatus === 'SEARCHING' ? '🔍 SCANNING...' : '📷 AR ACTIVE')
                : '📷 START AR CAMERA'
            }</span>
          </button>

          {/* Marker Modal Trigger */}
          <button
            type="button"
            onClick={() => {
              appState.markerModalOpen = true;
              notifyStateChange();
            }}
            className="px-3 py-1.5 rounded-lg bg-zinc-900/90 border border-amber-500/40 text-amber-200 hover:bg-amber-500/20 text-xs font-racing-title uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5"
          >
            <span>🎯 Target Marker</span>
          </button>

          {/* Music Play/Pause & Equalizer */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg bg-zinc-900/80 border border-amber-500/30">
            <button
              type="button"
              onClick={() => audioEngine.toggle()}
              className="text-xs text-amber-300 font-bold hover:text-yellow-300 cursor-pointer"
            >
              {appState.audioPlaying ? '⏸' : '▶'}
            </button>
            <div className="flex items-end gap-1 h-3.5">
              {[0, 1, 2, 3].map(i => (
                <div
                  key={i}
                  className={`w-1 rounded-full bg-amber-400 ${appState.audioPlaying ? 'eq-bar-active' : 'h-1'}`}
                />
              ))}
            </div>
            <select
              value={appState.audioEngine}
              onChange={(e) => audioEngine.setEngine(e.target.value as any)}
              className="bg-transparent text-[11px] font-mono text-amber-300 border-none focus:outline-none cursor-pointer"
            >
              <option value="synth" className="bg-zinc-950 text-amber-200">106 BPM Afrobeat Synth</option>
              <option value="youtube" className="bg-zinc-950 text-amber-200">YouTube Groove</option>
              <option value="hybrid" className="bg-zinc-950 text-amber-200">Hybrid Audio</option>
            </select>
          </div>

          {/* Studio Drawer Toggle */}
          <button
            type="button"
            onClick={() => {
              appState.studioDrawerOpen = !appState.studioDrawerOpen;
              notifyStateChange();
            }}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-amber-500/40 text-amber-300 hover:bg-amber-500/20 text-xs transition cursor-pointer"
            title="Studio Settings & PBR Sliders"
          >
            ⚙
          </button>

          {/* Install PWA Button */}
          {installPrompt && (
            <button
              type="button"
              onClick={handleInstallPWA}
              className="hidden md:flex px-3 py-1.5 rounded-lg bg-emerald-500 text-black font-racing-title font-bold text-xs uppercase tracking-wider hover:brightness-110 shadow-[0_0_12px_rgba(52,211,153,0.4)] cursor-pointer"
            >
              ⬇ Install App
            </button>
          )}
        </div>
      </header>

      {/* BOTTOM FLOATING TELEMETRY STATUS PILL */}
      <footer className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-3 px-4 py-2 rounded-xl bg-black/75 backdrop-blur-md border border-amber-500/35 shadow-[0_0_20px_rgba(0,0,0,0.8)]">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${
              appState.markerFound
                ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                : appState.trackingStatus === 'ERROR'
                  ? 'bg-red-400'
                  : 'bg-amber-400 animate-pulse'
            }`} />
            <span className="font-racing-title text-xs font-bold text-amber-200 uppercase tracking-wider">
              {appState.markerFound
                ? 'TARGET ACQUIRED: BRAVEN-MARKER (98.4%)'
                : appState.trackingStatus === 'SEARCHING' ? 'SCANNING FOR MARKER CARD...'
                : appState.trackingStatus === 'ERROR' ? 'AR INIT ERROR — CHECK CAMERA PERMISSION'
                : '8TH WALL AR — INITIALIZING CAMERA'}
            </span>
          </div>
          <span className="text-amber-500/50">|</span>
          <span className="font-mono text-xs text-amber-300">
            {currentSector} — {currentMetric}
          </span>
        </div>

        {/* 3D World Canvas Hint */}
        <div className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-amber-500/25 text-amber-300/80 text-xs font-mono">
          <span>Holographic Spatial UI rendered in 3D scene (Click cards or ◀ ▶ to navigate)</span>
        </div>
      </footer>

      {/* AR Scanning Reticle Overlay */}
      {appState.arMode && !appState.markerFound && (
        <div className="absolute inset-0 pointer-events-none z-10 flex flex-col items-center justify-center">
          <div className="relative w-64 h-64 sm:w-80 sm:h-80 border-2 border-dashed border-amber-400/60 rounded-3xl flex items-center justify-center animate-pulse shadow-[0_0_50px_rgba(245,158,11,0.2)]">
            <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-amber-300" />
            <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-amber-300" />
            <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-amber-300" />
            <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-amber-300" />
            <div className="text-center px-4">
              <span className="font-racing-title text-xs tracking-widest text-amber-300 font-bold uppercase block mb-1">
                POINT CAMERA AT MARKER
              </span>
              <span className="text-[10px] font-mono text-amber-200/70 block">
                8TH WALL IMAGE TRACKER ACTIVE
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              appState.markerModalOpen = true;
              notifyStateChange();
            }}
            className="pointer-events-auto mt-6 px-4 py-2 rounded-xl bg-black/80 border border-amber-400/50 text-amber-200 text-xs font-racing-title uppercase tracking-wider hover:bg-amber-500/20 shadow-[0_0_20px_rgba(0,0,0,0.8)] cursor-pointer"
          >
            🎯 View / Print Target Marker
          </button>
        </div>
      )}

      {/* Fallback / Permission Request Overlay */}
      {(!appState.arMode || appState.trackingStatus === 'ERROR') && (
        <div className="absolute inset-0 pointer-events-none z-10 flex flex-col items-center justify-center p-4">
          <div className="pointer-events-auto max-w-md w-full p-6 rounded-3xl bg-black/85 backdrop-blur-2xl border border-amber-500/40 shadow-[0_0_60px_rgba(235,188,70,0.25)] text-center animate-fade-in">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-yellow-300 via-amber-500 to-amber-700 flex items-center justify-center shadow-[0_0_20px_rgba(230,185,77,0.5)] text-2xl text-black">
              📷
            </div>
            <h2 className="font-racing-title text-base sm:text-lg font-extrabold text-amber-200 tracking-wider uppercase mb-2">
              8TH WALL AR IMAGE TRACKING
            </h2>
            <p className="font-sans text-xs sm:text-sm text-amber-300/80 mb-6 leading-relaxed">
              Enable your camera to project the 3D Metallic Gold Logo & Holographic World Canvas Signage onto the physical marker card in real-time.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => arRef.current?.startAR()}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-black font-racing-title font-black text-xs uppercase tracking-widest hover:brightness-110 shadow-[0_0_25px_rgba(235,188,70,0.6)] cursor-pointer transition transform hover:scale-105"
              >
                Allow Camera & Start AR
              </button>
              <button
                type="button"
                onClick={() => {
                  appState.markerModalOpen = true;
                  notifyStateChange();
                }}
                className="w-full sm:w-auto px-4 py-3 rounded-xl bg-zinc-900 border border-amber-500/40 text-amber-200 font-racing-title font-bold text-xs uppercase tracking-wider hover:bg-amber-500/20 cursor-pointer transition"
              >
                🎯 Target Marker
              </button>
            </div>
            <div className="mt-4 text-[10px] font-mono text-amber-400/60">
              Supports Mobile Phones, Tablets & PC Webcams
            </div>
          </div>
        </div>
      )}

      {/* STUDIO PARAMETERS & CUSTOMIZATION DRAWER */}
      {appState.studioDrawerOpen && (
        <aside className="absolute top-16 right-4 z-30 w-80 max-h-[82vh] overflow-y-auto p-4 rounded-2xl bg-zinc-950/95 border border-amber-500/40 shadow-[0_20px_60px_rgba(0,0,0,0.95)] backdrop-blur-xl transition-all">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-amber-500/25">
            <h2 className="font-racing-title text-xs font-bold text-amber-300 uppercase tracking-wider">
              Studio & PBR Telemetry
            </h2>
            <button
              type="button"
              onClick={() => {
                appState.studioDrawerOpen = false;
                notifyStateChange();
              }}
              className="text-xs text-amber-400 hover:text-white cursor-pointer px-2 py-0.5 rounded bg-zinc-800"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4 text-xs">
            {/* Backdrop Themes */}
            <div>
              <label className="block text-[11px] font-mono text-amber-300/80 mb-1.5 uppercase">Backdrop Environment</label>
              <div className="grid grid-cols-2 gap-1.5">
                {(['obsidian', 'marble', 'grid', 'alpha'] as const).map(mode => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      appState.backdropMode = mode;
                      notifyStateChange();
                    }}
                    className={`px-2 py-1.5 rounded text-[11px] font-semibold uppercase tracking-wider cursor-pointer ${
                      appState.backdropMode === mode
                        ? 'bg-amber-500/35 border border-yellow-400 text-yellow-100'
                        : 'bg-zinc-800/90 border border-zinc-700 text-amber-200/70 hover:border-yellow-400/50'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Slideshow Duration */}
            <div>
              <div className="flex justify-between font-mono text-amber-200 mb-1">
                <span>Slide Speed</span>
                <span>{appState.slideDuration.toFixed(1)}s</span>
              </div>
              <input
                type="range"
                min="3"
                max="15"
                step="0.5"
                value={appState.slideDuration}
                onChange={(e) => {
                  appState.slideDuration = parseFloat(e.target.value);
                  notifyStateChange();
                }}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>

            {/* UI Animation Amplification */}
            <div>
              <div className="flex justify-between font-mono text-amber-200 mb-1">
                <span>UI Animation Amp</span>
                <span>{appState.uiAmp.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.1"
                value={appState.uiAmp}
                onChange={(e) => {
                  appState.uiAmp = parseFloat(e.target.value);
                  notifyStateChange();
                }}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>

            {/* Individual Ring Radii */}
            <div>
              <label className="block text-[11px] font-mono text-amber-300/80 mb-1 uppercase">3 Orthogonal Ring Radii</label>
              {[0, 1, 2].map(idx => (
                <div key={idx} className="flex items-center gap-2 mb-1.5">
                  <span className="font-mono text-[10px] text-amber-400 w-12">R{idx + 1}:</span>
                  <input
                    type="range"
                    min="2.5"
                    max="6.0"
                    step="0.1"
                    value={appState.ringRadii[idx]}
                    onChange={(e) => {
                      const r = parseFloat(e.target.value);
                      appState.ringRadii[idx] = r;
                      sceneRef.current?.rebuildSingleRing(idx, r);
                      notifyStateChange();
                    }}
                    className="flex-1 accent-amber-400 cursor-pointer"
                  />
                  <span className="font-mono text-[10px] text-amber-200 w-8 text-right">
                    {appState.ringRadii[idx].toFixed(1)}
                  </span>
                </div>
              ))}
            </div>

            {/* Ring Tumbling Speed */}
            <div>
              <div className="flex justify-between font-mono text-amber-200 mb-1">
                <span>Ring Rotation Speed</span>
                <span>{appState.ringSpeed.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="3.0"
                step="0.1"
                value={appState.ringSpeed}
                onChange={(e) => {
                  appState.ringSpeed = parseFloat(e.target.value);
                  notifyStateChange();
                }}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>

            {/* Logo XYZ Pose */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono text-amber-300/80 uppercase">Logo 3D Pose Angles</label>
              {(['poseX', 'poseY', 'poseZ'] as const).map(axis => (
                <div key={axis} className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-amber-400 w-12">{axis.slice(-1).toUpperCase()}:</span>
                  <input
                    type="range"
                    min="-90"
                    max="90"
                    step="1"
                    value={appState[axis]}
                    onChange={(e) => {
                      appState[axis] = parseFloat(e.target.value);
                      notifyStateChange();
                    }}
                    className="flex-1 accent-amber-400 cursor-pointer"
                  />
                  <span className="font-mono text-[10px] text-amber-200 w-8 text-right">
                    {appState[axis]}°
                  </span>
                </div>
              ))}
            </div>

            {/* Bloom Strength */}
            <div>
              <div className="flex justify-between font-mono text-amber-200 mb-1">
                <span>Gold Bloom Halo</span>
                <span>{appState.bloomStrength.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.2"
                step="0.05"
                value={appState.bloomStrength}
                onChange={(e) => {
                  const b = parseFloat(e.target.value);
                  appState.bloomStrength = b;
                  if (sceneRef.current) sceneRef.current.bloomPass.strength = b;
                  notifyStateChange();
                }}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>
          </div>
        </aside>
      )}

      {/* AR IMAGE TRACKING MARKER MODAL */}
      {appState.markerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-2xl bg-zinc-950 border border-amber-500/50 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.95)]">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-amber-500/30">
              <div>
                <h3 className="font-racing-title text-sm sm:text-base font-bold text-amber-300 uppercase tracking-wider">
                  8th Wall AR Tracking Marker
                </h3>
                <p className="text-xs text-amber-200/70 mt-0.5">
                  Point your device camera at this marker to anchor the 3D logo & World Canvas signage.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  appState.markerModalOpen = false;
                  notifyStateChange();
                }}
                className="text-xs px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-amber-200 cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {/* Marker Image Display */}
            <div className="relative flex items-center justify-center p-4 rounded-xl bg-black border border-amber-500/30 overflow-hidden">
              <img
                src="/braven-marker.png"
                alt="8th Wall Tracking Target"
                className="max-h-64 object-contain rounded-lg shadow-[0_0_25px_rgba(235,188,70,0.3)]"
              />
            </div>

            <div className="flex items-center justify-between mt-5">
              <span className="text-[11px] font-mono text-amber-400">
                Target: image-targets/braven-marker.json
              </span>
              <a
                href="/braven-marker.png"
                download="braven-marker.png"
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-black font-racing-title font-bold text-xs uppercase tracking-wider hover:brightness-110 shadow-[0_0_15px_rgba(235,188,70,0.4)] transition"
              >
                ⬇ Download Marker Card
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
