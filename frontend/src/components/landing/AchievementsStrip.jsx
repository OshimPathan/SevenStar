import React from 'react';
import { GraduationCap, Users, Building2, BookOpen, Bus, Award } from 'lucide-react';

const features = [
    {
        icon: <GraduationCap className="w-6 h-6 sm:w-7 sm:h-7" />,
        title: 'Quality Education',
        desc: 'NEB-affiliated Nursery to +2 with 100% SEE pass rate',
        href: '#programs',
        color: 'bg-primary text-white',
    },
    {
        icon: <Users className="w-6 h-6 sm:w-7 sm:h-7" />,
        title: 'Experienced Faculty',
        desc: '80+ qualified teachers with B.Ed/M.Ed degrees',
        href: '#team',
        color: 'bg-accent text-gray-900',
    },
    {
        icon: <Building2 className="w-6 h-6 sm:w-7 sm:h-7" />,
        title: 'Modern Infrastructure',
        desc: 'Labs, library, smart classes, sports ground & Wi-Fi campus',
        href: '#facilities',
        color: 'bg-gray-900 text-white',
    },
    {
        icon: <BookOpen className="w-6 h-6 sm:w-7 sm:h-7" />,
        title: '5 Career Streams',
        desc: 'Management, CS, Hotel Mgmt, Finance & Education',
        href: '#programs',
        color: 'bg-primary text-white',
    },
    {
        icon: <Bus className="w-6 h-6 sm:w-7 sm:h-7" />,
        title: 'Hostel & Transport',
        desc: 'Safe hostel with meals & 10+ bus routes covering the district',
        href: '#fees',
        color: 'bg-accent text-gray-900',
    },
    {
        icon: <Award className="w-6 h-6 sm:w-7 sm:h-7" />,
        title: 'Scholarships',
        desc: 'Merit & need-based financial aid for deserving students',
        href: '#admissions',
        color: 'bg-gray-900 text-white',
    },
];

const AchievementsStrip = () => {
    return (
        <div className="relative z-30 -mt-6 sm:-mt-10 md:-mt-12 mb-0">
            <div className="max-w-7xl mx-auto px-3 sm:px-6">
                {/* Horizontal scroll on mobile, grid on desktop */}
                <div className="flex lg:grid lg:grid-cols-6 gap-2.5 sm:gap-3 overflow-x-auto lg:overflow-visible snap-x snap-mandatory pb-2 lg:pb-0 scrollbar-hide">
                    {features.map((f, i) => (
                        <a
                            key={i}
                            href={f.href}
                            className={`${f.color} rounded-xl p-3 sm:p-4 hover:shadow-xl transition-all hover:-translate-y-1 duration-300 group cursor-pointer block min-w-[140px] sm:min-w-[160px] lg:min-w-0 snap-start flex-shrink-0 lg:flex-shrink`}
                        >
                            <div className="mb-2 sm:mb-3 opacity-80 group-hover:opacity-100 transition-opacity">
                                {f.icon}
                            </div>
                            <h4 className="text-xs sm:text-sm font-bold leading-tight mb-0.5 sm:mb-1">{f.title}</h4>
                            <p className="text-[10px] sm:text-[11px] leading-relaxed opacity-75 line-clamp-2">{f.desc}</p>
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AchievementsStrip;
