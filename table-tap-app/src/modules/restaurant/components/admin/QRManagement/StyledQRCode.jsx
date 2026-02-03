import React, { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

const QR_COLORS = {
  background: '#ffffff', // White
  dots: '#cffafe',      // Cyan-100
};

const StyledQRCode = ({ value, size = 120, id, onInstanceReady }) => {
  const containerRef = useRef(null);
  const instanceRef = useRef(null);
  const onReadyRef = useRef(onInstanceReady);
  onReadyRef.current = onInstanceReady;
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    if (!value || typeof value !== 'string') return;
    setUseFallback(false);
    if (!containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = '';
    let cancelled = false;

    const run = async () => {
      try {
        const mod = await import('qr-code-styling');
        const QRCodeStyling = mod.default ?? mod.QRCodeStyling;
        if (cancelled || !containerRef.current || !QRCodeStyling) return;

        const qr = new QRCodeStyling({
          width: size,
          height: size,
          type: 'canvas',
          data: value,
          margin: 8,
          qrOptions: { errorCorrectionLevel: 'M' }, // Lower ECC for fewer dots
          dotsOptions: {
            type: 'dots', // Modern circular dots
            gradient: {
              type: 'linear',
              rotation: 45,
              colorStops: [
                { offset: 0, color: '#2A9D8F' }, // Primary Teal
                { offset: 1, color: '#264653' }  // Darker Secondary
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
        if (cancelled || !containerRef.current) return;
        container.innerHTML = '';
        instanceRef.current = qr;
        qr.append(container);
        onReadyRef.current?.(qr);
      } catch (err) {
        if (!cancelled) {
          console.warn('StyledQRCode: using fallback QR', err);
          setUseFallback(true);
        }
      }
    };

    run();
    return () => {
      cancelled = true;
      if (containerRef.current) containerRef.current.innerHTML = '';
      instanceRef.current = null;
    };
  }, [value, size]);

  // Fallback: show standard QR with splash colors when qr-code-styling fails (download uses SVG by id)
  if (useFallback) {
    return (
      <div className="styled-qr-container" style={{ width: size, height: size }}>
        <QRCodeSVG
          id={id}
          value={value}
          size={size}
          level="H"
          includeMargin
          bgColor={QR_COLORS.background}
          fgColor={QR_COLORS.dots}
        />
      </div>
    );
  }

  return <div ref={containerRef} id={id} className="styled-qr-container" style={{ width: size, height: size }} />;
};

export default StyledQRCode;
