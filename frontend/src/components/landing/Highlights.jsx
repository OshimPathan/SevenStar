import React, { useEffect, useState } from 'react';
import { Star, Users, Trophy, Award, Smile, Globe } from 'lucide-react';
import { getSiteSettings } from '../../api';

const HighlightCard = ({ rank, title, subtitle, accent = 'primary', metric }) => {
    const color = accent === 'primary' ? 'text-primary' : accent === 'accent' ? 'text-accent' : 'text-gray-800';
    return (
        <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-lg transition-all group">
            <div className="flex items-start justify-between">
                <div>
                    <p className={`text-[9px] sm:text-[10px] font-extrabold uppercase tracking-[0.2em] ${color}`}>{rank}</p>
                    <h3 className="text-base sm:text-lg font-extrabold text-gray-900 mt-1 leading-snug">{title}</h3>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Star className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
            </div>
            {metric && (
                <p className="mt-2 sm:mt-3 text-2xl sm:text-3xl font-black text-gray-900 font-serif">{metric}</p>
            )}
            <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-gray-500">{subtitle}</p>
        </div>
    );
};

const Highlights = () => {
    const [settings, setSettings] = useState({});
    useEffect(() => { getSiteSettings().then(s => setSettings(s || {})).catch(() => {}); }, []);

    const cards = [
        {
            icon: <Globe className="w-5 h-5" />,
            rank: 'Inclusiveness & Diversity',
            title: 'Students from varied backgrounds',
            subtitle: 'Admissions open for Montessori to +2 streams',
            metric: settings.active_students || '1000+',
            accent: 'primary'
        },
        {
            icon: <Trophy className="w-5 h-5" />,
            rank: 'Academic Outcomes',
            title: 'Strong board exam performance',
            subtitle: 'Focus on conceptual mastery and practice',
            metric: settings.board_gpa_3_plus || 'High GPA',
            accent: 'accent'
        },
        {
            icon: <Users className="w-5 h-5" />,
            rank: 'Clubs & ECAs',
            title: 'Vibrant extracurricular ecosystem',
            subtitle: 'Sports, arts, coding, debates, tours',
            metric: settings.clubs_events || 'Clubs & Events',
            accent: 'primary'
        },
        {
            icon: <Award className="w-5 h-5" />,
            rank: 'Scholarships',
            title: 'Merit & need-based awards',
            subtitle: 'Support for deserving students each year',
            metric: settings.scholarships || 'Scholarships',
            accent: 'accent'
        },
        {
            icon: <Smile className="w-5 h-5" />,
            rank: 'Student Satisfaction',
            title: 'Positive learning environment',
            subtitle: 'Mentorship, counseling, and parent connect',
            metric: settings.student_satisfaction || 'Excellent',
            accent: 'primary'
        },
    ];

    return (
        <section className="py-12 sm:py-16 bg-gradient-to-b from-white to-primary/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8 sm:mb-10">
                    <p className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-semibold mb-3 sm:mb-4">
                        <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Highlights
                    </p>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 font-serif">Why Choose Seven Star</h2>
                    <p className="text-gray-500 mt-2 max-w-2xl mx-auto text-sm sm:text-base">Academic strength, engaging campus life, and values-driven education from Montessori to +2.</p>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                    {cards.map((c, i) => (
                        <HighlightCard key={i} rank={c.rank} title={c.title} subtitle={c.subtitle} metric={c.metric} accent={c.accent} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Highlights;

