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
        color: 'bg-accent text-white',
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
        color: 'bg-accent text-white',
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
        <div className="relative z-30 -mt-8 sm:-mt-12 md:-mt-14 mb-0">
            <div className="max-w-7xl mx-auto px-3 sm:px-6">
                <div className="flex lg:grid lg:grid-cols-6 gap-3 sm:gap-3.5 overflow-x-auto lg:overflow-visible snap-x snap-mandatory pb-2 lg:pb-0 scrollbar-hide">
                    {features.map((f, i) => (
                        <a
                            key={i}
                            href={f.href}
                            className={`${f.color} rounded-2xl p-4 sm:p-5 hover:shadow-2xl transition-all hover:-translate-y-2 duration-300 group cursor-pointer block min-w-[150px] sm:min-w-[170px] lg:min-w-0 snap-start flex-shrink-0 lg:flex-shrink relative overflow-hidden`}
                        >
                            <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                            <div className="relative z-10">
                                <div className="mb-2.5 sm:mb-3 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all origin-left">
                                    {f.icon}
                                </div>
                                <h4 className="text-xs sm:text-sm font-bold leading-tight mb-1">{f.title}</h4>
                                <p className="text-[10px] sm:text-[11px] leading-relaxed opacity-75 line-clamp-2">{f.desc}</p>
                            </div>
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AchievementsStrip;
