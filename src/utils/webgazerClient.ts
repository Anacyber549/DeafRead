export interface GazePoint {
  x: number;
  y: number;
}

interface WebGazerInstance {
  params?: {
    faceMeshSolutionPath?: string;
    [key: string]: unknown;
  };
  saveDataAcrossSessions: (val: boolean) => WebGazerInstance;
  showVideoPreview: (val: boolean) => WebGazerInstance;
  showVideo: (val: boolean) => WebGazerInstance;
  showFaceOverlay: (val: boolean) => WebGazerInstance;
  showFaceFeedbackBox: (val: boolean) => WebGazerInstance;
  showPredictionPoints: (val: boolean) => WebGazerInstance;
  setGazeListener: (
    listener: (data: GazePoint | null, elapsedTime: number) => void
  ) => WebGazerInstance;
  clearGazeListener: () => WebGazerInstance;
  removeMouseEventListeners: () => WebGazerInstance;
  recordScreenPosition: (x: number, y: number, eventType?: string) => WebGazerInstance;
  begin: (onFail?: () => void) => Promise<WebGazerInstance>;
  pause: () => WebGazerInstance;
  stopVideo: () => WebGazerInstance;
  end: () => WebGazerInstance;
  clearData: () => Promise<void>;
}

let activeWebGazer: WebGazerInstance | null = null;
let loadPromise: Promise<WebGazerInstance> | null = null;

async function loadWebGazer(): Promise<WebGazerInstance> {
  if (typeof window === 'undefined') {
    throw new Error('Eye help requires a browser environment.');
  }

  const win = window as Window & { webgazer?: WebGazerInstance };
  if (win.webgazer) {
    return win.webgazer;
  }

  if (!loadPromise) {
    loadPromise = new Promise<WebGazerInstance>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(
        'script[data-signread-webgazer="true"]'
      );
      if (existing && win.webgazer) {
        resolve(win.webgazer);
        return;
      }

      const script = existing ?? document.createElement('script');
      script.src = '/vendor/webgazer.js';
      script.async = true;
      script.dataset.signreadWebgazer = 'true';

      script.onload = () => {
        if (win.webgazer) {
          resolve(win.webgazer);
        } else {
          loadPromise = null;
          reject(new Error('Eye help tracker could not start.'));
        }
      };

      script.onerror = () => {
        loadPromise = null;
        reject(new Error('Could not load eye help tracker script.'));
      };

      if (!existing) {
        document.head.appendChild(script);
      }
    });
  }

  return loadPromise;
}

/**
 * Starts WebGazer camera eye tracking strictly in browser memory.
 * Camera frames and calibration data are never saved across sessions or sent to any server.
 */
export async function startWebGazer(
  onGaze: (point: GazePoint) => void
): Promise<void> {
  if (
    typeof navigator === 'undefined' ||
    !navigator.mediaDevices ||
    typeof navigator.mediaDevices.getUserMedia !== 'function'
  ) {
    throw new Error('Your browser does not support camera access for eye help.');
  }

  const wg = await loadWebGazer();
  activeWebGazer = wg;

  if (wg.params) {
    wg.params.faceMeshSolutionPath = '/mediapipe/face_mesh';
  }

  wg.saveDataAcrossSessions(false);
  wg.showVideoPreview(false);
  wg.showVideo(false);
  wg.showFaceOverlay(false);
  wg.showFaceFeedbackBox(false);
  wg.showPredictionPoints(false);

  wg.setGazeListener((data) => {
    if (data && Number.isFinite(data.x) && Number.isFinite(data.y)) {
      onGaze({ x: data.x, y: data.y });
    }
  });

  await wg.begin(() => {
    // Handled via rejected Promise from wg.begin()
  });
}

/**
 * Feeds a calibration click coordinate to WebGazer while the student looks at the dot.
 */
export function recordCalibrationClick(x: number, y: number): void {
  if (!activeWebGazer) return;
  try {
    activeWebGazer.recordScreenPosition(x, y, 'click');
  } catch {
    // Ignore if tracker is still warming up
  }
}

/**
 * Locks calibration to the 9 clicked dots so random mouse movement does not skew gaze.
 */
export function finishCalibration(): void {
  if (!activeWebGazer) return;
  try {
    activeWebGazer.removeMouseEventListeners();
  } catch {
    // Ignore
  }
}

/**
 * Completely stops WebGazer, turns off the webcam stream tracks, and clears in-memory data.
 */
export async function stopWebGazer(): Promise<void> {
  const wg = activeWebGazer;
  activeWebGazer = null;

  // Stop any webcam video tracks created by WebGazer so the camera indicator turns off
  if (typeof document !== 'undefined') {
    const videoEl = document.getElementById(
      'webgazerVideoFeed'
    ) as HTMLVideoElement | null;
    if (videoEl && videoEl.srcObject instanceof MediaStream) {
      videoEl.srcObject.getTracks().forEach((track) => track.stop());
      videoEl.srcObject = null;
    }
  }

  if (!wg) return;

  try {
    wg.clearGazeListener();
  } catch {
    // Ignore
  }
  try {
    wg.pause();
  } catch {
    // Ignore
  }
  try {
    wg.stopVideo();
  } catch {
    // Ignore
  }
  try {
    wg.end();
  } catch {
    // Ignore
  }
  try {
    await wg.clearData();
  } catch {
    // Ignore
  }
}
