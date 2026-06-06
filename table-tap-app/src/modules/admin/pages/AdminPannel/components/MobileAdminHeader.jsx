import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import tableTapLogo from '../../../../../assets/icons/logott.png';

const MobileAdminHeader = ({ onMenuToggle }) => {
  const navigate = useNavigate();

  return (
    <div className="md:hidden bg-slate-950 border-b border-slate-800 shadow-sm z-20 sticky top-0 font-spartan">
      {/* Main Header Bar */}
      <div className="flex min-h-[198px] items-center justify-between px-6 py-5">
        {/* Left: Brand opens the mobile admin menu */}
        <button
          type="button"
          onClick={onMenuToggle}
          className="flex min-w-0 items-center gap-6 text-left"
          aria-label="Open admin menu"
        >
          <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[22px] bg-white">
            <img src={tableTapLogo} alt="TableTap Logo" className="h-16 w-16 object-contain" />
          </span>
          <span className="min-w-0">
            <span className="block text-[34px] font-bold leading-tight text-orange-500 font-spartan">
              TableTap
            </span>
            <span className="mt-1 block text-[21px] font-medium leading-tight text-slate-400 font-spartan">
              Admin Console
            </span>
          </span>
        </button>

        {/* Right: Back Button */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="ml-4 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-slate-800 text-slate-200 transition-colors hover:bg-slate-700 hover:text-white"
          title="Go Back"
          aria-label="Go back"
        >
          <ChevronLeft className="h-9 w-9" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};

export default MobileAdminHeader;
