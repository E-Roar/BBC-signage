import * as THREE from 'three';
import { appState, notifyStateChange } from './state';
import { Braven3DScene } from './braven-3d-scene';

type Vec3 = { x: number; y: number; z: number };
type Quat = { x: number; y: number; z: number; w: number };

export type ImageDetail = {
  name: string;
  type: 'FLAT' | 'CYLINDRICAL' | 'CONICAL';
  position: Vec3;
  rotation: Quat;
  scale: number;
  scaledWidth?: number;
  scaledHeight?: number;
};

declare global {
  interface Window {
    XR8?: any;
    THREE?: typeof THREE;
  }
}

// Robust helper to wait for XR8 and ensure SLAM/Tracking chunk is loaded
async function waitForXR8(): Promise<any> {
  const getXR = () => window.XR8;

  return new Promise((resolve) => {
    let resolved = false;

    const tryInit = async () => {
      if (resolved) return;
      const xr = getXR();
      if (xr) {
        // If XrController chunk hasn't finished loading yet, load it explicitly
        if (!xr.XrController && typeof xr.loadChunk === 'function') {
          try {
            console.log('[XR8] Explicitly loading SLAM / Image Tracking chunk...');
            await xr.loadChunk({ name: 'slam', url: '/ar/xr/xr-tracking.js' });
          } catch (e) {
            console.warn('[XR8] loadChunk note:', e);
          }
        }

        if (xr.XrController) {
          resolved = true;
          resolve(xr);
          return;
        }
      }
      setTimeout(tryInit, 80);
    };

    window.addEventListener('xrloaded', tryInit, { once: true });
    window.addEventListener('XRloaded', tryInit, { once: true });
    tryInit();
  });
}

export class ARTrackingController {
  private bravenScene: Braven3DScene;
  private isRunning = false;
  private starting = false;

  // Smoothing
  private targetPos = new THREE.Vector3();
  private targetQuat = new THREE.Quaternion();

  constructor(bravenScene: Braven3DScene) {
    this.bravenScene = bravenScene;
    (window as any).__bravenAR = this;
    // Auto-start AR immediately
    this.startAR();
  }

