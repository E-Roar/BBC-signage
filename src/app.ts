// 8th Wall Studio Native ECS Entry Point
import './components/image-target-sync';
import './components/braven-scene-controller';
import './components/world-canvas-signage';

const onxrloaded = () => {
  const XR8 = (window as any).XR8;
  if (XR8 && XR8.XrController) {
    try {
      XR8.XrController.configure({
        disableWorldTracking: true,
        imageTargetData: [
          require('../image-targets/braven-marker.json'),
        ],
      });
      console.log('[8th Wall Studio] braven-marker.json configured in XrController.');
    } catch (e) {
      console.warn('[8th Wall Studio] XrController configuration error:', e);
    }
  }
};

if (typeof window !== 'undefined') {
  (window as any).XR8 ? onxrloaded() : window.addEventListener('xrloaded', onxrloaded);
}

console.log('[8th Wall Studio] Braven AR Components registered with ECS.');

