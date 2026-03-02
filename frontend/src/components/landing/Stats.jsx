import React, { useState, useEffect, useRef } from 'react';
import { Users, BookOpenCheck, Clock, Award } from 'lucide-react';

const useCountUp = (end, duration = 2000, startCounting = false) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
        if (!startCounting) return;
        let start = 0;
        const increment = end / (duration / 16);
        const timer = setInterval(() => {
            start += increment;
            if (start >= end) {
                setCount(end);
                clearInterval(timer);
            } else {
                setCount(Math.floor(start));
            }
        }, 16);
        return () => clearInterval(timer);
    }, [end, duration, startCounting]);
    return count;
};

const Stats = () => {
    const [visible, setVisible] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setVisible(true); },
            { threshold: 0.3 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    const stats = [
        { label: "Active Students", value: 971, suffix: "+", icon: <Users className="w-8 h-8" /> },
        { label: "Expert Teachers", value: 80, suffix: "+", icon: <BookOpenCheck className="w-8 h-8" /> },
        { label: "Years of Excellence", value: 19, suffix: "+", icon: <Clock className="w-8 h-8" /> },
        { label: "SLC Pass Rate", value: 100, suffix: "%", icon: <Award className="w-8 h-8" /> },
    ];

    return (
        <section ref={ref} className="relative py-16 sm:py-20 md:py-24 overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0">
                <img src="/gallery1.jpg" alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-br from-primary/95 via-primary-dark/90 to-sidebar/95" />
            </div>

            {/* Grid pattern overlay */}
            <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-10 sm:mb-14">
                    <span className="inline-block text-accent text-xs font-bold uppercase tracking-[0.25em] mb-3">Our Impact</span>
                    <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3">Facts & Figures</h2>
                    <div className="w-20 sm:w-24 h-1.5 bg-gradient-to-r from-accent to-accent-light mx-auto rounded-full"></div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                    {stats.map((stat, idx) => (
                        <StatItem key={idx} stat={stat} visible={visible} idx={idx} />
                    ))}
                </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute top-10 left-10 w-20 h-20 border-2 border-accent/15 rotate-45 hidden lg:block animate-float"></div>
            <div className="absolute bottom-10 right-10 w-28 h-28 border-2 border-accent/10 rotate-45 hidden lg:block" style={{ animation: 'float 8s ease-in-out infinite 1.5s' }}></div>
            <div className="absolute top-1/2 left-1/4 w-12 h-12 border border-white/5 rotate-45 hidden lg:block" style={{ animation: 'float 10s ease-in-out infinite 3s' }}></div>
        </section>
    );
};

const StatItem = ({ stat, visible, idx }) => {
    const count = useCountUp(stat.value, 2000, visible);
    return (
        <div className="text-center group relative" style={{ animationDelay: `${idx * 150}ms` }}>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 sm:p-7 hover:bg-white/10 transition-all duration-300 hover:-translate-y-1">
                <div className="flex justify-center mb-3 sm:mb-4">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent/20 group-hover:scale-110 transition-all duration-300">
                        <div className="[&>svg]:w-6 [&>svg]:h-6 sm:[&>svg]:w-7 sm:[&>svg]:h-7">{stat.icon}</div>
                    </div>
                </div>
                <div className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-1.5 font-serif tabular-nums">
                    {count}{stat.suffix}
                </div>
                <div className="text-accent/90 text-[10px] sm:text-xs font-bold uppercase tracking-[0.15em]">
                    {stat.label}
                </div>
            </div>
        </div>
    );
};

export default Stats;