  public async startAR() {
    if (this.isRunning || this.starting) return;
    this.starting = true;

    try {
      console.log('[AR] Requesting camera & initializing 8th Wall AR...');
      appState.arMode = true;
      appState.trackingStatus = 'SEARCHING';
      appState.markerFound = false;
      notifyStateChange();

      // Ensure THREE is globally available for 8th Wall
      window.THREE = THREE;

      // 1. Prime camera access directly if user gesture is active
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const testStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: 'environment' } }
          }).catch(() => navigator.mediaDevices.getUserMedia({ video: true }));

          // Stop temporary priming tracks so XR8 can open the real stream
          testStream.getTracks().forEach(t => t.stop());
          console.log('[AR] Camera permission granted successfully.');
        } catch (permErr: any) {
          console.warn('[AR] Camera permission prompt note:', permErr);
          if (permErr?.name === 'NotAllowedError' || permErr?.name === 'PermissionDeniedError') {
            appState.trackingStatus = 'ERROR';
            notifyStateChange();
            throw permErr;
          }
        }
      }

      // 2. Wait for XR8 engine
      const XR8 = await waitForXR8();
      console.log('[XR8] Engine & XrController ready. Configuring target...');

      // 3. Stop standalone Three.js render loop & OrbitControls
      this.bravenScene.controls.enabled = false;
      this.bravenScene.stopLoop();

      // Reset camera to origin for AR image tracking (XR8 coordinates)
      this.bravenScene.camera.position.set(0, 0, 0);
      this.bravenScene.camera.quaternion.set(0, 0, 0, 1);

      // 4. Load the image target descriptor
      const targetRes = await fetch('/image-targets/braven-marker.json');
      const targetData = await targetRes.json();
      const targetName = targetData.name || 'braven-marker';

      // Ensure relative imagePath is absolute from web root
      if (targetData.imagePath && !targetData.imagePath.startsWith('/')) {
        targetData.imagePath = '/' + targetData.imagePath;
      }

      // 5. Configure 8th Wall Image Tracking
      XR8.XrController.configure({
        disableWorldTracking: true, // Crucial for PC webcam & mobile image tracking
        imageTargetData: [targetData],
      });

      const self = this;

      // 6. Custom Pipeline Module bridging XR8 camera feed with Braven scene
      const bravenModule = {
        name: 'braven-ar-scene',

        onStart() {
          console.log('[XR8] Pipeline started — camera stream active.');
          appState.trackingStatus = 'SEARCHING';
          notifyStateChange();
        },

        onRender() {
          // Update animations and world canvas panels
          self.bravenScene.tickAnimations();
          // Clear depth so 3D objects render over the GlTextureRenderer camera background
          self.bravenScene.renderer.clearDepth();
          // Render bloom composer
          self.bravenScene.composer.render();
        },

        onException(err: unknown) {
          console.error('[XR8] Pipeline exception:', err);
          appState.trackingStatus = 'ERROR';
          notifyStateChange();
        },

        onCameraStatusChange({ status }: { status: string }) {
          console.log('[XR8] Camera status:', status);
          if (status === 'hasStream') {
            appState.trackingStatus = 'SEARCHING';
            notifyStateChange();
          } else if (status === 'failed') {
            appState.trackingStatus = 'ERROR';
            notifyStateChange();
          }
        },

        listeners: [
          {
            event: 'reality.cameraconfigured',
            process(detail: any) {
              console.log('[XR8] Camera intrinsics configured:', detail);
            },
          },
          {
            event: 'reality.imagescanning',
            process() {
              if (!appState.markerFound) {
                appState.trackingStatus = 'SEARCHING';
                notifyStateChange();
              }
            },
          },
          {
            event: 'reality.imagefound',
            process({ detail }: { detail: ImageDetail }) {
              if (detail.name !== targetName) return;
              console.log('[XR8] ✅ MARKER FOUND:', detail.name, detail);
              appState.markerFound = true;
              appState.trackingStatus = 'TRACKING';
              appState.markerConfidence = 0.99;
              self.applyTransform(detail);
              self.bravenScene.markerAnchorGroup.visible = true;
              notifyStateChange();
            },
          },
          {
            event: 'reality.imageupdated',
            process({ detail }: { detail: ImageDetail }) {
              if (detail.name !== targetName) return;
              self.applyTransform(detail);
            },
          },
          {
            event: 'reality.imagelost',
            process({ detail }: { detail: ImageDetail }) {
              if (detail.name !== targetName) return;
              console.log('[XR8] ❌ MARKER LOST:', detail.name);
              appState.markerFound = false;
              appState.trackingStatus = 'LOST';
              appState.markerConfidence = 0;
              notifyStateChange();
            },
          },
        ],
      };

      // 7. Clear any existing modules and register pipeline
      try {
        XR8.stop?.();
        XR8.clearCameraPipelineModules?.();
      } catch (_) {}

      XR8.addCameraPipelineModules([
        XR8.GlTextureRenderer.pipelineModule(), // Renders the camera feed to canvas
        XR8.XrController.pipelineModule(),       // Runs the image tracking algorithm
        bravenModule,                            // Our custom render & event handler
      ]);

      // 8. Start the camera and tracking
      XR8.run({
        canvas: this.bravenScene.renderer.domElement,
        allowedDevices: XR8.XrConfig?.device?.()?.ANY || 'any',
        cameraConfig: { direction: XR8.XrConfig?.camera?.()?.ANY || 'any' },
        allowFront: true,
      });

      this.isRunning = true;
      this.starting = false;
      console.log('[XR8] AR Session successfully started. Looking for marker!');
    } catch (err: any) {
      this.starting = false;
      console.error('[XR8] Error starting AR:', err);
      // Fall back to 3D studio view
      appState.arMode = false;
      appState.trackingStatus = 'ERROR';
      this.bravenScene.controls.enabled = true;
      this.bravenScene.camera.position.set(0, 0.15, 13.8);
      this.bravenScene.startLoop();
      notifyStateChange();
    }
  }

  public stopAR() {
    if (!this.isRunning) return;
    try {
      if (window.XR8) {
        window.XR8.stop();
        window.XR8.clearCameraPipelineModules?.();
      }
    } catch (e) {
      console.warn('[XR8] Stop error:', e);
    }
    this.isRunning = false;
    appState.arMode = false;
    appState.trackingStatus = 'IDLE';
    appState.markerFound = false;
    this.bravenScene.controls.enabled = true;
    this.bravenScene.camera.position.set(0, 0.15, 13.8);
    this.bravenScene.startLoop();
    notifyStateChange();
  }

  private applyTransform(detail: ImageDetail) {
    if (!detail.position || !detail.rotation) return;

    this.targetPos.set(detail.position.x, detail.position.y, detail.position.z);
    this.targetQuat.set(detail.rotation.x, detail.rotation.y, detail.rotation.z, detail.rotation.w);

    const height = detail.scaledHeight ?? 0.2;
    const scale = Math.max(height * 2.2, 0.4);

    this.bravenScene.markerAnchorGroup.position.copy(this.targetPos);
    this.bravenScene.markerAnchorGroup.quaternion.copy(this.targetQuat);
    this.bravenScene.markerAnchorGroup.scale.setScalar(scale);
    this.bravenScene.markerAnchorGroup.visible = true;
  }

  update(dt: number) {
    if (this.isRunning && appState.markerFound) {
      this.bravenScene.markerAnchorGroup.position.lerp(this.targetPos, Math.min(dt * 18, 1));
      this.bravenScene.markerAnchorGroup.quaternion.slerp(this.targetQuat, Math.min(dt * 18, 1));
    }
  }
}
