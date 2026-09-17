import { useEffect, useRef, useState } from 'react';
import { BrowserQRCodeReader, type IScannerControls } from '@zxing/browser';
import { cn } from '@shared/lib/cn';

interface CustomerQrScannerProps {
  active: boolean;
  onScan: (raw: string) => void;
  className?: string;
}

async function pickBackCameraId(): Promise<string | undefined> {
  if (!navigator.mediaDevices?.enumerateDevices) return undefined;
  const devices = await navigator.mediaDevices.enumerateDevices();
  const cameras = devices.filter((device) => device.kind === 'videoinput');
  if (cameras.length === 0) return undefined;

  const back = cameras.find((device) =>
    /back|rear|environment|خلفية|خلف/i.test(device.label)
  );
  return (back ?? cameras[cameras.length - 1])?.deviceId;
}

export function CustomerQrScanner({ active, onScan, className }: CustomerQrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
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

      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;

      const video = videoRef.current;
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

      if (!window.isSecureContext && location.hostname !== 'localhost') {
        setCameraError('مسح QR يحتاج اتصال HTTPS على الجوال.');
        setStarting(false);
        return;
      }

      try {
        const reader = new BrowserQRCodeReader(undefined, {
          delayBetweenScanAttempts: 200,
          delayBetweenScanSuccess: 1400,
        });

        let stream: MediaStream | null = null;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
              facingMode: { ideal: 'environment' },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          });
        } catch {
          const deviceId = await pickBackCameraId();
          stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: deviceId
              ? { deviceId: { exact: deviceId } }
              : { facingMode: 'environment' },
          });
        }

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');
        video.muted = true;
        video.srcObject = stream;
        await video.play().catch(() => undefined);

        const controls = await reader.decodeFromStream(stream, video, (result) => {
          if (!result || cancelled || scanLockRef.current) return;
          scanLockRef.current = true;
          onScanRef.current(result.getText());
        });

        if (cancelled) {
          controls.stop();
          return;
        }

        controlsRef.current = controls;
      } catch {
        if (!cancelled) {
          setCameraError(
            'تعذر تشغيل الكاميرا. امنح إذن الكاميرا من إعدادات المتصفح ثم أعد المحاولة.'
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
        <div className="h-56 w-56 rounded-3xl border-2 border-wheat/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] sm:h-64 sm:w-64" />
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
