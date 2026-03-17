import React from 'react';
import Link from 'next/link';

interface ContinueLearningBarProps {
    data: {
        courseInfo: string;
        title: string;
        description: string;
        link: string;
    } | undefined;
}

export const ContinueLearningBar: React.FC<ContinueLearningBarProps> = ({ data }) => {
    if (!data) return null;

    return (
        <div className="sticky bottom-0 z-40 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] w-full py-4 px-6 md:px-12 flex justify-center">
            <div className="w-full max-w-4xl flex items-center justify-between">
                <div>
                    <div className="text-[11px] font-bold text-[#1CA1F2] uppercase tracking-wider mb-1">
                        TIẾP TỤC • {data.courseInfo}
                    </div>
                    <h3 className="text-base font-bold text-gray-900 mb-0.5">
                        {data.title}
                    </h3>
                    <p className="text-xs text-gray-500 hidden sm:block max-w-lg">
                        {data.description}
                    </p>
                </div>
                
                <Link 
                    href={data.link}
                    className="flex-shrink-0 w-12 h-12 bg-[#1CA1F2] hover:bg-[#188bd4] rounded-full flex items-center justify-center text-white shadow-md transition-transform hover:scale-105"
                >
                    <svg className="w-5 h-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                </Link>
            </div>
        </div>
    );
};
