import { useCallback, useRef, useState } from 'preact/hooks';
import { Html5Qrcode } from 'html5-qrcode';

async function enhanceCameraTrack(elementId) {
  await new Promise((resolve) => setTimeout(resolve, 250));

  const video = document.querySelector(`#${elementId} video`);
  const track = video?.srcObject?.getVideoTracks?.()[0];

  if (!track?.getCapabilities || !track?.applyConstraints) return;

  const caps = track.getCapabilities();
  const advanced = [];

  if (Array.isArray(caps.focusMode) && caps.focusMode.includes('continuous')) {
    advanced.push({ focusMode: 'continuous' });
  }

  if (caps.zoom) {
    const zoom = Math.min(caps.zoom.max, Math.max(caps.zoom.min, 2));
    advanced.push({ zoom });
  }

  if (advanced.length > 0) {
    await track.applyConstraints({ advanced }).catch(() => {});
  }
}

export function useQrScanner({ elementId, onScanSuccess }) {
  const scannerRef = useRef(null);
  const lastPayloadRef = useRef('');
  const lastScanAtRef = useRef(0);

  const [isScanning, setIsScanning] = useState(false);
  const [scannerError, setScannerError] = useState('');

  const startScanner = useCallback(async () => {
    setScannerError('');

    if (isScanning) {
      return;
    }

    const scanner = new Html5Qrcode(elementId);
    scannerRef.current = scanner;

    try {
      await scanner.start(
        {
          facingMode: 'environment',
        },
        {
          fps: 22,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const size = Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.72);
            return { width: size, height: size };
          },
          aspectRatio: 1.0,
          disableFlip: true,
          rememberLastUsedCamera: true,
          experimentalFeatures: { useBarCodeDetectorIfSupported: true },
        },
        async (decodedText) => {
          const now = Date.now();

          if (decodedText === lastPayloadRef.current && now - lastScanAtRef.current < 2500) {
            return;
          }

          lastPayloadRef.current = decodedText;
          lastScanAtRef.current = now;

          await onScanSuccess(decodedText);
        },
        () => {
          // Diamkan scan failure agar tidak spam setiap frame.
        },
      );

      await enhanceCameraTrack(elementId);

      setIsScanning(true);
    } catch (error) {
      setScannerError(error?.message || String(error));
      setIsScanning(false);
    }
  }, [elementId, isScanning, onScanSuccess]);

  const stopScanner = useCallback(async () => {
    if (!scannerRef.current || !isScanning) {
      return;
    }

    await scannerRef.current.stop();
    await scannerRef.current.clear();

    scannerRef.current = null;
    setIsScanning(false);
  }, [isScanning]);

  return {
    isScanning,
    scannerError,
    startScanner,
    stopScanner,
  };
}
