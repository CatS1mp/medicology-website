import React from 'react';
import { CourseSection as SectionModel } from '../types';
import { LessonNodeCard } from './LessonNodeCard';

interface RoadmapSectionProps {
    section: SectionModel;
}

export const RoadmapSection: React.FC<RoadmapSectionProps> = ({ section }) => {
    return (
        <div className="mb-10 relative">
            {/* Section Header */}
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <div className="w-1.5 h-6 bg-[#1CA1F2] rounded-r-md"></div>
                {section.title}
            </h2>

            {/* Nodes */}
            <div className="relative">
                {section.nodes.map((node, index) => (
                    <LessonNodeCard 
                        key={node.id} 
                        node={node} 
                        isLastInSection={index === section.nodes.length - 1} 
                    />
                ))}
            </div>

            {/* Optional Divider After Section */}
            {section.hasDividerAfter && (
                <div className="mt-12 flex items-center justify-center w-full max-w-2xl mx-auto">
                    <div className="flex-1 border-t border-dashed border-gray-300"></div>
                    <span className="px-4 text-[11px] font-bold text-gray-400 tracking-widest uppercase">
                        {section.hasDividerAfter.title}
                    </span>
                    <div className="flex-1 border-t border-dashed border-gray-300"></div>
                </div>
            )}
        </div>
    );
};
