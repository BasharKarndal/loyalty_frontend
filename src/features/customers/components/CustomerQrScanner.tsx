import { useEffect, useRef, useState } from 'react';
import { BrowserQRCodeReader, type IScannerControls } from '@zxing/browser';
import { cn } from '@shared/lib/cn';

interface CustomerQrScannerProps {
  active: boolean;
  onScan: (raw: string) => void;
  className?: string;
}

async function buildCameraConstraints(): Promise<MediaStreamConstraints> {
  return {
    audio: false,
    video: { facingMode: { ideal: 'environment' } },
  };
}

export function CustomerQrScanner({ active, onScan, className }: CustomerQrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const onScanRef = useRef(onScan);
  const scanLockRef = useRef(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  onScanRef.current = onScan;

  useEffect(() => {
    if (active) {
      scanLockRef.current = false;
    }
  }, [active]);

  useEffect(() => {
    let cancelled = false;

    const stopCamera = async () => {
      try {
        controlsRef.current?.stop();
      } catch {
        // ignore stop errors
      }
      controlsRef.current = null;

      const video = videoRef.current;
      const stream = video?.srcObject;
      if (stream instanceof MediaStream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (video) {
        video.srcObject = null;
      }
    };

    if (!active) {
      void stopCamera();
      setStarting(false);
      return () => {
        cancelled = true;
      };
    }

    const startCamera = async () => {
      setStarting(true);
      setCameraError(null);
      await stopCamera();

      const video = videoRef.current;
      if (!video || cancelled) return;

      try {
        const reader = new BrowserQRCodeReader(undefined, {
          delayBetweenScanAttempts: 180,
          delayBetweenScanSuccess: 1200,
        });

        const constraints = await buildCameraConstraints();

        const controls = await reader.decodeFromConstraints(
          constraints,
          video,
          (result) => {
            if (!result || cancelled || scanLockRef.current) return;
            scanLockRef.current = true;
            onScanRef.current(result.getText());
          }
        );

        if (cancelled) {
          controls.stop();
          return;
        }

        controlsRef.current = controls;
        await video.play().catch(() => undefined);
      } catch {
        if (!cancelled) {
          setCameraError(
            'تعذر تشغيل الكاميرا. تأكد من منح الإذن واستخدم HTTPS أو localhost على الجوال.'
          );
        }
      } finally {
        if (!cancelled) setStarting(false);
      }
    };

    void startCamera();

    return () => {
      cancelled = true;
      void stopCamera();
    };
  }, [active, retryKey]);

  const handleRetry = () => {
    scanLockRef.current = false;
    setCameraError(null);
    setRetryKey((key) => key + 1);
  };

  return (
    <div className={cn('relative h-full min-h-[50dvh] w-full overflow-hidden bg-black', className)}>
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        muted
        playsInline
        autoPlay
      />

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-64 w-64 rounded-3xl border-2 border-wheat/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
      </div>

      {starting && !cameraError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <p className="text-sm font-semibold text-white">جاري تشغيل الكاميرا...</p>
        </div>
      )}

      {cameraError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-6 text-center">
          <div>
            <p className="text-sm font-semibold leading-relaxed text-white">{cameraError}</p>
            <button
              type="button"
              onClick={handleRetry}
              className="mt-4 rounded-xl bg-wheat px-4 py-2 text-sm font-bold text-white"
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
