import React, { useEffect, useRef } from 'react';
import QRCodeStyling from 'qr-code-styling';

// Table Tap splash screen colors (opening.jsx: white/cyan-100 gradient, gray-800 accent)
const SPLASH_COLORS = {
  background: '#cffafe', // Tailwind cyan-100 (splash gradient)
  dots: '#1f2937',       // Tailwind gray-800 (splash button border/text)
};

const StyledQRCode = ({ value, size = 120, id, onInstanceReady }) => {
  const containerRef = useRef(null);
  const instanceRef = useRef(null);
  const onReadyRef = useRef(onInstanceReady);
  onReadyRef.current = onInstanceReady;

  useEffect(() => {
    if (!containerRef.current || !value) return;

    const qr = new QRCodeStyling({
      width: size,
      height: size,
      type: 'svg',
      data: value,
      margin: 8,
      qrOptions: { errorCorrectionLevel: 'H' },
      dotsOptions: {
        color: SPLASH_COLORS.dots,
        type: 'rounded',
      },
      cornersSquareOptions: {
        color: SPLASH_COLORS.dots,
        type: 'extra-rounded',
      },
      cornersDotOptions: {
        color: SPLASH_COLORS.dots,
        type: 'rounded',
      },
      backgroundOptions: {
        color: SPLASH_COLORS.background,
      },
    });

    instanceRef.current = qr;
    qr.append(containerRef.current);
    onReadyRef.current?.(qr);
  }, [value, size]);

  useEffect(() => {
    return () => {
      if (containerRef.current) containerRef.current.innerHTML = '';
      instanceRef.current = null;
    };
  }, []);

  return <div ref={containerRef} id={id} className="styled-qr-container" />;
};

export default StyledQRCode;
