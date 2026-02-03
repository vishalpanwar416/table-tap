import React, { useEffect, useRef } from 'react';
import QRCodeStyling from 'qr-code-styling';

const StyledQRCode = ({ value, size = 120, id, onInstanceReady }) => {
  const containerRef = useRef(null);
  const instanceRef = useRef(null);

  useEffect(() => {
    if (!value || typeof value !== 'string') return;
    if (!containerRef.current) return;

    // Initialize only once if possible, or re-init on value change
    // For simplicity, we create a new instance on changes
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

    containerRef.current.innerHTML = '';
    qr.append(containerRef.current);
    instanceRef.current = qr;

    if (onInstanceReady) {
      onInstanceReady(qr);
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [value, size, onInstanceReady]);

  return <div ref={containerRef} id={id} className="styled-qr-container" style={{ width: size, height: size }} />;
};

export default StyledQRCode;
