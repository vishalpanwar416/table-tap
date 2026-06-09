import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, ImagePlus } from 'lucide-react';

const SCANNER_ID = 'tt-qr-scanner-region';

const QRScanModal = ({ open, onClose, onScan }) => {
  const scannerRef = useRef(null);
  const startedRef = useRef(false);
  const handledRef = useRef(false);
  const fileInputRef = useRef(null);
  const [cameraError, setCameraError] = useState(null);
  const [starting, setStarting] = useState(false);

  const stopScanner = async () => {
    const active = scannerRef.current;
    const wasStarted = startedRef.current;
    scannerRef.current = null;
    startedRef.current = false;
    if (!active || !wasStarted) return;
    try {
      await active.stop();
      await active.clear();
    } catch {
      // scanner may already be stopped
    }
  };

  useEffect(() => {
    if (!open) {
      stopScanner();
      setCameraError(null);
      setStarting(false);
      return undefined;
    }

    handledRef.current = false;
    startedRef.current = false;
    setCameraError(null);
    setStarting(true);

    let cancelled = false;

    const startScanner = async () => {
      const el = document.getElementById(SCANNER_ID);
      if (!el || cancelled) {
        if (!cancelled) {
          setCameraError('Scanner could not start. Try again or upload a QR photo.');
          setStarting(false);
        }
        return;
      }

      if (!window.isSecureContext) {
        setCameraError(
          'Camera needs HTTPS (or localhost). On phone over Wi‑Fi IP, use Upload QR photo below.',
        );
        setStarting(false);
        return;
      }

      try {
        const scanner = new Html5Qrcode(SCANNER_ID);
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            if (handledRef.current) return;
            const accepted = onScan(decodedText);
            if (accepted !== false) {
              handledRef.current = true;
            }
          },
          () => {},
        );
        if (!cancelled) {
          startedRef.current = true;
          setStarting(false);
        }
      } catch {
        if (!cancelled) {
          setCameraError(
            'Could not access camera. Allow camera permission in browser settings, or upload a QR photo.',
          );
          setStarting(false);
        }
      }
    };

    // Wait for modal DOM to mount before html5-qrcode looks up the element
    const timer = window.setTimeout(() => {
      startScanner();
    }, 150);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      stopScanner();
    };
  }, [open, onScan]);

  const handleFilePick = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    await stopScanner();
    setCameraError(null);
    setStarting(true);

    try {
      const scanner = new Html5Qrcode(SCANNER_ID);
      const decodedText = await scanner.scanFile(file, false);
      const accepted = onScan(decodedText);
      if (accepted === false) {
        setCameraError('Invalid Table-Tap QR. Try another image.');
      }
    } catch {
      setCameraError('Could not read QR from image. Try a clearer photo.');
    } finally {
      setStarting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Scan table QR</h2>
            <p className="text-xs text-gray-500">
              Point your camera at the Table-Tap QR on your table
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
            aria-label="Close scanner"
          >
            <X size={16} />
          </button>
        </div>

        {/* Keep scanner mount point in DOM — removing it breaks html5-qrcode */}
        <div className="relative w-full min-h-[280px] bg-black">
          <div id={SCANNER_ID} className="w-full min-h-[280px]" />

          {(starting || cameraError) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-4 text-center">
              {starting && !cameraError && (
                <p className="text-sm text-white mb-3">Starting camera…</p>
              )}
              {cameraError && <p className="text-sm text-white mb-4">{cameraError}</p>}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
              >
                <ImagePlus size={16} />
                Upload QR photo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFilePick}
              />
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-gray-100">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full text-sm text-orange-600 font-medium py-1"
          >
            Or upload QR from gallery
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRScanModal;
