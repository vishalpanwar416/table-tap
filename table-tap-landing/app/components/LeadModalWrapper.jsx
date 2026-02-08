'use client';

import dynamic from 'next/dynamic';

const LeadModal = dynamic(() => import('./LeadModal'), { ssr: false });

export default function LeadModalWrapper() {
  return <LeadModal />;
}
