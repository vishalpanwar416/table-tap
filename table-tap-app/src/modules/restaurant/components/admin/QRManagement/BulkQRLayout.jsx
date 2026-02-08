import React, { useEffect, useState } from 'react';
import QRTableCard from './QRTableCard';
import { createPortal } from 'react-dom';

/**
 * BulkQRLayout - Renders a grid of QR cards optimized for printing.
 * Uses a Portal to render directly into the body to make "display: none" separation easier,
 * or simply renders as a hidden overlay that becomes visible during print.
 */
const BulkQRLayout = ({ tables, restaurant, platformBranding, generateQRUrl, onReady, isPrinting }) => {
    const [readyCount, setReadyCount] = useState(0);

    // Notify parent when all QR codes might be ready (simple heuristic: mounted)
    useEffect(() => {
        if (isPrinting) {
            // Give canvas QR codes time to render
            const timer = setTimeout(() => {
                if (onReady) onReady();
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [isPrinting, onReady]);

    if (!isPrinting && !tables.length) return null;

    return createPortal(
        <div id="bulk-qr-print-container" className={`${isPrinting ? 'fixed inset-0 z-[9999] bg-white' : 'hidden'}`}>
            <style>
                {`
          @media print {
            body > *:not(#bulk-qr-print-container) {
              display: none !important;
            }
            #bulk-qr-print-container {
              display: block !important;
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: white;
              z-index: 9999;
            }
            /* Reset page margins for full bleed if possible, though browser controls this */
            @page {
              margin: 0.5cm;
              size: auto;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        `}
            </style>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-8 print:grid-cols-2 print:gap-4 print:p-4 bg-white min-h-screen">
                {tables.map(table => (
                    <div key={table.id} className="flex justify-center break-inside-avoid page-break-inside-avoid print:break-inside-avoid mb-8 print:mb-4">
                        <QRTableCard
                            table={table}
                            restaurant={restaurant}
                            platformBranding={platformBranding}
                            generateQRUrl={generateQRUrl}
                            // Force styles for print layout: maintain aspect ratio but maybe scale down slightly to fit 2 per row on A4
                            className="!shadow-none border border-slate-200 print:border-slate-300 transform-none hover:transform-none !transition-none"
                        />
                    </div>
                ))}
            </div>
        </div>,
        document.body
    );
};

export default BulkQRLayout;
