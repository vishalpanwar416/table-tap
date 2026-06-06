import React, { useEffect, useRef, useState } from 'react';

/**
 * StyledQRCode - A high-performance, premium QR code component
 * Features: Inline loading states, stable callbacks, and automatic cleanup.
 */
const StyledQRCode = ({ value, size = 120, id, onInstanceReady }) => {
  const containerRef = useRef(null);
  const instanceRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Use a ref for the callback to prevent dependency re-renders
  const onInstanceReadyRef = useRef(onInstanceReady);

  useEffect(() => {
    onInstanceReadyRef.current = onInstanceReady;
  }, [onInstanceReady]);

  useEffect(() => {
    if (!value || typeof value !== 'string') return;
    if (!containerRef.current) return;

    let isMounted = true;

    const loadQR = async () => {
      try {
        if (isMounted) setIsLoading(true);

        // Dynamically import QRCodeStyling
        const QRCodeStylingModule = await import('qr-code-styling');
        const QRCodeStyling = QRCodeStylingModule.default;

        if (!isMounted) return;

        const qr = new QRCodeStyling({
          width: size,
          height: size,
          type: 'canvas',
          data: value,
          margin: 8,
          qrOptions: { errorCorrectionLevel: 'M' },
          dotsOptions: {
            type: 'dots',
            color: '#0f172a', // Solid dark slate for data dots
          },
          cornersSquareOptions: {
            type: 'extra-rounded',
            color: '#f97316', // Orange-500 for the 3 corner squares
          },
          cornersDotOptions: {
            type: 'dot',
            color: '#f97316', // Orange-500 for the inner dots of corners
          },
          backgroundOptions: { color: '#ffffff' },
          imageOptions: { crossOrigin: 'anonymous', margin: 10 },
        });

        if (containerRef.current && isMounted) {
          containerRef.current.innerHTML = '';
          qr.append(containerRef.current);
          instanceRef.current = qr;

          if (onInstanceReadyRef.current) {
            onInstanceReadyRef.current(qr);
          }
        }

        if (isMounted) {
          setIsLoading(false);
          setHasError(false);
        }
      } catch (error) {
        console.error('Failed to load premium QR styling:', error);
        if (isMounted) {
          setHasError(true);
          setIsLoading(false);
        }
      }
    };

    loadQR();

    return () => {
      isMounted = false;
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [value, size]);

  return (
    <div
      id={id}
      className="styled-qr-container relative flex items-center justify-center overflow-hidden"
      style={{ width: size, height: size }}
    >
      {isLoading && (
        <div className="absolute inset-0 bg-slate-50 border border-slate-100 rounded-xl animate-pulse flex flex-col items-center justify-center z-10">
          <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin mb-1"></div>
          <div className="text-[8px] text-slate-400 font-black uppercase tracking-tighter">
            Syncing
          </div>
        </div>
      )}

      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-rose-50 border border-rose-100 rounded-xl p-2 text-center">
          <div className="text-rose-400 mb-1">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          </div>
          <span className="text-[8px] font-black text-rose-500 uppercase">Error</span>
        </div>
      )}

      <div
        ref={containerRef}
        className="flex items-center justify-center"
        style={{ width: size, height: size }}
      />
    </div>
  );
};

export default StyledQRCode;
