import React from 'react';
import Image from 'next/image';

export const DashboardLoadingScreen: React.FC = () => {
    return (
        <div className="absolute inset-0 z-[9999] flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] transition-all duration-300">
            <div className="flex flex-col items-center transform scale-100 animate-in fade-in zoom-in duration-500">
                {/* Spinning Circle Above */}
                <div className="w-14 h-14 mb-8 rounded-full border-4 border-blue-400 border-t-transparent animate-spin shadow-lg" />
                
                {/* GIF underneath */}
                <div className="relative w-72 h-72 md:w-96 md:h-96 drop-shadow-xl">
                    <Image 
                        src="/images/gif/medical_bot_loading_final_clean.gif"
                        alt="Loading Medical Bot"
                        fill
                        className="object-contain"
                        priority
                        unoptimized
                    />
                </div>
                
                <h2 className="mt-8 text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-indigo-300 animate-pulse drop-shadow-md">
                    Đang tải dữ liệu...
                </h2>
                <p className="mt-2 text-gray-200 font-medium tracking-wide drop-shadow-md">
                    Vui lòng chờ trong giây lát
                </p>
            </div>
        </div>
    );
};
