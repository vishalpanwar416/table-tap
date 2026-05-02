import React from 'react';
import StyledQRCode from './StyledQRCode';

const QRTableCard = ({ table, restaurant, generateQRUrl, platformBranding, className = "" }) => {
    if (!table || !restaurant) return null;

    return (
        <div className={`relative bg-white shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] rounded-[48px] overflow-hidden flex flex-col w-full max-w-[400px] aspect-[400/680] border border-white/60 font-sans ${className}`}>

            {/* Background Layer - Rich Cyan/Orange Mesh */}
            <div className="absolute inset-0 z-0 bg-cyan-50/40">
                <div className="absolute top-[-30%] left-[-30%] w-[160%] h-[80%] bg-gradient-to-br from-cyan-300/40 via-cyan-100/30 to-transparent blur-[100px] transform rotate-12"></div>
                <div className="absolute bottom-[-20%] right-[-20%] w-[140%] h-[60%] bg-gradient-to-tl from-primary-300/20 via-primary-100/20 to-transparent blur-[80px] transform -rotate-12"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-white/0 via-white/50 to-white/80 backdrop-blur-[1px]"></div>
            </div>

            {/* Content Container */}
            <div className="relative z-10 flex flex-col h-full p-6 px-8 items-center justify-between">

                {/* 1. TOP: Restaurant Brand */}
                <div className="flex flex-col items-center text-center w-full mt-4">
                    {/* Logo with Glow */}
                    <div className="relative mb-4 group">
                        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-400 to-primary-300 rounded-[24px] blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-700"></div>
                        <div className="relative w-[88px] h-[88px] bg-white rounded-[24px] shadow-2xl shadow-cyan-900/5 flex items-center justify-center p-0 border border-white overflow-hidden ring-1 ring-slate-900/5">
                            {restaurant.logo_url ? (
                                <img src={restaurant.logo_url} alt="Logo" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-3xl font-black text-slate-800 tracking-tighter uppercase">{restaurant.name.substring(0, 2)}</span>
                            )}
                        </div>
                    </div>

                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-tight mb-2">
                        {restaurant.name}
                    </h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em]">
                        {restaurant.cuisine_type || "Menu"}
                    </p>
                </div>

                {/* 2. MIDDLE: QR Hero Section */}
                <div className="flex flex-col items-center justify-center w-full relative">
                    {/* Modern Glass Card for QR */}
                    <div className="relative bg-white p-4 rounded-[36px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] border border-slate-50 ring-1 ring-slate-100">
                        <div className="bg-white rounded-[28px] overflow-hidden relative z-10">
                            <StyledQRCode
                                id={`qr-${table.id}`}
                                value={generateQRUrl(table)}
                                size={160}
                            />
                        </div>

                        {/* Floating "Scan" Pill */}
                        <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-4 py-1.5 rounded-full shadow-lg shadow-slate-900/20 whitespace-nowrap z-20 border-2 border-white">
                            <p className="text-[9px] font-bold uppercase tracking-[0.15em]">Scan for Menu</p>
                        </div>
                    </div>

                    {/* Table Number Display */}
                    <div className="mt-8 text-center bg-slate-50/50 rounded-2xl py-3 px-6 border border-slate-100">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-1">Table</p>
                        <span className="text-[56px] font-black text-slate-900 leading-[0.85] tracking-tighter block mb-2">
                            {table.tableNumber}
                        </span>
                        <p className="text-[10px] font-medium text-slate-400 italic font-serif tracking-wide">
                            "Making Memories With Us"
                        </p>
                    </div>
                </div>

                {/* 3. BOTTOM: Footer */}
                <div className="flex flex-col items-center w-full mb-2">
                    <div className="w-12 h-1 bg-slate-100 rounded-full mb-4"></div>
                    <div className="flex items-center gap-2 opacity-100">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mr-1">Powered by</span>

                        <img
                            src={platformBranding?.url || (typeof platformBranding === 'string' ? platformBranding : null) || '/logo.png'}
                            className="h-10 object-contain"
                            alt="TableTap"
                        />
                    </div>
                </div>
            </div>

            {/* Subtle gloss overlay */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-white/0 via-white/0 to-white/40 opacity-50 rounded-[48px] border-t border-l border-white/40"></div>
        </div>
    );
};

export default QRTableCard;
