import React, { useEffect, useRef, useState } from 'react';

const StyledQRCode = ({ value, size = 120, id, onInstanceReady }) => {
  const containerRef = useRef(null);
  const instanceRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!value || typeof value !== 'string') return;
    if (!containerRef.current) return;

    // Dynamically import QRCodeStyling only when needed
    const loadQR = async () => {
      try {
        setIsLoading(true);
        const QRCodeStyling = (await import('qr-code-styling')).default;

        const qr = new QRCodeStyling({
          width: size,
          height: size,
          type: 'canvas',
          data: value,
          margin: 8,
          qrOptions: { errorCorrectionLevel: 'M' },
          dotsOptions: {
            type: 'dots',
            gradient: {
              type: 'linear',
              rotation: 45,
              colorStops: [
                { offset: 0, color: '#2A9D8F' },
                { offset: 1, color: '#264653' }
              ]
            }
          },
          cornersSquareOptions: {
            type: 'extra-rounded',
            color: '#264653'
          },
          cornersDotOptions: {
            type: 'dot',
            color: '#2A9D8F'
          },
          backgroundOptions: {
            color: '#ffffff',
          },
          imageOptions: {
            crossOrigin: 'anonymous',
            margin: 10
          },
        });

        if (containerRef.current) {
          containerRef.current.innerHTML = '';
          qr.append(containerRef.current);
          instanceRef.current = qr;

          if (onInstanceReady) {
            onInstanceReady(qr);
          }
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load QR code:', error);
        setIsLoading(false);
      }
    };

    loadQR();

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [value, size, onInstanceReady]);

  return (
    <div
      id={id}
      className="styled-qr-container relative"
      style={{ width: size, height: size }}
    >
      {isLoading && (
        <div
          className="absolute inset-0 bg-gray-100 rounded animate-pulse flex items-center justify-center"
        >
          <div className="text-gray-400 text-xs">Loading QR...</div>
        </div>
      )}
      <div ref={containerRef} style={{ width: size, height: size }} />
    </div>
  );
};

export default StyledQRCode;
