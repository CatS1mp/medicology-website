import React from 'react';
import Link from 'next/link';

interface AuthLayoutProps {
    children: React.ReactNode;
    topRightText: string;
    topRightHref: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, topRightText, topRightHref }) => {
    return (
        <div className="min-h-screen flex bg-white relative">
            {/* Close button top left */}
            <Link href="/" className="absolute top-6 left-6 text-gray-400 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </Link>

            {/* Top right button */}
            <div className="absolute top-6 right-6 z-20">
                <Link href={topRightHref} className="px-6 py-2.5 rounded-xl border-2 border-gray-200 text-[#51a8f6] font-bold text-sm tracking-wide hover:bg-gray-50 uppercase inline-block bg-white">
                    {topRightText}
                </Link>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row items-center justify-center p-8 lg:p-16">
                {/* Left visually engaging side */}
                <div className="w-full lg:w-1/2 flex items-center justify-center mb-12 lg:mb-0 relative py-12">
                    <div
                        className="relative w-80 h-80 sm:w-[450px] sm:h-[450px] lg:w-[500px] lg:h-[500px] flex items-center justify-center pointer-events-none select-none z-10"
                    >
                        {/* Massive soft blue circular glow behind the image */}
                        <div
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full -z-10"
                            style={{
                                width: 'min(900px, 150vw)',
                                height: 'min(900px, 150vw)',
                                backgroundColor: '#93c5fd', /* Stronger, vibrant Tailwind blue-300 hex */
                                filter: 'blur(100px)', /* Slightly less blur to keep the color dense */
                                opacity: 0.7 /* Higher opacity for stronger color */
                            }}
                        ></div>

                        {/* 
                         * Note: User needs to ensure public/images/1.svg exists.
                         */}
                        <img
                            src="/images/1.svg"
                            alt="Medicology Robot Nurse"
                            className="w-full h-full object-contain"
                            draggable="false"
                        />
                    </div>
                </div>

                {/* Right side form */}
                <div className="w-full md:w-1/2 flex items-center justify-center z-10 relative">
                    {children}
                </div>
            </div>
        </div>
    );
};
