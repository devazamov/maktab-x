"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import jsQR from "jsqr";
import { X, ScanLine } from "lucide-react";

/**
 * In-Mini-App QR scanner — opened from the bot's "📷 QR skanerlash"
 * button. Reads camera frames with jsQR (no native BarcodeDetector
 * dependency, since Telegram WebView support for that API is
 * inconsistent across client versions). A classroom/school QR encodes
 * a MAKTAB X URL (e.g. /classroom/<id>) — on a match we navigate
 * in-app; anything else is shown as raw text so it's still useful for
 * non-MAKTAB-X QR codes without pretending to handle them specially.
 */
export default function ScanPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          tick();
        }
      } catch {
        setError(
          "Kameraga ruxsat berilmadi. Telegram sozlamalaridan kamera ruxsatini yoqing."
        );
      }
    }

    function tick() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code?.data) {
        handleResult(code.data);
        return; // stop the loop once we have a hit
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    function handleResult(data: string) {
      setResult(data);
      try {
        const url = new URL(data, window.location.origin);
        if (url.origin === window.location.origin) {
          router.push(url.pathname + url.search);
          return;
        }
      } catch {
        // not a URL — fall through and just display it
      }
    }

    start();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [router]);

  return (
    <main className="relative min-h-screen bg-black">
      <video
        ref={videoRef}
        playsInline
        muted
        className="h-screen w-full object-cover"
      />
      <canvas ref={canvasRef} className="hidden" />

      <button
        onClick={() => router.back()}
        className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white"
      >
        <X size={20} />
      </button>

      {!error && !result && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3">
          <div className="h-64 w-64 rounded-3xl border-4 border-white/70" />
          <p className="flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-sm text-white">
            <ScanLine size={16} /> QR kodni ramka ichiga joylashtiring
          </p>
        </div>
      )}

      {error && (
        <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 rounded-2xl bg-white p-4 text-center text-sm font-medium text-foreground shadow-soft">
          {error}
        </div>
      )}

      {result && (
        <div className="absolute inset-x-4 bottom-8 space-y-2 rounded-2xl bg-white p-4 shadow-soft">
          <p className="text-xs font-semibold text-muted">Topildi:</p>
          <p className="break-all text-sm">{result}</p>
        </div>
      )}
    </main>
  );
}
